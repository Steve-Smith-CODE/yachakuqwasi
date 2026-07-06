import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { MakiService } from "./services/maki/maki.service.js";
import { GroqMakiService } from "./services/maki/providers/groq.provider.js";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Safe lazy initializer for Gemini
  let ai: GoogleGenAI | null = null;
  function getGemini() {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return null;
      }
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return ai;
  }

  // Maki desacoplado del proveedor de IA: MakiService (Gemini) y
  // GroqMakiService comparten la misma interfaz publica chat(prompt, systemInstruction),
  // asi que server.ts puede intercambiar de proveedor sin tocar la logica
  // de negocio ni las tools (services/maki/tools.ts).
  type MakiProvider = { chat(prompt: string, systemInstruction: string): Promise<string> };
  let maki: MakiProvider | null = null;

  function getMaki(): MakiProvider | null {
    if (maki) return maki;

    const requested = (process.env.AI_PROVIDER || "").toLowerCase();
    const groqKey = process.env.GROQ_API_KEY;

    if (requested === "groq" && groqKey) {
      maki = new GroqMakiService(groqKey);
      return maki;
    }
    if (requested === "gemini") {
      const gemini = getGemini();
      if (gemini) {
        maki = new MakiService(gemini);
        return maki;
      }
    }

    // Sin AI_PROVIDER explicito: Groq primero (mas rapido) si hay key,
    // luego Gemini, luego modo simulado.
    if (groqKey) {
      maki = new GroqMakiService(groqKey);
      return maki;
    }
    const gemini = getGemini();
    if (gemini) {
      maki = new MakiService(gemini);
      return maki;
    }
    return null;
  }

  // API Route for chatting with Maki the mascot
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      const makiService = getMaki();

      if (!makiService) {
        // Fallback simulated answers if API key is missing
        const fallbackAnswers = [
          "¡Hola, estimado Huamanguino! Soy Maki, tu halcón consejero. Para activar mi inteligencia artificial completa con el API Key de Gemini, configúrala en Settings > Secrets en AI Studio. Mientras tanto, te aconsejo buscar cuartos en el barrio de San Blas o cerca de la Av. Independencia, que están cerquísima a la UNSCH.",
          "¡Excelente pregunta! Como tu fiel mascota UNSCH, te sugiero siempre revisar que el contrato de alquiler incluya el costo del agua y la luz para evitar sorpresas. ¿Quieres saber más sobre algún barrio en Ayacucho?",
          "¡Ayacucho es hermoso! El costo promedio de una habitación estudiantil ronda entre los 150 y 350 soles según los servicios (como Wi-Fi o baño privado). ¡Te deseo el mejor de los éxitos en tu ciclo académico!",
          "¡Hola! Te recomiendo buscar alojamiento con buena iluminación natural para tus noches de estudio. Recuerda que estaré aquí para darte los mejores tips.",
        ];
        const randomAnswer = fallbackAnswers[Math.floor(Math.random() * fallbackAnswers.length)];
        return res.json({ text: randomAnswer, isSimulated: true });
      }

      // Convert history to context
      const systemInstruction = `You are Maki, the friendly hawk mascot of 'YachakuqWasi', a student housing portal in Ayacucho, Peru. You are a corporate mascot in the style of Duolingo or Mailchimp, but with Andean academic vibes. Your primary colors are Guindo (Burgundy/Maroon) and Plomo (Slate Grey), and you wear a stylized sun and condor emblem inspired by the UNSCH coat of arms. You are warm, encouraging, smart, and speak Spanish with local Peruvian charm (using friendly Andean words like '¡Hola, Huamanguino!', 'hermano', 'cuy', 'wawa', 'kusi' meaning happy, or mentioning the beautiful historic neighborhoods of Ayacucho like San Blas, Belén, Calvario, Carmen Alto, Conchopata, Santa Ana). You help UNSCH university students find safe, comfortable, and affordable housing. You give excellent advice on rent agreements, safety, proximity to the university campus (Ciudad Universitaria), living costs, and study habits. Keep your answers relatively concise, warm, helpful, and highly energetic! Always answer in Spanish. You have access to a "search_housings" tool that queries REAL, currently approved listings from the YachakuqWasi database (by neighborhood, type, and max price) — use it whenever a student asks to find, search, or recommend specific available housing, instead of inventing listings.`;

      let prompt = "";
      if (history && history.length > 0) {
        prompt += "Historial de conversación:\n";
        for (const msg of history) {
          prompt += `${msg.sender === "user" ? "Estudiante" : "Maki"}: ${msg.text}\n`;
        }
      }
      prompt += `Estudiante: ${message}\n\nMaki:`;

      const text = await makiService.chat(prompt, systemInstruction);

      return res.json({ text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      return res.status(500).json({ error: error.message || "Error al comunicarse con la IA" });
    }
  });

  // Serve static files in development via Vite, and dist folder in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
