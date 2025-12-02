import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Truck, Search, Mail, Phone, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Supplier = {
  id: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  deliveryDays: number | null;
  isActive: boolean;
};

export default function ResellerSuppliers() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/reseller/suppliers"],
  });

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.city?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Fornitori</h1>
        <Badge variant="secondary" data-testid="badge-suppliers-count">
          {suppliers.length} fornitori
        </Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Elenco Fornitori
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cerca fornitore..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessun fornitore trovato</p>
              <p className="text-sm mt-1">I fornitori verranno visualizzati quando i centri di riparazione associati effettueranno ordini</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codice</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contatti</TableHead>
                  <TableHead>Città</TableHead>
                  <TableHead>Tempi Consegna</TableHead>
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} data-testid={`row-supplier-${supplier.id}`}>
                    <TableCell className="font-mono text-sm" data-testid={`text-supplier-code-${supplier.id}`}>
                      {supplier.code}
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-supplier-name-${supplier.id}`}>
                      {supplier.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {supplier.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span data-testid={`text-supplier-email-${supplier.id}`}>{supplier.email}</span>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span data-testid={`text-supplier-phone-${supplier.id}`}>{supplier.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.city && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span data-testid={`text-supplier-city-${supplier.id}`}>{supplier.city}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell data-testid={`text-supplier-delivery-${supplier.id}`}>
                      {supplier.deliveryDays ? `${supplier.deliveryDays} giorni` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={supplier.isActive ? "default" : "secondary"} data-testid={`badge-supplier-status-${supplier.id}`}>
                        {supplier.isActive ? "Attivo" : "Inattivo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
