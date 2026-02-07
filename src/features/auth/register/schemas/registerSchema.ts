import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must not exceed 50 characters')
      .regex(/^[A-Za-z ]+$/, 'Name can only contain letters and spaces'),

    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Invalid email address')
      .toLowerCase(),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(64, 'Password must not exceed 64 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        'Password must contain at least one special character'
      )
      .refine((val) => !/\s/.test(val), {
        message: 'Password must not contain spaces',
      }),

    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => !data.password.toLowerCase().includes(data.name.toLowerCase()),
    {
      message: 'Password should not contain your name',
      path: ['password'],
    }
  )
  .refine(
    (data) => !data.password.toLowerCase().includes(data.email.split('@')[0]),
    {
      message: 'Password should not contain your email',
      path: ['password'],
    }
  );

export type RegisterSchemaType = z.infer<typeof registerSchema>;
