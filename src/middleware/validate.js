const { z } = require('zod');

const registerSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(9),
  email: z.string().email().optional(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  identifier: z.string(),
  password: z.string().min(6),
});

module.exports = { registerSchema, loginSchema };
