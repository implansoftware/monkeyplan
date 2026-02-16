import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, UsersRound, Store, Users, Activity } from "lucide-react";
import type { User } from "@shared/schema";

type ResellerWithCounts = Omit<User, 'password'> & { 
  customerCount: number; 
  staffCount: number;
};

export default function AdminResellerTeams() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: resellers = [], isLoading } = useQuery<ResellerWithCounts[]>({
    queryKey: ["/api/admin/resellers"],
  });

  const filteredResellers = resellers.filter((reseller) =>
    reseller.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reseller.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reseller.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStaff = resellers.reduce((sum, r) => sum + r.staffCount, 0);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-8">
        <div className="absolute top-0 -right-20 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
              <UsersRound className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{t("admin.resellerTeams.title")}</h1>
              <p className="text-blue-100/80 mt-1">{t("admin.resellerTeams.subtitle")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg shadow-blue-500/25">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl font-bold">{resellers.length}</p>
              <p className="text-sm text-blue-100">{t("admin.resellerTeams.totalResellers")}</p>
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 p-6 text-white shadow-lg shadow-cyan-500/25">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <UsersRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl font-bold">{totalStaff}</p>
              <p className="text-sm text-cyan-100">{t("admin.resellerTeams.totalStaff")}</p>
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-6 text-white shadow-lg shadow-emerald-500/25">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl font-bold">{resellers.filter(r => r.isActive).length}</p>
              <p className="text-sm text-emerald-100">{t("admin.resellerTeams.activeResellers")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex flex-wrap items-center gap-3 text-slate-900 dark:text-white">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
              <UsersRound className="h-5 w-5 text-white" />
            </div>
            {t("admin.resellerTeams.teamByReseller")}
          </CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder={t("admin.resellerTeams.searchReseller")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
              data-testid="input-search"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredResellers.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
              <UsersRound className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 text-lg">
                {resellers.length === 0 
                  ? t("admin.resellers.noResellers")
                  : t("admin.resellers.noResellersFound")}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                    <TableHead className="text-slate-600 dark:text-slate-400">{t("admin.resellers.reseller")}</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">{t("common.email")}</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">{t("admin.resellers.category")}</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">{t("common.status")}</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">{t("admin.resellerTeams.staff")}</TableHead>
                    <TableHead className="text-right text-slate-600 dark:text-slate-400">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResellers.map((reseller) => (
                    <TableRow key={reseller.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30" data-testid={`row-reseller-${reseller.id}`}>
                      <TableCell className="font-medium text-slate-900 dark:text-white">
                        {reseller.fullName}
                      </TableCell>
                      <TableCell className="text-slate-500">{reseller.email}</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {reseller.resellerCategory === 'franchising' ? t("admin.resellers.franchising") : 
                           reseller.resellerCategory === 'gdo' ? t("admin.resellers.gdo") : t("admin.resellers.standard")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={reseller.isActive 
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" 
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }>
                          {reseller.isActive ? t("common.active") : t("common.inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                          <UsersRound className="h-3 w-3 mr-1" />
                          {t("admin.resellerTeams.staffCount", { count: reseller.staffCount })}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/resellers/${reseller.id}/team`}>
                          <Button 
                            className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/25"
                            size="sm"
                            data-testid={`button-manage-team-${reseller.id}`}
                          >
                            <UsersRound className="h-4 w-4 mr-2" />
                            {t("admin.resellerTeams.manageTeam")}
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
