// FIX 19: Zod validation schemas for API routes
import { z } from 'zod';

// Cases validation
export const caseSchema = z.object({
  caseNumber: z.string().max(100).nullable().optional(),
  caseType: z.string().max(50).nullable().optional(),
  judicialBodyId: z.union([z.string(), z.number()]).nullable().optional(),
  chamberId: z.union([z.string(), z.number()]).nullable().optional(),
  wilayaId: z.union([z.string(), z.number()]).nullable().optional(),
  registrationDate: z.string().nullable().optional(),
  firstSessionDate: z.string().nullable().optional(),
  subject: z.string().max(500).nullable().optional(),
  status: z.enum(['active', 'adjourned', 'judged', 'closed', 'archived']).optional(),
  fees: z.union([z.string(), z.number()]).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  judgmentNumber: z.string().max(100).nullable().optional(),
  judgmentDate: z.string().nullable().optional(),
  issuingCourt: z.string().max(200).nullable().optional(),
  originalCaseNumber: z.string().max(100).nullable().optional(),
  originalCourt: z.string().max(200).nullable().optional(),
  parties: z.array(z.object({
    role: z.enum(['plaintiff', 'defendant']).optional(),
    clientId: z.union([z.string(), z.number()]).nullable().optional(),
    clientDescription: z.string().max(500).nullable().optional(),
    opponentFirstName: z.string().max(100).nullable().optional(),
    opponentLastName: z.string().max(100).nullable().optional(),
    opponentPhone: z.string().max(20).nullable().optional(),
    opponentAddress: z.string().max(300).nullable().optional(),
    description: z.string().max(500).nullable().optional(),
    lawyerId: z.union([z.string(), z.number()]).nullable().optional(),
    lawyerDescription: z.string().max(500).nullable().optional(),
  })).optional(),
});

export const caseUpdateSchema = caseSchema.extend({
  id: z.number(),
});

// Clients validation
export const clientSchema = z.object({
  fullName: z.string().max(200).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  clientType: z.enum(['natural_person', 'legal_entity']).optional(),
  businessName: z.string().max(200).nullable().optional(),
  legalRepresentative: z.string().max(200).nullable().optional(),
});

export const clientUpdateSchema = clientSchema.extend({
  id: z.number(),
});

// Sessions validation
export const sessionSchema = z.object({
  caseId: z.union([z.string(), z.number()]),
  sessionDate: z.string().nullable().optional(),
  adjournmentReason: z.string().max(500).nullable().optional(),
  decision: z.string().max(1000).nullable().optional(),
  rulingText: z.string().max(5000).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const sessionUpdateSchema = z.object({
  id: z.union([z.string(), z.number()]),
  sessionDate: z.string().nullable().optional(),
  adjournmentReason: z.string().max(500).nullable().optional(),
  decision: z.string().max(1000).nullable().optional(),
  rulingText: z.string().max(5000).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

// Case expenses validation
export const caseExpenseSchema = z.object({
  caseId: z.union([z.string(), z.number()]),
  description: z.string().min(1).max(500),
  amount: z.union([z.string(), z.number()]),
  expenseDate: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const caseExpenseUpdateSchema = z.object({
  id: z.union([z.string(), z.number()]),
  description: z.string().min(1).max(500).optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  expenseDate: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});
