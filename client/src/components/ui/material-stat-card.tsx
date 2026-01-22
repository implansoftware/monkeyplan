import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type GradientVariant = "primary" | "success" | "warning" | "info" | "danger" | "purple" | "dark";

const gradientStyles: Record<GradientVariant, string> = {
  primary: "from-blue-600 to-blue-400",
  success: "from-emerald-600 to-emerald-400",
  warning: "from-amber-500 to-orange-400",
  info: "from-cyan-500 to-cyan-400",
  danger: "from-rose-600 to-rose-400",
  purple: "from-violet-600 to-violet-400",
  dark: "from-slate-700 to-slate-500",
};

interface MaterialStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  subtitleIcon?: LucideIcon;
  icon: LucideIcon;
  gradient?: GradientVariant;
  trend?: {
    value: string;
    positive?: boolean;
  };
  onClick?: () => void;
  className?: string;
  isLoading?: boolean;
  "data-testid"?: string;
}

export function MaterialStatCard({
  title,
  value,
  subtitle,
  subtitleIcon: SubtitleIcon,
  icon: Icon,
  gradient = "primary",
  trend,
  onClick,
  className,
  isLoading = false,
  "data-testid": testId,
}: MaterialStatCardProps) {
  return (
    <Card 
      className={cn(
        "relative overflow-visible border-0 bg-card shadow-md transition-all duration-200 hover-elevate",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      data-testid={testId}
    >
      <CardContent className="p-4 pt-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 pt-6">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <h3 className="text-2xl font-bold mt-1 text-foreground">{value}</h3>
            )}
          </div>
          <div 
            className={cn(
              "absolute -top-4 right-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg",
              gradientStyles[gradient]
            )}
          >
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>
        
        {(subtitle || trend) && (
          <div className="mt-4 flex items-center gap-1 border-t pt-3 text-sm">
            {trend && (
              <span className={cn(
                "font-semibold",
                trend.positive ? "text-emerald-500" : "text-rose-500"
              )}>
                {trend.positive ? "+" : ""}{trend.value}
              </span>
            )}
            {subtitle && (
              <span className="text-muted-foreground flex items-center gap-1">
                {SubtitleIcon && <SubtitleIcon className="h-3.5 w-3.5" />}
                {subtitle}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MaterialChartCardProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  gradient?: GradientVariant;
  children: React.ReactNode;
  className?: string;
}

export function MaterialChartCard({
  title,
  subtitle,
  icon: Icon,
  gradient = "primary",
  children,
  className,
}: MaterialChartCardProps) {
  return (
    <Card className={cn("overflow-visible border-0 bg-card shadow-md", className)}>
      <div className="relative">
        <div 
          className={cn(
            "mx-4 -mt-6 rounded-xl bg-gradient-to-br p-4 shadow-lg",
            gradientStyles[gradient]
          )}
        >
          <div className="flex items-center justify-between text-white mb-2">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              <span className="font-medium">{title}</span>
            </div>
          </div>
          <div className="h-48">
            {children}
          </div>
        </div>
        {subtitle && (
          <div className="p-4">
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

interface MaterialTableCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function MaterialTableCard({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className,
}: MaterialTableCardProps) {
  return (
    <Card className={cn("border-0 bg-card shadow-md", className)}>
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 shadow">
              <Icon className="h-5 w-5 text-white" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-4">
        {children}
      </div>
    </Card>
  );
}
