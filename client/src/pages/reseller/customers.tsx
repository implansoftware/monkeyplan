import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Plus, Search, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

type User = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  repairCenterId: string | null;
  createdAt: string;
};

type RepairOrder = {
  id: string;
  orderNumber: string;
  deviceType: string;
  deviceModel: string;
  status: string;
  createdAt: string;
};

export default function ResellerCustomers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const { toast } = useToast();

  const { data: allUsers = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/reseller/customers"],
  });

  const { data: allRepairs = [] } = useQuery<RepairOrder[]>({
    queryKey: ["/api/reseller/repairs"],
  });

  const customers = allUsers.filter(user => user.role === "customer");

  const createCustomerMutation = useMutation({
    mutationFn: async (data: {
      username: string;
      email: string;
      password: string;
      fullName: string;
    }) => {
      const res = await apiRequest("POST", "/api/reseller/customers", {
        ...data,
        isActive: true,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/customers"] });
      setDialogOpen(false);
      toast({ title: "Cliente creato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;

    if (!username || !email || !password || !fullName) {
      toast({ title: "Errore", description: "Compila tutti i campi", variant: "destructive" });
      return;
    }

    createCustomerMutation.mutate({ username, email, password, fullName });
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCustomerRepairs = (customerId: string) => {
    return allRepairs.filter(repair => repair.customerId === customerId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary">In attesa</Badge>;
      case "in_progress": return <Badge>In lavorazione</Badge>;
      case "completed": return <Badge variant="outline">Completata</Badge>;
      case "delivered": return <Badge variant="outline">Consegnata</Badge>;
      case "cancelled": return <Badge variant="destructive">Annullata</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Clienti</h1>
          <p className="text-muted-foreground">
            Gestisci la tua base clienti e visualizza le loro riparazioni
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-customer">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crea Nuovo Cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  required
                  placeholder="Mario Rossi"
                  data-testid="input-fullname"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="mario.rossi@email.com"
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  name="username"
                  required
                  placeholder="mariorossi"
                  data-testid="input-username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Password sicura"
                  data-testid="input-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={createCustomerMutation.isPending} data-testid="button-submit-customer">
                {createCustomerMutation.isPending ? "Creazione..." : "Crea Cliente"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ricerca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome, email o username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              data-testid="input-search"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Elenco Clienti ({filteredCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessun cliente trovato
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Completo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Data Registrazione</TableHead>
                  <TableHead>Riparazioni</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => {
                  const customerRepairs = getCustomerRepairs(customer.id);
                  return (
                    <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                      <TableCell className="font-medium" data-testid={`text-name-${customer.id}`}>
                        {customer.fullName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {customer.email}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{customer.username}</TableCell>
                      <TableCell>
                        {customer.isActive ? (
                          <Badge variant="outline">Attivo</Badge>
                        ) : (
                          <Badge variant="destructive">Disattivato</Badge>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(customer.createdAt), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <Badge data-testid={`badge-repairs-${customer.id}`}>
                          {customerRepairs.length} riparazioni
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCustomer(customer)}
                          data-testid={`button-view-${customer.id}`}
                        >
                          Dettagli
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedCustomer && (
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Dettagli Cliente: {selectedCustomer.fullName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                </div>
                <div>
                  <Label>Username</Label>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.username}</p>
                </div>
                <div>
                  <Label>Data Registrazione</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedCustomer.createdAt), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
                <div>
                  <Label>Stato</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedCustomer.isActive ? "Attivo" : "Disattivato"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Riparazioni Cliente</h3>
                {getCustomerRepairs(selectedCustomer.id).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nessuna riparazione registrata</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Numero Ordine</TableHead>
                        <TableHead>Dispositivo</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getCustomerRepairs(selectedCustomer.id).map((repair) => (
                        <TableRow key={repair.id}>
                          <TableCell className="font-medium">{repair.orderNumber}</TableCell>
                          <TableCell>
                            {repair.deviceType} - {repair.deviceModel}
                          </TableCell>
                          <TableCell>{getStatusBadge(repair.status)}</TableCell>
                          <TableCell>{format(new Date(repair.createdAt), "dd/MM/yyyy")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
