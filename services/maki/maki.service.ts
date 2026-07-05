import {
  GoogleGenAI,
  createUserContent,
  createModelContent,
  createPartFromFunctionCall,
  createPartFromFunctionResponse,
} from "@google/genai";
import { makiTools, type MakiTool } from "./tools.js";

const MODEL = "gemini-3.5-flash";

// Capa que si sabe hablar con Gemini: traduce las MakiTool agnosticas al
// formato de function-calling del proveedor, y si el modelo pide ejecutar
// una, la corre y le devuelve el resultado en una segunda llamada.
export class MakiService {
  constructor(
    private ai: GoogleGenAI,
    private tools: MakiTool[] = makiTools
  ) {}

  private buildProviderTools() {
    return [
      {
        functionDeclarations: this.tools.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters as Record<string, unknown>,
        })),
      },
    ];
  }

  async chat(prompt: string, systemInstruction: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        tools: this.buildProviderTools(),
      },
    });

    const call = response.functionCalls?.[0];
    if (!call || !call.name) {
      return response.text ?? "";
    }

    const tool = this.tools.find((t) => t.name === call.name);
    if (!tool) {
      return response.text ?? "";
    }

    const result = (await tool.execute(call.args ?? {})) as Record<string, unknown>;

    const followUp = await this.ai.models.generateContent({
      model: MODEL,
      contents: [
        createUserContent(prompt),
        createModelContent([createPartFromFunctionCall(call.name, call.args ?? {})]),
        createUserContent([createPartFromFunctionResponse(call.id ?? call.name, call.name, result)]),
      ],
      config: { systemInstruction, temperature: 0.7 },
    });

    return followUp.text ?? "";
  }
}
