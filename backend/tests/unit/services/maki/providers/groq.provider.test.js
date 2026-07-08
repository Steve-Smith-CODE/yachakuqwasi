import { GroqMakiService } from '../../../../../src/services/maki/providers/groq.provider.js';

// Groq es un proveedor de IA externo de terceros (igual que Nominatim en
// geocoding.service.test.js): se mockea global.fetch en vez de pegarle a la
// API real, para no depender de red ni de una GROQ_API_KEY valida en CI.
const fakeTool = {
  name: 'fake_tool',
  description: 'Herramienta de prueba',
  parameters: {
    type: 'OBJECT',
    properties: { x: { type: 'STRING', description: 'una propiedad de prueba' } }
  },
  execute: jest.fn().mockResolvedValue({ ok: true })
};

function jsonResponse(body, ok = true) {
  return { ok, json: async () => body, text: async () => JSON.stringify(body) };
}

describe('GroqMakiService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    fakeTool.execute.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('usa makiTools por defecto cuando no se pasa un segundo argumento', () => {
    const service = new GroqMakiService('key');
    const tools = service.buildProviderTools();

    expect(tools.some((t) => t.function.name === 'search_housings')).toBe(true);
  });

  it('buildProviderTools convierte los "type" de Gemini (mayusculas) a JSON Schema (minusculas)', () => {
    const service = new GroqMakiService('key', [fakeTool]);

    const tools = service.buildProviderTools();

    expect(tools).toEqual([
      {
        type: 'function',
        function: {
          name: 'fake_tool',
          description: 'Herramienta de prueba',
          parameters: {
            type: 'object',
            properties: { x: { type: 'string', description: 'una propiedad de prueba' } }
          }
        }
      }
    ]);
  });

  it('convierte tambien los "type" dentro de arrays (p. ej. enum)', () => {
    const toolWithArray = {
      ...fakeTool,
      parameters: {
        type: 'OBJECT',
        properties: { estado: { type: 'STRING', enum: [{ type: 'ARRAY' }, { type: 'STRING' }] } }
      }
    };
    const service = new GroqMakiService('key', [toolWithArray]);

    const tools = service.buildProviderTools();

    expect(tools[0].function.parameters.properties.estado.enum).toEqual([{ type: 'array' }, { type: 'string' }]);
  });

  it('callGroq lanza un error legible cuando la respuesta no es ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' });
    const service = new GroqMakiService('key', [fakeTool]);

    await expect(service.callGroq([])).rejects.toThrow('Groq API error 500: boom');
  });

  it('chat devuelve el contenido directo cuando el modelo no pide ninguna tool', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: 'hola desde groq' } }] })
    );
    const service = new GroqMakiService('key', [fakeTool]);

    const result = await service.chat('hola', 'system');

    expect(result).toBe('hola desde groq');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('chat devuelve "" si no hay tool_calls ni content', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({ choices: [{ message: {} }] }));
    const service = new GroqMakiService('key', [fakeTool]);

    const result = await service.chat('hola', 'system');

    expect(result).toBe('');
  });

  it('chat devuelve el contenido directo si la tool solicitada no existe', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        choices: [
          { message: { content: 'texto original', tool_calls: [{ id: 'c1', function: { name: 'no_existe', arguments: '{}' } }] } }
        ]
      })
    );
    const service = new GroqMakiService('key', [fakeTool]);

    const result = await service.chat('hola', 'system');

    expect(result).toBe('texto original');
    expect(fakeTool.execute).not.toHaveBeenCalled();
  });

  it('chat devuelve "" (no null/undefined) si la tool no existe y el mensaje no trae content', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        choices: [
          { message: { content: null, tool_calls: [{ id: 'c1', function: { name: 'no_existe', arguments: '{}' } }] } }
        ]
      })
    );
    const service = new GroqMakiService('key', [fakeTool]);

    const result = await service.chat('hola', 'system');

    expect(result).toBe('');
    expect(fakeTool.execute).not.toHaveBeenCalled();
  });

  it('chat ejecuta la tool solicitada y hace una segunda llamada con el resultado', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          choices: [
            {
              message: {
                content: null,
                tool_calls: [{ id: 'c1', function: { name: 'fake_tool', arguments: '{"x":"1"}' } }]
              }
            }
          ]
        })
      )
      .mockResolvedValueOnce(jsonResponse({ choices: [{ message: { content: 'respuesta final groq' } }] }));
    const service = new GroqMakiService('key', [fakeTool]);

    const result = await service.chat('hola', 'system');

    expect(fakeTool.execute).toHaveBeenCalledWith({ x: '1' });
    expect(result).toBe('respuesta final groq');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('chat usa {} como argumentos si function.arguments viene vacio/undefined', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          choices: [
            {
              message: {
                content: null,
                tool_calls: [{ id: 'c1', function: { name: 'fake_tool', arguments: undefined } }]
              }
            }
          ]
        })
      )
      .mockResolvedValueOnce(jsonResponse({ choices: [{ message: {} }] }));
    const service = new GroqMakiService('key', [fakeTool]);

    await service.chat('hola', 'system');

    expect(fakeTool.execute).toHaveBeenCalledWith({});
  });

  it('chat usa {} como argumentos si el JSON de arguments es invalido', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          choices: [
            {
              message: {
                content: null,
                tool_calls: [{ id: 'c1', function: { name: 'fake_tool', arguments: '{invalido' } }]
              }
            }
          ]
        })
      )
      .mockResolvedValueOnce(jsonResponse({ choices: [{ message: {} }] }));
    const service = new GroqMakiService('key', [fakeTool]);

    const result = await service.chat('hola', 'system');

    expect(fakeTool.execute).toHaveBeenCalledWith({});
    expect(result).toBe('');
  });
});
