import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  User, Store, Shield, CheckCircle2, 
  ChevronRight, ChevronLeft, Loader2, Eye, FilePlus, Pencil, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RepairCenter {
  id: string;
  name: string;
}

interface StaffWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resellerId: string;
  resellerName?: string;
  repairCenters: RepairCenter[];
  onSuccess?: () => void;
}

const MODULES = [
  { id: "repairs", name: "Lavorazioni", description: "Gestione riparazioni e ordini" },
  { id: "customers", name: "Clienti", description: "Anagrafica clienti" },
  { id: "products", name: "Prodotti", description: "Catalogo prodotti e ricambi" },
  { id: "inventory", name: "Magazzino", description: "Gestione inventario" },
  { id: "repair_centers", name: "Centri Riparazione", description: "Gestione centri" },
  { id: "services", name: "Servizi", description: "Catalogo servizi" },
  { id: "suppliers", name: "Fornitori", description: "Gestione fornitori" },
  { id: "supplier_orders", name: "Ordini Fornitori", description: "Ordini ai fornitori" },
  { id: "appointments", name: "Appuntamenti", description: "Gestione appuntamenti" },
  { id: "invoices", name: "Fatture", description: "Fatturazione" },
  { id: "tickets", name: "Ticket Supporto", description: "Assistenza clienti" },
];

const PERMISSION_ACTIONS = [
  { id: "canRead", label: "Lettura", icon: Eye },
  { id: "canCreate", label: "Creazione", icon: FilePlus },
  { id: "canUpdate", label: "Modifica", icon: Pencil },
  { id: "canDelete", label: "Eliminazione", icon: Trash2 },
];

