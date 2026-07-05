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

    expect(logger.error).toHaveBeenCalledWith('stack-trace');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Recurso no encontrado', status: 404 });
  });

  it('debe usar 500 y mensaje por defecto cuando el error no los define', () => {
    const err = {};

    errorHandler(err, req, res, next);

    expect(logger.error).toHaveBeenCalledWith(undefined);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor', status: 500 });
  });

  it('debe registrar el mensaje del error cuando no hay stack', () => {
    const err = new Error('Fallo puntual');
    err.stack = undefined;

    errorHandler(err, req, res, next);

    expect(logger.error).toHaveBeenCalledWith('Fallo puntual');
  });
});
