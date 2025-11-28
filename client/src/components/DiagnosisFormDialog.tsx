import { useState, useMemo, useCallback, useEffect } from "react";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Stethoscope, 
  Camera, 
  AlertCircle,
  CircuitBoard,
  Monitor,
  Smartphone,
  Hand,
  Battery,
  BatteryWarning,
  Scan,
  Sun,
  Plug,
  Square,
  Layers,
  Cpu,
  Speaker,
  Mic,
  Volume2,
  Wifi,
  Bluetooth,
  Signal,
  Power,
  RotateCcw,
  Vibrate,
  Camera as CameraIcon,
  SquareStack,
  Fingerprint,
  Navigation,
  Flame,
  Zap,
  CheckCircle2,
  XCircle,
  Ban,
  Gift,
  CreditCard,
  ArrowLeftRight,
  HardDrive,
  Database,
  type LucideIcon,
} from "lucide-react";
import { DiagnosisPhotoUploader } from "@/components/DiagnosisPhotoUploader";
import type { DiagnosticFinding, DamagedComponentType, EstimatedRepairTime, RepairOrder, Promotion, UnrepairableReason } from "@shared/schema";

interface ExistingDiagnosis {
  id: string;
  technicalDiagnosis?: string | null;
  damagedComponents?: string[] | null;
  estimatedRepairTime?: number | null;
  requiresExternalParts?: boolean | null;
  diagnosisNotes?: string | null;
  photos?: string[] | null;
  findingIds?: string[] | null;
  componentIds?: string[] | null;
  estimatedRepairTimeId?: string | null;
  diagnosisOutcome?: string | null;
  unrepairableReasonId?: string | null;
  unrepairableReasonOther?: string | null;
  customerDataImportant?: boolean | null;
  suggestedPromotionIds?: string[] | null;
  dataRecoveryRequested?: boolean | null;
}

interface DiagnosisFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repairOrderId: string;
  repairOrder?: { deviceTypeId?: string | null };
  existingDiagnosis?: ExistingDiagnosis | null;
  onSuccess?: (outcome?: string) => void;
}