const staffFormSchema = z.object({
  username: z.string().min(3, "Username deve essere almeno 3 caratteri"),
  email: z.string().email("Email non valida"),
  fullName: z.string().min(2, "Nome completo richiesto"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password deve essere almeno 6 caratteri"),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

const STEPS = [
  { id: 1, name: "Dati Utente", icon: User },
  { id: 2, name: "Centri", icon: Store },
  { id: 3, name: "Permessi", icon: Shield },
  { id: 4, name: "Conferma", icon: CheckCircle2 },
];

export function StaffWizard({ 
  open, 
  onOpenChange, 
  resellerId,
  resellerName,
  repairCenters,
  onSuccess 
}: StaffWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCenters, setSelectedCenters] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const { toast } = useToast();

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      phone: "",
      password: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { user: StaffFormValues; permissions: any[]; repairCenterIds: string[] }) => {
      return apiRequest("POST", `/api/admin/resellers/${resellerId}/team`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers", resellerId, "team"] });
      toast({
        title: "Collaboratore creato",
        description: "Il nuovo membro del team è stato aggiunto con successo.",
      });
      handleClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare il collaboratore",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setCurrentStep(1);
    setSelectedCenters([]);
    setPermissions({});
    form.reset();
    onOpenChange(false);
  };

  const togglePermission = (module: string, action: string) => {
    setPermissions((prev) => {
      const modulePerms = prev[module] || {};
      return {
        ...prev,
        [module]: {
          ...modulePerms,
          [action]: !modulePerms[action],
        },
      };
    });
  };

  const toggleAllForModule = (module: string, checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        canRead: checked,
        canCreate: checked,
        canUpdate: checked,
        canDelete: checked,
      },
    }));
  };

  const isModuleFullyEnabled = (module: string) => {
    const p = permissions[module];
    return p?.canRead && p?.canCreate && p?.canUpdate && p?.canDelete;
  };

  const getPermissionCount = () => {
    let count = 0;
    Object.values(permissions).forEach((p) => {
      if (p.canRead) count++;
      if (p.canCreate) count++;
      if (p.canUpdate) count++;
      if (p.canDelete) count++;
    });
    return count;
  };

  const getActiveModulesCount = () => {
    return Object.entries(permissions).filter(([_, p]) => 
      p.canRead || p.canCreate || p.canUpdate || p.canDelete
    ).length;
  };

  const validateStep = async (step: number): Promise<boolean> => {
    if (step === 1) {
      const result = await form.trigger(["username", "email", "fullName", "password"]);
      return result;
    }
    return true;
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const values = form.getValues();
    const permissionsArray = Object.entries(permissions).map(([module, perms]) => ({
      module,
      canRead: perms.canRead || false,
      canCreate: perms.canCreate || false,
      canUpdate: perms.canUpdate || false,
      canDelete: perms.canDelete || false,
    }));

    createMutation.mutate({
      user: values,
      permissions: permissionsArray,
      repairCenterIds: selectedCenters,
    });
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((step, index) => {
        const StepIcon = step.icon;
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        
        return (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                isActive && "border-primary bg-primary text-primary-foreground",
                isCompleted && "border-primary bg-primary/20 text-primary",
                !isActive && !isCompleted && "border-muted-foreground/30 text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <StepIcon className="w-5 h-5" />
              )}
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "w-8 h-0.5 mx-1",
                  isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Dati Collaboratore</h3>
        <p className="text-sm text-muted-foreground">Inserisci le informazioni del nuovo membro del team</p>
      </div>

      <Form {...form}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Mario Rossi" data-testid="wizard-input-fullname" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="mario@esempio.it" data-testid="wizard-input-email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="mario.rossi" data-testid="wizard-input-username" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password *</FormLabel>
                <FormControl>
                  <Input {...field} type="password" placeholder="••••••" data-testid="wizard-input-password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Telefono (opzionale)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="+39 333 1234567" data-testid="wizard-input-phone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Centri di Riparazione</h3>
        <p className="text-sm text-muted-foreground">Seleziona i centri a cui il collaboratore avrà accesso</p>
      </div>

      {repairCenters.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nessun centro di riparazione disponibile</p>
            <p className="text-sm">Puoi procedere senza assegnare centri</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base">Centri Disponibili</Label>
            <Badge variant="secondary">
              {selectedCenters.length} selezionati
            </Badge>
          </div>
          <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
            {repairCenters.map((center) => (
              <div 
                key={center.id} 
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
                  selectedCenters.includes(center.id) 
                    ? "border-primary bg-primary/5" 
                    : "border-transparent hover:bg-muted/50"
                )}
                onClick={() => {
                  if (selectedCenters.includes(center.id)) {
                    setSelectedCenters(selectedCenters.filter(id => id !== center.id));
                  } else {
                    setSelectedCenters([...selectedCenters, center.id]);
                  }
                }}
              >
                <Checkbox
                  id={`wizard-center-${center.id}`}
                  checked={selectedCenters.includes(center.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedCenters([...selectedCenters, center.id]);
                    } else {
                      setSelectedCenters(selectedCenters.filter(id => id !== center.id));
                    }
                  }}
                  data-testid={`wizard-checkbox-center-${center.id}`}
                />
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <Store className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{center.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Permessi Moduli</h3>
        <p className="text-sm text-muted-foreground">Configura quali operazioni può eseguire il collaboratore</p>
      </div>

      <div className="flex items-center justify-between mb-2">
        <Label className="text-base">Moduli Sistema</Label>
        <Badge variant="secondary">
          {getActiveModulesCount()} moduli attivi
        </Badge>
      </div>

      <div className="border rounded-lg max-h-80 overflow-y-auto">
        {MODULES.map((module, index) => (
          <div 
            key={module.id} 
            className={cn(
              "p-4",
              index < MODULES.length - 1 && "border-b"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-medium">{module.name}</div>
                <div className="text-xs text-muted-foreground">{module.description}</div>
              </div>
              <Switch
                checked={isModuleFullyEnabled(module.id)}
                onCheckedChange={(checked) => toggleAllForModule(module.id, checked)}
                data-testid={`wizard-switch-module-${module.id}`}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {PERMISSION_ACTIONS.map((action) => {
                const ActionIcon = action.icon;
                const isEnabled = permissions[module.id]?.[action.id];
                return (
                  <Badge
                    key={action.id}
                    variant={isEnabled ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-colors",
                      isEnabled && "bg-primary"
                    )}
                    onClick={() => togglePermission(module.id, action.id)}
                    data-testid={`wizard-badge-${module.id}-${action.id}`}
                  >
                    <ActionIcon className="w-3 h-3 mr-1" />
                    {action.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => {
    const values = form.getValues();
    const selectedCenterNames = repairCenters
      .filter(rc => selectedCenters.includes(rc.id))
      .map(rc => rc.name);

    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold">Riepilogo</h3>
          <p className="text-sm text-muted-foreground">Verifica i dati prima di creare il collaboratore</p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <User className="w-4 h-4 text-primary" />
                <span className="font-medium">Dati Collaboratore</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Nome:</div>
                <div className="font-medium">{values.fullName}</div>
                <div className="text-muted-foreground">Email:</div>
                <div className="font-medium">{values.email}</div>
                <div className="text-muted-foreground">Username:</div>
                <div className="font-medium">{values.username}</div>
                {values.phone && (
                  <>
                    <div className="text-muted-foreground">Telefono:</div>
                    <div className="font-medium">{values.phone}</div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Store className="w-4 h-4 text-primary" />
                <span className="font-medium">Centri Assegnati</span>
                <Badge variant="secondary" className="ml-auto">
                  {selectedCenters.length}
                </Badge>
              </div>
              {selectedCenterNames.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedCenterNames.map((name) => (
                    <Badge key={name} variant="outline">{name}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nessun centro assegnato</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-primary" />
                <span className="font-medium">Permessi</span>
                <Badge variant="secondary" className="ml-auto">
                  {getPermissionCount()} permessi
                </Badge>
              </div>
              {getActiveModulesCount() > 0 ? (
                <div className="space-y-2">
                  {Object.entries(permissions)
                    .filter(([_, p]) => p.canRead || p.canCreate || p.canUpdate || p.canDelete)
                    .map(([moduleId, perms]) => {
                      const module = MODULES.find(m => m.id === moduleId);
                      const activePerms = [];
                      if (perms.canRead) activePerms.push("Lettura");
                      if (perms.canCreate) activePerms.push("Creazione");
                      if (perms.canUpdate) activePerms.push("Modifica");
                      if (perms.canDelete) activePerms.push("Eliminazione");
                      
                      return (
                        <div key={moduleId} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{module?.name}</span>
                          <span className="text-muted-foreground">{activePerms.join(", ")}</span>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nessun permesso configurato</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center">
            Nuovo Collaboratore {resellerName && `per ${resellerName}`}
          </DialogTitle>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="flex-1 overflow-y-auto px-1">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        <div className="flex justify-between pt-4 border-t mt-4">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? handleClose : prevStep}
            data-testid="wizard-button-back"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {currentStep === 1 ? "Annulla" : "Indietro"}
          </Button>

          {currentStep < 4 ? (
            <Button onClick={nextStep} data-testid="wizard-button-next">
              Avanti
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending}
              data-testid="wizard-button-create"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creazione...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Crea Collaboratore
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
