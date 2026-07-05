jest.mock('../../../src/config/logger.js', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn() }
}));

import { EventEmitter } from 'events';
import { requestLogger } from '../../../src/middlewares/requestLogger.middleware.js';
import logger from '../../../src/config/logger.js';

describe('requestLogger middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { method: 'GET', path: '/api/housings' };
    res = Object.assign(new EventEmitter(), { statusCode: 200 });
    next = jest.fn();
    logger.info.mockClear();
    logger.warn.mockClear();
  });

  it('asigna un req.id unico y llama a next()', () => {
    requestLogger(req, res, next);

    expect(req.id).toEqual(expect.any(String));
    expect(next).toHaveBeenCalled();
  });

  it('registra con nivel info y el requestId cuando la respuesta es exitosa', () => {
    requestLogger(req, res, next);
    res.emit('finish');

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('GET /api/housings - 200'),
      expect.objectContaining({ requestId: req.id })
    );
  });

  it('registra con nivel warn cuando el status es un error de cliente/servidor', () => {
    res.statusCode = 404;
    requestLogger(req, res, next);
    res.emit('finish');

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('404'),
      expect.objectContaining({ requestId: req.id })
    );
  });
});
