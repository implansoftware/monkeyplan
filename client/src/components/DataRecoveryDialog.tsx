import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  HardDrive, 
  User, 
  Loader2,
} from "lucide-react";

interface StaffUser {
  id: string;
  username: string;
  role: string;
}

interface DataRecoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repairOrderId: string;
  deviceDescription?: string;
  onSuccess?: () => void;
}

export function DataRecoveryDialog({ 
  open, 
  onOpenChange, 
  repairOrderId,
  deviceDescription,
  onSuccess 
}: DataRecoveryDialogProps) {
  const { toast } = useToast();
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>("");
  const [notes, setNotes] = useState("");

  const { data: staffUsers = [], isLoading: staffLoading } = useQuery<StaffUser[]>({
    queryKey: ["/api/users/staff"],
    enabled: open,
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: {
      handlingType: "internal";
      assignedToUserId?: string | null;
      internalNotes?: string | null;
    }) => {
      return await apiRequest(
        "POST",
        `/api/repair-orders/${repairOrderId}/data-recovery`,
        {
          ...data,
          triggerType: "manual",
        }
      );
    },
    onSuccess: () => {
      toast({
        title: "Recupero dati avviato",
        description: "Il recupero dati è stato assegnato al tecnico",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "data-recovery"] });
      onOpenChange(false);
      onSuccess?.();
      resetDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile avviare il recupero dati",
        variant: "destructive",
      });
    },
  });

  const resetDialog = () => {
    setSelectedTechnicianId("");
    setNotes("");
  };

  const handleSubmitInternal = () => {
    if (!selectedTechnicianId) {
      toast({
        title: "Seleziona un tecnico",
        description: "Devi selezionare un tecnico per il recupero dati interno",
        variant: "destructive",
      });
      return;
    }
    createJobMutation.mutate({
      handlingType: "internal",
      assignedToUserId: selectedTechnicianId,
      internalNotes: notes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetDialog();
      onOpenChange(value);
    }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-blue-500" />
            Avvia Recupero Dati
          </DialogTitle>
          <DialogDescription>
            {deviceDescription || "Assegna il recupero dati a un tecnico del laboratorio"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <User className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold">Recupero Dati Interno</h3>
                <p className="text-sm text-muted-foreground">
                  Assegna il recupero dati a un tecnico del laboratorio
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="technician" className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Tecnico Assegnato *
                </Label>
                {staffLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Caricamento tecnici...
                  </div>
                ) : (
                  <Select value={selectedTechnicianId} onValueChange={setSelectedTechnicianId}>
                    <SelectTrigger id="technician" data-testid="select-technician">
                      <SelectValue placeholder="Seleziona un tecnico" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffUsers.filter(u => u.role === "repair_center" || u.role === "admin").map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.username} ({user.role === "admin" ? "Admin" : "Tecnico"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-1">
                  Note Interne (opzionale)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Aggiungi note per il tecnico..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[80px]"
                  data-testid="input-notes"
                />
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Annulla
              </Button>
              <Button
                onClick={handleSubmitInternal}
                disabled={!selectedTechnicianId || createJobMutation.isPending}
                data-testid="button-submit-internal"
              >
                {createJobMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creazione...
                  </>
                ) : (
                  <>
                    <HardDrive className="mr-2 h-4 w-4" />
                    Avvia Recupero Interno
                  </>
                )}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
