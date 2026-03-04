import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Plus, Edit2, Trash2, MapPin, Phone, Mail } from "lucide-react";
import type { CustomerBranch } from "@shared/schema";
import { AddressAutocomplete } from "@/components/address-autocomplete";

interface CustomerBranchManagerProps {
  customerId: string;
  customerName?: string;
  readOnly?: boolean;
  mode?: "branches" | "subclients";
}

export function CustomerBranchManager({ customerId, customerName, readOnly = false, mode = "branches" }: CustomerBranchManagerProps) {
  const { t } = useTranslation();
  const isSubclientMode = mode === "subclients";

  const lbl = {
    title: isSubclientMode ? t("customer.subClients") : t("customer.branches"),
    addBtn: isSubclientMode ? t("customer.addSubClient") : t("customer.addBranch"),
    dialogNew: isSubclientMode ? t("customer.newSubClient") : t("customer.newBranch"),
    dialogEdit: isSubclientMode ? t("customer.editSubClient") : t("customer.editBranch"),
    codeLbl: isSubclientMode ? t("customer.subClientCode") : t("customer.branchCode"),
    nameLbl: isSubclientMode ? t("customer.subClientName") : t("customer.branchName"),
    notesPlaceholder: isSubclientMode ? t("customer.subClientAdditionalNotes") : t("customer.branchAdditionalNotes"),
    noItems: isSubclientMode ? t("customer.noSubClientRegistered") : t("customer.noBranchRegistered"),
    clickAdd: isSubclientMode ? t("customer.clickAddSubClient") : t("customer.clickAddBranch"),
    deleteTitle: isSubclientMode ? t("customer.deleteSubClient") : t("customer.deleteBranch"),
    deleteDesc: isSubclientMode ? t("customer.deleteSubClientDescription") : t("customer.deleteBranchDescription"),
    codeRequired: isSubclientMode ? t("customer.subClientCodeNameRequired") : t("customer.branchCodeNameRequired"),
    created: isSubclientMode ? t("customer.subClientCreated") : t("customer.branchCreated"),
    deleted: isSubclientMode ? t("customer.subClientDeleted") : t("customer.branchDeleted"),
    updated: isSubclientMode ? t("customer.subClientUpdated") : t("customer.branchUpdated"),
    egCode: isSubclientMode ? t("customer.egSubClientCode") : t("customer.egBranchCode"),
    egName: isSubclientMode ? t("customer.egSubClientName") : t("customer.egBranchName"),
  };
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<CustomerBranch | null>(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedPostalCode, setSelectedPostalCode] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Use unified customer branches endpoint for all roles
  const branchesQueryKey = ['/api/customers', customerId, 'branches'];
  const branchesCreateEndpoint = `/api/customers/${customerId}/branches`;

  const { data: branches = [], isLoading } = useQuery<CustomerBranch[]>({
    queryKey: branchesQueryKey,
  });

  const createBranchMutation = useMutation({
    mutationFn: async (data: Partial<CustomerBranch>) => {
      const res = await apiRequest("POST", branchesCreateEndpoint, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesQueryKey });
      setDialogOpen(false);
      toast({ title: lbl.created });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const updateBranchMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CustomerBranch> }) => {
      const res = await apiRequest("PATCH", `/api/branches/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesQueryKey });
      setEditBranch(null);
      toast({ title: lbl.updated });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteBranchMutation = useMutation({
    mutationFn: async (branchId: string) => {
      await apiRequest("DELETE", `/api/branches/${branchId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesQueryKey });
      toast({ title: lbl.deleted });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      branchCode: formData.get("branchCode") as string,
      branchName: formData.get("branchName") as string,
      address: selectedAddress || null,
      city: selectedCity || null,
      province: selectedProvince || null,
      postalCode: selectedPostalCode || null,
      contactName: formData.get("contactName") as string || null,
      contactPhone: formData.get("contactPhone") as string || null,
      contactEmail: formData.get("contactEmail") as string || null,
      notes: formData.get("notes") as string || null,
    };

    if (!data.branchCode || !data.branchName) {
      toast({ title: t("common.error"), description: lbl.codeRequired, variant: "destructive" });
      return;
    }

    if (editBranch) {
      updateBranchMutation.mutate({ id: editBranch.id, data });
    } else {
      createBranchMutation.mutate(data);
    }
  };

  const openEditDialog = (branch: CustomerBranch) => {
    setEditBranch(branch);
    setSelectedAddress(branch.address || "");
    setSelectedCity(branch.city || "");
    setSelectedProvince(branch.province || "");
    setSelectedPostalCode(branch.postalCode || "");
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditBranch(null);
      setSelectedAddress("");
      setSelectedCity("");
      setSelectedProvince("");
      setSelectedPostalCode("");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Building2 className="h-5 w-5" />
            {lbl.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="flex flex-wrap items-center gap-2">
          <Building2 className="h-5 w-5" />
          {lbl.title} {customerName && `${t("common.of")} ${customerName}`}
          <Badge variant="secondary">{branches.length}</Badge>
        </CardTitle>
        {!readOnly && (
          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-branch">
                <Plus className="h-4 w-4 mr-1" />
                {lbl.addBtn}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editBranch ? lbl.dialogEdit : lbl.dialogNew}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="branchCode">{lbl.codeLbl} *</Label>
                    <Input
                      id="branchCode"
                      name="branchCode"
                      required
                      placeholder={lbl.egCode}
                      defaultValue={editBranch?.branchCode || ""}
                      data-testid="input-branch-code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branchName">{lbl.nameLbl} *</Label>
                    <Input
                      id="branchName"
                      name="branchName"
                      required
                      placeholder={lbl.egName}
                      defaultValue={editBranch?.branchName || ""}
                      data-testid="input-branch-name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t("common.addressLabel")}</Label>
                  <AddressAutocomplete
                    id="address"
                    name="address"
                    value={selectedAddress}
                    onChange={setSelectedAddress}
                    onAddressSelect={(result) => {
                      setSelectedAddress(result.address);
                      setSelectedCity(result.city);
                      setSelectedProvince(result.province);
                      setSelectedPostalCode(result.postalCode);
                    }}
                    placeholder={t("common.startTypingAddress")}
                    data-testid="input-branch-address"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">{t("common.city")}</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder={t("customer.egCity")}
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      data-testid="input-branch-city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">{t("common.province")}</Label>
                    <Input
                      id="province"
                      name="province"
                      placeholder={t("customer.egProvince")}
                      maxLength={2}
                      value={selectedProvince}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                      data-testid="input-branch-province"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">{t("common.zipCode")}</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      placeholder={t("customer.egPostalCode")}
                      maxLength={5}
                      value={selectedPostalCode}
                      onChange={(e) => setSelectedPostalCode(e.target.value)}
                      data-testid="input-branch-cap"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">{t("customer.referent")}</Label>
                    <Input
                      id="contactName"
                      name="contactName"
                      placeholder={t("customer.egContactName")}
                      defaultValue={editBranch?.contactName || ""}
                      data-testid="input-branch-contact"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">{t("common.phone")}</Label>
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      type="tel"
                      placeholder={t("customer.egPhone")}
                      defaultValue={editBranch?.contactPhone || ""}
                      data-testid="input-branch-phone"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">{t("common.email")}</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    placeholder={t("customer.egEmail")}
                    defaultValue={editBranch?.contactEmail || ""}
                    data-testid="input-branch-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t("common.notes")}</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder={lbl.notesPlaceholder}
                    defaultValue={editBranch?.notes || ""}
                    data-testid="input-branch-notes"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createBranchMutation.isPending || updateBranchMutation.isPending}
                    data-testid="button-save-branch"
                  >
                    {createBranchMutation.isPending || updateBranchMutation.isPending ? t("common.saving") : t("common.save")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {branches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{lbl.noItems}</p>
            {!readOnly && (
              <p className="text-sm">{lbl.clickAdd}</p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.code")}</TableHead>
                <TableHead>{lbl.nameLbl}</TableHead>
                <TableHead>{t("common.addressLabel")}</TableHead>
                <TableHead>{t("customer.referent")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                {!readOnly && <TableHead>{t("common.actions")}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id} data-testid={`row-branch-${branch.id}`}>
                  <TableCell className="font-mono font-medium" data-testid={`text-branch-code-${branch.id}`}>
                    {branch.branchCode}
                  </TableCell>
                  <TableCell data-testid={`text-branch-name-${branch.id}`}>
                    {branch.branchName}
                  </TableCell>
                  <TableCell>
                    {branch.address ? (
                      <div className="flex items-start gap-1 text-sm">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <span>
                          {branch.address}
                          {branch.city && `, ${branch.city}`}
                          {branch.province && ` (${branch.province})`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {branch.contactName ? (
                      <div className="space-y-1 text-sm">
                        <div>{branch.contactName}</div>
                        {branch.contactPhone && (
                          <div className="flex flex-wrap items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {branch.contactPhone}
                          </div>
                        )}
                        {branch.contactEmail && (
                          <div className="flex flex-wrap items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {branch.contactEmail}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {branch.isActive ? (
                      <Badge variant="outline">{t("common.active")}</Badge>
                    ) : (
                      <Badge variant="destructive">{t("common.deactivated")}</Badge>
                    )}
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(branch)}
                          data-testid={`button-edit-branch-${branch.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-delete-branch-${branch.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{lbl.deleteTitle}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {lbl.deleteDesc}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteBranchMutation.mutate(branch.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {t("common.delete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
