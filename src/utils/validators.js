const Joi = require('joi');

const userSchema = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase, one lowercase, one number, and one special character',
      }),
    full_name: Joi.string().min(2).max(100).required(),
  }),

  update: Joi.object({
    email: Joi.string().email(),
    full_name: Joi.string().min(2).max(100),
    status: Joi.string().valid('active', 'inactive', 'suspended'),
  }),
};

const recordSchema = {
  create: Joi.object({
    amount: Joi.number().positive().precision(2).required(),
    type: Joi.string().valid('income', 'expense').required(),
    category: Joi.string().min(2).max(50).required(),
    date: Joi.date().max('now').required(),
    description: Joi.string().max(200),
    notes: Joi.string().max(500),
    tags: Joi.array().items(Joi.string().max(20)),
    metadata: Joi.object(),
  }),

  update: Joi.object({
    amount: Joi.number().positive().precision(2),
    type: Joi.string().valid('income', 'expense'),
    category: Joi.string().min(2).max(50),
    date: Joi.date().max('now'),
    description: Joi.string().max(200),
    notes: Joi.string().max(500),
    tags: Joi.array().items(Joi.string().max(20)),
    metadata: Joi.object(),
  }),

  filters: Joi.object({
    start_date: Joi.date(),
    end_date: Joi.date(),
    type: Joi.string().valid('income', 'expense'),
    category: Joi.string(),
    min_amount: Joi.number().positive(),
    max_amount: Joi.number().positive(),
    search: Joi.string(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort_by: Joi.string().valid('date', 'amount', 'created_at').default('date'),
    sort_order: Joi.string().valid('ASC', 'DESC').default('DESC'),
  }),
};

const dashboardSchema = {
  summary: Joi.object({
    start_date: Joi.date(),
    end_date: Joi.date(),
  }),
};

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      });
    }

    req[property] = value;
    next();
  };
};

module.exports = {
  userSchema,
  recordSchema,
  dashboardSchema,
  validate,
};