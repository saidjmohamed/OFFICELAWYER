import { z } from 'zod';

// ============ Sessions ============
export const sessionSchema = z.object({
  caseId: z.union([z.string(), z.number()]).transform(v => Number(v)),
  sessionDate: z.string().optional().nullable(),
  adjournmentReason: z.string().optional().nullable(),
  decision: z.string().optional().nullable(),
  rulingText: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const sessionUpdateSchema = sessionSchema.partial().extend({
  id: z.union([z.string(), z.number()]).transform(v => Number(v)),
});

// ============ Case Expenses ============
export const caseExpenseSchema = z.object({
  caseId: z.union([z.string(), z.number()]).transform(v => Number(v)),
  description: z.string().min(1, 'الوصف مطلوب'),
  amount: z.union([z.string(), z.number()]).transform(v => Number(v)).refine(v => !isNaN(v) && v > 0, 'المبلغ يجب أن يكون أكبر من صفر'),
  expenseDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const caseExpenseUpdateSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(v => Number(v)),
  description: z.string().optional(),
  amount: z.union([z.string(), z.number()]).transform(v => Number(v)).refine(v => !isNaN(v) && v > 0, 'المبلغ يجب أن يكون أكبر من صفر').optional(),
  expenseDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// ============ Helpers ============
export function safeParseInt(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  const num = typeof value === 'number' ? value : parseInt(value, 10);
  if (isNaN(num) || num < 0 || num > 2147483647) return null;
  return num;
}
