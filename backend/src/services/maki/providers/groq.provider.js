import { makiTools } from '../tools.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
// gpt-oss-20b: modelo vigente de Groq con soporte de tool-calling (verificado
// contra su documentacion). llama-3.1-8b-instant y llama-3.3-70b-versatile
// quedan deprecados — no usarlos.
const MODEL = 'openai/gpt-oss-20b';

// Las MakiTool.parameters se escriben en el formato de Gemini (Type.OBJECT,
// Type.STRING en mayusculas). Groq/OpenAI esperan JSON Schema estandar
// (minusculas). Se convierte solo el valor de la clave "type", sin tocar
// nombres de propiedades ni descripciones.
function toJsonSchema(value) {
  if (Array.isArray(value)) return value.map(toJsonSchema);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = key === 'type' && typeof val === 'string' ? val.toLowerCase() : toJsonSchema(val);
    }
    return out;
  }
  return value;
}

// Groq valida los tool calls contra el JSON Schema de forma estricta: si un
// parametro no tiene valor, el modelo manda `null` en vez de omitir la clave,
// y eso rompe con un 400 si el schema solo declara "type: number/string"
// (null no es un numero/string valido). Ningun parametro de MakiTool es
// realmente obligatorio, asi que se listan todos en "required" y se ensancha
// su type a [tipo, "null"] — el patron documentado por OpenAI/Groq para
// "parametros opcionales" en tool-calling estricto.
function withNullableOptionalParams(parameters) {
  const properties = parameters.properties;
  if (!properties || typeof properties !== 'object') return parameters;

  const widened = {};
  for (const [name, schema] of Object.entries(properties)) {
    widened[name] = typeof schema.type === 'string' ? { ...schema, type: [schema.type, 'null'] } : schema;
  }

  return { ...parameters, properties: widened, required: Object.keys(properties) };
}

// Adaptador Groq: misma interfaz publica que MakiService (Gemini), para que
// el controller pueda intercambiar de proveedor sin tocar la logica de negocio.
export class GroqMakiService {
  constructor(apiKey, tools = makiTools) {
    this.apiKey = apiKey;
    this.tools = tools;
  }

  buildProviderTools() {
    return this.tools.map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: withNullableOptionalParams(toJsonSchema(t.parameters))
      }
    }));
  }

  async callGroq(messages) {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        tools: this.buildProviderTools(),
        tool_choice: 'auto',
        temperature: 0.7
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API error ${res.status}: ${errText}`);
    }

    return res.json();
  }

  async chat(prompt, systemInstruction) {
    const messages = [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: prompt }
    ];

    const first = await this.callGroq(messages);
    const message = first.choices?.[0]?.message;
    const toolCall = message?.tool_calls?.[0];

    if (!toolCall) {
      return message?.content ?? '';
    }

    const tool = this.tools.find((t) => t.name === toolCall.function.name);
    if (!tool) {
      return message?.content ?? '';
    }

    let args = {};
    try {
      args = JSON.parse(toolCall.function.arguments || '{}');
    } catch {
      args = {};
    }

    const result = await tool.execute(args);

    const followUp = await this.callGroq([
      ...messages,
      message,
      { role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(result) }
    ]);

    return followUp.choices?.[0]?.message?.content ?? '';
  }
}
