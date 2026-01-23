import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, TrendingUp, CheckCircle2, DollarSign, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type WarrantyStats = {
  totalOffered: number;
  totalAccepted: number;
  totalDeclined: number;
  totalRevenue: number;
  conversionRate: number;
  topProducts: Array<{ productName: string; count: number; revenue: number }>;
  monthlyTrend: Array<{ month: string; offered: number; accepted: number; revenue: number }>;
};

export default function RepairCenterWarrantyAnalytics() {
  const { data: stats, isLoading } = useQuery<WarrantyStats>({
    queryKey: ["/api/repair-center/warranty-stats"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Impossibile caricare le statistiche</p>
      </div>
    );
  }

  const chartData = stats.monthlyTrend.map(item => ({
    ...item,
    month: item.month.split('-')[1] + '/' + item.month.split('-')[0].slice(2),
    revenueEur: item.revenue / 100,
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        {/* Animated background blobs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Garanzie</h1>
              <p className="text-emerald-100">Analisi e gestione delle garanzie</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-offered">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Garanzie Offerte</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOffered}</div>
            <p className="text-xs text-muted-foreground">Le tue offerte</p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-accepted">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Garanzie Vendute</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.totalAccepted}</div>
            <p className="text-xs text-muted-foreground">Accettate dai clienti</p>
          </CardContent>
        </Card>

        <Card data-testid="card-conversion-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Tasso Conversione</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDeclined} rifiutate
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Fatturato Garanzie</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {(stats.totalRevenue / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
            </div>
            <p className="text-xs text-muted-foreground">Totale incassato</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="card-monthly-trend">
          <CardHeader>
            <CardTitle className="text-lg">Trend Mensile</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Bar dataKey="offered" name="Offerte" fill="hsl(var(--muted-foreground))" />
                  <Bar dataKey="accepted" name="Vendute" fill="hsl(142 76% 36%)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nessun dato disponibile
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-top-products">
          <CardHeader>
            <CardTitle className="text-lg">Prodotti Più Venduti</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length > 0 ? (
              <div className="space-y-4">
                {stats.topProducts.map((product, index) => (
                  <div key={product.productName} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{product.productName}</p>
                        <p className="text-sm text-muted-foreground">{product.count} vendute</p>
                      </div>
                    </div>
                    <p className="font-medium text-emerald-600">
                      {(product.revenue / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Nessun prodotto venduto
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