const diagnosisSchema = z.object({
  selectedFindingIds: z.array(z.string()).min(1, "Seleziona almeno un risultato della diagnosi"),
  otherFindingDescription: z.string().optional(),
  selectedComponentIds: z.array(z.string()).default([]),
  otherComponentDescription: z.string().optional(),
  estimatedRepairTimeId: z.string().min(1, "Seleziona un tempo stimato di riparazione"),
  requiresExternalParts: z.boolean().default(false),
  diagnosisNotes: z.string().optional(),
  diagnosisOutcome: z.enum(["riparabile", "non_conveniente", "irriparabile"]).default("riparabile"),
  unrepairableReasonId: z.string().optional(),
  unrepairableReasonOther: z.string().optional(),
  customerDataImportant: z.boolean().default(false),
  suggestedPromotionIds: z.array(z.string()).default([]),
  dataRecoveryRequested: z.boolean().default(false),
}).refine((data) => {
  const hasOtherFinding = data.selectedFindingIds.some(id => id.includes("-other"));
  if (hasOtherFinding && !data.otherFindingDescription?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Descrivi il problema 'Altro' selezionato",
  path: ["otherFindingDescription"],
}).refine((data) => {
  const hasOtherComponent = data.selectedComponentIds.some(id => id.includes("-other"));
  if (hasOtherComponent && !data.otherComponentDescription?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Descrivi il componente 'Altro' selezionato",
  path: ["otherComponentDescription"],
}).refine((data) => {
  if (data.diagnosisOutcome === "irriparabile" && !data.unrepairableReasonId && !data.unrepairableReasonOther?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Seleziona un motivo di irriparabilità o descrivi 'Altro'",
  path: ["unrepairableReasonId"],
}).refine((data) => {
  if (data.diagnosisOutcome === "non_conveniente" && data.suggestedPromotionIds.length === 0) {
    return false;
  }
  return true;
}, {
  message: "Seleziona almeno una promozione da proporre al cliente",
  path: ["suggestedPromotionIds"],
});

type DiagnosisFormData = z.infer<typeof diagnosisSchema>;

const getPromotionIcon = (iconName: string): LucideIcon => {
  switch (iconName) {
    case 'Smartphone': return Smartphone;
    case 'CreditCard': return CreditCard;
    case 'ArrowLeftRight': return ArrowLeftRight;
    case 'Gift': return Gift;
    default: return Gift;
  }
};

// Mappa icone per i problemi riscontrati (findings) basata su parole chiave nel nome
const getFindingIcon = (name: string): LucideIcon => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('display') || lowerName.includes('schermo')) return Monitor;
  if (lowerName.includes('touch')) return Hand;
  if (lowerName.includes('lcd') || lowerName.includes('pannello')) return Layers;
  if (lowerName.includes('burn') || lowerName.includes('fantasma')) return Flame;
  if (lowerName.includes('batteria')) return Battery;
  if (lowerName.includes('linee') || lowerName.includes('artefatti')) return Scan;
  if (lowerName.includes('retroilluminazione') || lowerName.includes('backlight')) return Sun;
  if (lowerName.includes('fotocamera') || lowerName.includes('camera')) return CameraIcon;
  if (lowerName.includes('microfono') || lowerName.includes('mic')) return Mic;
  if (lowerName.includes('altoparlante') || lowerName.includes('speaker') || lowerName.includes('audio')) return Volume2;
  if (lowerName.includes('wifi') || lowerName.includes('wi-fi')) return Wifi;
  if (lowerName.includes('bluetooth')) return Bluetooth;
  if (lowerName.includes('segnale') || lowerName.includes('antenna') || lowerName.includes('rete')) return Signal;
  if (lowerName.includes('accensione') || lowerName.includes('power') || lowerName.includes('avvio')) return Power;
  if (lowerName.includes('riavvio') || lowerName.includes('restart') || lowerName.includes('loop')) return RotateCcw;
  if (lowerName.includes('vibrazione')) return Vibrate;
  if (lowerName.includes('sensore') || lowerName.includes('prossimità')) return Navigation;
  if (lowerName.includes('impronta') || lowerName.includes('fingerprint') || lowerName.includes('face id')) return Fingerprint;
  if (lowerName.includes('ricarica') || lowerName.includes('carica') || lowerName.includes('usb')) return Zap;
  if (lowerName.includes('scheda') || lowerName.includes('madre') || lowerName.includes('logic')) return Cpu;
  return AlertCircle; // default
};

// Mappa icone per i componenti danneggiati basata su parole chiave nel nome
const getComponentIcon = (name: string): LucideIcon => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('vetro')) return Square;
  if (lowerName.includes('lcd')) return Layers;
  if (lowerName.includes('oled') || lowerName.includes('amoled')) return Monitor;
  if (lowerName.includes('digitalizzatore') || lowerName.includes('touch') || lowerName.includes('digitizer')) return Hand;
  if (lowerName.includes('cornice') || lowerName.includes('frame') || lowerName.includes('telaio')) return SquareStack;
  if (lowerName.includes('retroilluminazione') || lowerName.includes('backlight')) return Sun;
  if (lowerName.includes('batteria') || lowerName.includes('cella')) return Battery;
  if (lowerName.includes('connettore')) return Plug;
  if (lowerName.includes('fotocamera') || lowerName.includes('camera')) return CameraIcon;
  if (lowerName.includes('altoparlante') || lowerName.includes('speaker')) return Speaker;
  if (lowerName.includes('microfono') || lowerName.includes('mic')) return Mic;
  if (lowerName.includes('antenna') || lowerName.includes('wifi')) return Wifi;
  if (lowerName.includes('scheda') || lowerName.includes('madre') || lowerName.includes('logic') || lowerName.includes('chip')) return Cpu;
  if (lowerName.includes('sensore')) return Navigation;
  if (lowerName.includes('pulsante') || lowerName.includes('tasto')) return Power;
  if (lowerName.includes('flex') || lowerName.includes('cavo')) return Zap;
  return CircuitBoard; // default
};

