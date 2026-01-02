import { z } from 'zod';
import { TELANGANA_DISTRICTS } from './constants';

export const pledgeSchema = z.object({
  childName: z.string().min(1, 'Child name is required').max(100).trim(),
  parentName: z.string().min(1, 'Parent name is required').max(100).trim(),
  institutionName: z.string().min(1, 'Institution name is required').max(200).trim(),
  district: z.enum([...TELANGANA_DISTRICTS] as [string, ...string[]], {
    message: 'Please select a valid district',
  }),
  language: z.enum(['en', 'te']).default('en'),
});

export type PledgeFormData = z.infer<typeof pledgeSchema>;

