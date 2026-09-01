import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, MoreVertical, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminContext, formatNum } from "@/components/admin-context";

export const Route = createFileRoute("/app/admin/apis")({
  component: AdminApisPage,
});

function AdminApisPage() {
  const { aiApis } = useAdminContext();

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">APIهای فعال</h3>
        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="ml-1 h-4 w-4" />افزودن API</Button>
      </div>
      <div className="mt-4 space-y-3">
        {!aiApis ? (
          <div className="text-sm text-muted-foreground py-4 text-center">در حال بارگذاری...</div>
        ) : aiApis.apis.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            هنوز درخواست AI ثبت نشده.
            {aiApis.gemini_configured && <span className="block mt-1 text-primary">Gemini API متصل است.</span>}
            {!aiApis.gemini_configured && <span className="block mt-1 text-amber-500">Gemini API تنظیم نشده.</span>}
          </div>
        ) : (
          aiApis.apis.map((a, i) => (
            <div key={a.name + i} className="flex items-center gap-4 rounded-lg border border-border bg-secondary/40 p-4">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <Cpu className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{a.name}</span>
                  {i === 0 && <Badge className="bg-primary text-primary-foreground">پیش‌فرض</Badge>}
                </div>
                <div className="text-xs text-muted-foreground tabular">endpoint: {a.endpoint}</div>
              </div>
              <div className="text-sm tabular">{formatNum(a.requests)} درخواست</div>
              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
            </div>
          ))
        )}
        {aiApis?.gemini_configured === false && (
          <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
            برای فعال‌سازی AI Coach، کلید Gemini API را در فایل backend/.env تنظیم کنید.
          </div>
        )}
      </div>
    </div>
  );
}
