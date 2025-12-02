import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { PartsLoadDocument, Product, Supplier, RepairCenter } from "@shared/schema";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Package,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  AlertTriangle,
  Box,
  Link2,
  ClipboardList,
  Plus,
  Trash2,
  Play,
} from "lucide-react";

interface PartsLoadDocumentWithDetails extends PartsLoadDocument {
  supplierName?: string;
  repairCenterName?: string;
}

interface PartsLoadItemWithDetails {
  id: string;
  partsLoadDocumentId: string;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  productId?: string;
  matchedProductId?: string;
  product?: Product;
}

interface PartsLoadDocumentDetails extends PartsLoadDocument {
  items: PartsLoadItemWithDetails[];
  supplier?: { id: string; name: string; code: string } | null;
  repairCenter?: { id: string; name: string; city: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: "Bozza", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: FileText },
  processing: { label: "In Elaborazione", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", icon: Clock },
  completed: { label: "Completato", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", icon: CheckCircle },
  partial: { label: "Parziale", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300", icon: AlertTriangle },
  cancelled: { label: "Annullato", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", icon: XCircle },
};

const ITEM_STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "In Attesa", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: Clock },
  matched: { label: "Abbinato", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", icon: Link2 },
  stock: { label: "A Magazzino", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", icon: Box },
  error: { label: "Errore", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", icon: AlertTriangle },
};

const DOC_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  ddt: { label: "DDT", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  fattura: { label: "Fattura", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300" },
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return format(new Date(date), "dd/MM/yyyy", { locale: it });
}

export default function ResellerPartsLoadPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [centerFilter, setCenterFilter] = useState<string>("all");
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  
  const [newDoc, setNewDoc] = useState({
    documentType: "ddt",
    documentNumber: "",
    documentDate: "",
    supplierId: "",
    repairCenterId: "",
    notes: "",
  });
  
  const [newItem, setNewItem] = useState({
    sku: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
  });

  const { data: documents = [], isLoading } = useQuery<PartsLoadDocumentWithDetails[]>({
    queryKey: ["/api/reseller/parts-load"],
  });

  const { data: docDetails, isLoading: isLoadingDetails } = useQuery<PartsLoadDocumentDetails>({
    queryKey: ["/api/reseller/parts-load", selectedDoc],
    enabled: !!selectedDoc,
  });

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/reseller/suppliers"],
  });

  const createDocMutation = useMutation({
    mutationFn: async (data: typeof newDoc) => {
      return await apiRequest("POST", "/api/reseller/parts-load", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/parts-load"] });
      setShowCreateDialog(false);
      setNewDoc({
        documentType: "ddt",
        documentNumber: "",
        documentDate: "",
        supplierId: "",
        repairCenterId: "",
        notes: "",
      });
      toast({ title: "Documento creato", description: "Il documento di carico è stato creato con successo." });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: { docId: string; item: typeof newItem }) => {
      return await apiRequest("POST", `/api/reseller/parts-load/${data.docId}/items`, {
        ...data.item,
        totalPrice: data.item.quantity * data.item.unitPrice,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/parts-load", selectedDoc] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/parts-load"] });
      setShowAddItemDialog(false);
      setNewItem({ sku: "", description: "", quantity: 1, unitPrice: 0 });
      toast({ title: "Riga aggiunta", description: "La riga è stata aggiunta al documento." });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiRequest("DELETE", `/api/reseller/parts-load-items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/parts-load", selectedDoc] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/parts-load"] });
      toast({ title: "Riga eliminata", description: "La riga è stata eliminata." });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const processDocMutation = useMutation({
    mutationFn: async (docId: string) => {
      const res = await apiRequest("POST", `/api/reseller/parts-load/${docId}/process`);
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/parts-load", selectedDoc] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/parts-load"] });
      toast({ 
        title: "Elaborazione completata", 
        description: `Abbinati: ${data.matched}, A magazzino: ${data.stock}, Errori: ${data.errors}` 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.loadNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.supplierName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    const matchesCenter = centerFilter === "all" || doc.repairCenterId === centerFilter;
    
    return matchesSearch && matchesStatus && matchesCenter;
  });

  const stats = {
    total: documents.length,
    draft: documents.filter(d => d.status === "draft").length,
    processing: documents.filter(d => d.status === "processing").length,
    completed: documents.filter(d => d.status === "completed").length,
    partial: documents.filter(d => d.status === "partial").length,
  };

  const handleCreateDoc = () => {
    if (!newDoc.supplierId || !newDoc.repairCenterId) {
      toast({ title: "Errore", description: "Seleziona fornitore e centro di riparazione", variant: "destructive" });
      return;
    }
    createDocMutation.mutate(newDoc);
  };

  const handleAddItem = () => {
    if (!selectedDoc || !newItem.sku || !newItem.description) {
      toast({ title: "Errore", description: "Compila tutti i campi obbligatori", variant: "destructive" });
      return;
    }
    addItemMutation.mutate({ docId: selectedDoc, item: newItem });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Carico Ricambi</h1>
          <p className="text-muted-foreground">
            Gestisci i documenti di carico ricambi dei tuoi centri di riparazione
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-doc">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Documento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card data-testid="card-stat-total">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-draft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bozze</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-processing">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Elaborazione</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-completed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-partial">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Parziali</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.partial}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Documenti di Carico
          </CardTitle>
          <CardDescription>
            Elenco dei documenti di carico ricambi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per numero, documento, fornitore..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={centerFilter} onValueChange={setCenterFilter}>
              <SelectTrigger className="w-full md:w-[200px]" data-testid="select-center">
                <SelectValue placeholder="Centro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i Centri</SelectItem>
                {repairCenters.map(center => (
                  <SelectItem key={center.id} value={center.id}>
                    {center.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]" data-testid="select-status">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli Stati</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nessun documento trovato</h3>
              <p className="text-muted-foreground mb-4">
                {documents.length === 0
                  ? "Non ci sono documenti di carico. Crea il primo!"
                  : "Prova a modificare i filtri di ricerca."}
              </p>
              {documents.length === 0 && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crea Documento
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero Carico</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Fornitore</TableHead>
                    <TableHead>Centro</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Righe</TableHead>
                    <TableHead className="text-right">Totale</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocs.map(doc => {
                    const statusConfig = STATUS_CONFIG[doc.status] || STATUS_CONFIG.draft;
                    const typeConfig = DOC_TYPE_CONFIG[doc.documentType] || DOC_TYPE_CONFIG.ddt;
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <TableRow key={doc.id} data-testid={`row-doc-${doc.id}`}>
                        <TableCell className="font-medium">{doc.loadNumber}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={typeConfig.color}>
                            {typeConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{doc.documentNumber || "-"}</TableCell>
                        <TableCell>{doc.supplierName || "-"}</TableCell>
                        <TableCell>{doc.repairCenterName || "-"}</TableCell>
                        <TableCell>{formatDate(doc.documentDate)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${statusConfig.color} flex items-center gap-1 w-fit`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {(doc.matchedItems || 0) + (doc.stockItems || 0)}/{doc.totalItems || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(doc.totalAmount || 0)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setSelectedDoc(doc.id)}
                            data-testid={`button-view-${doc.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuovo Documento di Carico</DialogTitle>
            <DialogDescription>
              Crea un nuovo documento di carico ricambi
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo Documento</Label>
                <Select value={newDoc.documentType} onValueChange={(v) => setNewDoc({ ...newDoc, documentType: v })}>
                  <SelectTrigger data-testid="select-doc-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ddt">DDT</SelectItem>
                    <SelectItem value="fattura">Fattura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Numero Documento</Label>
                <Input
                  value={newDoc.documentNumber}
                  onChange={(e) => setNewDoc({ ...newDoc, documentNumber: e.target.value })}
                  placeholder="Es: DDT-2024-001"
                  data-testid="input-doc-number"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data Documento</Label>
              <Input
                type="date"
                value={newDoc.documentDate}
                onChange={(e) => setNewDoc({ ...newDoc, documentDate: e.target.value })}
                data-testid="input-doc-date"
              />
            </div>
            <div className="space-y-2">
              <Label>Fornitore *</Label>
              <Select value={newDoc.supplierId} onValueChange={(v) => setNewDoc({ ...newDoc, supplierId: v })}>
                <SelectTrigger data-testid="select-supplier">
                  <SelectValue placeholder="Seleziona fornitore" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Centro di Riparazione *</Label>
              <Select value={newDoc.repairCenterId} onValueChange={(v) => setNewDoc({ ...newDoc, repairCenterId: v })}>
                <SelectTrigger data-testid="select-repair-center">
                  <SelectValue placeholder="Seleziona centro" />
                </SelectTrigger>
                <SelectContent>
                  {repairCenters.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={newDoc.notes}
                onChange={(e) => setNewDoc({ ...newDoc, notes: e.target.value })}
                placeholder="Note aggiuntive..."
                data-testid="input-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Annulla</Button>
            <Button onClick={handleCreateDoc} disabled={createDocMutation.isPending} data-testid="button-confirm-create">
              {createDocMutation.isPending ? "Creazione..." : "Crea Documento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dettaglio Documento {docDetails?.loadNumber}
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : docDetails ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo Documento</p>
                  <Badge variant="secondary" className={DOC_TYPE_CONFIG[docDetails.documentType]?.color}>
                    {DOC_TYPE_CONFIG[docDetails.documentType]?.label || docDetails.documentType}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Numero Documento</p>
                  <p className="font-medium">{docDetails.documentNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Documento</p>
                  <p className="font-medium">{formatDate(docDetails.documentDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stato</p>
                  <Badge variant="secondary" className={STATUS_CONFIG[docDetails.status]?.color}>
                    {STATUS_CONFIG[docDetails.status]?.label || docDetails.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fornitore</p>
                  <p className="font-medium">{docDetails.supplier?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Centro di Riparazione</p>
                  <p className="font-medium">{docDetails.repairCenter?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Righe Elaborate</p>
                  <p className="font-medium">{(docDetails.matchedItems || 0) + (docDetails.stockItems || 0)} / {docDetails.totalItems || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Totale</p>
                  <p className="font-medium">{formatCurrency(docDetails.totalAmount || 0)}</p>
                </div>
              </div>

              {docDetails.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Note</p>
                  <p className="text-sm">{docDetails.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h3 className="font-medium">Righe Documento</h3>
                {docDetails.status === 'draft' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowAddItemDialog(true)} data-testid="button-add-item">
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi Riga
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => processDocMutation.mutate(docDetails.id)}
                      disabled={processDocMutation.isPending || docDetails.items.length === 0}
                      data-testid="button-process"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {processDocMutation.isPending ? "Elaborazione..." : "Elabora"}
                    </Button>
                  </div>
                )}
              </div>

              {docDetails.items.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">
                  Nessuna riga presente. {docDetails.status === 'draft' && "Aggiungi la prima riga!"}
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Descrizione</TableHead>
                        <TableHead className="text-center">Qtà</TableHead>
                        <TableHead className="text-right">Prezzo Unit.</TableHead>
                        <TableHead className="text-right">Totale</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Prodotto</TableHead>
                        {docDetails.status === 'draft' && <TableHead className="w-[60px]"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {docDetails.items.map(item => {
                        const itemStatus = ITEM_STATUS_CONFIG[item.status] || ITEM_STATUS_CONFIG.pending;
                        const ItemIcon = itemStatus.icon;
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`${itemStatus.color} flex items-center gap-1 w-fit`}>
                                <ItemIcon className="h-3 w-3" />
                                {itemStatus.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.product ? (
                                <span className="text-sm">{item.product.name}</span>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            {docDetails.status === 'draft' && (
                              <TableCell>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => deleteItemMutation.mutate(item.id)}
                                  disabled={deleteItemMutation.isPending}
                                  data-testid={`button-delete-item-${item.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Riga</DialogTitle>
            <DialogDescription>
              Aggiungi una nuova riga al documento di carico
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>SKU *</Label>
              <Input
                value={newItem.sku}
                onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                placeholder="Codice articolo"
                data-testid="input-item-sku"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrizione *</Label>
              <Input
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Descrizione articolo"
                data-testid="input-item-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantità</Label>
                <Input
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                  data-testid="input-item-quantity"
                />
              </div>
              <div className="space-y-2">
                <Label>Prezzo Unitario (centesimi)</Label>
                <Input
                  type="number"
                  min="0"
                  value={newItem.unitPrice}
                  onChange={(e) => setNewItem({ ...newItem, unitPrice: parseInt(e.target.value) || 0 })}
                  data-testid="input-item-price"
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Totale: {formatCurrency(newItem.quantity * newItem.unitPrice)}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>Annulla</Button>
            <Button onClick={handleAddItem} disabled={addItemMutation.isPending} data-testid="button-confirm-add-item">
              {addItemMutation.isPending ? "Aggiunta..." : "Aggiungi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
