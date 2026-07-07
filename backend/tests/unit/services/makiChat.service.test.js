// makiChat.service.js cachea el proveedor de IA elegido en variables de
// modulo (`let ai`, `let maki`). Para poder probar cada combinacion de
// AI_PROVIDER/GEMINI_API_KEY/GROQ_API_KEY hace falta un modulo "fresco" por
// escenario: jest.resetModules() + import() dinamico despues de fijar el env.
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({ id: 'fake-gemini-client' }))
}));
jest.mock('../../../src/services/maki/maki.service.js', () => ({
  MakiService: jest.fn().mockImplementation(() => ({ chat: jest.fn().mockResolvedValue('respuesta gemini') }))
}));
jest.mock('../../../src/services/maki/providers/groq.provider.js', () => ({
  GroqMakiService: jest.fn().mockImplementation(() => ({ chat: jest.fn().mockResolvedValue('respuesta groq') }))
}));

const ENV_KEYS = ['GEMINI_API_KEY', 'GROQ_API_KEY', 'AI_PROVIDER'];

async function loadWithEnv(envOverrides) {
  jest.resetModules();
  for (const key of ENV_KEYS) delete process.env[key];
  Object.assign(process.env, envOverrides);

  const makiChatModule = await import('../../../src/services/makiChat.service.js');
  const { MakiService } = await import('../../../src/services/maki/maki.service.js');
  const { GroqMakiService } = await import('../../../src/services/maki/providers/groq.provider.js');
  return { chatWithMaki: makiChatModule.chatWithMaki, MakiService, GroqMakiService };
}

describe('makiChat.service', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('responde con una respuesta simulada cuando no hay ninguna API key configurada', async () => {
    const { chatWithMaki } = await loadWithEnv({});

    const result = await chatWithMaki('Hola Maki', []);

    expect(result.isSimulated).toBe(true);
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeGreaterThan(0);
  });

  it('usa Groq cuando AI_PROVIDER=groq y hay GROQ_API_KEY', async () => {
    const { chatWithMaki, GroqMakiService } = await loadWithEnv({ AI_PROVIDER: 'groq', GROQ_API_KEY: 'groq-key' });

    const result = await chatWithMaki('Hola Maki', []);

    expect(result).toEqual({ text: 'respuesta groq' });
    expect(GroqMakiService).toHaveBeenCalledWith('groq-key');
  });

  it('usa Gemini cuando AI_PROVIDER=gemini y hay GEMINI_API_KEY', async () => {
    const { chatWithMaki, MakiService } = await loadWithEnv({ AI_PROVIDER: 'gemini', GEMINI_API_KEY: 'gemini-key' });

    const result = await chatWithMaki('Hola Maki', []);

    expect(result).toEqual({ text: 'respuesta gemini' });
    expect(MakiService).toHaveBeenCalled();
  });

  it('cae a modo simulado si AI_PROVIDER=gemini pero no hay GEMINI_API_KEY ni GROQ_API_KEY', async () => {
    const { chatWithMaki } = await loadWithEnv({ AI_PROVIDER: 'gemini' });

    const result = await chatWithMaki('Hola Maki', []);

    expect(result.isSimulated).toBe(true);
  });

  it('sin AI_PROVIDER explicito, prioriza Groq si hay GROQ_API_KEY', async () => {
    const { chatWithMaki, GroqMakiService } = await loadWithEnv({ GROQ_API_KEY: 'groq-key' });

    const result = await chatWithMaki('Hola Maki', []);

    expect(result).toEqual({ text: 'respuesta groq' });
    expect(GroqMakiService).toHaveBeenCalled();
  });

  it('sin AI_PROVIDER explicito y sin Groq, usa Gemini si hay GEMINI_API_KEY', async () => {
    const { chatWithMaki, MakiService } = await loadWithEnv({ GEMINI_API_KEY: 'gemini-key' });

    const result = await chatWithMaki('Hola Maki', []);

    expect(result).toEqual({ text: 'respuesta gemini' });
    expect(MakiService).toHaveBeenCalled();
  });

  it('incluye el historial de conversacion en el prompt enviado al proveedor', async () => {
    const { chatWithMaki, MakiService } = await loadWithEnv({ GEMINI_API_KEY: 'gemini-key' });

    await chatWithMaki('Segundo mensaje', [{ sender: 'user', text: 'Primero' }, { sender: 'maki', text: 'Respuesta previa' }]);

    const instance = MakiService.mock.results[0].value;
    const [prompt] = instance.chat.mock.calls[0];
    expect(prompt).toContain('Historial de conversación');
    expect(prompt).toContain('Estudiante: Primero');
    expect(prompt).toContain('Maki: Respuesta previa');
    expect(prompt).toContain('Estudiante: Segundo mensaje');
  });

  it('reutiliza el mismo proveedor cacheado en llamadas sucesivas dentro del mismo modulo', async () => {
    const { chatWithMaki, MakiService } = await loadWithEnv({ GEMINI_API_KEY: 'gemini-key' });

    await chatWithMaki('Primera', []);
    await chatWithMaki('Segunda', []);

    expect(MakiService).toHaveBeenCalledTimes(1);
  });

  it('usa un mensaje de error generico si el error del proveedor no trae message', async () => {
    jest.resetModules();
    for (const key of ENV_KEYS) delete process.env[key];
    Object.assign(process.env, { GEMINI_API_KEY: 'gemini-key' });

    jest.doMock('../../../src/services/maki/maki.service.js', () => ({
      MakiService: jest.fn().mockImplementation(() => ({ chat: jest.fn().mockRejectedValue(new Error()) }))
    }));

    const { chatWithMaki } = await import('../../../src/services/makiChat.service.js');

    await expect(chatWithMaki('Hola', [])).rejects.toMatchObject({
      statusCode: 502,
      message: 'Error al comunicarse con la IA'
    });
  });

  it('lanza un error con statusCode 502 si el proveedor falla', async () => {
    jest.resetModules();
    for (const key of ENV_KEYS) delete process.env[key];
    Object.assign(process.env, { GEMINI_API_KEY: 'gemini-key' });

    jest.doMock('../../../src/services/maki/maki.service.js', () => ({
      MakiService: jest.fn().mockImplementation(() => ({ chat: jest.fn().mockRejectedValue(new Error('IA caida')) }))
    }));

    const { chatWithMaki } = await import('../../../src/services/makiChat.service.js');

    await expect(chatWithMaki('Hola', [])).rejects.toMatchObject({ statusCode: 502, message: 'IA caida' });
  });
});
