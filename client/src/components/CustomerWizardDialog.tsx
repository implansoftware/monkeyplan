import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { customerWizardSchema, type User as UserType, type RepairCenter } from "@shared/schema";
import type { z } from "zod";
import { useAuth } from "@/hooks/use-auth";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Building2, User, CheckCircle2, ChevronRight, ChevronLeft, X, UserPlus, Mail, Phone, MapPin, CreditCard, Loader2 } from "lucide-react";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { Checkbox } from "@/components/ui/checkbox";

interface CustomerWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (customer: any) => void;
}

type WizardStep = "type" | "details" | "review";

export function CustomerWizardDialog({ open, onOpenChange, onSuccess }: CustomerWizardDialogProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<WizardStep>("type");
  const [customerType, setCustomerType] = useState<"private" | "company">("private");
  const [createdCustomer, setCreatedCustomer] = useState<any>(null);
  const [selectedResellerId, setSelectedResellerId] = useState<string | null>(null);
  const [selectedSubResellerId, setSelectedSubResellerId] = useState<string | null>(null);
  const [selectedRepairCenterIds, setSelectedRepairCenterIds] = useState<string[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: resellers = [] } = useQuery<UserType[]>({
    queryKey: ["/api/admin/resellers"],
    enabled: isAdmin,
  });
  
  const isReseller = user?.role === "reseller";
  const isResellerStaff = user?.role === "reseller_staff";
  const isRepairCenter = user?.role === "repair_center";
  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
    enabled: isReseller || isResellerStaff || isRepairCenter,
  });
  
  const { data: subResellers = [] } = useQuery<UserType[]>({
    queryKey: ["/api/reseller/sub-resellers"],
    enabled: isReseller,
  });
  
  const { data: adminSubResellers = [] } = useQuery<UserType[]>({
    queryKey: ["/api/admin/resellers", selectedResellerId, "sub-resellers"],
    enabled: isAdmin && !!selectedResellerId,
  });

  const form = useForm<InsertCustomerWizard>({
    resolver: zodResolver(customerWizardSchema),
    defaultValues: {
      customerType: "private",
      username: "",
      password: "",
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      zipCode: "",
      country: "IT",
      showAddress: false,
      showIban: false,
      showFiscalCode: false,
      notes: "",
      // Company fields
      companyName: "",
      vatNumber: "",
      fiscalCode: "",
      pec: "",
      codiceUnivoco: "",
      iban: "",
    },
  });

  const showAddress = form.watch("showAddress");
  const showIban = form.watch("showIban");
  const showFiscalCode = form.watch("showFiscalCode");

  const createCustomerMutation = useMutation({
    mutationFn: async (data: InsertCustomerWizard) => {
      let payload: any = { ...data };

      // For company customers: map companyName → fullName so backend can store the name
      if (payload.customerType === "company") {
        if (!payload.fullName && payload.companyName) {
          payload.fullName = payload.companyName;
        }
        // Also map frontend field names to backend field names
        if (payload.vatNumber) payload.partitaIva = payload.vatNumber;
        if (payload.fiscalCode) payload.codiceFiscale = payload.fiscalCode;
        if (payload.companyName) payload.ragioneSociale = payload.companyName;
      }

      if (isAdmin && selectedResellerId) {
        payload.resellerId = selectedResellerId;
        if (selectedSubResellerId) {
          payload.subResellerId = selectedSubResellerId;
        }
      }
      if ((isReseller || isResellerStaff) && selectedSubResellerId) {
        payload.subResellerId = selectedSubResellerId;
      }
      if (selectedRepairCenterIds.length > 0) {
        payload.repairCenterIds = selectedRepairCenterIds;
      }
      const endpoint = (isReseller || isResellerStaff) 
        ? "/api/reseller/customers" 
        : isRepairCenter 
          ? "/api/repair-center/customers"
          : "/api/customers";
      const response = await apiRequest("POST", endpoint, payload);
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
        title: t("customer.created"),
        description: t("customer.createdDescription", { name: data.customer.fullName, password: data.tempPassword }),
      });
      if (onSuccess) onSuccess(data);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || t("customer.createError"),
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
    setSelectedResellerId(null);
    setSelectedSubResellerId(null);
    setSelectedRepairCenterIds([]);
    onOpenChange(false);
  };

  const renderTypeSelection = () => (
    <div className="space-y-6 py-4">
      <div className="text-center mb-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4">
          <UserPlus className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t("customer.chooseType")}</h3>
        <p className="text-sm text-slate-500 mt-1">{t("customer.chooseTypeDescription")}</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          className="group cursor-pointer rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-6 transition-all hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10"
          onClick={() => handleTypeSelect("private")}
          data-testid="card-customer-type-private"
        >
          <div className="text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4 group-hover:scale-110 transition-transform">
              <User className="h-7 w-7 text-white" />
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{t("customer.private")}</h4>
            <p className="text-sm text-slate-500 mb-4">{t("customer.privateDescription")}</p>
          </div>
          <ul className="text-sm text-slate-500 space-y-2">
            <li className="flex flex-wrap items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {t("customer.fullName")}
            </li>
            <li className="flex flex-wrap items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {t("customer.emailAndPhone")}
            </li>
            <li className="flex flex-wrap items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {t("customer.address")}
            </li>
            <li className="flex flex-wrap items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-slate-300" />
              {t("customer.ibanOptional")}
            </li>
          </ul>
        </div>

        <div
          className="group cursor-pointer rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-6 transition-all hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/10"
          onClick={() => handleTypeSelect("company")}
          data-testid="card-customer-type-company"
        >
          <div className="text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 mb-4 group-hover:scale-110 transition-transform">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{t("customer.company")}</h4>
            <p className="text-sm text-slate-500 mb-4">{t("customer.companyDescription")}</p>
          </div>
          <ul className="text-sm text-slate-500 space-y-2">
            <li className="flex flex-wrap items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {t("customer.companyName")}
            </li>
            <li className="flex flex-wrap items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {t("customer.vatFiscalCode")}
            </li>
            <li className="flex flex-wrap items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {t("customer.pecOrUniqueCode")}
            </li>
            <li className="flex flex-wrap items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-slate-300" />
              {t("customer.ibanOptional")}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderDetailsForm = () => (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6 py-4">
        <div className="space-y-5">
          {customerType === "company" ? (
            <>
              <FormField
                control={form.control as any}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-slate-300">{t("customer.companyName")} *</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11 rounded-xl" data-testid="input-company-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="vatNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300">{t("fiscal.vatNumber")}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} className="h-11 rounded-xl" data-testid="input-vat-number" />
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
                      <FormLabel className="text-slate-700 dark:text-slate-300">{t("fiscal.fiscalCode")}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} className="h-11 rounded-xl" data-testid="input-fiscal-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="pec"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300">{t("fiscal.pec")}</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} value={field.value || ""} className="h-11 rounded-xl" data-testid="input-pec" />
                      </FormControl>
                      <FormDescription className="text-xs">{t("fiscal.pecOrUniqueCodeRequired")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="codiceUnivoco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300">{t("fiscal.uniqueCode")}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} className="h-11 rounded-xl" data-testid="input-codice-univoco" />
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
                  <FormLabel className="text-slate-700 dark:text-slate-300">{t("customer.fullName")} *</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-11 rounded-xl" data-testid="input-full-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 dark:text-slate-300">{t("customer.username")} *</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-11 rounded-xl" data-testid="input-username" />
                  </FormControl>
                  <FormDescription className="text-xs">{t("customer.usernameDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 dark:text-slate-300">{t("customer.password")} *</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} className="h-11 rounded-xl" data-testid="input-password" />
                  </FormControl>
                  <FormDescription className="text-xs">{t("customer.passwordMinChars")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 dark:text-slate-300">{t("common.email")} *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input type="email" {...field} className="h-11 rounded-xl pl-10" data-testid="input-email" />
                    </div>
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
                  <FormLabel className="text-slate-700 dark:text-slate-300">{t("common.phone")} *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input {...field} className="h-11 rounded-xl pl-10" data-testid="input-phone" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {customerType === "private" && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
              <FormField
                control={form.control as any}
                name="showAddress"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-show-address"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("customer.wantAddress")}
                      </FormLabel>
                      <FormDescription className="text-xs">
                        {t("customer.wantAddressDescription")}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </>
          )}

          {(customerType === "company" || showAddress) && (
            <>
              <FormField
                control={form.control as any}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-slate-300">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      {t("customer.address")} {customerType === "private" ? "*" : ""}
                    </FormLabel>
                    <FormControl>
                      <AddressAutocomplete
                        id="address"
                        value={field.value}
                        onChange={field.onChange}
                        onAddressSelect={(result) => {
                          field.onChange(result.address);
                          form.setValue("city", result.city);
                          form.setValue("zipCode", result.postalCode);
                        }}
                        placeholder={t("form.startTypingAddress")}
                        data-testid="input-address"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">{t("form.startTypingForSuggestions")}</FormDescription>
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
                      <FormLabel className="text-slate-700 dark:text-slate-300">{t("customer.city")} {customerType === "private" ? "*" : ""}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t("customer.city")} className="h-11 rounded-xl" data-testid="input-city" />
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
                      <FormLabel className="text-slate-700 dark:text-slate-300">{t("customer.zipCode")} {customerType === "private" ? "*" : ""}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t("customer.zipCode")} className="h-11 rounded-xl" data-testid="input-zip-code" />
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
                      <FormLabel className="text-slate-700 dark:text-slate-300">{t("customer.country")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-xl" data-testid="select-country">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="IT">{t("countries.italy")}</SelectItem>
                          <SelectItem value="FR">{t("countries.france")}</SelectItem>
                          <SelectItem value="DE">{t("countries.germany")}</SelectItem>
                          <SelectItem value="ES">{t("countries.spain")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}

          {customerType === "private" && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
              <FormField
                control={form.control as any}
                name="showIban"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-show-iban"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("customer.wantIban")}
                      </FormLabel>
                      <FormDescription className="text-xs">
                        {t("customer.wantIbanDescription")}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              {showIban && (
                <FormField
                  control={form.control as any}
                  name="iban"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300">
                        <CreditCard className="inline h-4 w-4 mr-1" />
                        IBAN
                      </FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} className="h-11 rounded-xl font-mono" data-testid="input-iban" />
                      </FormControl>
                      <FormDescription className="text-xs">{t("customer.ibanDescription")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </>
          )}

          {customerType === "private" && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
              <FormField
                control={form.control as any}
                name="showFiscalCode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-show-fiscal-code"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("customer.wantFiscalCode")}
                      </FormLabel>
                      <FormDescription className="text-xs">
                        {t("customer.wantFiscalCodeDescription")}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              {showFiscalCode && (
                <FormField
                  control={form.control as any}
                  name="fiscalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300">{t("fiscal.fiscalCode")}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} className="h-11 rounded-xl font-mono" data-testid="input-fiscal-code" placeholder="RSSMRA85M01H501Z" />
                      </FormControl>
                      <FormDescription className="text-xs">{t("customer.fiscalCodeDescription")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </>
          )}

          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
          <FormField
            control={form.control as any}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 dark:text-slate-300">{t("common.notes")}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    placeholder={t("customer.notesPlaceholder")}
                    className="rounded-xl resize-none"
                    rows={3}
                    data-testid="textarea-customer-notes"
                  />
                </FormControl>
                <FormDescription className="text-xs">{t("customer.notesDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {isAdmin && resellers.length > 0 && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
              <FormItem>
                <FormLabel className="text-slate-700 dark:text-slate-300">{t("customer.referenceReseller")}</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    const newResellerId = value === "none" ? null : value;
                    setSelectedResellerId(newResellerId);
                    setSelectedSubResellerId(null);
                  }} 
                  value={selectedResellerId || "none"}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl" data-testid="select-reseller">
                      <SelectValue placeholder={t("customer.selectResellerOptional")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">{t("customer.noReseller")}</SelectItem>
                    {resellers.map((reseller) => (
                      <SelectItem key={reseller.id} value={reseller.id}>
                        {reseller.fullName} ({reseller.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  {t("customer.associateReseller")}
                </FormDescription>
              </FormItem>
            </>
          )}

          {isAdmin && selectedResellerId && adminSubResellers.length > 0 && (
            <>
              <FormItem>
                <FormLabel className="text-slate-700 dark:text-slate-300">{t("customer.referenceSubReseller")}</FormLabel>
                <Select 
                  onValueChange={(value) => setSelectedSubResellerId(value === "none" ? null : value)} 
                  value={selectedSubResellerId || "none"}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl" data-testid="select-admin-sub-reseller">
                      <SelectValue placeholder={t("customer.selectSubResellerOptional")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">{t("customer.noSubReseller")}</SelectItem>
                    {adminSubResellers.map((subReseller) => (
                      <SelectItem key={subReseller.id} value={subReseller.id}>
                        {subReseller.fullName} ({subReseller.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  {t("customer.associateSubReseller")}
                </FormDescription>
              </FormItem>
            </>
          )}

          {isReseller && subResellers.length > 0 && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
              <FormItem>
                <FormLabel className="text-slate-700 dark:text-slate-300">{t("customer.referenceSubReseller")}</FormLabel>
                <Select 
                  onValueChange={(value) => setSelectedSubResellerId(value === "none" ? null : value)} 
                  value={selectedSubResellerId || "none"}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl" data-testid="select-sub-reseller">
                      <SelectValue placeholder={t("customer.selectSubResellerOptional")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">{t("customer.noSubReseller")}</SelectItem>
                    {subResellers.map((subReseller) => (
                      <SelectItem key={subReseller.id} value={subReseller.id}>
                        {subReseller.fullName} ({subReseller.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  {t("customer.associateSubReseller")}
                </FormDescription>
              </FormItem>
            </>
          )}

          {(isReseller || isRepairCenter) && repairCenters.length > 0 && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
              <FormItem>
                <FormLabel className="text-slate-700 dark:text-slate-300">{t("customer.associatedRepairCenters")}</FormLabel>
                <div className="space-y-2">
                  <Select 
                    onValueChange={(value) => {
                      if (value && !selectedRepairCenterIds.includes(value)) {
                        setSelectedRepairCenterIds([...selectedRepairCenterIds, value]);
                      }
                    }}
                    value=""
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-xl" data-testid="select-repair-centers">
                        <SelectValue placeholder={t("customer.addRepairCenter")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {repairCenters
                        .filter(rc => !selectedRepairCenterIds.includes(rc.id))
                        .map((center) => (
                          <SelectItem key={center.id} value={center.id}>
                            {center.name} - {center.city}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {selectedRepairCenterIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedRepairCenterIds.map(id => {
                        const center = repairCenters.find(rc => rc.id === id);
                        return center ? (
                          <div
                            key={id}
                            className="inline-flex items-center gap-2 rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-sm text-blue-700 dark:text-blue-400"
                          >
                            <span>{center.name}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedRepairCenterIds(selectedRepairCenterIds.filter(rcId => rcId !== id))}
                              className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                              data-testid={`button-remove-repair-center-${id}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                <FormDescription className="text-xs">
                  {t("customer.selectRepairCentersDescription")}
                </FormDescription>
              </FormItem>
            </>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep("type")}
            className="rounded-xl"
            data-testid="button-back"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>
          <Button 
            type="button" 
            onClick={handleNext} 
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            data-testid="button-next"
          >
            {t("common.next")}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );

  const renderReview = () => {
    const values = form.getValues();
    return (
      <div className="space-y-6 py-4">
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/30 p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className={`p-2 rounded-xl ${customerType === "private" ? "bg-gradient-to-br from-cyan-500 to-blue-600" : "bg-gradient-to-br from-violet-500 to-purple-600"}`}>
              {customerType === "private" ? <User className="h-5 w-5 text-white" /> : <Building2 className="h-5 w-5 text-white" />}
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">{t("customer.customerType")}</p>
              <p className="font-semibold text-slate-900 dark:text-white">
                {values.customerType === "private" ? t("customer.private") : t("customer.company")}
              </p>
            </div>
          </div>

          {values.customerType === "company" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t("customer.companyName")}</p>
                <p className="font-semibold text-slate-900 dark:text-white" data-testid="text-review-company-name">{values.companyName}</p>
              </div>
              {values.vatNumber && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t("fiscal.vatNumber")}</p>
                  <p className="font-mono text-slate-900 dark:text-white" data-testid="text-review-vat">{values.vatNumber}</p>
                </div>
              )}
              {values.pec && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t("fiscal.pec")}</p>
                  <p className="text-slate-900 dark:text-white text-sm" data-testid="text-review-pec">{values.pec}</p>
                </div>
              )}
              {values.codiceUnivoco && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t("fiscal.uniqueCode")}</p>
                  <p className="font-mono text-slate-900 dark:text-white" data-testid="text-review-codice">{values.codiceUnivoco}</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t("customer.fullName")}</p>
              <p className="font-semibold text-slate-900 dark:text-white" data-testid="text-review-full-name">{values.fullName}</p>
            </div>
          )}

          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t("common.email")}</p>
              <p className="text-slate-900 dark:text-white flex items-center gap-2" data-testid="text-review-email">
                <Mail className="h-4 w-4 text-blue-500" />
                {values.email}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t("common.phone")}</p>
              <p className="text-slate-900 dark:text-white flex items-center gap-2" data-testid="text-review-phone">
                <Phone className="h-4 w-4 text-emerald-500" />
                {values.phone}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t("customer.address")}</p>
            {!values.showAddress && customerType === "private" ? (
              <p className="text-slate-400 italic" data-testid="text-review-address">{t("customer.notEntered")}</p>
            ) : (
              <p className="text-slate-900 dark:text-white flex items-center gap-2" data-testid="text-review-address">
                <MapPin className="h-4 w-4 text-rose-500" />
                {values.address}, {values.zipCode} {values.city}, {values.country}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">IBAN</p>
              {!values.showIban || !values.iban ? (
                <p className="text-slate-400 italic" data-testid="text-review-iban">{t("customer.notEntered")}</p>
              ) : (
                <p className="font-mono text-sm text-slate-900 dark:text-white" data-testid="text-review-iban">{values.iban}</p>
              )}
            </div>
            {values.customerType === "private" && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t("fiscal.fiscalCode")}</p>
                {!values.showFiscalCode || !values.fiscalCode ? (
                  <p className="text-slate-400 italic" data-testid="text-review-fiscal-code">{t("customer.notEntered")}</p>
                ) : (
                  <p className="font-mono text-slate-900 dark:text-white" data-testid="text-review-fiscal-code">{values.fiscalCode}</p>
                )}
              </div>
            )}
          </div>

          {isAdmin && selectedResellerId && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t("customer.referenceReseller")}</p>
              <p className="text-slate-900 dark:text-white flex items-center gap-2" data-testid="text-review-reseller">
                <Building2 className="h-4 w-4 text-blue-500" />
                {resellers.find(r => r.id === selectedResellerId)?.fullName || "N/D"}
              </p>
            </div>
          )}

          {selectedSubResellerId && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t("customer.referenceSubReseller")}</p>
              <p className="text-slate-900 dark:text-white flex items-center gap-2" data-testid="text-review-sub-reseller">
                <Building2 className="h-4 w-4 text-violet-500" />
                {(isReseller 
                  ? subResellers.find(r => r.id === selectedSubResellerId)?.fullName 
                  : adminSubResellers.find(r => r.id === selectedSubResellerId)?.fullName
                ) || "N/D"}
              </p>
            </div>
          )}

          {selectedRepairCenterIds.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">{t("customer.repairCenters")}</p>
              <div className="flex flex-wrap gap-2" data-testid="text-review-repair-centers">
                {selectedRepairCenterIds.map(id => {
                  const center = repairCenters.find(rc => rc.id === id);
                  return center ? (
                    <span key={id} className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full">
                      {center.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
          {form.watch("notes") && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t("common.notes")}</p>
              <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap" data-testid="text-review-notes">{form.watch("notes")}</p>
            </div>
          )}
        </div>

        {createdCustomer && (
          <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 p-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <h4 className="font-semibold text-emerald-800 dark:text-emerald-300">{t("customer.createdSuccess")}</h4>
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-slate-500">Username:</span>{" "}
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{createdCustomer.customer.username}</span>
              </p>
              <p>
                <span className="text-slate-500">{t("customer.temporaryPassword")}:</span>{" "}
                <code className="bg-white dark:bg-slate-800 px-3 py-1 rounded-lg font-mono font-semibold text-emerald-600" data-testid="text-temp-password">
                  {createdCustomer.tempPassword}
                </code>
              </p>
              <p className="text-xs text-slate-500 mt-3">
                {t("customer.provideCredentials")}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep("details")}
            disabled={createCustomerMutation.isPending || createdCustomer}
            className="rounded-xl"
            data-testid="button-back-to-details"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t("common.edit")}
          </Button>
          {createdCustomer ? (
            <Button onClick={handleClose} className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700" data-testid="button-close">
              {t("common.close")}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createCustomerMutation.isPending}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              data-testid="button-create-customer"
            >
              {createCustomerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.creating")}
                </>
              ) : (
                t("customer.createCustomer")
              )}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-3">
            <div className={`p-2 rounded-xl ${
              step === "type" ? "bg-gradient-to-br from-blue-500 to-indigo-600" :
              step === "details" ? (customerType === "private" ? "bg-gradient-to-br from-cyan-500 to-blue-600" : "bg-gradient-to-br from-violet-500 to-purple-600") :
              "bg-gradient-to-br from-emerald-500 to-green-600"
            }`}>
              {step === "type" && <UserPlus className="h-5 w-5 text-white" />}
              {step === "details" && (customerType === "private" ? <User className="h-5 w-5 text-white" /> : <Building2 className="h-5 w-5 text-white" />)}
              {step === "review" && <CheckCircle2 className="h-5 w-5 text-white" />}
            </div>
            <div>
              <DialogTitle className="text-lg">
                {step === "type" && t("customer.newCustomer")}
                {step === "details" && t("customer.newType", { type: customerType === "private" ? t("customer.private") : t("customer.company") })}
                {step === "review" && t("customer.summaryAndConfirm")}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {step === "type" && t("customer.selectTypeToCreate")}
                {step === "details" && t("customer.fillCustomerData")}
                {step === "review" && t("customer.verifyBeforeCreate")}
              </DialogDescription>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <div className={`flex-1 h-1.5 rounded-full ${step === "type" || step === "details" || step === "review" ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"}`} />
            <div className={`flex-1 h-1.5 rounded-full ${step === "details" || step === "review" ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"}`} />
            <div className={`flex-1 h-1.5 rounded-full ${step === "review" ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"}`} />
          </div>
        </DialogHeader>

        {step === "type" && renderTypeSelection()}
        {step === "details" && renderDetailsForm()}
        {step === "review" && renderReview()}
      </DialogContent>
    </Dialog>
  );
}
