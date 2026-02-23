import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, AlertTriangle, Download, X, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";

type ImportStep = "upload" | "preview" | "results";

type ParsedRow = {
  fullName: string;
  email: string;
  phone: string;
  phoneLandline: string;
  address: string;
  city: string;
  province: string;
  cap: string;
};

type ImportResult = {
  imported: number;
  skipped: number;
  errors: { row: number; name: string; message: string }[];
  created: { fullName: string; email: string }[];
};

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiEndpoint: string;
  queryKeyToInvalidate: string;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else if (char === ";" && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseAddress(raw: string): { address: string; cap: string; city: string; province: string } {
  const result = { address: "", cap: "", city: "", province: "" };
  if (!raw || raw.trim() === "" || raw.trim() === ",   () IT") return result;

  const cleaned = raw.replace(/\s+IT$/, "").trim();
  const provMatch = cleaned.match(/\(([A-Z]{2})\)\s*$/);
  if (provMatch) {
    result.province = provMatch[1];
  }

  const withoutProv = cleaned.replace(/\s*\([A-Z]{2}\)\s*$/, "").trim();
  const parts = withoutProv.split(",").map(p => p.trim());

  if (parts.length >= 2) {
    result.address = parts[0];
    const cityPart = parts[1].trim();
    const capMatch = cityPart.match(/^(\d{5})\s+(.+)$/);
    if (capMatch) {
      result.cap = capMatch[1];
      result.city = capMatch[2];
    } else {
      result.city = cityPart;
    }
  } else if (parts.length === 1 && parts[0]) {
    result.address = parts[0];
  }

  return result;
}

const HEADER_MAP: Record<string, keyof ParsedRow> = {
  cliente: "fullName",
  "indirizzo email": "email",
  email: "email",
  cellulare: "phone",
  "telefono fisso": "phoneLandline",
  indirizzo: "address",
  nome: "fullName",
  "nome completo": "fullName",
  telefono: "phone",
  name: "fullName",
  "full name": "fullName",
  mobile: "phone",
  phone: "phone",
  address: "address",
};

export function CsvImportDialog({ open, onOpenChange, apiEndpoint, queryKeyToInvalidate }: CsvImportDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>("upload");
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const resetState = useCallback(() => {
    setStep("upload");
    setFileName("");
    setParsedRows([]);
    setImportResult(null);
    setIsImporting(false);
    setDragOver(false);
  }, []);

  const handleClose = useCallback((openState: boolean) => {
    if (!openState) {
      resetState();
    }
    onOpenChange(openState);
  }, [onOpenChange, resetState]);

  const processFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({ title: t("csvImport.invalidFormat"), variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t("csvImport.fileTooLarge"), variant: "destructive" });
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string || "").replace(/^\uFEFF/, "");
      const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");

      if (lines.length < 2) {
        toast({ title: t("csvImport.emptyFile"), variant: "destructive" });
        return;
      }

      const headerFields = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/^["']|["']$/g, ""));
      const columnMap: Record<number, keyof ParsedRow> = {};
      headerFields.forEach((h, i) => {
        const mapped = HEADER_MAP[h];
        if (mapped) columnMap[i] = mapped;
      });

      if (!Object.values(columnMap).includes("fullName")) {
        toast({ title: t("csvImport.missingNameColumn"), variant: "destructive" });
        return;
      }

      const rows: ParsedRow[] = [];
      for (let i = 1; i < lines.length && rows.length < 500; i++) {
        const fields = parseCSVLine(lines[i]);
        const row: ParsedRow = { fullName: "", email: "", phone: "", phoneLandline: "", address: "", city: "", province: "", cap: "" };

        for (const [colIdx, field] of Object.entries(columnMap)) {
          const val = fields[Number(colIdx)] || "";
          (row as any)[field] = val;
        }

        if (!row.fullName || row.fullName.trim() === "") continue;

        if (row.address) {
          const parsed = parseAddress(row.address);
          if (parsed.city) row.city = parsed.city;
          if (parsed.province) row.province = parsed.province;
          if (parsed.cap) row.cap = parsed.cap;
          if (parsed.address) row.address = parsed.address;
          else row.address = "";
        }

        rows.push(row);
      }

      if (rows.length === 0) {
        toast({ title: t("csvImport.noValidRows"), variant: "destructive" });
        return;
      }

      setParsedRows(rows);
      setStep("preview");
    };
    reader.readAsText(file, "UTF-8");
  }, [toast, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleImport = useCallback(async () => {
    setIsImporting(true);
    try {
      const response = await apiRequest("POST", apiEndpoint, { customers: parsedRows });
      const result: ImportResult = await response.json();
      setImportResult(result);
      setStep("results");
      queryClient.invalidateQueries({ queryKey: [queryKeyToInvalidate] });
      if (result.imported > 0) {
        toast({ title: t("csvImport.importSuccess", { count: result.imported }) });
      }
    } catch (error: any) {
      toast({ title: t("csvImport.importError"), description: error.message, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  }, [parsedRows, apiEndpoint, queryKeyToInvalidate, toast, t]);

  const downloadTemplate = useCallback(() => {
    const bom = "\uFEFF";
    const header = "Cliente,Indirizzo email,Cellulare,Telefono fisso,Indirizzo";
    const example = '"ROSSI MARIO","mario.rossi@email.com","+393331234567","","VIA ROMA 1, 00100 ROMA (RM) IT"';
    const csv = bom + header + "\n" + example + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_clienti.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="text-csv-import-title">
            <Upload className="h-5 w-5" />
            {t("csvImport.title")}
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="flex-1 space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>{t("csvImport.formatInfo")}</AlertDescription>
            </Alert>

            <div
              className={`border-2 border-dashed rounded-md p-8 text-center transition-colors cursor-pointer ${
                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              data-testid="dropzone-csv"
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">{t("csvImport.dragDrop")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("csvImport.maxSize")}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
                data-testid="input-csv-file"
              />
            </div>

            <Button variant="outline" size="sm" onClick={downloadTemplate} data-testid="button-download-template">
              <Download className="h-4 w-4 mr-2" />
              {t("csvImport.downloadTemplate")}
            </Button>
          </div>
        )}

        {step === "preview" && (
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">{fileName}</span>
                <Badge variant="secondary">{parsedRows.length} {t("csvImport.rows")}</Badge>
              </div>
            </div>

            <ScrollArea className="flex-1 border rounded-md max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>{t("csvImport.colName")}</TableHead>
                    <TableHead>{t("csvImport.colEmail")}</TableHead>
                    <TableHead>{t("csvImport.colPhone")}</TableHead>
                    <TableHead>{t("csvImport.colCity")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.slice(0, 50).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{row.fullName}</TableCell>
                      <TableCell className="text-sm">{row.email || "-"}</TableCell>
                      <TableCell className="text-sm">{row.phone || "-"}</TableCell>
                      <TableCell className="text-sm">{row.city || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedRows.length > 50 && (
                <p className="text-xs text-muted-foreground p-2 text-center">
                  {t("csvImport.showingFirst", { count: 50, total: parsedRows.length })}
                </p>
              )}
            </ScrollArea>
          </div>
        )}

        {step === "results" && importResult && (
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card imported={importResult.imported} icon={<CheckCircle className="h-5 w-5 text-green-600" />} label={t("csvImport.imported")} />
              <Card imported={importResult.skipped} icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} label={t("csvImport.skippedErrors")} />
            </div>

            {importResult.imported > 0 && (
              <Progress value={100} className="h-2" />
            )}

            {importResult.errors.length > 0 && (
              <ScrollArea className="max-h-[250px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">{t("csvImport.row")}</TableHead>
                      <TableHead>{t("csvImport.colName")}</TableHead>
                      <TableHead>{t("csvImport.error")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importResult.errors.map((err, i) => (
                      <TableRow key={i}>
                        <TableCell>{err.row}</TableCell>
                        <TableCell className="font-medium">{err.name}</TableCell>
                        <TableCell className="text-sm text-destructive">{err.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-wrap items-center gap-2">
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => { setStep("upload"); setParsedRows([]); }} data-testid="button-csv-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("csvImport.back")}
              </Button>
              <Button onClick={handleImport} disabled={isImporting} data-testid="button-csv-confirm-import">
                {isImporting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("csvImport.importing")}</>
                ) : (
                  <><ArrowRight className="h-4 w-4 mr-2" />{t("csvImport.confirmImport", { count: parsedRows.length })}</>
                )}
              </Button>
            </>
          )}
          {step === "results" && (
            <Button onClick={() => handleClose(false)} data-testid="button-csv-close">
              {t("csvImport.close")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Card({ imported, icon, label }: { imported: number; icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 p-4 border rounded-md">
      {icon}
      <div>
        <p className="text-2xl font-bold">{imported}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
