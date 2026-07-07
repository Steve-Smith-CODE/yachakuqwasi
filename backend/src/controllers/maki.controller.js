import { chatWithMaki } from '../services/makiChat.service.js';

export async function chat(req, res) {
  const { message, history } = req.body;
  const result = await chatWithMaki(message, history);
  res.json(result);
}
