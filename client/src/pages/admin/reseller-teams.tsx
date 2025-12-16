import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, UsersRound, Store, Users } from "lucide-react";
import type { User } from "@shared/schema";

type ResellerWithCounts = Omit<User, 'password'> & { 
  customerCount: number; 
  staffCount: number;
};

export default function AdminResellerTeams() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: resellers = [], isLoading } = useQuery<ResellerWithCounts[]>({
    queryKey: ["/api/admin/resellers"],
  });

  const filteredResellers = resellers.filter((reseller) =>
    reseller.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reseller.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reseller.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStaff = resellers.reduce((sum, r) => sum + r.staffCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Team Rivenditori</h1>
        <p className="text-muted-foreground">
          Gestisci i collaboratori di tutti i rivenditori
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totale Rivenditori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              {resellers.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totale Collaboratori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-primary" />
              {totalStaff}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rivenditori Attivi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              {resellers.filter(r => r.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersRound className="h-5 w-5" />
            Team per Rivenditore
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca rivenditore..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              data-testid="input-search"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredResellers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {resellers.length === 0 
                ? "Nessun rivenditore presente"
                : "Nessun rivenditore trovato"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rivenditore</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Collaboratori</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResellers.map((reseller) => (
                  <TableRow key={reseller.id} data-testid={`row-reseller-${reseller.id}`}>
                    <TableCell className="font-medium">
                      {reseller.fullName}
                    </TableCell>
                    <TableCell>{reseller.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {reseller.resellerCategory === 'franchising' ? 'Franchising' : 
                         reseller.resellerCategory === 'gdo' ? 'GDO' : 'Standard'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {reseller.isActive ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Attivo
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Inattivo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        <UsersRound className="h-3 w-3 mr-1" />
                        {reseller.staffCount} collaboratori
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/resellers/${reseller.id}/team`}>
                        <Button 
                          variant="default" 
                          size="sm"
                          data-testid={`button-manage-team-${reseller.id}`}
                        >
                          <UsersRound className="h-4 w-4 mr-2" />
                          Gestisci Team
                        </Button>
                      </Link>
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
