import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { 
  Supplier, 
  Product, 
  RepairCenter,
  PartsLoadDocument,
  PartsLoadItem,
  PartsOrder,
  RepairOrder
} from "@shared/schema";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Package,
  Truck,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  Eye,
  Trash2,
  PackageCheck,
  Building2,
  AlertTriangle,
  Box,
  Link2,
  Wrench,
  Download,
  Play,
  ListChecks,
  ClipboardPaste,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface ParsedItem {
  partCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface PartsLoadDocumentWithDetails extends PartsLoadDocument {
  supplierName?: string;
  repairCenterName?: string;
}

interface PartsLoadItemWithDetails extends PartsLoadItem {
  product?: Product;
  repairOrder?: RepairOrder;
  partsOrder?: PartsOrder;
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

export default function PartsLoadPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSupplier, setFilterSupplier] = useState<string>("all");
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<PartsLoadDocumentWithDetails | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PartsLoadItemWithDetails | null>(null);
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [createProducts, setCreateProducts] = useState(true);
  
  const [newDocForm, setNewDocForm] = useState({
    documentType: "ddt",
    documentNumber: "",
    documentDate: format(new Date(), "yyyy-MM-dd"),
    supplierId: "",
    repairCenterId: "",
    notes: "",
  });
  
  const [newItemForm, setNewItemForm] = useState({
    partCode: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
  });
  
  const { data: documents = [], isLoading } = useQuery<PartsLoadDocumentWithDetails[]>({
    queryKey: ["/api/parts-load"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/repair-centers"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: waitingPartsOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/parts-orders/waiting"],
    enabled: matchDialogOpen,
  });

  const { data: docDetails } = useQuery<any>({
    queryKey: ["/api/parts-load", selectedDoc?.id],
    enabled: !!selectedDoc && detailsDialogOpen,
  });

  const createDocMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/parts-load", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts-load"] });
      setCreateDialogOpen(false);
      resetNewDocForm();
      toast({ title: "Documento creato", description: "Nuovo carico ricambi creato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateDocMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/parts-load/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts-load"] });
      toast({ title: "Documento aggiornato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const processDocMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/parts-load/${id}/process`, {});
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts-load"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parts-load", selectedDoc?.id] });
      toast({ 
        title: "Elaborazione completata", 
        description: `Abbinati: ${result.matched}, A magazzino: ${result.stock}, Errori: ${result.errors}` 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", `/api/parts-load/${selectedDoc?.id}/items`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts-load", selectedDoc?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/parts-load"] });
      setItemDialogOpen(false);
      resetNewItemForm();
      toast({ title: "Articolo aggiunto" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/parts-load-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts-load", selectedDoc?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/parts-load"] });
      toast({ title: "Articolo eliminato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const matchItemMutation = useMutation({
    mutationFn: async ({ itemId, partsOrderId, productId }: { itemId: string; partsOrderId?: string; productId?: string }) => {
      return apiRequest("POST", `/api/parts-load-items/${itemId}/match`, { partsOrderId, productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts-load", selectedDoc?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/parts-load"] });
      setMatchDialogOpen(false);
      setSelectedItem(null);
      toast({ title: "Abbinamento completato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const addToInventoryMutation = useMutation({
    mutationFn: async ({ itemId, stockLocation }: { itemId: string; stockLocation?: string }) => {
      return apiRequest("POST", `/api/parts-load-items/${itemId}/add-to-inventory`, { stockLocation });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts-load", selectedDoc?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-warehouse"] });
      toast({ title: "Aggiunto all'inventario" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async ({ docId, items, createProducts }: { docId: string; items: ParsedItem[]; createProducts: boolean }) => {
      const res = await apiRequest("POST", `/api/parts-load/${docId}/bulk-items`, { items, createProducts });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts-load", selectedDoc?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/parts-load"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setPasteDialogOpen(false);
      setPasteText("");
      setParsedItems([]);
      toast({ 
        title: "Importazione completata", 
        description: `Importati: ${data.imported}, Prodotti creati: ${data.productsCreated}${data.errors?.length ? `, Errori: ${data.errors.length}` : ''}` 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  function parseTextToItems(text: string): ParsedItem[] {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const items: ParsedItem[] = [];
    
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length < 2) continue;
      
      const partCode = parts[0]?.trim() || '';
      const description = parts[1]?.trim() || '';
      const quantity = parseInt(parts[2]?.trim()) || 1;
      const unitPrice = parseFloat(parts[3]?.trim()?.replace(',', '.')) || 0;
      
      if (partCode && description) {
        items.push({ partCode, description, quantity, unitPrice });
      }
    }
    
    return items;
  }

  function handlePasteTextChange(text: string) {
    setPasteText(text);
    const parsed = parseTextToItems(text);
    setParsedItems(parsed);
  }

  function handleBulkImport() {
    if (!selectedDoc || parsedItems.length === 0) return;
    bulkImportMutation.mutate({ 
      docId: selectedDoc.id, 
      items: parsedItems, 
      createProducts 
    });
  }

  function resetNewDocForm() {
    setNewDocForm({
      documentType: "ddt",
      documentNumber: "",
      documentDate: format(new Date(), "yyyy-MM-dd"),
      supplierId: "",
      repairCenterId: "",
      notes: "",
    });
  }

  function resetNewItemForm() {
    setNewItemForm({
      partCode: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
    });
  }

  function handleCreateDoc() {
    if (!newDocForm.documentNumber || !newDocForm.supplierId) {
      toast({ title: "Errore", description: "Compila tutti i campi obbligatori", variant: "destructive" });
      return;
    }
    
    createDocMutation.mutate({
      documentType: newDocForm.documentType,
      documentNumber: newDocForm.documentNumber,
      documentDate: new Date(newDocForm.documentDate),
      supplierId: newDocForm.supplierId,
      repairCenterId: newDocForm.repairCenterId || undefined,
      notes: newDocForm.notes || undefined,
    });
  }

  function handleAddItem() {
    if (!newItemForm.partCode || !newItemForm.description) {
      toast({ title: "Errore", description: "Compila codice e descrizione", variant: "destructive" });
      return;
    }
    
    addItemMutation.mutate({
      partCode: newItemForm.partCode,
      description: newItemForm.description,
      quantity: newItemForm.quantity,
      unitPrice: Math.round(newItemForm.unitPrice * 100),
      totalPrice: Math.round(newItemForm.unitPrice * 100 * newItemForm.quantity),
    });
  }

  const filteredDocs = documents.filter(doc => {
    if (filterStatus !== "all" && doc.status !== filterStatus) return false;
    if (filterSupplier !== "all" && doc.supplierId !== filterSupplier) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        doc.loadNumber?.toLowerCase().includes(search) ||
        doc.documentNumber?.toLowerCase().includes(search) ||
        doc.supplierName?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const items: PartsLoadItemWithDetails[] = docDetails?.items || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Carico Ricambi</h1>
          <p className="text-muted-foreground">Gestione DDT e fatture per carico ricambi</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-new-load">
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Carico
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cerca per numero carico, documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]" data-testid="select-filter-status">
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                <SelectTrigger className="w-[160px]" data-testid="select-filter-supplier">
                  <SelectValue placeholder="Fornitore" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i fornitori</SelectItem>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nessun documento di carico trovato</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N. Carico</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>N. Documento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Fornitore</TableHead>
                  <TableHead>Articoli</TableHead>
                  <TableHead>Totale</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map(doc => {
                  const status = STATUS_CONFIG[doc.status] || STATUS_CONFIG.draft;
                  const docType = DOC_TYPE_CONFIG[doc.documentType] || DOC_TYPE_CONFIG.ddt;
                  const StatusIcon = status.icon;
                  
                  return (
                    <TableRow key={doc.id} data-testid={`row-load-${doc.id}`}>
                      <TableCell className="font-medium">{doc.loadNumber}</TableCell>
                      <TableCell>
                        <Badge className={docType.color}>{docType.label}</Badge>
                      </TableCell>
                      <TableCell>{doc.documentNumber}</TableCell>
                      <TableCell>{formatDate(doc.documentDate)}</TableCell>
                      <TableCell>{doc.supplierName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <span>{doc.totalItems || 0} art.</span>
                          {doc.matchedItems ? (
                            <Badge variant="outline" className="text-green-600">
                              <Link2 className="w-3 h-3 mr-1" />{doc.matchedItems}
                            </Badge>
                          ) : null}
                          {doc.stockItems ? (
                            <Badge variant="outline" className="text-blue-600">
                              <Box className="w-3 h-3 mr-1" />{doc.stockItems}
                            </Badge>
                          ) : null}
                          {doc.errorItems ? (
                            <Badge variant="outline" className="text-red-600">
                              <AlertTriangle className="w-3 h-3 mr-1" />{doc.errorItems}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(doc.totalAmount || 0)}</TableCell>
                      <TableCell>
                        <Badge className={status.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-menu-${doc.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedDoc(doc); setDetailsDialogOpen(true); }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizza
                            </DropdownMenuItem>
                            {doc.status === 'draft' && (
                              <>
                                <DropdownMenuItem onClick={() => { setSelectedDoc(doc); setItemDialogOpen(true); }}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Aggiungi Articolo
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => processDocMutation.mutate(doc.id)}>
                                  <Play className="mr-2 h-4 w-4" />
                                  Elabora Carico
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuovo Carico Ricambi</DialogTitle>
            <DialogDescription>Inserisci i dati del documento di carico (DDT o Fattura)</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo Documento *</Label>
                <Select value={newDocForm.documentType} onValueChange={(v) => setNewDocForm(p => ({ ...p, documentType: v }))}>
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
                <Label>Numero Documento *</Label>
                <Input
                  value={newDocForm.documentNumber}
                  onChange={(e) => setNewDocForm(p => ({ ...p, documentNumber: e.target.value }))}
                  placeholder="Es. DDT-001/2024"
                  data-testid="input-doc-number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Documento *</Label>
                <Input
                  type="date"
                  value={newDocForm.documentDate}
                  onChange={(e) => setNewDocForm(p => ({ ...p, documentDate: e.target.value }))}
                  data-testid="input-doc-date"
                />
              </div>
              <div className="space-y-2">
                <Label>Fornitore *</Label>
                <Select value={newDocForm.supplierId} onValueChange={(v) => setNewDocForm(p => ({ ...p, supplierId: v }))}>
                  <SelectTrigger data-testid="select-supplier">
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {repairCenters.length > 0 && (
              <div className="space-y-2">
                <Label>Centro Riparazione</Label>
                <Select value={newDocForm.repairCenterId} onValueChange={(v) => setNewDocForm(p => ({ ...p, repairCenterId: v }))}>
                  <SelectTrigger data-testid="select-repair-center">
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {repairCenters.map(rc => (
                      <SelectItem key={rc.id} value={rc.id}>{rc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={newDocForm.notes}
                onChange={(e) => setNewDocForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Note aggiuntive..."
                data-testid="input-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleCreateDoc} 
              disabled={createDocMutation.isPending}
              data-testid="button-create-doc"
            >
              {createDocMutation.isPending ? "Creazione..." : "Crea Carico"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialogOpen} onOpenChange={(open) => { if (!open) setSelectedDoc(null); setDetailsDialogOpen(open); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">{selectedDoc?.loadNumber}</DialogTitle>
                <DialogDescription>
                  {DOC_TYPE_CONFIG[selectedDoc?.documentType || 'ddt']?.label} {selectedDoc?.documentNumber} - {formatDate(selectedDoc?.documentDate)}
                </DialogDescription>
              </div>
              <Badge className={STATUS_CONFIG[selectedDoc?.status || 'draft']?.color || ''}>
                {STATUS_CONFIG[selectedDoc?.status || 'draft']?.label}
              </Badge>
            </div>
          </DialogHeader>
          
          {selectedDoc && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Fornitore</span>
                    </div>
                    <p className="font-medium mt-1">{docDetails?.supplier?.name || selectedDoc.supplierName}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Articoli</span>
                    </div>
                    <p className="font-medium mt-1">{selectedDoc.totalItems || 0} ({selectedDoc.totalQuantity || 0} pz)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Totale</span>
                    </div>
                    <p className="font-medium mt-1">{formatCurrency(selectedDoc.totalAmount || 0)}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Articoli</h3>
                <div className="flex gap-2">
                  {selectedDoc.status === 'draft' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setItemDialogOpen(true)}
                        data-testid="button-add-item"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Aggiungi
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setPasteDialogOpen(true)}
                        data-testid="button-paste-items"
                      >
                        <ClipboardPaste className="mr-2 h-4 w-4" />
                        Incolla Testo
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => processDocMutation.mutate(selectedDoc.id)}
                        disabled={processDocMutation.isPending || items.length === 0}
                        data-testid="button-process"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Elabora
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codice</TableHead>
                    <TableHead>Descrizione</TableHead>
                    <TableHead className="text-center">Qta</TableHead>
                    <TableHead className="text-right">Prezzo Unit.</TableHead>
                    <TableHead className="text-right">Totale</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Destinazione</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nessun articolo inserito
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map(item => {
                      const itemStatus = ITEM_STATUS_CONFIG[item.status] || ITEM_STATUS_CONFIG.pending;
                      const ItemIcon = itemStatus.icon;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">{item.partCode}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
                          <TableCell>
                            <Badge className={itemStatus.color}>
                              <ItemIcon className="mr-1 h-3 w-3" />
                              {itemStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.status === 'matched' && item.repairOrder && (
                              <div className="flex items-center gap-1 text-sm">
                                <Wrench className="h-3 w-3" />
                                <span>Rip. {item.repairOrder.orderNumber}</span>
                              </div>
                            )}
                            {item.status === 'stock' && item.product && (
                              <div className="flex items-center gap-1 text-sm">
                                <Box className="h-3 w-3" />
                                <span>{item.product.name}</span>
                              </div>
                            )}
                            {item.status === 'error' && (
                              <span className="text-sm text-destructive">{item.errorMessage}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {(item.status === 'pending' || item.status === 'error') && (
                                  <DropdownMenuItem onClick={() => { setSelectedItem(item); setMatchDialogOpen(true); }}>
                                    <Link2 className="mr-2 h-4 w-4" />
                                    Abbina Manualmente
                                  </DropdownMenuItem>
                                )}
                                {item.status === 'stock' && !item.addedToInventory && (
                                  <DropdownMenuItem onClick={() => addToInventoryMutation.mutate({ itemId: item.id })}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Aggiungi a Inventario
                                  </DropdownMenuItem>
                                )}
                                {item.addedToInventory && (
                                  <DropdownMenuItem disabled>
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                    Già in Inventario
                                  </DropdownMenuItem>
                                )}
                                {selectedDoc.status === 'draft' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-destructive"
                                      onClick={() => deleteItemMutation.mutate(item.id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Elimina
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {selectedDoc.notes && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium mb-1">Note</p>
                  <p className="text-sm text-muted-foreground">{selectedDoc.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Articolo</DialogTitle>
            <DialogDescription>Inserisci i dati dell'articolo del carico</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Codice Articolo *</Label>
              <Input
                value={newItemForm.partCode}
                onChange={(e) => setNewItemForm(p => ({ ...p, partCode: e.target.value }))}
                placeholder="Codice fornitore"
                data-testid="input-part-code"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrizione *</Label>
              <Input
                value={newItemForm.description}
                onChange={(e) => setNewItemForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Descrizione articolo"
                data-testid="input-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantità</Label>
                <Input
                  type="number"
                  min="1"
                  value={newItemForm.quantity}
                  onChange={(e) => setNewItemForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
                  data-testid="input-quantity"
                />
              </div>
              <div className="space-y-2">
                <Label>Prezzo Unitario (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItemForm.unitPrice}
                  onChange={(e) => setNewItemForm(p => ({ ...p, unitPrice: parseFloat(e.target.value) || 0 }))}
                  data-testid="input-unit-price"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleAddItem} 
              disabled={addItemMutation.isPending}
              data-testid="button-add-item-confirm"
            >
              {addItemMutation.isPending ? "Aggiunta..." : "Aggiungi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={matchDialogOpen} onOpenChange={(open) => { if (!open) setSelectedItem(null); setMatchDialogOpen(open); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Abbinamento Manuale</DialogTitle>
            <DialogDescription>
              Abbina l'articolo "{selectedItem?.description}" a un ordine ricambio o prodotto
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="repair">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="repair">
                <Wrench className="mr-2 h-4 w-4" />
                Ordini Ricambio
              </TabsTrigger>
              <TabsTrigger value="stock">
                <Box className="mr-2 h-4 w-4" />
                Magazzino
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="repair" className="mt-4">
              <div className="max-h-[300px] overflow-y-auto">
                {waitingPartsOrders.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Nessun ordine ricambio in attesa
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Riparazione</TableHead>
                        <TableHead>Ricambio</TableHead>
                        <TableHead>Codice</TableHead>
                        <TableHead>Qta</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {waitingPartsOrders.map((po: any) => (
                        <TableRow key={po.id}>
                          <TableCell>{po.repairNumber}</TableCell>
                          <TableCell>{po.partName}</TableCell>
                          <TableCell className="font-mono text-sm">{po.partNumber}</TableCell>
                          <TableCell>{po.quantity}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm"
                              onClick={() => matchItemMutation.mutate({ 
                                itemId: selectedItem!.id, 
                                partsOrderId: po.id 
                              })}
                              disabled={matchItemMutation.isPending}
                            >
                              Abbina
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="stock" className="mt-4">
              <div className="max-h-[300px] overflow-y-auto">
                {products.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Nessun prodotto in catalogo
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Prodotto</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((prod) => (
                        <TableRow key={prod.id}>
                          <TableCell className="font-mono text-sm">{prod.sku}</TableCell>
                          <TableCell>{prod.name}</TableCell>
                          <TableCell>{prod.category}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm"
                              onClick={() => matchItemMutation.mutate({ 
                                itemId: selectedItem!.id, 
                                productId: prod.id 
                              })}
                              disabled={matchItemMutation.isPending}
                            >
                              Abbina
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={pasteDialogOpen} onOpenChange={(open) => { if (!open) { setPasteText(""); setParsedItems([]); } setPasteDialogOpen(open); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Incolla Articoli da Testo</DialogTitle>
            <DialogDescription>
              Incolla righe di testo con formato: Codice [TAB] Descrizione [TAB] Quantità [TAB] Prezzo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Testo da importare</Label>
              <Textarea
                value={pasteText}
                onChange={(e) => handlePasteTextChange(e.target.value)}
                placeholder="Incolla qui le righe copiate da Excel o documento...&#10;Formato: Codice[TAB]Descrizione[TAB]Quantità[TAB]Prezzo&#10;&#10;Esempio:&#10;ABC123      Display iPhone 14       2       45,90&#10;XYZ789        Batteria Samsung S23    5       25,00"
                className="min-h-[150px] font-mono text-sm"
                data-testid="textarea-paste-items"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="createProducts" 
                checked={createProducts} 
                onCheckedChange={(checked) => setCreateProducts(checked === true)}
                data-testid="checkbox-create-products"
              />
              <Label htmlFor="createProducts" className="text-sm font-normal">
                Crea automaticamente i prodotti nel catalogo se non esistono
              </Label>
            </div>
            
            {parsedItems.length > 0 && (
              <div className="space-y-2">
                <Label>Anteprima ({parsedItems.length} articoli riconosciuti)</Label>
                <div className="border rounded-lg overflow-hidden max-h-[200px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Codice</TableHead>
                        <TableHead>Descrizione</TableHead>
                        <TableHead className="text-center">Qta</TableHead>
                        <TableHead className="text-right">Prezzo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedItems.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-sm">{item.partCode}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice * 100)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPasteDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleBulkImport} 
              disabled={bulkImportMutation.isPending || parsedItems.length === 0}
              data-testid="button-confirm-bulk-import"
            >
              {bulkImportMutation.isPending ? "Importazione..." : `Importa ${parsedItems.length} articoli`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
