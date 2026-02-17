import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, Loader2, Search, Heart } from "lucide-react";
import type { User, CustomerRelationship } from "@shared/schema";

function getRelationshipTypes(t: (key: string) => string) {
  return [
    { value: "genitore", label: t("customer.parent") },
    { value: "figlio", label: t("customer.child") },
    { value: "coniuge", label: t("customer.spouse") },
    { value: "fratello", label: t("customer.sibling") },
    { value: "cugino", label: t("customer.cousin") },
    { value: "zio", label: t("customer.uncle") },
    { value: "nipote", label: t("customer.grandchild") },
    { value: "nonno", label: t("customer.grandparent") },
    { value: "altro", label: t("common.other") },
  ];
}

interface CustomerRelationshipsCardProps {
  customerId: string;
  resellerId?: string;
  repairCenterId?: string;
}

interface RelationshipWithCustomer extends CustomerRelationship {
  relatedCustomer: User;
}

export function CustomerRelationshipsCard({ customerId, resellerId, repairCenterId }: CustomerRelationshipsCardProps) {
  const { t } = useTranslation();
  const RELATIONSHIP_TYPES = getRelationshipTypes(t);
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [relationshipType, setRelationshipType] = useState<string>("");
  const [notes, setNotes] = useState("");

  const { data: relationships = [], isLoading } = useQuery<RelationshipWithCustomer[]>({
    queryKey: ["/api/customers", customerId, "relationships"],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${customerId}/relationships`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const { data: customers = [] } = useQuery<User[]>({
    queryKey: ["/api/customers", { resellerId, repairCenterId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (resellerId) params.set("resellerId", resellerId);
      if (repairCenterId) params.set("repairCenterId", repairCenterId);
      const res = await fetch(`/api/customers?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { relatedCustomerId: string; relationshipType: string; notes?: string }) => {
      return apiRequest("POST", `/api/customers/${customerId}/relationships`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "relationships"] });
      toast({ title: t("customer.relationAdded"), description: t("customer.relationCreatedSuccess") });
      resetForm();
      setAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (relationshipId: string) => {
      return apiRequest("DELETE", `/api/customer-relationships/${relationshipId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "relationships"] });
      toast({ title: t("customer.relationRemoved"), description: t("customer.relationDeleted") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setSearchTerm("");
    setSelectedCustomerId("");
    setRelationshipType("");
    setNotes("");
  };

  const existingRelatedIds = new Set(relationships.map(r => r.relatedCustomerId));
  const availableCustomers = customers.filter(c => 
    c.id !== customerId && 
    !existingRelatedIds.has(c.id) &&
    c.role === "customer" &&
    (searchTerm === "" || c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRelationshipLabel = (type: string) => {
    return RELATIONSHIP_TYPES.find(rt => rt.value === type)?.label || type;
  };

  const handleSubmit = () => {
    if (!selectedCustomerId || !relationshipType) {
      toast({ title: t("common.error"), description: t("customer.selectCustomerAndType"), variant: "destructive" });
      return;
    }
    createMutation.mutate({
      relatedCustomerId: selectedCustomerId,
      relationshipType,
      notes: notes || undefined,
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4" />
            {t("customer.relationships")}
          </CardTitle>
          <Button size="sm" onClick={() => setAddDialogOpen(true)} data-testid="button-add-relationship">
            <Plus className="h-4 w-4 mr-1" />
            {t("common.add")}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : relationships.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("customer.noRelationships")}
            </p>
          ) : (
            <div className="space-y-2">
              {relationships.map((rel) => (
                <div
                  key={rel.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  data-testid={`relationship-item-${rel.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{rel.relatedCustomer.fullName}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {getRelationshipLabel(rel.relationshipType)}
                        </Badge>
                        {rel.notes && (
                          <span className="text-xs text-muted-foreground">{rel.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(rel.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-relationship-${rel.id}`}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("customer.addRelation")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("customer.searchCustomer")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("customer.searchByNameOrEmail")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-customer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("customer.selectCustomer")}</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger data-testid="select-customer">
                  <SelectValue placeholder={t("customer.selectACustomer")} />
                </SelectTrigger>
                <SelectContent>
                  {availableCustomers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {t("customer.noCustomersAvailable")}
                    </div>
                  ) : (
                    availableCustomers.slice(0, 20).map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.fullName} ({customer.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("customer.relationType")}</Label>
              <Select value={relationshipType} onValueChange={setRelationshipType}>
                <SelectTrigger data-testid="select-relationship-type">
                  <SelectValue placeholder={t("common.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("common.notesOptional")}</Label>
              <Textarea
                placeholder={t("common.addNotes")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="input-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setAddDialogOpen(false); }}>
              {t("common.cancel")}
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending || !selectedCustomerId || !relationshipType}
              data-testid="button-confirm-relationship"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
