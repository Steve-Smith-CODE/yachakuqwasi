import { AppError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError } from '../../../src/errors/AppError.js';

describe('AppError', () => {
  it('usa 500 e INTERNAL_ERROR por defecto y marca isOperational', () => {
    const err = new AppError('Algo fallo');

    expect(err.message).toBe('Algo fallo');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(Error);
  });

  it('acepta statusCode y code personalizados', () => {
    const err = new AppError('Custom', 418, 'TEAPOT');

    expect(err.statusCode).toBe(418);
    expect(err.code).toBe('TEAPOT');
  });
});

describe('ValidationError', () => {
  it('usa statusCode 400 y adjunta los details', () => {
    const details = { fieldErrors: { email: ['Email invalido'] } };
    const err = new ValidationError(details);

    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toBe(details);
  });
});

describe('UnauthorizedError', () => {
  it('usa statusCode 401 y mensaje por defecto', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('No autorizado');
  });
});

describe('ForbiddenError', () => {
  it('usa statusCode 403 y mensaje por defecto', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('No tienes permiso para esta acción');
  });
});

describe('NotFoundError', () => {
  it('interpola el nombre del recurso en el mensaje', () => {
    const err = new NotFoundError('Usuario');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Usuario no encontrado');
  });

  it('usa "Recurso" por defecto cuando no se especifica', () => {
    const err = new NotFoundError();
    expect(err.message).toBe('Recurso no encontrado');
  });
});
