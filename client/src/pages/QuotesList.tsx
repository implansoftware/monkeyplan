import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Euro, Calendar } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { RepairOrderDetailDrawer } from "@/components/RepairOrderDetailDrawer";

const quoteStatusLabels: Record<string, string> = {
  draft: "Bozza",
  sent: "Inviato",
  accepted: "Accettato",
  rejected: "Rifiutato",
  expired: "Scaduto",
};

const quoteStatusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  expired: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export default function QuotesList() {
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: quotes, isLoading } = useQuery<any[]>({
    queryKey: ["/api/quotes"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Preventivi</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Preventivi</h1>
      </div>

      {!quotes || quotes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nessun preventivo trovato
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {quotes.map((quote) => (
            <Card
              key={quote.id}
              className="hover-elevate cursor-pointer"
              onClick={() => {
                setSelectedRepairId(quote.repairOrderId);
                setDrawerOpen(true);
              }}
              data-testid={`card-quote-${quote.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">
                      {quote.quoteNumber}
                    </span>
                    <span>#{quote.orderNumber}</span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={quoteStatusColors[quote.quoteStatus] || quoteStatusColors.draft}>
                      {quoteStatusLabels[quote.quoteStatus] || quote.quoteStatus}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {quote.deviceType} - {quote.deviceModel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 font-semibold">
                        <Euro className="h-4 w-4" />
                        {quote.totalAmount ? Number(quote.totalAmount).toFixed(2) : "0.00"}
                      </span>
                      {quote.laborCost && (
                        <span className="text-muted-foreground">
                          (Manodopera: €{Number(quote.laborCost).toFixed(2)})
                        </span>
                      )}
                    </div>
                  </div>

                  {quote.parts && quote.parts.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {quote.parts.slice(0, 3).map((part: any, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {part.name}: €{Number(part.price || 0).toFixed(2)}
                        </Badge>
                      ))}
                      {quote.parts.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{quote.parts.length - 3} ricambi
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        Creato: {quote.createdAt && format(new Date(quote.createdAt), "dd MMM yyyy", { locale: it })}
                      </span>
                      {quote.validUntil && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Valido fino: {format(new Date(quote.validUntil), "dd MMM yyyy", { locale: it })}
                        </span>
                      )}
                    </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RepairOrderDetailDrawer
        repairOrderId={selectedRepairId}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedRepairId(null);
        }}
      />
    </div>
  );
}
