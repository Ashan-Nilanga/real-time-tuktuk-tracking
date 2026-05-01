import { sendError } from '../utils/response.js';


export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const details = error.details.map(d => d.message).join('; ');
      return sendError(res, `Validation failed: ${details}`, 400);
    }

    req[source] = value;
    next();
  };
};
