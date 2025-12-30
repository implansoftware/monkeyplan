import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Send, Package, Plus, Search, Clock, CheckCircle, XCircle, 
  Truck, Ban, Eye, Trash2, PackageCheck
} from "lucide-react";
import type { Product } from "@shared/schema";

type TransferRequestItem = {
  id: string;
  productId: string;
  requestedQuantity: number;
  approvedQuantity: number | null;
  shippedQuantity: number | null;
  receivedQuantity: number | null;
  product: Product | null;
};

type TransferRequest = {
  id: string;
  requestNumber: string;
  requesterType: string;
  requesterId: string;
  requesterWarehouseId: string;
  sourceWarehouseId: string;
  targetResellerId: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'shipped' | 'received' | 'cancelled';
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  shippedAt: string | null;
  shippedBy: string | null;
  receivedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: TransferRequestItem[];
  sourceWarehouse?: { id: string; name: string } | null;
  requesterWarehouse?: { id: string; name: string } | null;
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "In Attesa", color: "bg-yellow-500/20 text-yellow-700", icon: Clock },
  approved: { label: "Approvata", color: "bg-blue-500/20 text-blue-700", icon: CheckCircle },
  rejected: { label: "Rifiutata", color: "bg-red-500/20 text-red-700", icon: XCircle },
  shipped: { label: "Spedita", color: "bg-purple-500/20 text-purple-700", icon: Truck },
  received: { label: "Ricevuta", color: "bg-green-500/20 text-green-700", icon: PackageCheck },
  cancelled: { label: "Annullata", color: "bg-gray-500/20 text-gray-700", icon: Ban },
};

