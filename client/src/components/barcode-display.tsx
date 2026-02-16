import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Printer, Barcode, Download, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BarcodeDisplayProps {
  value: string;
  showText?: boolean;
  height?: number;
  copyable?: boolean;
  printable?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BarcodeDisplay({
  value,
  showText = true,
  height = 50,
  copyable = true,
  printable = true,
  size = "md",
  className = "",
}: BarcodeDisplayProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) return;
    
    // Usa l'endpoint API per generare l'immagine del barcode
    setBarcodeDataUrl(`/api/barcode/${encodeURIComponent(value)}`);
  }, [value]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({ title: t("barcode.copied"), description: value });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: t("common.error"), description: t("barcode.copyError"), variant: "destructive" });
    }
  };

  const handlePrint = () => {
    if (!barcodeDataUrl) return;
    
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Barcode - ${value}</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                display: flex; 
                flex-direction: column;
                align-items: center; 
                justify-content: center; 
                min-height: 100vh;
                font-family: system-ui, sans-serif;
              }
              .barcode-container {
                text-align: center;
                padding: 20px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
              }
              img { max-width: 100%; height: auto; }
              .code { font-size: 14px; color: #6b7280; margin-top: 10px; }
              @media print {
                body { padding: 0; }
                .barcode-container { border: none; }
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              <img src="${barcodeDataUrl}" alt="Barcode" />
              <div class="code">${value}</div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownload = () => {
    if (!barcodeDataUrl) return;
    
    const link = document.createElement("a");
    link.download = `barcode-${value}.png`;
    link.href = barcodeDataUrl;
    link.click();
  };

  const sizeClasses = {
    sm: "text-xs gap-1",
    md: "text-sm gap-2",
    lg: "text-base gap-3",
  };

  if (!value) {
    return (
      <span className="text-muted-foreground text-sm italic">
        {t("barcode.noBarcode")}
      </span>
    );
  }

  return (
    <div className={`flex items-center ${sizeClasses[size]} ${className}`}>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <button
            className="flex flex-wrap items-center gap-2 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-mono text-slate-700 dark:text-slate-300 cursor-pointer"
            data-testid="button-view-barcode"
          >
            <Barcode className="h-4 w-4 text-blue-600" />
            {showText && <span>{value}</span>}
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <Barcode className="h-5 w-5 text-blue-600" />
              {t("barcode.productBarcode")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-6" ref={printRef}>
            {barcodeDataUrl ? (
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <img 
                  src={barcodeDataUrl} 
                  alt={`Barcode: ${value}`} 
                  className="max-w-full h-auto"
                  data-testid="img-barcode"
                />
              </div>
            ) : (
              <div className="h-24 w-48 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">{t("common.loading")}</span>
              </div>
            )}
            
            <div className="text-center">
              <p className="font-mono text-lg font-semibold text-slate-900 dark:text-white" data-testid="text-barcode-value">
                {value}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("barcode.uniqueCode")}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {copyable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="rounded-xl"
                  data-testid="button-copy-barcode"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      {t("common.copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      {t("common.copy")}
                    </>
                  )}
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="rounded-xl"
                data-testid="button-download-barcode"
              >
                <Download className="h-4 w-4 mr-2" />
                {t("common.download")}
              </Button>
              
              {printable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="rounded-xl"
                  data-testid="button-print-barcode"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {t("common.print")}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {copyable && !dialogOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleCopy}
          title={t("barcode.copyBarcode")}
          data-testid="button-quick-copy-barcode"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>
      )}
    </div>
  );
}

export function BarcodeInline({ value }: { value: string }) {
  if (!value) {
    return <span className="text-muted-foreground">-</span>;
  }
  
  return (
    <span className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
      {value}
    </span>
  );
}
