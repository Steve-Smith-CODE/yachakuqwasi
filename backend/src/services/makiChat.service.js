import { GoogleGenAI } from '@google/genai';
import { MakiService } from './maki/maki.service.js';
import { GroqMakiService } from './maki/providers/groq.provider.js';
import logger from '../config/logger.js';

const SYSTEM_INSTRUCTION = `You are Maki, the friendly hawk mascot of 'YachakuqWasi', a student housing portal in Ayacucho, Peru. You are a corporate mascot in the style of Duolingo or Mailchimp, but with Andean academic vibes. Your primary colors are Guindo (Burgundy/Maroon) and Plomo (Slate Grey), and you wear a stylized sun and condor emblem inspired by the UNSCH coat of arms. You are warm, encouraging, smart, and speak Spanish with local Peruvian charm (using friendly Andean words like '¡Hola, Huamanguino!', 'hermano', 'cuy', 'wawa', 'kusi' meaning happy, or mentioning the beautiful historic neighborhoods of Ayacucho like San Blas, Belén, Calvario, Carmen Alto, Conchopata, Santa Ana). You help UNSCH university students find safe, comfortable, and affordable housing. You give excellent advice on rent agreements, safety, proximity to the university campus (Ciudad Universitaria), living costs, and study habits. Keep your answers relatively concise, warm, helpful, and highly energetic! Always answer in Spanish. You have access to a "search_housings" tool that queries REAL, currently approved listings from the YachakuqWasi database (by neighborhood, type, and max price) — use it whenever a student asks to find, search, or recommend specific available housing, instead of inventing listings.`;

const FALLBACK_ANSWERS = [
  '¡Hola, estimado Huamanguino! Soy Maki, tu halcón consejero. Para activar mi inteligencia artificial completa, configura GEMINI_API_KEY o GROQ_API_KEY en el backend. Mientras tanto, te aconsejo buscar cuartos en el barrio de San Blas o cerca de la Av. Independencia, que están cerquísima a la UNSCH.',
  '¡Excelente pregunta! Como tu fiel mascota UNSCH, te sugiero siempre revisar que el contrato de alquiler incluya el costo del agua y la luz para evitar sorpresas. ¿Quieres saber más sobre algún barrio en Ayacucho?',
  '¡Ayacucho es hermoso! El costo promedio de una habitación estudiantil ronda entre los 150 y 350 soles según los servicios (como Wi-Fi o baño privado). ¡Te deseo el mejor de los éxitos en tu ciclo académico!',
  '¡Hola! Te recomiendo buscar alojamiento con buena iluminación natural para tus noches de estudio. Recuerda que estaré aquí para darte los mejores tips.'
];

let ai = null;
function getGemini() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'yachakuqwasi-backend' } }
    });
  }
  return ai;
}

let maki = null;
function getMaki() {
  if (maki) return maki;

  const requested = (process.env.AI_PROVIDER || '').toLowerCase();
  const groqKey = process.env.GROQ_API_KEY;

  if (requested === 'groq' && groqKey) {
    maki = new GroqMakiService(groqKey);
    return maki;
  }
  if (requested === 'gemini') {
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

function buildPrompt(message, history) {
  let prompt = '';
  if (history && history.length > 0) {
    prompt += 'Historial de conversación:\n';
    for (const msg of history) {
      prompt += `${msg.sender === 'user' ? 'Estudiante' : 'Maki'}: ${msg.text}\n`;
    }
  }
  prompt += `Estudiante: ${message}\n\nMaki:`;
  return prompt;
}

export async function chatWithMaki(message, history) {
  const provider = getMaki();

  if (!provider) {
    const randomAnswer = FALLBACK_ANSWERS[Math.floor(Math.random() * FALLBACK_ANSWERS.length)];
    return { text: randomAnswer, isSimulated: true };
  }

  try {
    const text = await provider.chat(buildPrompt(message, history), SYSTEM_INSTRUCTION);
    return { text };
  } catch (err) {
    logger.error('Maki chat error: ' + err.message);
    const error = new Error(err.message || 'Error al comunicarse con la IA');
    error.statusCode = 502;
    throw error;
  }
}
