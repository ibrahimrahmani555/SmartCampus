import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(8)
  .regex(/\d/, 'Le mot de passe doit contenir au moins un chiffre.')
