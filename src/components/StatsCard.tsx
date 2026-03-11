import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendType?: "up" | "down" | "neutral";
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, trendType = "neutral", className }: StatsCardProps) {
  return (
    <div className={cn("rounded-md border border-border bg-card p-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2">
        <p className="font-mono text-2xl font-bold text-card-foreground">{value}</p>
        {trend && (
          <p className={cn(
            "mt-1 font-mono text-xs",
            trendType === "up" && "text-success",
            trendType === "down" && "text-destructive",
            trendType === "neutral" && "text-muted-foreground"
          )}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
