import { z } from 'zod';
import { validate } from '../../../src/middlewares/validate.middleware.js';

const schema = z.object({
  nombre: z.string().min(1),
  edad: z.coerce.number().int().positive()
});

describe('validate middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, query: {} };
    res = {};
    next = jest.fn();
  });

  it('llama a next() y reemplaza req.body con los datos parseados cuando el body es valido', () => {
    req.body = { nombre: 'Ana', edad: '21' };

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ nombre: 'Ana', edad: 21 });
  });

  it('llama a next(err) con un ValidationError (400) cuando el body es invalido', () => {
    req.body = { nombre: '' };

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toBeDefined();
  });

  it('valida req.query cuando se pasa source = "query"', () => {
    req.query = { nombre: 'Luis', edad: '30' };

    validate(schema, 'query')(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.query).toEqual({ nombre: 'Luis', edad: 30 });
  });
});
