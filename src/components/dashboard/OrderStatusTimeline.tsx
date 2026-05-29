import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Package, PackageCheck, Truck } from "lucide-react";
import type { ShippingStatus } from "@/lib/supabase";

const steps: { key: ShippingStatus; label: string; icon: typeof Clock }[] = [
  { key: "menunggu_pembayaran", label: "Menunggu Pembayaran", icon: Clock },
  { key: "diproses", label: "Diproses", icon: Package },
  { key: "dikemas", label: "Dikemas", icon: PackageCheck },
  { key: "dikirim", label: "Dikirim", icon: Truck },
  { key: "selesai", label: "Selesai", icon: CheckCircle2 },
];

export function OrderStatusTimeline({ status }: { status: ShippingStatus }) {
  const currentIdx = steps.findIndex((s) => s.key === status);
  const pct = ((currentIdx + 1) / steps.length) * 100;

  return (
    <div className="space-y-4">
      <Progress value={pct} className="h-2" />
      <div className="grid grid-cols-5 gap-2">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const done = i <= currentIdx;
          const active = i === currentIdx;
          return (
            <div key={s.key} className="flex flex-col items-center text-center">
              <div className={`h-10 w-10 rounded-full grid place-items-center transition-all ${
                done ? "bg-gradient-primary text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground"
              } ${active ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className={`text-[10px] md:text-xs mt-2 leading-tight ${done ? "font-medium" : "text-muted-foreground"}`}>{s.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: ShippingStatus }) {
  const labels: Record<ShippingStatus, string> = {
    menunggu_pembayaran: "Menunggu Bayar",
    diproses: "Diproses",
    dikemas: "Dikemas",
    dikirim: "Dikirim",
    selesai: "Selesai",
  };
  const colors: Record<ShippingStatus, string> = {
    menunggu_pembayaran: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
    diproses: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    dikemas: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
    dikirim: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
    selesai: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}
