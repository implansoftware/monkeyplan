import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListOrdered, Eye, Search, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PriceList } from "@shared/schema";

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function RepairCenterPriceLists() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const { data: inheritedLists, isLoading } = useQuery<PriceList[]>({
    queryKey: ["/api/price-lists/inherited"],
  });

  const filteredLists = inheritedLists?.filter(list => 
    list.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <ListOrdered className="h-6 w-6 text-emerald-500" />
          Listini Prezzi
        </h1>
        <p className="text-muted-foreground mt-1">
          Visualizza i listini prezzi del tuo reseller
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Listini del Reseller
              </CardTitle>
              <CardDescription>
                {filteredLists.length} listini disponibili
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("products.searchPriceList")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filteredLists.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("priceLists.nessunListinoDisponibileDalReseller")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.name")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("common.description")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("common.date")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLists.map((list) => (
                  <TableRow key={list.id} data-testid={`row-pricelist-${list.id}`}>
                    <TableCell className="font-medium">{list.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground max-w-xs truncate">
                      {list.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={list.isActive ? "default" : "secondary"}>
                        {list.isActive ? t("common.active") : t("common.disabled")}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {formatDate(list.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/repair-center/price-lists/${list.id}`}>
                        <Button size="sm" variant="outline" data-testid={`button-view-${list.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizza
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
