const { AppError } = require('./errorMiddleware');

/**
 * Validates request data against a Joi schema.
 * @param {Object} schema - Joi schema object
 * @param {'body' | 'query' | 'params'} property - Target property to validate
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    if (!schema) return next();

    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return next(new AppError('Validation failed', 400, errorMessages));
    }

    req[property] = value;
    next();
  };
};

module.exports = {
  validate
};