export default function SubResellerTransferRequestsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TransferRequest | null>(null);
  const [requestNotes, setRequestNotes] = useState("");
  const [requestItems, setRequestItems] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [receiveItems, setReceiveItems] = useState<Array<{ id: string; receivedQuantity: number }>>([]);

  const { data: requests = [], isLoading } = useQuery<TransferRequest[]>({
    queryKey: ["/api/reseller/sub-reseller/transfer-requests"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: { notes: string; items: Array<{ productId: string; quantity: number }> }) => {
      return apiRequest("POST", "/api/reseller/sub-reseller/transfer-requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/sub-reseller/transfer-requests"] });
      toast({ title: "Richiesta Inviata", description: "La richiesta di trasferimento è stata inviata al reseller padre" });
      setShowNewRequestDialog(false);
      setRequestNotes("");
      setRequestItems([]);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest("PATCH", `/api/reseller/sub-reseller/transfer-requests/${requestId}/cancel`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/sub-reseller/transfer-requests"] });
      toast({ title: "Richiesta Annullata", description: "La richiesta è stata annullata" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const receiveRequestMutation = useMutation({
    mutationFn: async (data: { requestId: string; items: Array<{ id: string; receivedQuantity: number }> }) => {
      return apiRequest("PATCH", `/api/reseller/sub-reseller/transfer-requests/${data.requestId}/receive`, { items: data.items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/sub-reseller/transfer-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      toast({ title: "Ricezione Confermata", description: "Gli articoli sono stati aggiunti al tuo magazzino" });
      setShowReceiveDialog(false);
      setSelectedRequest(null);
      setReceiveItems([]);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleAddItem = () => {
    setRequestItems([...requestItems, { productId: "", quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setRequestItems(requestItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    const updated = [...requestItems];
    updated[index] = { ...updated[index], [field]: value };
    setRequestItems(updated);
  };

  const handleViewDetails = (request: TransferRequest) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };

  const handleOpenReceive = (request: TransferRequest) => {
    setSelectedRequest(request);
    setReceiveItems(request.items.map(item => ({
      id: item.id,
      receivedQuantity: item.shippedQuantity || 0
    })));
    setShowReceiveDialog(true);
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.items.some(item => item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const canSubmit = requestItems.length > 0 && requestItems.every(item => item.productId && item.quantity > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Send className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-title">
              Richieste Trasferimento
            </h1>
            <p className="text-sm text-muted-foreground">
              Richiedi prodotti dal magazzino del reseller padre
            </p>
          </div>
        </div>

        <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-request">
              <Plus className="h-4 w-4 mr-2" />
              Nuova Richiesta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nuova Richiesta Trasferimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Note</Label>
                <Textarea
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="Note aggiuntive per la richiesta..."
                  data-testid="input-notes"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Prodotti Richiesti</Label>
                  <Button variant="outline" size="sm" onClick={handleAddItem} data-testid="button-add-item">
                    <Plus className="h-4 w-4 mr-1" />
                    Aggiungi
                  </Button>
                </div>

                {requestItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nessun prodotto aggiunto. Clicca "Aggiungi" per iniziare.
                  </p>
                )}

                {requestItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-md">
                    <div className="flex-1">
                      <Select
                        value={item.productId}
                        onValueChange={(v) => handleItemChange(index, 'productId', v)}
                      >
                        <SelectTrigger data-testid={`select-product-${index}`}>
                          <SelectValue placeholder="Seleziona prodotto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        placeholder="Qtà"
                        data-testid={`input-quantity-${index}`}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      data-testid={`button-remove-item-${index}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewRequestDialog(false)}>
                Annulla
              </Button>
              <Button
                onClick={() => createRequestMutation.mutate({ notes: requestNotes, items: requestItems })}
                disabled={!canSubmit || createRequestMutation.isPending}
                data-testid="button-submit-request"
              >
                {createRequestMutation.isPending ? "Invio..." : "Invia Richiesta"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per numero richiesta o prodotto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="Filtra per stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nessuna richiesta trovata</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => {
            const StatusIcon = statusConfig[request.status]?.icon || Clock;
            return (
              <Card key={request.id} data-testid={`card-request-${request.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{request.requestNumber}</CardTitle>
                      <Badge className={statusConfig[request.status]?.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[request.status]?.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {request.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelRequestMutation.mutate(request.id)}
                          disabled={cancelRequestMutation.isPending}
                          data-testid={`button-cancel-${request.id}`}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Annulla
                        </Button>
                      )}
                      {request.status === 'shipped' && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenReceive(request)}
                          data-testid={`button-receive-${request.id}`}
                        >
                          <PackageCheck className="h-4 w-4 mr-1" />
                          Conferma Ricezione
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(request)}
                        data-testid={`button-details-${request.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Data:</span>{" "}
                      {new Date(request.createdAt).toLocaleDateString('it-IT')}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Articoli:</span>{" "}
                      {request.items.length} prodotti
                    </div>
                    <div>
                      <span className="text-muted-foreground">Da:</span>{" "}
                      {request.sourceWarehouse?.name || "Magazzino Padre"}
                    </div>
                  </div>
                  {request.rejectionReason && (
                    <div className="mt-2 p-2 bg-destructive/10 rounded text-sm text-destructive">
                      Motivo rifiuto: {request.rejectionReason}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dettagli Richiesta {selectedRequest?.requestNumber}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Stato:</span>{" "}
                  <Badge className={statusConfig[selectedRequest.status]?.color}>
                    {statusConfig[selectedRequest.status]?.label}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Data Creazione:</span>{" "}
                  {new Date(selectedRequest.createdAt).toLocaleString('it-IT')}
                </div>
                {selectedRequest.approvedAt && (
                  <div>
                    <span className="text-muted-foreground">Data Approvazione:</span>{" "}
                    {new Date(selectedRequest.approvedAt).toLocaleString('it-IT')}
                  </div>
                )}
                {selectedRequest.shippedAt && (
                  <div>
                    <span className="text-muted-foreground">Data Spedizione:</span>{" "}
                    {new Date(selectedRequest.shippedAt).toLocaleString('it-IT')}
                  </div>
                )}
                {selectedRequest.receivedAt && (
                  <div>
                    <span className="text-muted-foreground">Data Ricezione:</span>{" "}
                    {new Date(selectedRequest.receivedAt).toLocaleString('it-IT')}
                  </div>
                )}
              </div>
              
              {selectedRequest.notes && (
                <div>
                  <Label>Note:</Label>
                  <p className="text-sm mt-1">{selectedRequest.notes}</p>
                </div>
              )}

              <div>
                <Label>Articoli:</Label>
                <div className="mt-2 border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2">Prodotto</th>
                        <th className="text-center p-2">Richiesto</th>
                        <th className="text-center p-2">Approvato</th>
                        <th className="text-center p-2">Spedito</th>
                        <th className="text-center p-2">Ricevuto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.product?.name || "Prodotto"}</td>
                          <td className="text-center p-2">{item.requestedQuantity}</td>
                          <td className="text-center p-2">{item.approvedQuantity ?? "-"}</td>
                          <td className="text-center p-2">{item.shippedQuantity ?? "-"}</td>
                          <td className="text-center p-2">{item.receivedQuantity ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Ricezione - {selectedRequest?.requestNumber}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Inserisci le quantità effettivamente ricevute per ogni prodotto:
              </p>
              <div className="space-y-2">
                {selectedRequest.items.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">{item.product?.name || "Prodotto"}</p>
                      <p className="text-sm text-muted-foreground">
                        Spedito: {item.shippedQuantity || 0}
                      </p>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={item.shippedQuantity || 0}
                      value={receiveItems[index]?.receivedQuantity || 0}
                      onChange={(e) => {
                        const updated = [...receiveItems];
                        updated[index] = { 
                          ...updated[index], 
                          receivedQuantity: parseInt(e.target.value) || 0 
                        };
                        setReceiveItems(updated);
                      }}
                      className="w-24"
                      data-testid={`input-receive-${item.id}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiveDialog(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => {
                if (selectedRequest) {
                  receiveRequestMutation.mutate({
                    requestId: selectedRequest.id,
                    items: receiveItems
                  });
                }
              }}
              disabled={receiveRequestMutation.isPending}
              data-testid="button-confirm-receive"
            >
              {receiveRequestMutation.isPending ? "Conferma..." : "Conferma Ricezione"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
