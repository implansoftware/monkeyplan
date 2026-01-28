import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { B2bReturn, B2bReturnItem, Product, User, ResellerPurchaseOrder } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, RotateCcw, Clock, CheckCircle, XCircle, Truck, PackageCheck, Eye, ThumbsUp, ThumbsDown, Download, FileText, Tag, RefreshCw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface B2BReturnWithDetails extends B2bReturn {
  items: (B2bReturnItem & { product?: Product })[];
  reseller?: User;
  order?: ResellerPurchaseOrder;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  requested: { label: "In Attesa", variant: "secondary", icon: Clock },
  approved: { label: "Approvato", variant: "default", icon: CheckCircle },
  awaiting_shipment: { label: "Da Spedire", variant: "outline", icon: Truck },
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

export default function AdminB2BReturns() {
  const [selectedReturn, setSelectedReturn] = useState<B2BReturnWithDetails | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [creditAmount, setCreditAmount] = useState<string>("");
  const { toast } = useToast();

  const { data: returns, isLoading } = useQuery<B2BReturnWithDetails[]>({
    queryKey: ['/api/admin/b2b-returns'],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes?: string }) => {
      const res = await apiRequest('POST', `/api/admin/b2b-returns/${id}/approve`, { adminNotes });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Reso approvato", description: "Il reseller può ora spedire il reso" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/b2b-returns'] });
      setDetailOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, rejectionReason, adminNotes }: { id: string; rejectionReason: string; adminNotes?: string }) => {
      const res = await apiRequest('POST', `/api/admin/b2b-returns/${id}/reject`, { rejectionReason, adminNotes });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Reso rifiutato", description: "La richiesta di reso è stata rifiutata" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/b2b-returns'] });
      setRejectDialogOpen(false);
      setDetailOpen(false);
      setRejectionReason("");
      setAdminNotes("");
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const receiveMutation = useMutation({
    mutationFn: async ({ id, inspectionNotes, creditAmount }: { id: string; inspectionNotes?: string; creditAmount?: number }) => {
      const res = await apiRequest('POST', `/api/admin/b2b-returns/${id}/receive`, { inspectionNotes, creditAmount });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Reso completato", description: "Lo stock è stato ripristinato nel magazzino" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/b2b-returns'] });
      setReceiveDialogOpen(false);
      setDetailOpen(false);
      setInspectionNotes("");
      setCreditAmount("");
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const openDetail = async (ret: B2BReturnWithDetails) => {
    try {
      const res = await fetch(`/api/admin/b2b-returns/${ret.id}`, { credentials: 'include' });
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

  const ReturnCard = ({ ret }: { ret: B2BReturnWithDetails }) => {
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
            <Badge variant={status.variant} className="flex flex-wrap items-center gap-1">
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
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gestione Resi B2B</h1>
              <p className="text-sm text-muted-foreground">Gestisci le richieste di reso dai reseller</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Da Approvare ({pendingReturns.length})
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
                <p className="text-muted-foreground">Nessun reso da approvare</p>
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
                {selectedReturn.reseller && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium">Reseller:</p>
                    <p className="text-sm">{selectedReturn.reseller.fullName || selectedReturn.reseller.username}</p>
                    <p className="text-xs text-muted-foreground">{selectedReturn.reseller.email}</p>
                  </div>
                )}

                {selectedReturn.order && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                    <p className="text-sm font-medium">Ordine Originale:</p>
                    <p className="text-sm">{selectedReturn.order.orderNumber}</p>
                  </div>
                )}

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
                            <div className="flex flex-wrap items-center gap-2">
                              {item.product?.imageUrl ? (
                                <img src={item.product.imageUrl} alt="" className="w-8 h-8 object-cover rounded" />
                              ) : (
                                <Package className="w-8 h-8 text-muted-foreground" />
                              )}
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
                    <p className="text-sm font-medium">Note reseller:</p>
                    <p className="text-sm text-muted-foreground">{selectedReturn.resellerNotes}</p>
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
                {(selectedReturn.shippingLabelPath || selectedReturn.ddtPath || ['approved', 'awaiting_shipment', 'shipped', 'received', 'inspecting', 'completed'].includes(selectedReturn.status)) && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documenti Spedizione
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedReturn.shippingLabelPath && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a 
                            href={`/api/admin/b2b-returns/${selectedReturn.id}/label`}
                            download={`etichetta_${selectedReturn.returnNumber}.pdf`}
                            onClick={(e) => e.stopPropagation()}
                            data-testid="button-admin-download-label"
                          >
                            <Tag className="h-4 w-4 mr-2" />
                            Etichetta
                          </a>
                        </Button>
                      )}
                      {selectedReturn.ddtPath && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a 
                            href={`/api/admin/b2b-returns/${selectedReturn.id}/ddt`}
                            download={`ddt_${selectedReturn.returnNumber}.pdf`}
                            onClick={(e) => e.stopPropagation()}
                            data-testid="button-admin-download-ddt"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            DDT
                          </a>
                        </Button>
                      )}
                      {['approved', 'awaiting_shipment', 'shipped', 'received', 'inspecting', 'completed'].includes(selectedReturn.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            fetch(`/api/admin/b2b-returns/${selectedReturn.id}/regenerate-documents`, { 
                              method: 'POST',
                              credentials: 'include' 
                            })
                              .then(res => {
                                if (res.ok) {
                                  toast({ title: "Documenti rigenerati", description: "I documenti sono stati rigenerati con successo" });
                                  queryClient.invalidateQueries({ queryKey: ['/api/admin/b2b-returns'] });
                                } else {
                                  throw new Error("Errore nella rigenerazione");
                                }
                              })
                              .catch(() => {
                                toast({ title: "Errore", description: "Impossibile rigenerare i documenti", variant: "destructive" });
                              });
                          }}
                          data-testid="button-regenerate-documents"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Rigenera
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 flex-wrap">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Chiudi
                </Button>
                {selectedReturn.status === 'requested' && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => setRejectDialogOpen(true)}
                      data-testid="button-reject-return"
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Rifiuta
                    </Button>
                    <Button
                      onClick={() => approveMutation.mutate({ id: selectedReturn.id })}
                      disabled={approveMutation.isPending}
                      data-testid="button-approve-return"
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      {approveMutation.isPending ? "Approvazione..." : "Approva"}
                    </Button>
                  </>
                )}
                {selectedReturn.status === 'shipped' && (
                  <Button onClick={() => { setCreditAmount(String(selectedReturn.totalAmount || 0)); setReceiveDialogOpen(true); }} data-testid="button-receive-return">
                    <PackageCheck className="h-4 w-4 mr-2" />
                    Conferma Ricezione
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rifiuta Reso</DialogTitle>
            <DialogDescription>
              Specifica il motivo del rifiuto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo del rifiuto *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Spiega perché il reso viene rifiutato..."
                data-testid="input-rejection-reason"
              />
            </div>
            <div className="space-y-2">
              <Label>Note interne</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Note interne (opzionale)..."
                data-testid="input-admin-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedReturn && rejectMutation.mutate({ id: selectedReturn.id, rejectionReason, adminNotes })}
              disabled={!rejectionReason || rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? "Rifiuto..." : "Conferma Rifiuto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Dialog */}
      <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Ricezione Reso</DialogTitle>
            <DialogDescription>
              Lo stock verrà automaticamente ripristinato nel magazzino
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Note ispezione</Label>
              <Textarea
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
                placeholder="Note sull'ispezione degli articoli..."
                data-testid="input-inspection-notes"
              />
            </div>
            <div className="space-y-2">
              <Label>Importo da accreditare (centesimi)</Label>
              <Input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="Lascia vuoto per accreditare l'intero importo"
                data-testid="input-credit-amount"
              />
              <p className="text-xs text-muted-foreground">
                Totale reso: {formatPrice(selectedReturn?.totalAmount || 0)}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => selectedReturn && receiveMutation.mutate({ 
                id: selectedReturn.id, 
                inspectionNotes, 
                creditAmount: creditAmount ? parseInt(creditAmount) : undefined 
              })}
              disabled={receiveMutation.isPending}
              data-testid="button-confirm-receive"
            >
              {receiveMutation.isPending ? "Completamento..." : "Completa Reso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
