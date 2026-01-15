import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Document } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Download, CalendarIcon, Eye, Trash2, FolderOpen, Receipt, Wrench, Truck, FileCheck, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { DateRange } from "react-day-picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DocumentType = "intake" | "delivery" | "diagnosis" | "quote" | "label" | "invoice" | "receipt" | "shipping" | "attachment" | "contract" | "report" | "other";
type DocumentSourceType = "repair_order" | "invoice" | "b2b_order" | "b2b_return" | "sales_order" | "utility_practice" | "pos_transaction" | "warehouse_transfer" | "customer" | "supplier_order" | "other";

const documentTypeLabels: Record<DocumentType, string> = {
  intake: "Accettazione",
  delivery: "Consegna",
  diagnosis: "Diagnosi",
  quote: "Preventivo",
  label: "Etichetta",
  invoice: "Fattura",
  receipt: "Ricevuta",
  shipping: "DDT",
  attachment: "Allegato",
  contract: "Contratto",
  report: "Report",
  other: "Altro",
};

const sourceTypeLabels: Record<DocumentSourceType, string> = {
  repair_order: "Riparazione",
  invoice: "Fatturazione",
  b2b_order: "Ordine B2B",
  b2b_return: "Reso B2B",
  sales_order: "Ordine E-commerce",
  utility_practice: "Pratica Utility",
  pos_transaction: "POS",
  warehouse_transfer: "Trasferimento",
  customer: "Cliente",
  supplier_order: "Ordine Fornitore",
  other: "Altro",
};

export default function RepairCenterDocuments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery<{ documents: Document[]; total: number }>({
    queryKey: ["/api/repair-center/documents", typeFilter, sourceFilter, searchQuery, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.append("documentType", typeFilter);
      if (sourceFilter !== "all") params.append("sourceType", sourceFilter);
      if (searchQuery) params.append("search", searchQuery);
      if (dateRange?.from) params.append("startDate", dateRange.from.toISOString());
      if (dateRange?.to) params.append("endDate", dateRange.to.toISOString());
      const response = await fetch(`/api/repair-center/documents?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Documento eliminato", description: "Il documento è stato rimosso con successo" });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/documents"] });
      setDeleteDialogOpen(false);
      setSelectedDoc(null);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message || "Impossibile eliminare il documento", variant: "destructive" });
    },
  });

  const documents = data?.documents || [];
  const total = data?.total || 0;

  const getTypeBadge = (type: DocumentType) => {
    const icons: Record<DocumentType, typeof FileText> = {
      intake: Wrench,
      delivery: Truck,
      diagnosis: FileCheck,
      quote: Receipt,
      label: Tag,
      invoice: Receipt,
      receipt: Receipt,
      shipping: Truck,
      attachment: FileText,
      contract: FileText,
      report: FileText,
      other: FileText,
    };
    const Icon = icons[type] || FileText;
    return (
      <Badge variant="outline" className="gap-1">
        <Icon className="h-3 w-3" />
        {documentTypeLabels[type] || type}
      </Badge>
    );
  };

  const getSourceBadge = (source: DocumentSourceType) => {
    return (
      <Badge variant="secondary" className="text-xs">
        {sourceTypeLabels[source] || source}
      </Badge>
    );
  };

  const handleView = async (doc: Document) => {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, "_blank");
    } else if (doc.filePath) {
      toast({ title: "Download", description: "Il documento verrà scaricato a breve" });
    } else {
      toast({ title: "Errore", description: "Documento non disponibile", variant: "destructive" });
    }
  };

  const handleDelete = (doc: Document) => {
    setSelectedDoc(doc);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedDoc) {
      deleteMutation.mutate(selectedDoc.id);
    }
  };

  return (
    <div className="space-y-6" data-testid="page-repair-center-documents">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Archivio Documenti</h1>
              <p className="text-muted-foreground">
                Tutti i documenti generati dalla piattaforma
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {total} documenti
            </Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
              <div className="flex-1 relative min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca documento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-documents"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-filter-type">
                  <SelectValue placeholder="Tipo documento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i tipi</SelectItem>
                  {Object.entries(documentTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-filter-source">
                  <SelectValue placeholder="Origine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le origini</SelectItem>
                  {Object.entries(sourceTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2" data-testid="button-filter-date">
                    <CalendarIcon className="h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, "dd/MM")} - ${format(dateRange.to, "dd/MM")}`
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      "Filtra per data"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range);
                      refetch();
                    }}
                    numberOfMonths={2}
                    locale={it}
                  />
                  {dateRange && (
                    <div className="p-2 border-t">
                      <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)} className="w-full">
                        Cancella filtro
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Nessun documento trovato</h3>
              <p className="text-sm text-muted-foreground mt-1">
                I documenti generati appariranno qui
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titolo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Origine</TableHead>
                  <TableHead>Riferimento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id} data-testid={`row-document-${doc.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{doc.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                    </TableCell>
                    <TableCell>{getTypeBadge(doc.documentType as DocumentType)}</TableCell>
                    <TableCell>{getSourceBadge(doc.sourceType as DocumentSourceType)}</TableCell>
                    <TableCell>
                      <span className="text-sm">{doc.sourceReference || "-"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(doc.createdAt), "dd MMM yyyy, HH:mm", { locale: it })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(doc)}
                          data-testid={`button-view-${doc.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(doc)}
                          data-testid={`button-delete-${doc.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. Il documento "{selectedDoc?.title}" verrà eliminato permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
