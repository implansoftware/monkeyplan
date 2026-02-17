import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck,
  Monitor,
  Hand,
  Battery,
  Volume2,
  Camera,
  Wifi,
  MousePointer2,
  Gauge,
  Plug,
  Smartphone,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { RepairTestChecklist } from "@shared/schema";

interface TestChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repairOrderId: string;
  onSuccess?: () => void;
}

const testChecklistSchema = z.object({
  displayTest: z.boolean().nullable().optional(),
  touchTest: z.boolean().nullable().optional(),
  batteryTest: z.boolean().nullable().optional(),
  audioTest: z.boolean().nullable().optional(),
  cameraTest: z.boolean().nullable().optional(),
  connectivityTest: z.boolean().nullable().optional(),
  buttonsTest: z.boolean().nullable().optional(),
  sensorsTest: z.boolean().nullable().optional(),
  chargingTest: z.boolean().nullable().optional(),
  softwareTest: z.boolean().nullable().optional(),
  overallResult: z.boolean().optional(),
  notes: z.string().optional(),
});

type TestChecklistFormData = z.infer<typeof testChecklistSchema>;

function getTestItems(t: (key: string) => string) {
  return [
    { key: "displayTest", label: t("test.display"), icon: Monitor, description: t("test.displayDescription") },
    { key: "touchTest", label: t("test.touch"), icon: Hand, description: t("repair.touchReactivity") },
    { key: "batteryTest", label: t("repair.battery"), icon: Battery, description: t("test.batteryDescription") },
    { key: "audioTest", label: t("test.audio"), icon: Volume2, description: t("test.audioDescription") },
    { key: "cameraTest", label: t("repair.camera"), icon: Camera, description: t("test.cameraDescription") },
    { key: "connectivityTest", label: t("diagnosis.connectivity"), icon: Wifi, description: t("test.connectivityDescription") },
    { key: "buttonsTest", label: t("test.buttons"), icon: MousePointer2, description: t("test.buttonsDescription") },
    { key: "sensorsTest", label: t("repair.sensors"), icon: Gauge, description: t("repair.proximityAccelerometer") },
    { key: "chargingTest", label: t("repair.charging"), icon: Plug, description: t("test.chargingDescription") },
    { key: "softwareTest", label: t("test.software"), icon: Smartphone, description: t("repair.osStability") },
  ] as const;
}

