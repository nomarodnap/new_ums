import { z } from "zod";

export const departmentTypeEnum = z.enum(
  ["central", "regional_central", "regional"],
  {
    message: "กรุณาระบุประเภทหน่วยงาน",
  },
);

export const departmentSchema = z.object({
  costCenterCode: z.string().optional().nullable(),
  disbursingUnit: z.string().optional().nullable(),
  depositUnit: z.string().optional().nullable(),
  fullName: z.string().min(1, "กรุณาระบุชื่อหน่วยงาน (เต็ม)").max(255),
  shortName: z.string().optional().nullable(),
  division: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  responsiblePerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  responsiblePhone: z.string().optional().nullable(),
  email: z
    .string()
    .email("รูปแบบอีเมลไม่ถูกต้อง")
    .optional()
    .nullable()
    .or(z.literal("")),
  type: departmentTypeEnum.optional().nullable(),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
