import { z } from "zod";

export const budgetSchema = z.object({
  budgetCode: z.string().min(1, "กรุณาระบุรหัสงบประมาณ"),
  name: z.string().min(1, "กรุณาระบุชื่องบประมาณ"),
  fundSource: z.string().optional().nullable(),
  allocatedAmount: z.coerce.number().min(0, "จำนวนเงินต้องไม่ติดลบ"),
  transferredAmount: z.coerce.number().min(0, "จำนวนเงินต้องไม่ติดลบ"),
  departmentId: z.string().min(1, "กรุณาเลือกหน่วยงาน"),
  fiscalYear: z.coerce.number().min(2500, "ปีงบประมาณไม่ถูกต้อง").max(2600),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
