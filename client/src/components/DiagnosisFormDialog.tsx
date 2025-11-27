import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  Monitor,
  Fingerprint,
  Zap,
  Battery,
  BatteryWarning,
  Plug,
  Volume2,
  VolumeX,
  Mic,
  Wifi,
  WifiOff,
  Bluetooth,
  Signal,
  Settings,
  HardDrive,
  Cpu,
  MemoryStick,
  CircuitBoard,
  Smartphone,
  Square,
  Sun,
  Power,
  Usb,
  Cable,
  Layers,
  ScanLine,
  Radio,
  Component,
  Thermometer,
  Droplets,
  Shield,
  Lock,
  Bug,
  RefreshCw,
  Ghost,
} from "lucide-react";
import { DiagnosisPhotoUploader } from "@/components/DiagnosisPhotoUploader";
import type { DiagnosticFinding, DamagedComponentType, EstimatedRepairTime, RepairOrder } from "@shared/schema";

interface DiagnosisFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repairOrderId: string;
  repairOrder?: { deviceTypeId?: string | null };
  onSuccess?: () => void;
}

const getDiagnosticFindingIcon = (findingName: string) => {
  const name = findingName.toLowerCase();
  
  if (name.includes("display") || name.includes("schermo") || name.includes("lcd") || name.includes("oled")) return Monitor;
  if (name.includes("touch") || name.includes("digitalizzatore")) return Fingerprint;
  if (name.includes("linee") || name.includes("artefatti") || name.includes("burn") || name.includes("fantasma")) return Ghost;
  if (name.includes("batteria gonfia") || name.includes("gonfia")) return BatteryWarning;
  if (name.includes("batteria") || name.includes("consumo") || name.includes("degradata")) return Battery;
  if (name.includes("ricarica") || name.includes("carica")) return Plug;
  if (name.includes("altoparlante") || name.includes("speaker") || name.includes("audio")) return Volume2;
  if (name.includes("microfono")) return Mic;
  if (name.includes("wifi") || name.includes("wi-fi")) return Wifi;
  if (name.includes("bluetooth")) return Bluetooth;
  if (name.includes("rete") || name.includes("segnale") || name.includes("antenna")) return Signal;
  if (name.includes("software") || name.includes("sistema")) return Settings;
  if (name.includes("memoria") || name.includes("storage")) return HardDrive;
  if (name.includes("processore") || name.includes("cpu") || name.includes("chip")) return Cpu;
  if (name.includes("ram")) return MemoryStick;
  if (name.includes("scheda") || name.includes("madre") || name.includes("logic")) return CircuitBoard;
  if (name.includes("fotocamera") || name.includes("camera")) return Camera;
  if (name.includes("tast") || name.includes("pulsant") || name.includes("button")) return Square;
  if (name.includes("retroilluminazione") || name.includes("luminosità")) return Sun;
  if (name.includes("accensione") || name.includes("power") || name.includes("avvio")) return Power;
  if (name.includes("usb") || name.includes("porta")) return Usb;
  if (name.includes("flex") || name.includes("cavo")) return Cable;
  if (name.includes("nfc")) return Radio;
  if (name.includes("sensore") || name.includes("sensor")) return ScanLine;
  if (name.includes("acqua") || name.includes("liquid") || name.includes("ossid")) return Droplets;
  if (name.includes("sicurezza") || name.includes("blocco")) return Lock;
  if (name.includes("virus") || name.includes("malware")) return Bug;
  if (name.includes("aggiornamento") || name.includes("update")) return RefreshCw;
  
  return AlertCircle;
};

const getDamagedComponentIcon = (componentName: string) => {
  const name = componentName.toLowerCase();
  
  if (name.includes("vetro") || name.includes("display") || name.includes("schermo")) return Monitor;
  if (name.includes("oled") || name.includes("lcd") || name.includes("pannello")) return Layers;
  if (name.includes("touch") || name.includes("digitalizzatore")) return Fingerprint;
  if (name.includes("retroilluminazione")) return Sun;
  if (name.includes("cornice")) return Square;
  if (name.includes("batteria") || name.includes("cella")) return Battery;
  if (name.includes("connettore") && name.includes("batteria")) return Plug;
  if (name.includes("ricarica") || name.includes("ic ricarica")) return Zap;
  if (name.includes("porta") && (name.includes("ricarica") || name.includes("usb"))) return Usb;
  if (name.includes("flex")) return Cable;
  if (name.includes("altoparlante") || name.includes("speaker")) return Volume2;
  if (name.includes("microfono")) return Mic;
  if (name.includes("fotocamera") || name.includes("camera")) return Camera;
  if (name.includes("antenna") || name.includes("wifi")) return Wifi;
  if (name.includes("bluetooth")) return Bluetooth;
  if (name.includes("nfc")) return Radio;
  if (name.includes("sensore")) return ScanLine;
  if (name.includes("pulsant") || name.includes("tast") || name.includes("button")) return Square;
  if (name.includes("scheda") || name.includes("madre") || name.includes("logic")) return CircuitBoard;
  if (name.includes("chip") || name.includes("ic") || name.includes("processore")) return Cpu;
  if (name.includes("memoria") || name.includes("storage") || name.includes("nand")) return HardDrive;
  if (name.includes("ram")) return MemoryStick;
  if (name.includes("scocca") || name.includes("frame") || name.includes("telaio")) return Smartphone;
  if (name.includes("vibra")) return Radio;
  
  return Component;
};

