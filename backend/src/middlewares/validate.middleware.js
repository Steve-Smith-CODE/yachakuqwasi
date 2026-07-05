import { ValidationError } from '../errors/AppError.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return next(new ValidationError(result.error.flatten()));
    }

    req[source] = result.data;
    next();
  };
}
