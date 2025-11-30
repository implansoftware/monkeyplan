import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { customerWizardSchema } from "@shared/schema";
import type { z } from "zod";

type InsertCustomerWizard = z.infer<typeof customerWizardSchema>;
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Building2, User, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";

interface CustomerWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (customer: any) => void;
}

type WizardStep = "type" | "details" | "review";

export function CustomerWizardDialog({ open, onOpenChange, onSuccess }: CustomerWizardDialogProps) {
  const [step, setStep] = useState<WizardStep>("type");
  const [customerType, setCustomerType] = useState<"private" | "company">("private");
  const [createdCustomer, setCreatedCustomer] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertCustomerWizard>({
    resolver: zodResolver(customerWizardSchema),
    defaultValues: {
      customerType: "private",
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      zipCode: "",
      country: "IT",
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: InsertCustomerWizard) => {
      const response = await apiRequest("POST", "/api/customers", data);
      const result = await response.json() as {
        customer: {
          id: string;
          username: string;
          email: string;
          fullName: string;
          phone: string | null;
        };
        tempPassword: string;
        billing: any;
      };
      return result;
    },
    onSuccess: (data) => {
      setCreatedCustomer(data);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Cliente creato",
        description: `Cliente ${data.customer.fullName} creato con successo. Password temporanea: ${data.tempPassword}`,
      });
      if (onSuccess) onSuccess(data);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile creare il cliente",
      });
    },
  });

  const handleTypeSelect = (type: "private" | "company") => {
    setCustomerType(type);
    form.setValue("customerType", type);
    setStep("details");
  };

  const handleNext = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      setStep("review");
    }
  };

  const handleSubmit = form.handleSubmit((data) => {
    createCustomerMutation.mutate(data as InsertCustomerWizard);
  });

  const handleClose = () => {
    form.reset();
    setStep("type");
    setCustomerType("private");
    setCreatedCustomer(null);
    onOpenChange(false);
  };

  const renderTypeSelection = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card
          className="cursor-pointer hover-elevate active-elevate-2"
          onClick={() => handleTypeSelect("private")}
          data-testid="card-customer-type-private"
        >
          <CardHeader className="text-center">
            <User className="mx-auto h-12 w-12 text-primary" />
            <CardTitle>Privato</CardTitle>
            <CardDescription>Cliente privato</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Nome completo</li>
              <li>• Email e telefono</li>
              <li>• Indirizzo</li>
              <li>• IBAN (opzionale)</li>
            </ul>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover-elevate active-elevate-2"
          onClick={() => handleTypeSelect("company")}
          data-testid="card-customer-type-company"
        >
          <CardHeader className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-primary" />
            <CardTitle>Azienda</CardTitle>
            <CardDescription>Cliente aziendale</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Ragione sociale</li>
              <li>• P.IVA / C.F.</li>
              <li>• PEC o Codice Univoco</li>
              <li>• IBAN (opzionale)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderDetailsForm = () => (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {customerType === "company" ? (
            <>
              <FormField
                control={form.control as any}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ragione Sociale *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-company-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="companyCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria Azienda</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "standard"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-company-category">
                          <SelectValue placeholder="Seleziona categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="franchising">Franchising</SelectItem>
                        <SelectItem value="gdo">GDO (Grande Distribuzione)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Franchising e GDO possono avere filiali/punti vendita
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="vatNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>P.IVA</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-vat-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="fiscalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codice Fiscale</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-fiscal-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="pec"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PEC</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} value={field.value || ""} data-testid="input-pec" />
                      </FormControl>
                      <FormDescription>Almeno uno tra PEC e Codice Univoco è obbligatorio</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="codiceUnivoco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codice Univoco</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-codice-univoco" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          ) : (
            <FormField
              control={form.control as any}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-full-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} data-testid="input-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefono *</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-phone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <FormField
            control={form.control as any}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Indirizzo *</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-address" />
                </FormControl>
                <FormDescription>Inserisci l'indirizzo completo</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control as any}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Città *</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-city" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CAP *</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-zip-code" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paese</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-country">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="IT">Italia</SelectItem>
                      <SelectItem value="FR">Francia</SelectItem>
                      <SelectItem value="DE">Germania</SelectItem>
                      <SelectItem value="ES">Spagna</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <FormField
            control={form.control as any}
            name="iban"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IBAN</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} data-testid="input-iban" />
                </FormControl>
                <FormDescription>Opzionale - per addebito diretto</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep("type")}
            data-testid="button-back"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Indietro
          </Button>
          <Button type="button" onClick={handleNext} data-testid="button-next">
            Avanti
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );

  const renderReview = () => {
    const values = form.getValues();
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Riepilogo Dati</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Tipo Cliente</h4>
              <p className="text-sm text-muted-foreground">
                {values.customerType === "private" ? "Privato" : "Azienda"}
              </p>
            </div>

            {values.customerType === "company" ? (
              <>
                <div>
                  <h4 className="font-medium mb-2">Ragione Sociale</h4>
                  <p className="text-sm" data-testid="text-review-company-name">{values.companyName}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Categoria Azienda</h4>
                  <p className="text-sm" data-testid="text-review-company-category">
                    {(values as any).companyCategory === "franchising" ? "Franchising" : 
                     (values as any).companyCategory === "gdo" ? "GDO (Grande Distribuzione)" : "Standard"}
                  </p>
                </div>
                {values.vatNumber && (
                  <div>
                    <h4 className="font-medium mb-2">P.IVA</h4>
                    <p className="text-sm" data-testid="text-review-vat">{values.vatNumber}</p>
                  </div>
                )}
                {values.pec && (
                  <div>
                    <h4 className="font-medium mb-2">PEC</h4>
                    <p className="text-sm" data-testid="text-review-pec">{values.pec}</p>
                  </div>
                )}
                {values.codiceUnivoco && (
                  <div>
                    <h4 className="font-medium mb-2">Codice Univoco</h4>
                    <p className="text-sm" data-testid="text-review-codice">{values.codiceUnivoco}</p>
                  </div>
                )}
              </>
            ) : (
              <div>
                <h4 className="font-medium mb-2">Nome Completo</h4>
                <p className="text-sm" data-testid="text-review-full-name">{values.fullName}</p>
              </div>
            )}

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Contatti</h4>
              <p className="text-sm" data-testid="text-review-email">{values.email}</p>
              <p className="text-sm" data-testid="text-review-phone">{values.phone}</p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Indirizzo</h4>
              <p className="text-sm" data-testid="text-review-address">
                {values.address}, {values.zipCode} {values.city}, {values.country}
              </p>
            </div>

            {values.iban && (
              <div>
                <h4 className="font-medium mb-2">IBAN</h4>
                <p className="text-sm" data-testid="text-review-iban">{values.iban}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {createdCustomer && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Cliente Creato con Successo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                <strong>Username:</strong> {createdCustomer.customer.username}
              </p>
              <p className="text-sm">
                <strong>Password Temporanea:</strong>{" "}
                <code className="bg-muted px-2 py-1 rounded" data-testid="text-temp-password">
                  {createdCustomer.tempPassword}
                </code>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Fornisci queste credenziali al cliente per il primo accesso.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep("details")}
            disabled={createCustomerMutation.isPending || createdCustomer}
            data-testid="button-back-to-details"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Modifica
          </Button>
          {createdCustomer ? (
            <Button onClick={handleClose} data-testid="button-close">
              Chiudi
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createCustomerMutation.isPending}
              data-testid="button-create-customer"
            >
              {createCustomerMutation.isPending ? "Creazione..." : "Crea Cliente"}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "type" && "Nuovo Cliente - Tipo"}
            {step === "details" && `Nuovo Cliente - ${customerType === "private" ? "Privato" : "Azienda"}`}
            {step === "review" && "Riepilogo e Conferma"}
          </DialogTitle>
          <DialogDescription>
            {step === "type" && "Seleziona il tipo di cliente da creare"}
            {step === "details" && "Compila i dati del cliente"}
            {step === "review" && "Verifica i dati prima di creare il cliente"}
          </DialogDescription>
        </DialogHeader>

        {step === "type" && renderTypeSelection()}
        {step === "details" && renderDetailsForm()}
        {step === "review" && renderReview()}
      </DialogContent>
    </Dialog>
  );
}