const diagnosisSchema = z.object({
  selectedFindingIds: z.array(z.string()).min(1, "Seleziona almeno un risultato della diagnosi"),
  otherFindingDescription: z.string().optional(),
  selectedComponentIds: z.array(z.string()).default([]),
  otherComponentDescription: z.string().optional(),
  estimatedRepairTimeId: z.string().min(1, "Seleziona un tempo stimato di riparazione"),
  requiresExternalParts: z.boolean().default(false),
  diagnosisNotes: z.string().optional(),
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
});

type DiagnosisFormData = z.infer<typeof diagnosisSchema>;

export function DiagnosisFormDialog({
  open,
  onOpenChange,
  repairOrderId,
  repairOrder,
  onSuccess,
}: DiagnosisFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [showOtherFinding, setShowOtherFinding] = useState(false);
  const [showOtherComponent, setShowOtherComponent] = useState(false);

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

  const findingsByCategory = diagnosticFindings.reduce((acc, finding) => {
    const category = finding.category || "altro";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(finding);
    return acc;
  }, {} as Record<string, DiagnosticFinding[]>);

  const categoryLabels: Record<string, string> = {
    hardware: "Hardware",
    software: "Software",
    connectivity: "Connettività",
    altro: "Altro",
  };

  const form = useForm<DiagnosisFormData>({
    resolver: zodResolver(diagnosisSchema),
    defaultValues: {
      selectedFindingIds: [],
      otherFindingDescription: "",
      selectedComponentIds: [],
      otherComponentDescription: "",
      estimatedRepairTimeId: "",
      requiresExternalParts: false,
      diagnosisNotes: "",
    },
  });

  const selectedFindingIds = form.watch("selectedFindingIds");
  const selectedComponentIds = form.watch("selectedComponentIds");

  useEffect(() => {
    const hasOther = selectedFindingIds.some(id => id.includes("-other"));
    setShowOtherFinding(hasOther);
    if (!hasOther) {
      form.setValue("otherFindingDescription", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFindingIds]);

  useEffect(() => {
    const hasOther = selectedComponentIds.some(id => id.includes("-other"));
    setShowOtherComponent(hasOther);
    if (!hasOther) {
      form.setValue("otherComponentDescription", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedComponentIds]);

  const resetFormState = () => {
    form.reset();
    setUploadedPhotos([]);
    setShowOtherFinding(false);
    setShowOtherComponent(false);
  };

  const createDiagnosisMutation = useMutation({
    mutationFn: async (data: DiagnosisFormData) => {
      const findingsMap = new Map(diagnosticFindings.map(f => [f.id, f]));
      const componentsMap = new Map(damagedComponentTypes.map(c => [c.id, c]));
      const timesMap = new Map(estimatedRepairTimes.map(t => [t.id, t]));

      const selectedFindingNames = data.selectedFindingIds
        .map(id => findingsMap.get(id)?.name)
        .filter(Boolean) as string[];
      
      let technicalDiagnosis = selectedFindingNames.join(", ");
      if (showOtherFinding && data.otherFindingDescription?.trim()) {
        technicalDiagnosis += technicalDiagnosis ? `, ${data.otherFindingDescription.trim()}` : data.otherFindingDescription.trim();
      }

      const selectedComponentNames = data.selectedComponentIds
        .map(id => componentsMap.get(id)?.name)
        .filter(Boolean) as string[];
      
      if (showOtherComponent && data.otherComponentDescription?.trim()) {
        selectedComponentNames.push(data.otherComponentDescription.trim());
      }

      const selectedTime = timesMap.get(data.estimatedRepairTimeId);
      const estimatedHours = selectedTime?.hoursMax ?? undefined;

      const payload = {
        technicalDiagnosis,
        damagedComponents: selectedComponentNames,
        estimatedRepairTime: estimatedHours,
        requiresExternalParts: data.requiresExternalParts,
        diagnosisNotes: data.diagnosisNotes,
        photos: uploadedPhotos,
        findingIds: data.selectedFindingIds,
        componentIds: data.selectedComponentIds,
        estimatedRepairTimeId: data.estimatedRepairTimeId,
      };
      
      return await apiRequest(
        "POST",
        `/api/repair-orders/${repairOrderId}/diagnostics`,
        payload
      );
    },
    onSuccess: () => {
      toast({
        title: "Diagnosi creata",
        description: "La diagnosi tecnica è stata registrata con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/repair-orders/${repairOrderId}`],
      });
      resetFormState();
      onOpenChange(false);
      onSuccess?.();
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
    createDiagnosisMutation.mutate(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  const handleExplicitCancel = () => {
    resetFormState();
    onOpenChange(false);
  };

  const toggleFinding = (findingId: string) => {
    const current = form.getValues("selectedFindingIds");
    const newValue = current.includes(findingId)
      ? current.filter(id => id !== findingId)
      : [...current, findingId];
    form.setValue("selectedFindingIds", newValue, { shouldValidate: true });
  };

  const toggleComponent = (componentId: string) => {
    const current = form.getValues("selectedComponentIds");
    const newValue = current.includes(componentId)
      ? current.filter(id => id !== componentId)
      : [...current, componentId];
    form.setValue("selectedComponentIds", newValue, { shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Diagnosi Tecnica
          </DialogTitle>
          <DialogDescription>
            Registra i risultati della diagnosi tecnica per questa lavorazione
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
                  render={() => (
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
                                  const isSelected = selectedFindingIds.includes(finding.id);
                                  const FindingIcon = getDiagnosticFindingIcon(finding.name);
                                  return (
                                    <div 
                                      key={finding.id} 
                                      className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${
                                        isSelected 
                                          ? 'border-primary bg-primary/10 ring-1 ring-primary' 
                                          : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                                      }`}
                                      onClick={() => toggleFinding(finding.id)}
                                    >
                                      <Checkbox
                                        id={`finding-${finding.id}`}
                                        checked={isSelected}
                                        onCheckedChange={() => toggleFinding(finding.id)}
                                        data-testid={`checkbox-finding-${finding.id}`}
                                        className="h-5 w-5"
                                      />
                                      <FindingIcon className={`h-6 w-6 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                      <label
                                        htmlFor={`finding-${finding.id}`}
                                        className={`text-sm cursor-pointer leading-tight ${isSelected ? 'font-medium' : ''}`}
                                      >
                                        {finding.name}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      {selectedFindingIds.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted rounded">
                          <strong>Selezionati ({selectedFindingIds.length}):</strong>{" "}
                          {selectedFindingIds.map(id => diagnosticFindings.find(f => f.id === id)?.name).filter(Boolean).join(", ")}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showOtherFinding && (
                  <FormField
                    control={form.control}
                    name="otherFindingDescription"
                    render={({ field }) => (
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
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="selectedComponentIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Componenti Danneggiati</FormLabel>
                      <FormDescription>
                        Seleziona i componenti che necessitano riparazione o sostituzione
                      </FormDescription>
                      <ScrollArea className="h-[220px] border rounded-md p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {damagedComponentTypes.map((component) => {
                            const isSelected = selectedComponentIds.includes(component.id);
                            const ComponentIcon = getDamagedComponentIcon(component.name);
                            return (
                              <div 
                                key={component.id} 
                                className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${
                                  isSelected 
                                    ? 'border-primary bg-primary/10 ring-1 ring-primary' 
                                    : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                                }`}
                                onClick={() => toggleComponent(component.id)}
                              >
                                <Checkbox
                                  id={`component-${component.id}`}
                                  checked={isSelected}
                                  onCheckedChange={() => toggleComponent(component.id)}
                                  data-testid={`checkbox-component-${component.id}`}
                                  className="h-5 w-5"
                                />
                                <ComponentIcon className={`h-6 w-6 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                <label
                                  htmlFor={`component-${component.id}`}
                                  className={`text-sm cursor-pointer leading-tight ${isSelected ? 'font-medium' : ''}`}
                                >
                                  {component.name}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                      {selectedComponentIds.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted rounded">
                          <strong>Selezionati ({selectedComponentIds.length}):</strong>{" "}
                          {selectedComponentIds.map(id => damagedComponentTypes.find(c => c.id === id)?.name).filter(Boolean).join(", ")}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showOtherComponent && (
                  <FormField
                    control={form.control}
                    name="otherComponentDescription"
                    render={({ field }) => (
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
                    )}
                  />
                )}
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
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-requires-parts"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Richiede Ricambi Esterni</FormLabel>
                        <FormDescription>
                          Spunta se è necessario ordinare ricambi esternamente
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="diagnosisNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note Aggiuntive</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Osservazioni o raccomandazioni aggiuntive..."
                          rows={3}
                          data-testid="input-diagnosis-notes"
                        />
                      </FormControl>
                      <FormMessage />
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
                disabled={createDiagnosisMutation.isPending}
                data-testid="button-submit-diagnosis"
              >
                {createDiagnosisMutation.isPending
                  ? "Creazione..."
                  : "Crea Diagnosi"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
