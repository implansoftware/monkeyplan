import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UtilitySupplier, InsertUtilitySupplier } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, Phone, Mail, Globe, Plus, Pencil, Trash2,
  ArrowLeft, Building2, CheckCircle2, XCircle, Globe2, User
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

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

export default function ResellerUtilitySuppliers() {
  const { t } = useTranslation();
  const categoryLabels = getCategoryLabels(t);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<UtilitySupplier | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("fisso");
  const { toast } = useToast();

  const { data: suppliers = [], isLoading } = useQuery<UtilitySupplier[]>({
    queryKey: ["/api/utility/suppliers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertUtilitySupplier) => {
      const res = await apiRequest("POST", "/api/utility/suppliers", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/suppliers"] });
      setDialogOpen(false);
      setEditingSupplier(null);
      toast({ title: t("suppliers.supplierCreated") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertUtilitySupplier> }) => {
      const res = await apiRequest("PATCH", `/api/utility/suppliers/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/suppliers"] });
      setDialogOpen(false);
      setEditingSupplier(null);
      toast({ title: t("utility.supplierUpdated") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/utility/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/suppliers"] });
      toast({ title: t("utility.supplierDeleted") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: InsertUtilitySupplier = {
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      category: selectedCategory as "fisso" | "mobile" | "centralino" | "luce" | "gas" | "altro",
      email: formData.get("email") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      portalUrl: formData.get("portalUrl") as string || undefined,
      referentName: formData.get("referentName") as string || undefined,
      referentPhone: formData.get("referentPhone") as string || undefined,
      referentEmail: formData.get("referentEmail") as string || undefined,
      notes: formData.get("notes") as string || undefined,
      isActive: formData.get("isActive") === "on",
    };

    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (supplier: UtilitySupplier) => {
    setEditingSupplier(supplier);
    setSelectedCategory(supplier.category);
    setDialogOpen(true);
  };

  const handleNewSupplier = () => {
    setEditingSupplier(null);
    setSelectedCategory("fisso");
    setDialogOpen(true);
  };

  const isOwnSupplier = (supplier: UtilitySupplier) => {
    return supplier.resellerId !== null;
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t("utility.utilitySuppliers")}</h1>
              <p className="text-white/80">{t("utility.manageServiceSuppliers")}</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex-1 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("suppliers.searchSupplier")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
              data-testid="input-search-suppliers"
            />
          </div>
          <Button onClick={handleNewSupplier} data-testid="button-new-supplier">
            <Plus className="h-4 w-4 mr-2" />{t("suppliers.newSupplier")}</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{t("suppliers.noSuppliersFound")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.name")}</TableHead>
                  <TableHead>{t("common.code")}</TableHead>
                  <TableHead>{t("common.type")}</TableHead>
                  <TableHead>{t("common.category")}</TableHead>
                  <TableHead>{t("common.contact")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} data-testid={`row-supplier-${supplier.id}`}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{supplier.code}</Badge>
                    </TableCell>
                    <TableCell>
                      {isOwnSupplier(supplier) ? (
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          <User className="h-3 w-3 mr-1" />
                          {t("utility.personal")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Globe2 className="h-3 w-3 mr-1" />
                          {t("utility.global")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {categoryLabels[supplier.category] || supplier.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {supplier.referentName && (
                          <span className="text-sm">{supplier.referentName}</span>
                        )}
                        {supplier.email && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {supplier.email}
                          </span>
                        )}
                        {supplier.phone && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {supplier.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.isActive ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          <CheckCircle2 className="h-3 w-3 mr-1" />{t("common.active")}</Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />{t("common.inactive")}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {supplier.portalUrl && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={supplier.portalUrl} target="_blank" rel="noopener noreferrer">
                              <Globe className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {isOwnSupplier(supplier) && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEdit(supplier)}
                              data-testid={`button-edit-${supplier.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                if (confirm(t("utility.confirmDeleteSupplier"))) {
                                  deleteMutation.mutate(supplier.id);
                                }
                              }}
                              data-testid={`button-delete-${supplier.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? t("utility.editSupplier") : t("utility.newPersonalSupplier")}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier 
                ? t("utility.editSupplierData")
                : t("utility.addNewPersonalSupplier")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("utility.nameRequired2")}</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingSupplier?.name || ""}
                  required
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">{t("utility.codeRequired")}</Label>
                <Input
                  id="code"
                  name="code"
                  defaultValue={editingSupplier?.code || ""}
                  placeholder="es. UTL-TIM"
                  required
                  data-testid="input-code"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{t("utility.categoryRequired")}</Label>
              <Select 
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("common.email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={editingSupplier?.email || ""}
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("common.phone")}</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={editingSupplier?.phone || ""}
                  data-testid="input-phone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="portalUrl">{t("utility.partnerPortalUrl")}</Label>
              <Input
                id="portalUrl"
                name="portalUrl"
                type="url"
                defaultValue={editingSupplier?.portalUrl || ""}
                placeholder="https://"
                data-testid="input-portal-url"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="referentName">{t("utility.referent")}</Label>
                <Input
                  id="referentName"
                  name="referentName"
                  defaultValue={editingSupplier?.referentName || ""}
                  data-testid="input-referent-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referentPhone">{t("utility.referentPhone")}</Label>
                <Input
                  id="referentPhone"
                  name="referentPhone"
                  defaultValue={editingSupplier?.referentPhone || ""}
                  data-testid="input-referent-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referentEmail">{t("utility.referentEmail")}</Label>
                <Input
                  id="referentEmail"
                  name="referentEmail"
                  type="email"
                  defaultValue={editingSupplier?.referentEmail || ""}
                  data-testid="input-referent-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t("common.notes")}</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={editingSupplier?.notes || ""}
                data-testid="input-notes"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Switch
                id="isActive"
                name="isActive"
                defaultChecked={editingSupplier?.isActive ?? true}
                data-testid="switch-active"
              />
              <Label htmlFor="isActive">{t("utility.supplierActive")}</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                data-testid="button-cancel"
              >{t("common.cancel")}</Button>
              <Button 
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save"
              >
                {editingSupplier ? t("profile.saveChanges") : t("utility.createSupplier")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
