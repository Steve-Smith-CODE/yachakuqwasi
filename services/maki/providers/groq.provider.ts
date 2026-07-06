import { makiTools, type MakiTool } from "../tools.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
// gpt-oss-20b: modelo vigente de Groq con soporte de tool-calling (verificado
// contra su documentacion). llama-3.1-8b-instant y llama-3.3-70b-versatile
// quedan deprecados — no usarlos.
const MODEL = "openai/gpt-oss-20b";

interface GroqMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string;
  tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
}

interface GroqResponse {
  choices?: Array<{ message?: GroqMessage }>;
}

// Las MakiTool.parameters se escriben en el formato de Gemini (Type.OBJECT,
// Type.STRING en mayusculas). Groq/OpenAI esperan JSON Schema estandar
// (minusculas). Se convierte solo el valor de la clave "type", sin tocar
// nombres de propiedades ni descripciones.
function toJsonSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toJsonSchema);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = key === "type" && typeof val === "string" ? val.toLowerCase() : toJsonSchema(val);
    }
    return out;
  }
  return value;
}

// Adaptador Groq: misma interfaz publica que MakiService (Gemini), para que
// server.ts pueda intercambiar de proveedor sin tocar la logica de negocio.
export class GroqMakiService {
  constructor(
    private apiKey: string,
    private tools: MakiTool[] = makiTools
  ) {}

  private buildProviderTools() {
    return this.tools.map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: toJsonSchema(t.parameters) as Record<string, unknown>,
      },
    }));
  }

  private async callGroq(messages: GroqMessage[]): Promise<GroqResponse> {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        tools: this.buildProviderTools(),
        tool_choice: "auto",
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API error ${res.status}: ${errText}`);
    }

    return res.json() as Promise<GroqResponse>;
  }

  async chat(prompt: string, systemInstruction: string): Promise<string> {
    const messages: GroqMessage[] = [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt },
    ];

    const first = await this.callGroq(messages);
    const message = first.choices?.[0]?.message;
    const toolCall = message?.tool_calls?.[0];

    if (!toolCall) {
      return message?.content ?? "";
    }

    const tool = this.tools.find((t) => t.name === toolCall.function.name);
    if (!tool) {
      return message?.content ?? "";
    }

    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(toolCall.function.arguments || "{}");
    } catch {
      args = {};
    }

    const result = await tool.execute(args);

    const followUp = await this.callGroq([
      ...messages,
      message!,
      { role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(result) },
    ]);

    return followUp.choices?.[0]?.message?.content ?? "";
  }
}
