import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { B2bReturn, B2bReturnItem, Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, RotateCcw, Clock, CheckCircle, XCircle, Truck, PackageCheck, Eye, Send, Download, FileText, Tag } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface B2BReturnWithItems extends B2bReturn {
  items: (B2bReturnItem & { product?: Product })[];
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  requested: { label: "In Attesa", variant: "secondary", icon: Clock },
  approved: { label: "Approvato", variant: "default", icon: CheckCircle },
  awaiting_shipment: { label: "Da Spedire", variant: "outline", icon: Send },
  rejected: { label: "Rifiutato", variant: "destructive", icon: XCircle },
  shipped: { label: "Spedito", variant: "default", icon: Truck },
  received: { label: "Ricevuto", variant: "default", icon: PackageCheck },
  inspecting: { label: "In Ispezione", variant: "secondary", icon: Eye },
  completed: { label: "Completato", variant: "default", icon: CheckCircle },
  cancelled: { label: "Annullato", variant: "destructive", icon: XCircle },
};

const reasonLabels: Record<string, string> = {
  defective: "Difettoso",
  wrong_item: "Articolo errato",
  not_as_described: "Non conforme",
  damaged_in_transit: "Danneggiato",
  excess_stock: "Eccesso stock",
  quality_issue: "Qualità",
  other: "Altro",
};

