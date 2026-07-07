import { chat } from '../../../src/controllers/maki.controller.js';

// Sin GEMINI_API_KEY/GROQ_API_KEY en .env.test, chatWithMaki cae al modo
// simulado real (ver makiChat.service.test.js para los demas proveedores).
describe('Maki Controller', () => {
  it('chat responde con el resultado real de chatWithMaki (modo simulado)', async () => {
    const req = { body: { message: 'Hola Maki', history: [] } };
    const res = { json: jest.fn().mockReturnThis() };

    await chat(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.isSimulated).toBe(true);
    expect(typeof body.text).toBe('string');
  });
});
