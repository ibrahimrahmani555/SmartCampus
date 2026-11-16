import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
  .regex(/\d/, 'Le mot de passe doit contenir au moins un chiffre.')
