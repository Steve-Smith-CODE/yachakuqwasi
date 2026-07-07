import {
  createUserContent,
  createModelContent,
  createPartFromFunctionCall,
  createPartFromFunctionResponse
} from '@google/genai';
import { makiTools } from './tools.js';

const MODEL = 'gemini-3.5-flash';

// Capa que si sabe hablar con Gemini: traduce las MakiTool agnosticas al
// formato de function-calling del proveedor, y si el modelo pide ejecutar
// una, la corre y le devuelve el resultado en una segunda llamada.
export class MakiService {
  constructor(ai, tools = makiTools) {
    this.ai = ai;
    this.tools = tools;
  }

  buildProviderTools() {
    return [
      {
        functionDeclarations: this.tools.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters
        }))
      }
    ];
  }

  async chat(prompt, systemInstruction) {
    const response = await this.ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        tools: this.buildProviderTools()
      }
    });

    const call = response.functionCalls?.[0];
    if (!call || !call.name) {
      return response.text ?? '';
    }

    const tool = this.tools.find((t) => t.name === call.name);
    if (!tool) {
      return response.text ?? '';
    }

    const result = await tool.execute(call.args ?? {});

    // Se reutilizan las partes reales devueltas por el modelo (incluyen
    // thoughtSignature cuando el modelo la genera) en vez de reconstruir el
    // functionCall a mano: la API de Gemini rechaza un turno de modelo con
    // functionCall sin esa firma ("thought_signature") en modelos recientes.
    const modelParts = response.candidates?.[0]?.content?.parts ?? [
      createPartFromFunctionCall(call.name, call.args ?? {})
    ];

    const followUp = await this.ai.models.generateContent({
      model: MODEL,
      contents: [
        createUserContent(prompt),
        createModelContent(modelParts),
        createUserContent([createPartFromFunctionResponse(call.id ?? call.name, call.name, result)])
      ],
      config: { systemInstruction, temperature: 0.7 }
    });

    return followUp.text ?? '';
  }
}