export function DiagnosisFormDialog({
  open,
  onOpenChange,
  repairOrderId,
  repairOrder,
  existingDiagnosis,
  onSuccess,
}: DiagnosisFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  
  const isEditMode = !!existingDiagnosis;

  const deviceTypeId = repairOrder?.deviceTypeId;

  const buildQueryUrl = (base: string, params: Record<string, string | undefined>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
    const queryString = searchParams.toString();
    return queryString ? `${base}?${queryString}` : base;
  };

  const { data: diagnosticFindings = [] } = useQuery<DiagnosticFinding[]>({
    queryKey: ["/api/diagnostic-findings", { deviceTypeId }],
    queryFn: async () => {
      const url = buildQueryUrl("/api/diagnostic-findings", { deviceTypeId: deviceTypeId ?? undefined });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Errore nel caricamento diagnosi");
      return res.json();
    },
    enabled: open,
  });

  const { data: damagedComponentTypes = [] } = useQuery<DamagedComponentType[]>({
    queryKey: ["/api/damaged-component-types", { deviceTypeId }],
    queryFn: async () => {
      const url = buildQueryUrl("/api/damaged-component-types", { deviceTypeId: deviceTypeId ?? undefined });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Errore nel caricamento componenti");
      return res.json();
    },
    enabled: open,
  });

  const { data: estimatedRepairTimes = [] } = useQuery<EstimatedRepairTime[]>({
    queryKey: ["/api/estimated-repair-times", { deviceTypeId }],
    queryFn: async () => {
      const url = buildQueryUrl("/api/estimated-repair-times", { deviceTypeId: deviceTypeId ?? undefined });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Errore nel caricamento tempi");
      return res.json();
    },
    enabled: open,
  });

  const { data: promotions = [] } = useQuery<Promotion[]>({
    queryKey: ["/api/promotions"],
    queryFn: async () => {
      const res = await fetch("/api/promotions", { credentials: "include" });
      if (!res.ok) throw new Error("Errore nel caricamento promozioni");
      return res.json();
    },
    enabled: open,
  });

  const { data: unrepairableReasons = [] } = useQuery<UnrepairableReason[]>({
    queryKey: ["/api/unrepairable-reasons", { deviceTypeId }],
    queryFn: async () => {
      const url = buildQueryUrl("/api/unrepairable-reasons", { deviceTypeId: deviceTypeId ?? undefined });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Errore nel caricamento motivi irriparabilità");
      return res.json();
    },
    enabled: open,
  });

  // Memoize findingsByCategory to prevent re-calculation on every render
  const findingsByCategory = useMemo(() => {
    return diagnosticFindings.reduce((acc, finding) => {
      const category = finding.category || "altro";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(finding);
      return acc;
    }, {} as Record<string, DiagnosticFinding[]>);
  }, [diagnosticFindings]);

  const categoryLabels: Record<string, string> = {
    hardware: "Hardware",
    software: "Software",
    connectivity: "Connettività",
    altro: "Altro",
  };

  const form = useForm<DiagnosisFormData>({
    resolver: zodResolver(diagnosisSchema),
    defaultValues: {
      selectedFindingIds: existingDiagnosis?.findingIds || [],
      otherFindingDescription: "",
      selectedComponentIds: existingDiagnosis?.componentIds || [],
      otherComponentDescription: "",
      estimatedRepairTimeId: existingDiagnosis?.estimatedRepairTimeId || "",
      requiresExternalParts: existingDiagnosis?.requiresExternalParts || false,
      diagnosisNotes: existingDiagnosis?.diagnosisNotes || "",
      diagnosisOutcome: (existingDiagnosis?.diagnosisOutcome as "riparabile" | "non_conveniente" | "irriparabile") || "riparabile",
      unrepairableReasonId: existingDiagnosis?.unrepairableReasonId || "",
      unrepairableReasonOther: existingDiagnosis?.unrepairableReasonOther || "",
      customerDataImportant: existingDiagnosis?.customerDataImportant || false,
      suggestedPromotionIds: existingDiagnosis?.suggestedPromotionIds || [],
      dataRecoveryRequested: existingDiagnosis?.dataRecoveryRequested || false,
    },
  });

  const diagnosisOutcome = form.watch("diagnosisOutcome");
  const customerDataImportant = form.watch("customerDataImportant");

  // Reset form when existingDiagnosis changes or dialog opens
  const resetFormState = useCallback(() => {
    if (existingDiagnosis) {
      form.reset({
        selectedFindingIds: existingDiagnosis.findingIds || [],
        otherFindingDescription: "",
        selectedComponentIds: existingDiagnosis.componentIds || [],
        otherComponentDescription: "",
        estimatedRepairTimeId: existingDiagnosis.estimatedRepairTimeId || "",
        requiresExternalParts: existingDiagnosis.requiresExternalParts || false,
        diagnosisNotes: existingDiagnosis.diagnosisNotes || "",
        diagnosisOutcome: (existingDiagnosis.diagnosisOutcome as "riparabile" | "non_conveniente" | "irriparabile") || "riparabile",
        unrepairableReasonId: existingDiagnosis.unrepairableReasonId || "",
        unrepairableReasonOther: existingDiagnosis.unrepairableReasonOther || "",
        customerDataImportant: existingDiagnosis.customerDataImportant || false,
        suggestedPromotionIds: existingDiagnosis.suggestedPromotionIds || [],
        dataRecoveryRequested: existingDiagnosis.dataRecoveryRequested || false,
      });
      setUploadedPhotos(existingDiagnosis.photos || []);
    } else {
      form.reset({
        selectedFindingIds: [],
        otherFindingDescription: "",
        selectedComponentIds: [],
        otherComponentDescription: "",
        estimatedRepairTimeId: "",
        requiresExternalParts: false,
        diagnosisNotes: "",
        diagnosisOutcome: "riparabile",
        unrepairableReasonId: "",
        unrepairableReasonOther: "",
        customerDataImportant: false,
        suggestedPromotionIds: [],
        dataRecoveryRequested: false,
      });
      setUploadedPhotos([]);
    }
  }, [form, existingDiagnosis]);

  // Sync form values when dialog opens with existing diagnosis
  useEffect(() => {
    if (open) {
      resetFormState();
    }
  }, [open, resetFormState]);

  // Helper function to build payload from form data
  const buildPayload = (data: DiagnosisFormData) => {
    const findingsMap = new Map(diagnosticFindings.map(f => [f.id, f]));
    const componentsMap = new Map(damagedComponentTypes.map(c => [c.id, c]));
    const timesMap = new Map(estimatedRepairTimes.map(t => [t.id, t]));

    const selectedFindingNames = data.selectedFindingIds
      .map(id => findingsMap.get(id)?.name)
      .filter(Boolean) as string[];
    
    let technicalDiagnosis = selectedFindingNames.join(", ");
    const hasOtherFinding = data.selectedFindingIds.some(id => id.includes("-other"));
    if (hasOtherFinding && data.otherFindingDescription?.trim()) {
      technicalDiagnosis += technicalDiagnosis ? `, ${data.otherFindingDescription.trim()}` : data.otherFindingDescription.trim();
    }

    const selectedComponentNames = data.selectedComponentIds
      .map(id => componentsMap.get(id)?.name)
      .filter(Boolean) as string[];
    
    const hasOtherComponent = data.selectedComponentIds.some(id => id.includes("-other"));
    if (hasOtherComponent && data.otherComponentDescription?.trim()) {
      selectedComponentNames.push(data.otherComponentDescription.trim());
    }

    const selectedTime = timesMap.get(data.estimatedRepairTimeId);
    const estimatedHours = selectedTime?.hoursMax ?? undefined;

    return {
      technicalDiagnosis,
      damagedComponents: selectedComponentNames,
      estimatedRepairTime: estimatedHours,
      requiresExternalParts: data.requiresExternalParts,
      diagnosisNotes: data.diagnosisNotes,
      photos: uploadedPhotos,
      findingIds: data.selectedFindingIds,
      componentIds: data.selectedComponentIds,
      estimatedRepairTimeId: data.estimatedRepairTimeId,
      diagnosisOutcome: data.diagnosisOutcome,
      unrepairableReasonId: data.unrepairableReasonId || null,
      unrepairableReasonOther: data.unrepairableReasonOther || null,
      customerDataImportant: data.customerDataImportant,
      suggestedPromotionIds: data.suggestedPromotionIds,
      dataRecoveryRequested: data.dataRecoveryRequested,
    };
  };

  const createDiagnosisMutation = useMutation({
    mutationFn: async (data: DiagnosisFormData) => {
      const payload = buildPayload(data);
      return await apiRequest(
        "POST",
        `/api/repair-orders/${repairOrderId}/diagnostics`,
        payload
      );
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Diagnosi creata",
        description: "La diagnosi tecnica è stata registrata con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/repair-orders", repairOrderId, "diagnostics"],
      });
      resetFormState();
      onOpenChange(false);
      onSuccess?.(variables.diagnosisOutcome);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateDiagnosisMutation = useMutation({
    mutationFn: async (data: DiagnosisFormData) => {
      const payload = buildPayload(data);
      return await apiRequest(
        "PATCH",
        `/api/repair-orders/${repairOrderId}/diagnostics`,
        payload
      );
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Diagnosi aggiornata",
        description: "La diagnosi tecnica è stata aggiornata con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/repair-orders", repairOrderId, "diagnostics"],
      });
      resetFormState();
      onOpenChange(false);
      onSuccess?.(variables.diagnosisOutcome);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DiagnosisFormData) => {
    if (isEditMode) {
      updateDiagnosisMutation.mutate(data);
    } else {
      createDiagnosisMutation.mutate(data);
    }
  };
  
  const isPending = createDiagnosisMutation.isPending || updateDiagnosisMutation.isPending;

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  const handleExplicitCancel = () => {
    resetFormState();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            {isEditMode ? "Modifica Diagnosi Tecnica" : "Diagnosi Tecnica"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Modifica i risultati della diagnosi tecnica per questa lavorazione"
              : "Registra i risultati della diagnosi tecnica per questa lavorazione"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Risultati Diagnosi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="selectedFindingIds"
                  render={({ field }) => {
                    const selectedIds = field.value || [];
                    const handleToggle = (findingId: string) => {
                      const newValue = selectedIds.includes(findingId)
                        ? selectedIds.filter(id => id !== findingId)
                        : [...selectedIds, findingId];
                      field.onChange(newValue);
                    };
                    return (
                      <FormItem>
                        <FormLabel>Problemi Riscontrati *</FormLabel>
                        <FormDescription>
                          Seleziona tutti i problemi identificati durante la diagnosi
                        </FormDescription>
                        <ScrollArea className="h-[200px] border rounded-md p-3">
                          <div className="space-y-4">
                            {Object.entries(findingsByCategory).map(([category, findings]) => (
                              <div key={category} className="space-y-2">
                                <h4 className="text-sm font-semibold text-muted-foreground border-b pb-1">
                                  {categoryLabels[category] || category}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {findings.map((finding) => {
                                    const isSelected = selectedIds.includes(finding.id);
                                    const FindingIcon = getFindingIcon(finding.name);
                                    return (
                                      <div 
                                        key={finding.id} 
                                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                          isSelected 
                                            ? 'border-primary bg-primary/10' 
                                            : 'border-transparent hover:bg-muted/50'
                                        }`}
                                        onClick={() => handleToggle(finding.id)}
                                        data-testid={`checkbox-finding-${finding.id}`}
                                      >
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                          isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                                        }`}>
                                          {isSelected && <span className="text-primary-foreground text-xs">✓</span>}
                                        </div>
                                        <FindingIcon className={`h-5 w-5 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <span className="text-sm leading-tight">
                                          {finding.name}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        {selectedIds.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted rounded">
                            <strong>Selezionati ({selectedIds.length}):</strong>{" "}
                            {selectedIds.map(id => diagnosticFindings.find(f => f.id === id)?.name).filter(Boolean).join(", ")}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="otherFindingDescription"
                  render={({ field }) => {
                    const findingIds = form.getValues("selectedFindingIds") || [];
                    const hasOther = findingIds.some(id => id.includes("-other"));
                    if (!hasOther) return <></>;
                    return (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          Descrivi altro problema *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Descrivi il problema non presente in lista..."
                            data-testid="input-other-finding"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="selectedComponentIds"
                  render={({ field }) => {
                    const selectedIds = field.value || [];
                    const handleToggle = (componentId: string) => {
                      const newValue = selectedIds.includes(componentId)
                        ? selectedIds.filter(id => id !== componentId)
                        : [...selectedIds, componentId];
                      field.onChange(newValue);
                    };
                    return (
                      <FormItem>
                        <FormLabel>Componenti Danneggiati</FormLabel>
                        <FormDescription>
                          Seleziona i componenti che necessitano riparazione o sostituzione
                        </FormDescription>
                        <ScrollArea className="h-[220px] border rounded-md p-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {damagedComponentTypes.map((component) => {
                              const isSelected = selectedIds.includes(component.id);
                              const ComponentIcon = getComponentIcon(component.name);
                              return (
                                <div 
                                  key={component.id} 
                                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                    isSelected 
                                      ? 'border-primary bg-primary/10' 
                                      : 'border-transparent hover:bg-muted/50'
                                  }`}
                                  onClick={() => handleToggle(component.id)}
                                  data-testid={`checkbox-component-${component.id}`}
                                >
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                    isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                                  }`}>
                                    {isSelected && <span className="text-primary-foreground text-xs">✓</span>}
                                  </div>
                                  <ComponentIcon className={`h-5 w-5 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                  <span className="text-sm leading-tight">
                                    {component.name}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                        {selectedIds.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted rounded">
                            <strong>Selezionati ({selectedIds.length}):</strong>{" "}
                            {selectedIds.map(id => damagedComponentTypes.find(c => c.id === id)?.name).filter(Boolean).join(", ")}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="otherComponentDescription"
                  render={({ field }) => {
                    const componentIds = form.getValues("selectedComponentIds") || [];
                    const hasOther = componentIds.some(id => id.includes("-other"));
                    if (!hasOther) return <></>;
                    return (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          Descrivi altro componente *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Descrivi il componente non presente in lista..."
                            data-testid="input-other-component"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Valutazione</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="estimatedRepairTimeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tempo Stimato di Riparazione *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-estimated-time">
                            <SelectValue placeholder="Seleziona tempo stimato" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {estimatedRepairTimes.map((time) => (
                            <SelectItem key={time.id} value={time.id}>
                              {time.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Tempo stimato per completare la riparazione
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requiresExternalParts"
                  render={({ field }) => (
                    <FormItem 
                      className="flex flex-row items-start space-x-3 space-y-0 cursor-pointer"
                      onClick={() => field.onChange(!field.value)}
                    >
                      <div className={`w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        field.value ? 'bg-primary border-primary' : 'border-muted-foreground'
                      }`}>
                        {field.value && <span className="text-primary-foreground text-xs">✓</span>}
                      </div>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">Richiede Ricambi Esterni</FormLabel>
                        <FormDescription>
                          Spunta se è necessario ordinare ricambi esternamente
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    <span className="text-sm font-medium">Foto Diagnosi</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Carica foto del dispositivo e dei componenti danneggiati
                  </p>
                  <DiagnosisPhotoUploader
                    repairOrderId={repairOrderId}
                    photos={uploadedPhotos}
                    onPhotosChange={setUploadedPhotos}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Esito Diagnosi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="diagnosisOutcome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seleziona l'esito della diagnosi *</FormLabel>
                      <FormDescription>
                        Indica se il dispositivo è riparabile o meno
                      </FormDescription>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                        <div
                          className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            field.value === "riparabile"
                              ? "border-green-500 bg-green-500/10"
                              : "border-muted hover:bg-muted/50"
                          }`}
                          onClick={() => field.onChange("riparabile")}
                          data-testid="outcome-riparabile"
                        >
                          <CheckCircle2 className={`h-12 w-12 ${field.value === "riparabile" ? "text-green-500" : "text-muted-foreground"}`} />
                          <div className="text-center">
                            <div className="font-semibold">Riparabile</div>
                            <div className="text-xs text-muted-foreground">Il dispositivo può essere riparato</div>
                          </div>
                        </div>
                        <div
                          className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            field.value === "non_conveniente"
                              ? "border-amber-500 bg-amber-500/10"
                              : "border-muted hover:bg-muted/50"
                          }`}
                          onClick={() => field.onChange("non_conveniente")}
                          data-testid="outcome-non-conveniente"
                        >
                          <XCircle className={`h-12 w-12 ${field.value === "non_conveniente" ? "text-amber-500" : "text-muted-foreground"}`} />
                          <div className="text-center">
                            <div className="font-semibold">Non Conveniente</div>
                            <div className="text-xs text-muted-foreground">Costo riparazione troppo alto</div>
                          </div>
                        </div>
                        <div
                          className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            field.value === "irriparabile"
                              ? "border-red-500 bg-red-500/10"
                              : "border-muted hover:bg-muted/50"
                          }`}
                          onClick={() => field.onChange("irriparabile")}
                          data-testid="outcome-irriparabile"
                        >
                          <Ban className={`h-12 w-12 ${field.value === "irriparabile" ? "text-red-500" : "text-muted-foreground"}`} />
                          <div className="text-center">
                            <div className="font-semibold">Irriparabile</div>
                            <div className="text-xs text-muted-foreground">Tecnicamente non riparabile</div>
                          </div>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {diagnosisOutcome === "non_conveniente" && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/30">
                      <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                        Il costo della riparazione supera il valore del dispositivo. Proponi al cliente delle alternative:
                      </p>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="suggestedPromotionIds"
                      render={({ field }) => {
                        const selectedIds = field.value || [];
                        const handleToggle = (promotionId: string) => {
                          const newValue = selectedIds.includes(promotionId)
                            ? selectedIds.filter(id => id !== promotionId)
                            : [...selectedIds, promotionId];
                          field.onChange(newValue);
                        };
                        return (
                          <FormItem>
                            <FormLabel>Promozioni Suggerite</FormLabel>
                            <FormDescription>
                              Seleziona le promozioni da proporre al cliente
                            </FormDescription>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {promotions.map((promo) => {
                                const isSelected = selectedIds.includes(promo.id);
                                const PromoIcon = getPromotionIcon(promo.icon || "Gift");
                                return (
                                  <div
                                    key={promo.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                      isSelected
                                        ? "border-primary bg-primary/10"
                                        : "border-muted hover:bg-muted/50"
                                    }`}
                                    onClick={() => handleToggle(promo.id)}
                                    data-testid={`promotion-${promo.id}`}
                                  >
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                      isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                                    }`}>
                                      {isSelected && <span className="text-primary-foreground text-xs">✓</span>}
                                    </div>
                                    <PromoIcon className={`h-6 w-6 flex-shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm">{promo.name}</div>
                                      {promo.description && (
                                        <div className="text-xs text-muted-foreground truncate">{promo.description}</div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="customerDataImportant"
                      render={({ field }) => (
                        <FormItem
                          className="flex flex-row items-start space-x-3 space-y-0 cursor-pointer p-3 rounded-lg border bg-muted/30"
                          onClick={() => field.onChange(!field.value)}
                          data-testid="toggle-customer-data-important-nc"
                        >
                          <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            field.value ? "bg-primary border-primary" : "border-muted-foreground"
                          }`}>
                            {field.value && <span className="text-primary-foreground text-xs">✓</span>}
                          </div>
                          <div className="space-y-1 leading-none flex-1">
                            <div className="flex items-center gap-2">
                              <Database className="h-5 w-5 text-blue-500" />
                              <FormLabel className="cursor-pointer font-semibold">Il cliente ha dati importanti sul dispositivo</FormLabel>
                            </div>
                            <FormDescription>
                              Spunta se il cliente necessita del recupero dati prima di procedere
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {customerDataImportant && (
                      <FormField
                        control={form.control}
                        name="dataRecoveryRequested"
                        render={({ field }) => (
                          <FormItem
                            className="flex flex-row items-start space-x-3 space-y-0 cursor-pointer p-3 rounded-lg border border-blue-500/30 bg-blue-500/10"
                            onClick={() => field.onChange(!field.value)}
                            data-testid="toggle-data-recovery-nc"
                          >
                            <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              field.value ? "bg-blue-500 border-blue-500" : "border-muted-foreground"
                            }`}>
                              {field.value && <span className="text-white text-xs">✓</span>}
                            </div>
                            <div className="space-y-1 leading-none flex-1">
                              <div className="flex items-center gap-2">
                                <HardDrive className="h-5 w-5 text-blue-600" />
                                <FormLabel className="cursor-pointer font-semibold text-blue-700 dark:text-blue-300">Richiedi Recupero Dati</FormLabel>
                              </div>
                              <FormDescription className="text-blue-600 dark:text-blue-400">
                                Il servizio di recupero dati verrà attivato prima della restituzione
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {diagnosisOutcome === "irriparabile" && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/30">
                      <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                        Il dispositivo presenta danni tecnici che ne impediscono la riparazione. Seleziona il motivo:
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="unrepairableReasonId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivo Irriparabilità *</FormLabel>
                          <FormDescription>
                            Seleziona il motivo tecnico per cui il dispositivo non può essere riparato
                          </FormDescription>
                          <div className="grid grid-cols-1 gap-2">
                            {unrepairableReasons.map((reason) => {
                              const isSelected = field.value === reason.id;
                              return (
                                <div
                                  key={reason.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                    isSelected
                                      ? "border-red-500 bg-red-500/10"
                                      : "border-muted hover:bg-muted/50"
                                  }`}
                                  onClick={() => field.onChange(reason.id)}
                                  data-testid={`unrepairable-reason-${reason.id}`}
                                >
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    isSelected ? "border-red-500" : "border-muted-foreground"
                                  }`}>
                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                                  </div>
                                  <Ban className={`h-5 w-5 flex-shrink-0 ${isSelected ? "text-red-500" : "text-muted-foreground"}`} />
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{reason.name}</div>
                                    {reason.description && (
                                      <div className="text-xs text-muted-foreground">{reason.description}</div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            <div
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                field.value === "altro"
                                  ? "border-red-500 bg-red-500/10"
                                  : "border-muted hover:bg-muted/50"
                              }`}
                              onClick={() => field.onChange("altro")}
                              data-testid="unrepairable-reason-altro"
                            >
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                field.value === "altro" ? "border-red-500" : "border-muted-foreground"
                              }`}>
                                {field.value === "altro" && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                              </div>
                              <AlertCircle className={`h-5 w-5 flex-shrink-0 ${field.value === "altro" ? "text-red-500" : "text-muted-foreground"}`} />
                              <div className="font-medium text-sm">Altro motivo</div>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("unrepairableReasonId") === "altro" && (
                      <FormField
                        control={form.control}
                        name="unrepairableReasonOther"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              Descrivi il motivo *
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Descrivi il motivo tecnico per cui il dispositivo non può essere riparato..."
                                className="min-h-[80px]"
                                data-testid="input-unrepairable-reason-other"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="customerDataImportant"
                      render={({ field }) => (
                        <FormItem
                          className="flex flex-row items-start space-x-3 space-y-0 cursor-pointer p-3 rounded-lg border bg-muted/30"
                          onClick={() => field.onChange(!field.value)}
                          data-testid="toggle-customer-data-important-ir"
                        >
                          <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            field.value ? "bg-primary border-primary" : "border-muted-foreground"
                          }`}>
                            {field.value && <span className="text-primary-foreground text-xs">✓</span>}
                          </div>
                          <div className="space-y-1 leading-none flex-1">
                            <div className="flex items-center gap-2">
                              <Database className="h-5 w-5 text-blue-500" />
                              <FormLabel className="cursor-pointer font-semibold">Il cliente ha dati importanti sul dispositivo</FormLabel>
                            </div>
                            <FormDescription>
                              Spunta se il cliente necessita del recupero dati prima di procedere
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {customerDataImportant && (
                      <FormField
                        control={form.control}
                        name="dataRecoveryRequested"
                        render={({ field }) => (
                          <FormItem
                            className="flex flex-row items-start space-x-3 space-y-0 cursor-pointer p-3 rounded-lg border border-blue-500/30 bg-blue-500/10"
                            onClick={() => field.onChange(!field.value)}
                            data-testid="toggle-data-recovery-ir"
                          >
                            <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              field.value ? "bg-blue-500 border-blue-500" : "border-muted-foreground"
                            }`}>
                              {field.value && <span className="text-white text-xs">✓</span>}
                            </div>
                            <div className="space-y-1 leading-none flex-1">
                              <div className="flex items-center gap-2">
                                <HardDrive className="h-5 w-5 text-blue-600" />
                                <FormLabel className="cursor-pointer font-semibold text-blue-700 dark:text-blue-300">Richiedi Recupero Dati</FormLabel>
                              </div>
                              <FormDescription className="text-blue-600 dark:text-blue-400">
                                Il servizio di recupero dati verrà attivato prima della restituzione
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleExplicitCancel}
                data-testid="button-cancel"
              >
                Annulla e Chiudi
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-submit-diagnosis"
              >
                {isPending
                  ? (isEditMode ? "Salvataggio..." : "Creazione...")
                  : (isEditMode ? "Salva Modifiche" : "Crea Diagnosi")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