export default function ResellerB2BReturns() {
  const [selectedReturn, setSelectedReturn] = useState<B2BReturnWithItems | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const { toast } = useToast();

  const { data: returns, isLoading } = useQuery<B2BReturnWithItems[]>({
    queryKey: ['/api/reseller/b2b-returns'],
  });

  const shipReturnMutation = useMutation({
    mutationFn: async ({ id, trackingNumber, carrier }: { id: string; trackingNumber: string; carrier: string }) => {
      const res = await apiRequest('POST', `/api/reseller/b2b-returns/${id}/ship`, { trackingNumber, carrier });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Spedizione registrata", description: "Il reso è stato marcato come spedito" });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/b2b-returns'] });
      setShipDialogOpen(false);
      setDetailOpen(false);
      setTrackingNumber("");
      setCarrier("");
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const openDetail = async (ret: B2BReturnWithItems) => {
    try {
      const res = await fetch(`/api/reseller/b2b-returns/${ret.id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSelectedReturn(data);
        setDetailOpen(true);
      }
    } catch (error) {
      setSelectedReturn(ret);
      setDetailOpen(true);
    }
  };

  const pendingReturns = returns?.filter(r => r.status === 'requested') || [];
  const activeReturns = returns?.filter(r => ['approved', 'awaiting_shipment', 'shipped', 'inspecting'].includes(r.status)) || [];
  const completedReturns = returns?.filter(r => ['received', 'completed', 'cancelled', 'rejected'].includes(r.status)) || [];

  const ReturnCard = ({ ret }: { ret: B2BReturnWithItems }) => {
    const status = statusConfig[ret.status] || statusConfig.requested;
    const StatusIcon = status.icon;
    
    return (
      <Card className="hover-elevate cursor-pointer" onClick={() => openDetail(ret)} data-testid={`card-return-${ret.id}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">{ret.returnNumber}</CardTitle>
              <CardDescription>
                {ret.requestedAt && format(new Date(ret.requestedAt), "d MMMM yyyy", { locale: it })}
              </CardDescription>
            </div>
            <Badge variant={status.variant} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Motivo:</span>
            <span>{reasonLabels[ret.reason] || ret.reason}</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <span className="font-semibold text-primary">{formatPrice(ret.totalAmount || 0)}</span>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            Dettagli
          </Button>
        </CardFooter>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <RotateCcw className="h-6 w-6" />
          I Miei Resi B2B
        </h1>
        <p className="text-muted-foreground">Gestisci le tue richieste di reso per ordini B2B</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            In Attesa ({pendingReturns.length})
          </TabsTrigger>
          <TabsTrigger value="active" data-testid="tab-active">
            In Corso ({activeReturns.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completati ({completedReturns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingReturns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nessun reso in attesa di approvazione</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingReturns.map(ret => <ReturnCard key={ret.id} ret={ret} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          {activeReturns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nessun reso in corso</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeReturns.map(ret => <ReturnCard key={ret.id} ret={ret} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {completedReturns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nessun reso completato</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedReturns.map(ret => <ReturnCard key={ret.id} ret={ret} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          {selectedReturn && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>Reso {selectedReturn.returnNumber}</DialogTitle>
                    <DialogDescription>
                      Richiesto il {selectedReturn.requestedAt && format(new Date(selectedReturn.requestedAt), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                    </DialogDescription>
                  </div>
                  <Badge variant={statusConfig[selectedReturn.status]?.variant || "secondary"}>
                    {statusConfig[selectedReturn.status]?.label || selectedReturn.status}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium">Motivo: {reasonLabels[selectedReturn.reason] || selectedReturn.reason}</p>
                  {selectedReturn.reasonDetails && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedReturn.reasonDetails}</p>
                  )}
                </div>

                <ScrollArea className="max-h-48">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prodotto</TableHead>
                        <TableHead className="text-right">Qtà</TableHead>
                        <TableHead className="text-right">Totale</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReturn.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="w-8 h-8 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{item.productName}</div>
                                {item.productSku && <div className="text-sm text-muted-foreground">{item.productSku}</div>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right font-medium">{formatPrice(item.totalPrice || 0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Totale Reso:</span>
                  <span className="text-primary">{formatPrice(selectedReturn.totalAmount || 0)}</span>
                </div>

                {selectedReturn.resellerNotes && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium">Le tue note:</p>
                    <p className="text-sm text-muted-foreground">{selectedReturn.resellerNotes}</p>
                  </div>
                )}

                {selectedReturn.adminNotes && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                    <p className="text-sm font-medium">Note amministratore:</p>
                    <p className="text-sm text-muted-foreground">{selectedReturn.adminNotes}</p>
                  </div>
                )}

                {selectedReturn.rejectionReason && (
                  <div className="bg-destructive/10 p-3 rounded-lg">
                    <p className="text-sm font-medium text-destructive">Motivo rifiuto:</p>
                    <p className="text-sm">{selectedReturn.rejectionReason}</p>
                  </div>
                )}

                {selectedReturn.trackingNumber && (
                  <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                    <p className="text-sm font-medium">Tracking spedizione:</p>
                    <p className="text-sm">
                      {selectedReturn.carrier && <span className="text-muted-foreground">{selectedReturn.carrier}: </span>}
                      {selectedReturn.trackingNumber}
                    </p>
                  </div>
                )}

                {selectedReturn.creditAmount && selectedReturn.status === 'completed' && (
                  <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                    <p className="text-sm font-medium">Importo accreditato:</p>
                    <p className="text-lg font-semibold text-green-600">{formatPrice(selectedReturn.creditAmount)}</p>
                  </div>
                )}

                {/* Document Downloads - Available after approval */}
                {(selectedReturn.shippingLabelPath || selectedReturn.ddtPath) && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documenti per la spedizione
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedReturn.shippingLabelPath && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const res = await fetch(`/api/reseller/b2b-returns/${selectedReturn.id}/label`, { credentials: 'include' });
                              if (res.ok) {
                                const data = await res.json();
                                window.open(data.url, '_blank');
                              } else {
                                toast({ title: "Errore", description: "Impossibile scaricare l'etichetta", variant: "destructive" });
                              }
                            } catch (error) {
                              toast({ title: "Errore", description: "Errore di connessione", variant: "destructive" });
                            }
                          }}
                          data-testid="button-download-label"
                        >
                          <Tag className="h-4 w-4 mr-2" />
                          Scarica Etichetta
                        </Button>
                      )}
                      {selectedReturn.ddtPath && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const res = await fetch(`/api/reseller/b2b-returns/${selectedReturn.id}/ddt`, { credentials: 'include' });
                              if (res.ok) {
                                const data = await res.json();
                                window.open(data.url, '_blank');
                              } else {
                                toast({ title: "Errore", description: "Impossibile scaricare il DDT", variant: "destructive" });
                              }
                            } catch (error) {
                              toast({ title: "Errore", description: "Errore di connessione", variant: "destructive" });
                            }
                          }}
                          data-testid="button-download-ddt"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Scarica DDT
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Stampa questi documenti e allegali al pacco per la spedizione del reso.
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Chiudi
                </Button>
                {(selectedReturn.status === 'approved' || selectedReturn.status === 'awaiting_shipment') && (
                  <Button onClick={() => setShipDialogOpen(true)} data-testid="button-ship-return">
                    <Truck className="h-4 w-4 mr-2" />
                    Registra Spedizione
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Ship Dialog */}
      <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registra Spedizione Reso</DialogTitle>
            <DialogDescription>
              Inserisci i dati di tracking per la spedizione del reso
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Corriere</Label>
              <Input
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="es. GLS, BRT, DHL..."
                data-testid="input-carrier"
              />
            </div>
            <div className="space-y-2">
              <Label>Numero Tracking *</Label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Inserisci il numero di tracking"
                data-testid="input-tracking"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShipDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => selectedReturn && shipReturnMutation.mutate({ id: selectedReturn.id, trackingNumber, carrier })}
              disabled={!trackingNumber || shipReturnMutation.isPending}
              data-testid="button-confirm-ship"
            >
              {shipReturnMutation.isPending ? "Invio..." : "Conferma Spedizione"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