export function TestChecklistDialog({
  open,
  onOpenChange,
  repairOrderId,
  onSuccess,
}: TestChecklistDialogProps) {
  const { t } = useTranslation();
  const testItems = getTestItems(t);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: existingChecklist } = useQuery<RepairTestChecklist | null>({
    queryKey: ["/api/repair-orders", repairOrderId, "test-checklist"],
    queryFn: async () => {
      const res = await fetch(`/api/repair-orders/${repairOrderId}/test-checklist`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch checklist");
      return res.json();
    },
    enabled: open,
  });

  const form = useForm<TestChecklistFormData>({
    resolver: zodResolver(testChecklistSchema),
    defaultValues: {
      displayTest: null,
      touchTest: null,
      batteryTest: null,
      audioTest: null,
      cameraTest: null,
      connectivityTest: null,
      buttonsTest: null,
      sensorsTest: null,
      chargingTest: null,
      softwareTest: null,
      overallResult: false,
      notes: "",
    },
  });

  useEffect(() => {
    if (existingChecklist) {
      form.reset({
        displayTest: existingChecklist.displayTest,
        touchTest: existingChecklist.touchTest,
        batteryTest: existingChecklist.batteryTest,
        audioTest: existingChecklist.audioTest,
        cameraTest: existingChecklist.cameraTest,
        connectivityTest: existingChecklist.connectivityTest,
        buttonsTest: existingChecklist.buttonsTest,
        sensorsTest: existingChecklist.sensorsTest,
        chargingTest: existingChecklist.chargingTest,
        softwareTest: existingChecklist.softwareTest,
        overallResult: existingChecklist.overallResult ?? false,
        notes: existingChecklist.notes ?? "",
      });
    } else {
      form.reset({
        displayTest: null,
        touchTest: null,
        batteryTest: null,
        audioTest: null,
        cameraTest: null,
        connectivityTest: null,
        buttonsTest: null,
        sensorsTest: null,
        chargingTest: null,
        softwareTest: null,
        overallResult: false,
        notes: "",
      });
    }
  }, [existingChecklist, form, repairOrderId]);

  const saveChecklistMutation = useMutation({
    mutationFn: async (data: TestChecklistFormData) => {
      return await apiRequest("POST", `/api/repair-orders/${repairOrderId}/test-checklist`, data);
    },
    onSuccess: () => {
      toast({
        title: t("test.checklistSaved"),
        description: t("test.testResultsSaved"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "test-checklist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TestChecklistFormData) => {
    saveChecklistMutation.mutate(data);
  };

  const watchedValues = form.watch();
  const passedTests = testItems.filter(item => watchedValues[item.key as keyof TestChecklistFormData] === true).length;
  const failedTests = testItems.filter(item => watchedValues[item.key as keyof TestChecklistFormData] === false).length;
  const pendingTests = testItems.length - passedTests - failedTests;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative pb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent rounded-t-lg -m-6 mb-0 p-6" />
          <DialogTitle className="relative flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ClipboardCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <span className="text-lg font-semibold">{t("test.deviceTestChecklist")}</span>
              <DialogDescription className="mt-0.5">
                {t("test.performAndRecordTests")}
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" /> {passedTests} {t("test.passed")}
          </Badge>
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" /> {failedTests} {t("test.failed")}
          </Badge>
          <Badge variant="outline" className="gap-1">
            {pendingTests} {t("test.pending")}
          </Badge>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
              <CardHeader className="relative">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                      <Smartphone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    {t("test.functionalTests")}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      onClick={() => {
                        testItems.forEach((item) => {
                          form.setValue(item.key as any, true);
                        });
                      }}
                      className="gap-1"
                      data-testid="button-all-ok"
                    >
                      <CheckCircle className="h-3 w-3" /> {t("test.allOk")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        testItems.forEach((item) => {
                          form.setValue(item.key as any, false);
                        });
                      }}
                      className="gap-1"
                      data-testid="button-all-ko"
                    >
                      <XCircle className="h-3 w-3" /> {t("test.allFailed")}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {testItems.map((item) => {
                    const Icon = item.icon;
                    const value = watchedValues[item.key as keyof TestChecklistFormData];
                    return (
                      <div
                        key={item.key}
                        className={`p-3 border rounded-lg transition-colors ${
                          value === true
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                            : value === false
                            ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                            : ""
                        }`}
                        data-testid={`test-item-${item.key}`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="font-medium">{item.label}</div>
                            <div className="text-xs text-muted-foreground mb-2">
                              {item.description}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={value === true ? "default" : "outline"}
                                onClick={() => form.setValue(item.key as any, true)}
                                className="gap-1"
                                data-testid={`button-pass-${item.key}`}
                              >
                                <CheckCircle className="h-3 w-3" /> OK
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={value === false ? "destructive" : "outline"}
                                onClick={() => form.setValue(item.key as any, false)}
                                className="gap-1"
                                data-testid={`button-fail-${item.key}`}
                              >
                                <XCircle className="h-3 w-3" /> KO
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => form.setValue(item.key as any, null)}
                                className="text-xs"
                                data-testid={`button-na-${item.key}`}
                              >
                                N/A
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
              <CardHeader className="relative">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                    <ClipboardCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  {t("test.overallResult")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="overallResult"
                  render={({ field }) => (
                    <FormItem className="flex flex-wrap items-center gap-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-overall-result"
                        />
                      </FormControl>
                      <FormLabel className="text-base font-medium cursor-pointer">
                        {t("test.devicePassedAllTests")}
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.notes")}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={t("test.additionalObservations")}
                          rows={3}
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-close"
              >
                {t("common.close")}
              </Button>
              <Button
                type="submit"
                disabled={saveChecklistMutation.isPending}
                data-testid="button-save-checklist"
              >
                {saveChecklistMutation.isPending ? t("common.saving") : t("test.saveChecklist")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
