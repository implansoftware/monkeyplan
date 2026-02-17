import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Search, ListChecks, Users, Building2, User, Eye, Plus, Shield } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useState } from "react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface PriceList {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  ownerType: "admin" | "reseller" | "sub_reseller" | "repair_center";
  targetAudience: "sub_reseller" | "repair_center" | "customer" | "reseller" | "all";
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  ownerName: string;
  ownerEmail: string;
}

export default function AdminPriceLists() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [ownerTypeFilter, setOwnerTypeFilter] = useState<string>("all");
  const [targetAudienceFilter, setTargetAudienceFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [newListTargetAudience, setNewListTargetAudience] = useState<string>("reseller");

  const { data: priceLists, isLoading } = useQuery<PriceList[]>({
    queryKey: ["/api/admin/price-lists"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; targetAudience: string }) => {
      return apiRequest("POST", "/api/price-lists", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/price-lists"] });
      setCreateDialogOpen(false);
      setNewListName("");
      setNewListDescription("");
      setNewListTargetAudience("reseller");
      toast({
        title: t("products.priceListCreatedTitle"),
        description: t("products.priceListCreated"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("products.errorCreatingPriceList"),
        variant: "destructive",
      });
    },
  });

  const handleCreateList = () => {
    if (!newListName.trim()) {
      toast({
        title: t("common.error"),
        description: t("products.priceListNameRequired"),
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate({
      name: newListName,
      description: newListDescription,
      targetAudience: newListTargetAudience,
    });
  };

  // Separate admin lists from others
  const adminLists = priceLists?.filter((list) => list.ownerType === "admin") || [];
  const otherLists = priceLists?.filter((list) => list.ownerType !== "admin") || [];

  const filteredOtherLists = otherLists.filter((list) => {
    const matchesSearch =
      list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      list.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      list.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOwnerType =
      ownerTypeFilter === "all" || list.ownerType === ownerTypeFilter;

    const matchesTargetAudience =
      targetAudienceFilter === "all" || list.targetAudience === targetAudienceFilter;

    return matchesSearch && matchesOwnerType && matchesTargetAudience;
  });

  const getOwnerTypeIcon = (ownerType: string) => {
    switch (ownerType) {
      case "admin":
        return <Shield className="h-4 w-4" />;
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
      case "admin":
        return <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">Admin</Badge>;
      case "reseller":
        return <Badge variant="default">Reseller</Badge>;
      case "sub_reseller":
        return <Badge variant="secondary">Sub-Reseller</Badge>;
      case "repair_center":
        return <Badge variant="secondary">{t("roles.repairCenter")}</Badge>;
      default:
        return <Badge variant="outline">{ownerType}</Badge>;
    }
  };

  const getTargetAudienceBadge = (target: string) => {
    switch (target) {
      case "reseller":
        return <Badge variant="outline" className="border-emerald-500 text-emerald-600">Reseller</Badge>;
      case "sub_reseller":
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Sub-Reseller</Badge>;
      case "repair_center":
        return <Badge variant="outline" className="border-green-500 text-green-600">Centri Riparazione</Badge>;
      case "customer":
        return <Badge variant="outline" className="border-purple-500 text-purple-600">{t("sidebar.items.customers")}</Badge>;
      case "all":
        return <Badge variant="outline" className="border-gray-500">{t("common.allMasc")}</Badge>;
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
            <h1 className="text-2xl font-bold">{t("products.priceLists")}</h1>
            <p className="text-muted-foreground">
              {t("products.priceListsDescription")}
            </p>
          </div>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-price-list">
              <Plus className="h-4 w-4 mr-2" />
              {t("products.createPriceList")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("products.createPriceList")}</DialogTitle>
              <DialogDescription>
                {t("products.createPriceListDesc")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("products.priceListName")}</Label>
                <Input
                  id="name"
                  placeholder={t("products.priceListNamePlaceholder")}
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  data-testid="input-new-list-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t("common.description")}</Label>
                <Textarea
                  id="description"
                  placeholder={t("utility.optionalDescription")}
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  data-testid="input-new-list-description"
                />
              </div>
              <div className="space-y-2">
                <Label>Target</Label>
                <Select value={newListTargetAudience} onValueChange={setNewListTargetAudience}>
                  <SelectTrigger data-testid="select-new-list-target">
                    <SelectValue placeholder={t("products.selectTarget")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reseller">Reseller ({t("b2b.purchases")})</SelectItem>
                    <SelectItem value="sub_reseller">Sub-Reseller</SelectItem>
                    <SelectItem value="repair_center">{t("admin.repairCenters.repairCenters")}</SelectItem>
                    <SelectItem value="customer">{t("sidebar.items.customers")}</SelectItem>
                    <SelectItem value="all">{t("common.allMasc")}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t("products.priceListTargetHint")}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleCreateList}
                disabled={createMutation.isPending}
                data-testid="button-confirm-create-list"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("products.createPriceList")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {adminLists.length > 0 && (
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-lg">I Tuoi Listini (Admin)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("products.priceListName")}</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("common.created")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminLists.map((list) => (
                  <TableRow key={list.id} data-testid={`row-admin-price-list-${list.id}`}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{list.name}</span>
                        {list.description && (
                          <span className="text-xs text-muted-foreground">{list.description}</span>
                        )}
                        {list.isDefault && (
                          <Badge variant="secondary" className="w-fit mt-1 text-xs">
                            Predefinito
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getTargetAudienceBadge(list.targetAudience)}</TableCell>
                    <TableCell>
                      {list.isActive ? (
                        <Badge variant="default" className="bg-green-500">{t("common.active")}</Badge>
                      ) : (
                        <Badge variant="secondary">{t("common.inactive")}</Badge>
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
                        data-testid={`button-edit-admin-price-list-${list.id}`}
                      >
                        <Link href={`/admin/price-lists/${list.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Gestisci
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Listini Reseller e Centri Riparazione</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("common.search")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-price-lists"
              />
            </div>
            <Select value={ownerTypeFilter} onValueChange={setOwnerTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-owner-type">
                <SelectValue placeholder={t("warehouse.ownerType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allTypes")}</SelectItem>
                <SelectItem value="reseller">Reseller</SelectItem>
                <SelectItem value="sub_reseller">Sub-Reseller</SelectItem>
                <SelectItem value="repair_center">{t("roles.repairCenter")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={targetAudienceFilter} onValueChange={setTargetAudienceFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-target-audience">
                <SelectValue placeholder="Target" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="reseller">Reseller</SelectItem>
                <SelectItem value="sub_reseller">Sub-Reseller</SelectItem>
                <SelectItem value="repair_center">{t("admin.repairCenters.repairCenters")}</SelectItem>
                <SelectItem value="customer">{t("sidebar.items.customers")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("products.priceListName")}</TableHead>
                <TableHead>{t("warehouse.owner")}</TableHead>
                <TableHead>{t("common.type")}</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("common.created")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOtherLists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {t("products.noPriceListFound")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOtherLists.map((list) => (
                  <TableRow key={list.id} data-testid={`row-price-list-${list.id}`}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{list.name}</span>
                        {list.isDefault && (
                          <Badge variant="secondary" className="w-fit mt-1 text-xs">
                            {t("common.default")}
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
                        <Badge variant="default" className="bg-green-500">{t("common.active")}</Badge>
                      ) : (
                        <Badge variant="secondary">{t("common.inactive")}</Badge>
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
                          {t("common.view")}
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
        {t("products.priceListTotal", { total: adminLists.length + filteredOtherLists.length, admin: adminLists.length, other: filteredOtherLists.length })}
      </div>
    </div>
  );
}
