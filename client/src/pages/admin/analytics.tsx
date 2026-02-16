import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Wrench, Clock, Ticket, Euro, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTranslation } from "react-i18next";

type OverviewKPIs = {
  totalRevenue: number;
  paidInvoices: number;
  totalRepairs: number;
  activeRepairs: number;
  completedRepairs: number;
  avgRepairTime: number;
  totalTickets: number;
  openTickets: number;
};

type RevenueData = {
  period: string;
  revenue: number;
  invoiceCount: number;
};

type CenterPerformance = {
  repairCenterId: string;
  totalRepairs: number;
  completedRepairs: number;
  cancelledRepairs: number;
  avgRepairDays: number;
  successRate: number;
  totalRevenue: number;
};

type TopProduct = {
  id: string;
  name: string;
  sku: string;
  category: string;
  usageCount: number;
  stockIn: number;
  centersCount: number;
};

const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AdminAnalytics() {
  const { t } = useTranslation();
  usePageTitle(t("sidebar.items.analytics"));
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  
  const now = new Date();
  const startDate = new Date();
  if (period === 'week') {
    startDate.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(now.getMonth() - 1);
  } else {
    startDate.setFullYear(now.getFullYear() - 1);
  }

  const { data: overview, isLoading: overviewLoading } = useQuery<OverviewKPIs>({
    queryKey: ["/api/admin/analytics/overview"],
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: revenue, isLoading: revenueLoading } = useQuery<RevenueData[]>({
    queryKey: ["/api/admin/analytics/revenue", startDate.toISOString(), now.toISOString(), period],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/revenue?startDate=${startDate.toISOString()}&endDate=${now.toISOString()}&groupBy=${period === 'week' ? 'day' : period === 'month' ? 'day' : 'month'}`);
      if (!res.ok) throw new Error('Failed to fetch revenue data');
      return res.json();
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: centers, isLoading: centersLoading } = useQuery<CenterPerformance[]>({
    queryKey: ["/api/admin/analytics/repair-centers/performance"],
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: products, isLoading: productsLoading } = useQuery<TopProduct[]>({
    queryKey: ["/api/admin/analytics/products/top"],
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
  });

  const kpiCards = [
    {
      title: t("dashboard.totalRevenue"),
      value: overview?.totalRevenue ? `€${(overview.totalRevenue / 100).toFixed(2)}` : "€0.00",
      icon: Euro,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: t("dashboard.activeRepairs"),
      value: overview?.activeRepairs ?? 0,
      icon: Wrench,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: t("dashboard.avgRepairTime"),
      value: overview?.avgRepairTime ? `${overview.avgRepairTime.toFixed(1)} giorni` : "0 giorni",
      icon: Clock,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: t("dashboard.paidInvoices"),
      value: overview?.paidInvoices ?? 0,
      icon: TrendingUp,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: t("dashboard.completedRepairs"),
      value: overview?.completedRepairs ?? 0,
      icon: Activity,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
    {
      title: t("dashboard.openTickets"),
      value: overview?.openTickets ?? 0,
      icon: Ticket,
      color: "text-chart-5",
      bgColor: "bg-chart-5/10",
    },
  ];

  const repairStatusData = overview ? [
    { name: 'Attive', value: overview.activeRepairs },
    { name: 'Completate', value: overview.completedRepairs },
    { name: 'Totali', value: overview.totalRepairs - overview.activeRepairs - overview.completedRepairs },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="heading-analytics">{t("sidebar.items.analytics")}</h1>
              <p className="text-sm text-muted-foreground">
                Panoramica dettagliata delle performance e dei KPI
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={period === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('week')}
              data-testid="button-period-week"
            >
              Settimana
            </Button>
            <Button
              variant={period === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('month')}
              data-testid="button-period-month"
            >
              Mese
            </Button>
            <Button
              variant={period === 'year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('year')}
              data-testid="button-period-year"
            >
              Anno
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((stat, index) => (
          <Card key={index} data-testid={`card-kpi-${index}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`flex h-9 w-9 items-center justify-center rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid={`text-kpi-value-${index}`}>
                  {stat.value}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-revenue-chart">
          <CardHeader>
            <CardTitle>{t("reports.revenueTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : revenue && revenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => `€${(value / 100).toFixed(0)}`} />
                  <Tooltip 
                    formatter={(value: any) => [`€${(value / 100).toFixed(2)}`, 'Fatturato']}
                    labelFormatter={(label) => `Periodo: ${label}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke={CHART_COLORS[0]} strokeWidth={2} name="Fatturato" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nessun dato disponibile per il periodo selezionato
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-status-chart">
          <CardHeader>
            <CardTitle>{t("reports.repairStatusDistribution")}</CardTitle>
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : repairStatusData.length > 0 && repairStatusData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={repairStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {repairStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nessuna riparazione disponibile
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-centers-chart">
          <CardHeader>
            <CardTitle>{t("reports.repairCenterPerformance")}</CardTitle>
          </CardHeader>
          <CardContent>
            {centersLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : centers && centers.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={centers.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="repairCenterId" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalRepairs" fill={CHART_COLORS[0]} name="Riparazioni Totali" />
                  <Bar dataKey="completedRepairs" fill={CHART_COLORS[1]} name="Completate" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nessun centro di riparazione disponibile
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-products-chart">
          <CardHeader>
            <CardTitle>{t("reports.top5Products")}</CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : products && products.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={products.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="usageCount" fill={CHART_COLORS[2]} name="Utilizzi" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nessun prodotto disponibile
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
