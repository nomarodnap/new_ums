import { z } from "zod";

export const budgetCodeSchema = z.object({
  code: z.string().min(1, "กรุณากรอกรหัสงบประมาณ"),
  name: z.string().optional().default(""),
  fiscalYear: z.coerce
    .number()
    .int()
    .min(2500, "กรุณาระบุปีงบประมาณ พ.ศ. ให้ถูกต้อง (เช่น 2568, 2569)"),
  description: z.string().optional(),
  isActive: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === "true" || val === "on")
    .optional()
    .default(true),
});

export type BudgetCodeInput = z.infer<typeof budgetCodeSchema>;
