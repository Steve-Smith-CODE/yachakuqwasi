jest.mock('../../../src/config/logger.js', () => ({
  __esModule: true,
  default: { error: jest.fn() }
}));

import errorHandler from '../../../src/middlewares/errorHandler.middleware.js';
import logger from '../../../src/config/logger.js';

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    logger.error.mockClear();
  });

  it('debe usar el statusCode y mensaje del error cuando estan definidos', () => {
    const err = { statusCode: 404, message: 'Recurso no encontrado', stack: 'stack-trace' };

    errorHandler(err, req, res, next);

    expect(logger.error).toHaveBeenCalledWith(
      'stack-trace',
      expect.objectContaining({ statusCode: 404, stack: 'stack-trace' })
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Recurso no encontrado', status: 404 });
  });

  it('debe usar 500 y mensaje por defecto cuando el error no los define', () => {
    const err = {};

    errorHandler(err, req, res, next);

    expect(logger.error).toHaveBeenCalledWith(undefined, expect.objectContaining({ statusCode: 500 }));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor', status: 500 });
  });

  it('debe registrar el mensaje del error cuando no hay stack', () => {
    const err = new Error('Fallo puntual');
    err.stack = undefined;

    errorHandler(err, req, res, next);

    expect(logger.error).toHaveBeenCalledWith('Fallo puntual', expect.any(Object));
  });

  it('debe incluir el requestId en el log cuando req.id esta presente', () => {
    const err = { statusCode: 400, message: 'Dato invalido' };
    req.id = 'req-123';
    req.path = '/api/test';

    errorHandler(err, req, res, next);

    expect(logger.error).toHaveBeenCalledWith(
      'Dato invalido',
      expect.objectContaining({ requestId: 'req-123', path: '/api/test' })
    );
  });

  it('debe incluir details en la respuesta cuando el error los trae (p. ej. ValidationError)', () => {
    const err = { statusCode: 400, message: 'Validación fallida', details: { fieldErrors: { email: ['Email inválido'] } } };

    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      error: 'Validación fallida',
      status: 400,
      details: { fieldErrors: { email: ['Email inválido'] } }
    });
  });

  it('no expone el stack en el log cuando el error es operacional (isOperational)', () => {
    const err = { statusCode: 400, message: 'Operacional', stack: 'stack-secreto', isOperational: true };

    errorHandler(err, req, res, next);

    const [, meta] = logger.error.mock.calls[0];
    expect(meta.stack).toBeUndefined();
  });
});
