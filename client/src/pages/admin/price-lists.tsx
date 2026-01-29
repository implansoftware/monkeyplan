import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, ListChecks, Users, Building2, User, Eye } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useState } from "react";
import { Link } from "wouter";

interface PriceList {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  ownerType: "reseller" | "repair_center";
  targetAudience: "sub_reseller" | "repair_center" | "customer" | "all";
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  ownerName: string;
  ownerEmail: string;
}

export default function AdminPriceLists() {
  const [searchTerm, setSearchTerm] = useState("");
  const [ownerTypeFilter, setOwnerTypeFilter] = useState<string>("all");
  const [targetAudienceFilter, setTargetAudienceFilter] = useState<string>("all");

  const { data: priceLists, isLoading } = useQuery<PriceList[]>({
    queryKey: ["/api/admin/price-lists"],
  });

  const filteredLists = priceLists?.filter((list) => {
    const matchesSearch =
      list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      list.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      list.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOwnerType =
      ownerTypeFilter === "all" || list.ownerType === ownerTypeFilter;

    const matchesTargetAudience =
      targetAudienceFilter === "all" || list.targetAudience === targetAudienceFilter;

    return matchesSearch && matchesOwnerType && matchesTargetAudience;
  }) || [];

  const getOwnerTypeIcon = (ownerType: string) => {
    switch (ownerType) {
      case "reseller":
        return <Building2 className="h-4 w-4" />;
      case "repair_center":
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getOwnerTypeBadge = (ownerType: string) => {
    switch (ownerType) {
      case "reseller":
        return <Badge variant="default">Reseller</Badge>;
      case "repair_center":
        return <Badge variant="secondary">Centro Riparazione</Badge>;
      default:
        return <Badge variant="outline">{ownerType}</Badge>;
    }
  };

  const getTargetAudienceBadge = (target: string) => {
    switch (target) {
      case "sub_reseller":
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Sub-Reseller</Badge>;
      case "repair_center":
        return <Badge variant="outline" className="border-green-500 text-green-600">Centri Riparazione</Badge>;
      case "customer":
        return <Badge variant="outline" className="border-purple-500 text-purple-600">Clienti</Badge>;
      case "all":
        return <Badge variant="outline" className="border-gray-500">Tutti</Badge>;
      default:
        return <Badge variant="outline">{target}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500">
            <ListChecks className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Listini Prezzi</h1>
            <p className="text-muted-foreground">
              Visualizza tutti i listini creati dai reseller e centri riparazione
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome, proprietario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-price-lists"
              />
            </div>
            <Select value={ownerTypeFilter} onValueChange={setOwnerTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-owner-type">
                <SelectValue placeholder="Tipo Proprietario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i tipi</SelectItem>
                <SelectItem value="reseller">Reseller</SelectItem>
                <SelectItem value="repair_center">Centro Riparazione</SelectItem>
              </SelectContent>
            </Select>
            <Select value={targetAudienceFilter} onValueChange={setTargetAudienceFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-target-audience">
                <SelectValue placeholder="Target Audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i target</SelectItem>
                <SelectItem value="sub_reseller">Sub-Reseller</SelectItem>
                <SelectItem value="repair_center">Centri Riparazione</SelectItem>
                <SelectItem value="customer">Clienti</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Listino</TableHead>
                <TableHead>Proprietario</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Creato</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nessun listino trovato
                  </TableCell>
                </TableRow>
              ) : (
                filteredLists.map((list) => (
                  <TableRow key={list.id} data-testid={`row-price-list-${list.id}`}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{list.name}</span>
                        {list.isDefault && (
                          <Badge variant="secondary" className="w-fit mt-1 text-xs">
                            Predefinito
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getOwnerTypeIcon(list.ownerType)}
                        <div className="flex flex-col">
                          <span className="font-medium">{list.ownerName}</span>
                          <span className="text-xs text-muted-foreground">{list.ownerEmail}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getOwnerTypeBadge(list.ownerType)}</TableCell>
                    <TableCell>{getTargetAudienceBadge(list.targetAudience)}</TableCell>
                    <TableCell>
                      {list.isActive ? (
                        <Badge variant="default" className="bg-green-500">Attivo</Badge>
                      ) : (
                        <Badge variant="secondary">Inattivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(list.createdAt), "dd MMM yyyy", { locale: it })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        data-testid={`button-view-price-list-${list.id}`}
                      >
                        <Link href={`/admin/price-lists/${list.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Visualizza
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        Totale: {filteredLists.length} listini
      </div>
    </div>
  );
}
