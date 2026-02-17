import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import {
  BarChart3,
  ArrowLeft,
  TrendingUp,
  FileCheck,
  Coins,
  Building2,
  Zap,
  Phone,
  Lightbulb,
  Flame,
} from "lucide-react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useTranslation } from "react-i18next";

interface UtilitySummary {
  year: number;
  totalPractices: number;
  activePractices: number;
  byCategory: Record<string, { count: number; revenue: number; commissions: number }>;
  byStatus: Record<string, number>;
  commissions: {
    total: number;
    pending: number;
    paid: number;
  };
  supplierCount: number;
}

function getCategoryLabels(t: (key: string) => string): Record<string, string> {
  return {
    fisso: t("utility.types.fisso"),
    mobile: t("utility.types.mobile"),
    centralino: t("utility.types.centralino"),
    luce: t("utility.types.luce"),
    gas: t("utility.types.gas"),
    altro: t("common.other"),
  };
}

const categoryIcons: Record<string, typeof Phone> = {
  fisso: Phone,
  mobile: Phone,
  centralino: Building2,
  luce: Lightbulb,
  gas: Flame,
  altro: Zap,
};

function getStatusLabels(t: (key: string) => string): Record<string, string> {
  return {
    bozza: t("invoices.draft"),
    inviata: t("invoices.sent"),
    in_lavorazione: t("repairs.inProgress"),
    completata: t("utility.practiceStatus.completata"),
    annullata: t("common.cancelled"),
    rifiutata: t("common.rejected"),
  };
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

export default function ResellerUtilityReports() {
  const { t } = useTranslation();
  const categoryLabels = getCategoryLabels(t);
  const statusLabels = getStatusLabels(t);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const { data: summary, isLoading } = useQuery<UtilitySummary>({
    queryKey: ["/api/utility/reports/summary", { year: selectedYear }],
  });

  const categoryData = Object.entries(summary?.byCategory || {}).map(([key, value]) => ({
    name: categoryLabels[key] || key,
    value: value.count,
    revenue: value.revenue,
    commissions: value.commissions,
  }));

  const statusData = Object.entries(summary?.byStatus || {}).map(([key, value]) => ({
    name: statusLabels[key] || key,
    count: value,
  }));

  const commissionsData = [
    { name: t("utility.paid"), value: summary?.commissions?.paid || 0, fill: "#22c55e" },
    { name: t("common.pending"), value: summary?.commissions?.pending || 0, fill: "#eab308" },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/reseller/utility">
                <Button variant="ghost" size="icon" className="text-white/80">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{t("utility.reportTitle")}</h1>
                <p className="text-white/80">{t("utility.statisticsAndReports")}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="rounded-2xl">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/reseller/utility">
              <Button variant="ghost" size="icon" className="text-white/80" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t("utility.reportTitle")}</h1>
              <p className="text-white/80">{t("utility.statisticsAndReports")}</p>
            </div>
          </div>
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-24 bg-white/20 border-white/30 text-white" data-testid="select-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl" data-testid="card-total-practices">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("utility.totalPractices")}</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalPractices || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.activePractices || 0} {t("utility.practiceStatus.completata").toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl" data-testid="card-suppliers">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("suppliers.title")}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.supplierCount || 0}</div>
            <p className="text-xs text-muted-foreground">{t("utility.activeProviders")}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl" data-testid="card-commissions-pending">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("utility.commissionsPending")}</CardTitle>
            <Coins className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.commissions?.pending || 0)}
            </div>
            <p className="text-xs text-muted-foreground">{t("utility.toBePaid")}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl" data-testid="card-commissions-total">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("utility.commissionsTotal")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.commissions?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Anno {selectedYear}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl" data-testid="card-chart-categories">
          <CardHeader>
            <CardTitle className="text-lg">{t("utility.practicesByCategory")}</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value} ${t("utility.practicesLabel").toLowerCase()} - ${formatCurrency(props.payload.commissions)}`,
                        name
                      ]}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">{t("common.noData")}</div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl" data-testid="card-chart-status">
          <CardHeader>
            <CardTitle className="text-lg">{t("utility.practicesByStatus")}</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" name={t("utility.practicesLabel")} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">{t("common.noData")}</div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl" data-testid="card-chart-commissions">
          <CardHeader>
            <CardTitle className="text-lg">{t("utility.commissionsStatusTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {(summary?.commissions?.total || 0) > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={commissionsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                    >
                      {commissionsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">{t("common.noData")}</div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl" data-testid="card-categories-detail">
          <CardHeader>
            <CardTitle className="text-lg">{t("utility.categoryDetail")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.length > 0 ? (
                categoryData.map((cat, index) => {
                  const CategoryIcon = categoryIcons[Object.keys(categoryLabels).find(k => categoryLabels[k] === cat.name) || "altro"];
                  return (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: COLORS[index % COLORS.length] + "20" }}
                        >
                          <CategoryIcon 
                            className="h-4 w-4" 
                            style={{ color: COLORS[index % COLORS.length] }}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {cat.value} {t("utility.practicesLabel").toLowerCase()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(cat.commissions)}</p>
                        <p className="text-xs text-muted-foreground">{t("utility.commissionsLabel")}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">{t("common.noData")}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
