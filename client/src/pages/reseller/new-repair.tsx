import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { InsertRepairOrder } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ResellerNewRepair() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const createRepairMutation = useMutation({
    mutationFn: async (data: Partial<InsertRepairOrder>) => {
      const res = await apiRequest("POST", "/api/repair-orders", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      toast({ title: t("newRepair.repairCreated") });
      setLocation("/reseller/orders");
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Partial<InsertRepairOrder> = {
      deviceType: formData.get("deviceType") as string,
      deviceModel: formData.get("deviceModel") as string,
      issueDescription: formData.get("issueDescription") as string,
      notes: formData.get("notes") as string || undefined,
    };
    createRepairMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/reseller")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold mb-2">{t("newRepair.title")}</h1>
          <p className="text-muted-foreground">
            {t("newRepair.subtitle")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("newRepair.deviceDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deviceType">{t("repairs.deviceType")}</Label>
                <Select name="deviceType" defaultValue="smartphone">
                  <SelectTrigger id="deviceType" data-testid="select-device-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smartphone">Smartphone</SelectItem>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deviceModel">{t("products.model")}</Label>
                <Input
                  id="deviceModel"
                  name="deviceModel"
                  placeholder={t("newRepair.modelPlaceholder")}
                  required
                  data-testid="input-device-model"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueDescription">{t("repairs.problemDescription")}</Label>
              <Textarea
                id="issueDescription"
                name="issueDescription"
                placeholder={t("newRepair.describeIssuePlaceholder")}
                required
                rows={4}
                data-testid="textarea-issue-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t("newRepair.additionalNotesLabel")}</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder={t("newRepair.additionalNotesPlaceholder")}
                rows={3}
                data-testid="textarea-notes"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/reseller")}
                data-testid="button-cancel"
              >{t("common.cancel")}</Button>
              <Button
                type="submit"
                disabled={createRepairMutation.isPending}
                data-testid="button-submit-repair"
              >
                {createRepairMutation.isPending ? t("pages.creating") : t("newRepair.createRequest")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
