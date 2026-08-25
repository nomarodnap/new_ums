"use client";

import { useActionState } from "react";
import { resolveAudit } from "@/server/actions/audits";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function ResolveAuditForm({ auditId }: { auditId: string }) {
  const [state, formAction, isPending] = useActionState(resolveAudit, null);

  return (
    <form noValidate action={formAction} className="space-y-4 mt-6">
      <input type="hidden" name="auditId" value={auditId} />

      {state?.error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">
          บันทึกการแก้ไขเรียบร้อยแล้ว
        </div>
      )}

      {!state?.success && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="remarks">บันทึกการแก้ไข / หมายเหตุ</Label>
            <Textarea
              id="remarks"
              name="remarks"
              placeholder="ระบุการดำเนินการแก้ไขที่ได้ทำไป..."
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="attachment">แนบเอกสารหลักฐาน (PDF, JPG)</Label>
            <Input id="attachment" name="attachment" type="file" />
            <p className="text-xs text-muted-foreground">
              เช่น หนังสือขออนุมัติอธิบดี, หลักฐานการเรียกเงินคืน
            </p>
          </div>

          <Button type="submit" disabled={isPending} className="mt-2">
            {isPending ? "กำลังบันทึก..." : "ยืนยันการแก้ไข (Mark as Corrected)"}
          </Button>
        </>
      )}
    </form>
  );
}
