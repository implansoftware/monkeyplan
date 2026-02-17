import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  ListOrdered, Plus, Pencil, Trash2, Star, StarOff, Eye, Search, Package, Wrench, Euro, Users, Percent
} from "lucide-react";
import { VAT_RATES } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { PriceList } from "@shared/schema";
import { useTranslation } from "react-i18next";

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function ResellerPriceLists() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingList, setEditingList] = useState<PriceList | null>(null);
  const [deleteList, setDeleteList] = useState<PriceList | null>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    description: "", 
    targetAudience: "all" as "sub_reseller" | "repair_center" | "customer" | "reseller" | "all",
    targetCustomerType: null as "private" | "company" | null,
    defaultVatRate: 22
  });

  const customerTypeOptions = [
    { value: "all", label: t("reseller.allCustomers") },
    { value: "private", label: t("reseller.privateOnly") },
    { value: "company", label: t("reseller.companyOnly") },
  ];

  const targetAudienceOptions = [
    { value: "all", label: t("common.allMasc") },
    { value: "sub_reseller", label: t("admin.resellers.subResellers") },
    { value: "repair_center", label: t("sidebar.items.repairCentersShort") },
    { value: "customer", label: t("customers.title") },
    { value: "reseller", label: t("sidebar.items.resellers") },
  ];

  const { data: priceLists, isLoading } = useQuery<PriceList[]>({
    queryKey: ["/api/price-lists"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; targetAudience: string; targetCustomerType?: string | null; defaultVatRate?: number }) => {
      return apiRequest("POST", "/api/price-lists", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      toast({ title: t("products.priceListCreatedTitle"), description: t("reseller.priceListCreatedDesc") });
      setShowCreateDialog(false);
      setFormData({ name: "", description: "", targetAudience: "all", targetCustomerType: null, defaultVatRate: 22 });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PriceList> }) => {
      return apiRequest("PUT", `/api/price-lists/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      toast({ title: t("reseller.priceListUpdated"), description: t("reseller.changesSaved") });
      setEditingList(null);
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/price-lists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      toast({ title: t("reseller.priceListDeleted"), description: t("reseller.priceListDeletedDesc") });
      setDeleteList(null);
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/price-lists/${id}/set-default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      toast({ title: t("reseller.defaultPriceList"), description: t("reseller.priceListSetDefault") });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const filteredLists = priceLists?.filter(list => 
    list.name.toLowerCase().includes(search.toLowerCase()) ||
    list.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleCreateSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: t("common.error"), description: t("reseller.nameRequired"), variant: "destructive" });
      return;
    }
    createMutation.mutate({
      ...formData,
      targetCustomerType: formData.targetAudience === "customer" ? formData.targetCustomerType : null,
      defaultVatRate: formData.defaultVatRate
    });
  };

  const handleUpdateSubmit = () => {
    if (!editingList) return;
    updateMutation.mutate({
      id: editingList.id,
      data: { 
        name: formData.name, 
        description: formData.description, 
        targetAudience: formData.targetAudience,
        targetCustomerType: formData.targetAudience === "customer" ? formData.targetCustomerType : null,
        defaultVatRate: formData.defaultVatRate,
        isDefault: editingList.isDefault,
        isActive: editingList.isActive
      },
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <ListOrdered className="h-6 w-6 text-emerald-500" />{t("sidebar.items.priceLists")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("reseller.managePriceLists")}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-list">
          <Plus className="h-4 w-4 mr-2" />{t("products.newPriceList")}</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-emerald-500" />
                {t("reseller.myPriceLists")}
              </CardTitle>
              <CardDescription>
                {filteredLists.length} {t("reseller.priceListsFound")}
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
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredLists.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ListOrdered className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("products.noPriceListsFound")}</p>
              <p className="text-sm">{t("reseller.createFirstPriceList")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.name")}</TableHead>
                  <TableHead>{t("common.description")}</TableHead>
                  <TableHead>{t("reseller.recipients")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("common.creationDate")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLists.map((list) => (
                  <TableRow key={list.id} data-testid={`row-pricelist-${list.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {list.name}
                        {list.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                            {t("reseller.default")}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {list.description || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="text-xs w-fit">
                          <Users className="h-3 w-3 mr-1" />
                          {list.targetAudience === "all" && t("common.allMasc")}
                          {list.targetAudience === "sub_reseller" && t("admin.resellers.subResellers")}
                          {list.targetAudience === "repair_center" && t("sidebar.items.repairCentersShort")}
                          {list.targetAudience === "customer" && t("customers.title")}
                          {list.targetAudience === "reseller" && t("sidebar.items.resellers")}
                        </Badge>
                        {list.targetAudience === "customer" && list.targetCustomerType && (
                          <Badge variant="secondary" className="text-xs w-fit">
                            {list.targetCustomerType === "private" ? t("reseller.privateOnly") : t("reseller.companyOnly")}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={list.isActive ? "default" : "secondary"}>
                        {list.isActive ? t("common.active") : t("common.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(list.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/reseller/price-lists/${list.id}`}>
                          <Button size="icon" variant="ghost" data-testid={`button-view-${list.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setFormData({ 
                              name: list.name, 
                              description: list.description || "", 
                              targetAudience: list.targetAudience || "all",
                              targetCustomerType: list.targetCustomerType || null,
                              defaultVatRate: (list as any).defaultVatRate ?? 22
                            });
                            setEditingList(list);
                          }}
                          data-testid={`button-edit-${list.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!list.isDefault && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDefaultMutation.mutate(list.id)}
                            disabled={setDefaultMutation.isPending}
                            data-testid={`button-default-${list.id}`}
                          >
                            <StarOff className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteList(list)}
                          data-testid={`button-delete-${list.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("reseller.newPriceList")}</DialogTitle>
            <DialogDescription>
              {t("reseller.createPriceListDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("reseller.priceListName")} *</Label>
              <Input
                id="name"
                placeholder={t("reseller.priceListNamePlaceholder")}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("common.description")}</Label>
              <Textarea
                id="description"
                placeholder={t("reseller.optionalDescPlaceholder")}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="input-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAudience">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("reseller.recipients")}
                </span>
              </Label>
              <Select
                value={formData.targetAudience}
                onValueChange={(value: "sub_reseller" | "repair_center" | "customer" | "reseller" | "all") => 
                  setFormData({ ...formData, targetAudience: value, targetCustomerType: null })
                }
              >
                <SelectTrigger className="w-full" data-testid="select-target-audience">
                  <SelectValue placeholder={t("reseller.selectRecipients")} />
                </SelectTrigger>
                <SelectContent>
                  {targetAudienceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("reseller.recipientsHint")}
              </p>
            </div>
            {formData.targetAudience === "customer" && (
              <div className="space-y-2">
                <Label htmlFor="targetCustomerType">{t("reseller.customerType")}</Label>
                <Select
                  value={formData.targetCustomerType || "all"}
                  onValueChange={(value) => 
                    setFormData({ ...formData, targetCustomerType: value === "all" ? null : value as "private" | "company" })
                  }
                >
                  <SelectTrigger className="w-full" data-testid="select-target-customer-type">
                    <SelectValue placeholder={t("reseller.selectCustomerType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {customerTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t("reseller.customerTypeHint")}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>
                <span className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  {t("reseller.defaultVatRate")}
                </span>
              </Label>
              <Select
                value={String(formData.defaultVatRate)}
                onValueChange={(value) => setFormData({ ...formData, defaultVatRate: Number(value) })}
              >
                <SelectTrigger data-testid="select-vat-rate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VAT_RATES.map((rate) => (
                    <SelectItem key={rate.value} value={String(rate.value)}>
                      {rate.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("reseller.vatRateHint")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>{t("common.cancel")}</Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={createMutation.isPending}
              data-testid="button-submit-create"
            >
              {createMutation.isPending ? t("pages.creating") : t("reseller.createPriceList")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingList} onOpenChange={(open) => !open && setEditingList(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("reseller.editPriceList")}</DialogTitle>
            <DialogDescription>
              {t("reseller.editPriceListDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t("reseller.priceListName")} *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-edit-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t("common.description")}</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="input-edit-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-targetAudience">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("reseller.recipients")}
                </span>
              </Label>
              <Select
                value={formData.targetAudience}
                onValueChange={(value: "sub_reseller" | "repair_center" | "customer" | "reseller" | "all") => 
                  setFormData({ ...formData, targetAudience: value, targetCustomerType: null })
                }
              >
                <SelectTrigger className="w-full" data-testid="select-edit-target-audience">
                  <SelectValue placeholder={t("reseller.selectRecipients")} />
                </SelectTrigger>
                <SelectContent>
                  {targetAudienceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("reseller.recipientsHint")}
              </p>
            </div>
            {formData.targetAudience === "customer" && (
              <div className="space-y-2">
                <Label htmlFor="edit-targetCustomerType">{t("reseller.customerType")}</Label>
                <Select
                  value={formData.targetCustomerType || "all"}
                  onValueChange={(value) => 
                    setFormData({ ...formData, targetCustomerType: value === "all" ? null : value as "private" | "company" })
                  }
                >
                  <SelectTrigger className="w-full" data-testid="select-edit-target-customer-type">
                    <SelectValue placeholder={t("reseller.selectCustomerType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {customerTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t("reseller.customerTypeHint")}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>
                <span className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  {t("reseller.defaultVatRate")}
                </span>
              </Label>
              <Select
                value={String(formData.defaultVatRate)}
                onValueChange={(value) => setFormData({ ...formData, defaultVatRate: Number(value) })}
              >
                <SelectTrigger data-testid="select-edit-vat-rate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VAT_RATES.map((rate) => (
                    <SelectItem key={rate.value} value={String(rate.value)}>
                      {rate.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("reseller.vatRateHint")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingList(null)}>{t("common.cancel")}</Button>
            <Button
              onClick={handleUpdateSubmit}
              disabled={updateMutation.isPending}
              data-testid="button-submit-edit"
            >
              {updateMutation.isPending ? t("profile.saving") : t("profile.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteList} onOpenChange={(open) => !open && setDeleteList(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.teams.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("reseller.confirmDeletePriceList", { name: deleteList?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteList && deleteMutation.mutate(deleteList.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? t("pages.deleting") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
