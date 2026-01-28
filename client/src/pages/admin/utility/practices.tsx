import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UtilityPractice, InsertUtilityPractice, UtilitySupplier, UtilityService, User, Product, RepairCenter } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Search, FileCheck, Pencil, Trash2, 
  ArrowLeft, User as UserIcon, Eye, Package, Calendar, Euro, ClipboardList, X, Building2, User2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

type PracticeStatus = "bozza" | "inviata" | "in_lavorazione" | "attesa_documenti" | "completata" | "rifiutata" | "annullata";

const statusLabels: Record<PracticeStatus, string> = {
  bozza: "Bozza",
  inviata: "Inviata",
  in_lavorazione: "In Lavorazione",
  attesa_documenti: "Attesa Documenti",
  completata: "Completata",
  annullata: "Annullata",
  rifiutata: "Rifiutata",
};

const statusColors: Record<PracticeStatus, string> = {
  bozza: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  inviata: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  in_lavorazione: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  attesa_documenti: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  completata: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  annullata: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  rifiutata: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const categoryLabels: Record<string, string> = {
  fisso: "Fisso",
  mobile: "Mobile",
  centralino: "Centralino",
  luce: "Luce",
  gas: "Gas",
  altro: "Altro",
};

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

type ItemType = "service" | "product" | "service_with_products";
type PriceType = "mensile" | "forfait";

interface PracticeProductItem {
  productId: string;
  quantity: number;
  unitPriceCents: number;
  notes?: string;
}

export default function AdminUtilityPractices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPractice, setEditingPractice] = useState<UtilityPractice | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<PracticeStatus>("bozza");
  const [selectedItemType, setSelectedItemType] = useState<ItemType>("service");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedPriceType, setSelectedPriceType] = useState<PriceType>("mensile");
  const [practiceProducts, setPracticeProducts] = useState<PracticeProductItem[]>([]);
  const [useCustomService, setUseCustomService] = useState(false);
  const [customServiceName, setCustomServiceName] = useState("");
  const [useTemporarySupplier, setUseTemporarySupplier] = useState(false);
  const [temporarySupplierName, setTemporarySupplierName] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [useTemporaryCustomer, setUseTemporaryCustomer] = useState(false);
  const [temporaryCustomerName, setTemporaryCustomerName] = useState("");
  const [temporaryCustomerEmail, setTemporaryCustomerEmail] = useState("");
  const [temporaryCustomerPhone, setTemporaryCustomerPhone] = useState("");
  const [newCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [showImportField, setShowImportField] = useState(false);
  const [importText, setImportText] = useState("");
  const [supplierReferenceValue, setSupplierReferenceValue] = useState("");
  const [assigneeType, setAssigneeType] = useState<"admin" | "reseller" | "repair_center">("admin");
  const [selectedResellerId, setSelectedResellerId] = useState<string>("");
  const [selectedSubResellerId, setSelectedSubResellerId] = useState<string>("");
  const [selectedRepairCenterId, setSelectedRepairCenterId] = useState<string>("");
  const [monthlyPriceValue, setMonthlyPriceValue] = useState<string>("");
  const [flatPriceValue, setFlatPriceValue] = useState<string>("");
  const [commissionValue, setCommissionValue] = useState<string>("");
  const { toast } = useToast();

  const parseImportText = (text: string) => {
    const result: {
      supplierName: string | null;
      serviceName: string | null;
      customerName: string | null;
      customerEmail: string | null;
      customerPhone: string | null;
      supplierReference: string | null;
    } = {
      supplierName: null,
      serviceName: null,
      customerName: null,
      customerEmail: null,
      customerPhone: null,
      supplierReference: null,
    };
    
    const normalizedText = text.toLowerCase();
    
    const knownSuppliers = [
      { keywords: ['fastweb'], name: 'Fastweb' },
      { keywords: ['tim', 'telecom italia'], name: 'TIM' },
      { keywords: ['vodafone'], name: 'Vodafone' },
      { keywords: ['wind', 'windtre', 'wind tre'], name: 'WindTre' },
      { keywords: ['iliad'], name: 'Iliad' },
      { keywords: ['enel', 'enel energia'], name: 'Enel Energia' },
      { keywords: ['eni', 'eni gas', 'eni luce'], name: 'Eni' },
      { keywords: ['a2a'], name: 'A2A' },
      { keywords: ['edison'], name: 'Edison' },
      { keywords: ['sorgenia'], name: 'Sorgenia' },
      { keywords: ['acea'], name: 'Acea' },
      { keywords: ['hera'], name: 'Hera' },
      { keywords: ['iren'], name: 'Iren' },
      { keywords: ['sky'], name: 'Sky' },
      { keywords: ['dazn'], name: 'DAZN' },
      { keywords: ['ho.', 'ho mobile'], name: 'ho. Mobile' },
      { keywords: ['kena', 'kena mobile'], name: 'Kena Mobile' },
      { keywords: ['poste mobile', 'postemobile'], name: 'PosteMobile' },
      { keywords: ['very mobile', 'verymobile'], name: 'Very Mobile' },
    ];
    
    for (const supplier of knownSuppliers) {
      for (const keyword of supplier.keywords) {
        if (normalizedText.includes(keyword)) {
          result.supplierName = supplier.name;
          break;
        }
      }
      if (result.supplierName) break;
    }
    
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      result.customerEmail = emailMatch[0].toLowerCase();
    }
    
    const phonePatterns = [
      /(?:\+39\s?)?(?:3[0-9]{2}[\s.-]?[0-9]{6,7})/g,
      /(?:\+39\s?)?(?:0[0-9]{1,4}[\s.-]?[0-9]{5,8})/g,
    ];
    for (const pattern of phonePatterns) {
      const phoneMatch = text.match(pattern);
      if (phoneMatch) {
        result.customerPhone = phoneMatch[0].replace(/[\s.-]/g, '');
        break;
      }
    }
    
    const namePatterns = [
      /(?:cliente|intestatario|nominativo|titolare|contraente)[:\s]+([A-Za-zÀ-ÿ\s]+?)(?:\n|,|;|$)/i,
      /(?:sig\.?|signor|signora)[:\s]+([A-Za-zÀ-ÿ\s]+?)(?:\n|,|;|$)/i,
    ];
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        if (name.length >= 3 && name.length <= 100) {
          result.customerName = name;
          break;
        }
      }
    }
    
    const servicePatterns = [
      /(?:offerta|piano|tariffa|promozione)[:\s]+([^\n]+)/i,
    ];
    for (const pattern of servicePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const service = match[1].trim();
        if (service.length >= 3 && service.length <= 200) {
          result.serviceName = service;
          break;
        }
      }
    }
    
    const refPatterns = [
      /(?:codice\s*(?:pratica|preventivo|contratto|ordine)|pratica\s*n[.°]?|contratto\s*n[.°]?|rif\.?)[:\s]*([A-Z0-9.\-\/]+)/i,
      /(?:FWD|PDA|CRM|ID)[.:\s]*([A-Z0-9.\-\/]+)/i,
    ];
    for (const pattern of refPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const ref = match[1].trim();
        if (ref.length >= 3 && ref.length <= 50) {
          result.supplierReference = ref;
          break;
        }
      }
    }
    
    return result;
  };

  const handleImportText = () => {
    if (!importText.trim()) {
      toast({ title: "Nessun testo", description: "Incolla il testo dal documento", variant: "destructive" });
      return;
    }
    
    const parsed = parseImportText(importText);
    
    // Handle supplier: try catalog first, fallback to temporary
    if (parsed.supplierName) {
      const matchedSupplier = suppliers.find(s => 
        s.name.toLowerCase().includes(parsed.supplierName!.toLowerCase()) ||
        parsed.supplierName!.toLowerCase().includes(s.name.toLowerCase())
      );
      if (matchedSupplier) {
        setUseTemporarySupplier(false);
        setSelectedSupplierId(matchedSupplier.id);
        setTemporarySupplierName("");
      } else {
        setUseTemporarySupplier(true);
        setTemporarySupplierName(parsed.supplierName);
        setSelectedSupplierId("");
      }
    }
    
    // Handle customer: try catalog first, fallback to temporary
    if (parsed.customerName || parsed.customerEmail) {
      const matchedCustomer = customers.find(c => {
        if (parsed.customerEmail && c.email?.toLowerCase() === parsed.customerEmail.toLowerCase()) {
          return true;
        }
        if (parsed.customerName && c.fullName?.toLowerCase().includes(parsed.customerName.toLowerCase())) {
          return true;
        }
        return false;
      });
      if (matchedCustomer) {
        setUseTemporaryCustomer(false);
        setSelectedCustomerId(matchedCustomer.id);
        setTemporaryCustomerName("");
        setTemporaryCustomerEmail("");
        setTemporaryCustomerPhone("");
      } else {
        setUseTemporaryCustomer(true);
        setTemporaryCustomerName(parsed.customerName || "");
        setTemporaryCustomerEmail(parsed.customerEmail || "");
        setTemporaryCustomerPhone(parsed.customerPhone || "");
        setSelectedCustomerId("");
      }
    }
    
    if (parsed.serviceName) {
      setUseCustomService(true);
      setCustomServiceName(parsed.serviceName);
    }
    
    if (parsed.supplierReference) {
      setSupplierReferenceValue(parsed.supplierReference);
    }
    
    setShowImportField(false);
    setImportText("");
    
    const foundFields = [
      parsed.supplierName && "Fornitore",
      parsed.customerName && "Cliente", 
      parsed.serviceName && "Servizio",
      parsed.supplierReference && "Riferimento",
    ].filter(Boolean);
    
    toast({ 
      title: "Dati importati", 
      description: foundFields.length > 0 
        ? `Trovati: ${foundFields.join(", ")}` 
        : "Nessun dato riconosciuto nel testo"
    });
  };

  const { data: practices = [], isLoading } = useQuery<UtilityPractice[]>({
    queryKey: ["/api/utility/practices"],
  });

  const { data: suppliers = [] } = useQuery<UtilitySupplier[]>({
    queryKey: ["/api/utility/suppliers"],
  });

  const { data: services = [] } = useQuery<UtilityService[]>({
    queryKey: ["/api/utility/services", selectedSupplierId],
    queryFn: async () => {
      const url = selectedSupplierId 
        ? `/api/utility/services?supplierId=${selectedSupplierId}`
        : "/api/utility/services";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
    enabled: !!selectedSupplierId,
  });
  
  const { data: allServices = [] } = useQuery<UtilityService[]>({
    queryKey: ["/api/utility/services"],
  });

  const { data: customers = [] } = useQuery<User[]>({
    queryKey: ["/api/customers"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: resellers = [] } = useQuery<User[]>({
    queryKey: ["/api/resellers"],
  });

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/repair-centers"],
  });

  // Filtra i rivenditori padre (quelli senza parentResellerId)
  const parentResellers = resellers.filter((r: any) => !r.parentResellerId);

  // Query per sotto-rivenditori del rivenditore selezionato
  const { data: subResellers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/resellers", selectedResellerId, "sub-resellers"],
    queryFn: async () => {
      if (!selectedResellerId) return [];
      const res = await fetch(`/api/admin/resellers/${selectedResellerId}/sub-resellers`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedResellerId && assigneeType === "reseller",
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertUtilityPractice) => {
      const res = await apiRequest("POST", "/api/utility/practices", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices"] });
      setDialogOpen(false);
      setEditingPractice(null);
      toast({ title: "Pratica creata con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertUtilityPractice> }) => {
      const res = await apiRequest("PATCH", `/api/utility/practices/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices"] });
      setDialogOpen(false);
      setEditingPractice(null);
      toast({ title: "Pratica aggiornata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/utility/practices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices"] });
      toast({ title: "Pratica eliminata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: { fullName: string; email?: string; phone?: string }) => {
      const res = await apiRequest("POST", "/api/customers/quick", data);
      return await res.json();
    },
    onSuccess: (newCustomer: User) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setSelectedCustomerId(newCustomer.id);
      setNewCustomerDialogOpen(false);
      setNewCustomerName("");
      setNewCustomerEmail("");
      setNewCustomerPhone("");
      toast({ title: "Cliente creato", description: `${newCustomer.fullName} aggiunto con successo` });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateCustomer = () => {
    if (!newCustomerName.trim()) {
      toast({ title: "Errore", description: "Il nome è obbligatorio", variant: "destructive" });
      return;
    }
    createCustomerMutation.mutate({
      fullName: newCustomerName.trim(),
      email: newCustomerEmail.trim() || undefined,
      phone: newCustomerPhone.trim() || undefined,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: Partial<InsertUtilityPractice> = {
      itemType: selectedItemType,
      supplierReference: supplierReferenceValue || undefined,
      status: selectedStatus,
      priceType: selectedPriceType,
      monthlyPriceCents: selectedPriceType === "mensile" && monthlyPriceValue 
        ? Math.round(parseFloat(monthlyPriceValue) * 100) 
        : undefined,
      flatPriceCents: selectedPriceType === "forfait" && flatPriceValue
        ? Math.round(parseFloat(flatPriceValue) * 100)
        : undefined,
      commissionAmountCents: commissionValue
        ? Math.round(parseFloat(commissionValue) * 100)
        : undefined,
      notes: formData.get("notes") as string || undefined,
    };

    // Handle customer (catalog or temporary)
    if (useTemporaryCustomer) {
      data.customerId = null;
      data.temporaryCustomerName = temporaryCustomerName.trim();
      data.temporaryCustomerEmail = temporaryCustomerEmail.trim() || null;
      data.temporaryCustomerPhone = temporaryCustomerPhone.trim() || null;
    } else {
      data.customerId = selectedCustomerId || null;
      data.temporaryCustomerName = null;
      data.temporaryCustomerEmail = null;
      data.temporaryCustomerPhone = null;
    }

    // Handle assignee (reseller or repair center)
    if (assigneeType === "reseller" && selectedResellerId) {
      // Se è selezionato un sotto-rivenditore, usa quello; altrimenti usa il rivenditore padre
      data.resellerId = (selectedSubResellerId && selectedSubResellerId !== "none") 
        ? selectedSubResellerId 
        : selectedResellerId;
      (data as any).repairCenterId = null;
    } else if (assigneeType === "repair_center" && selectedRepairCenterId) {
      data.resellerId = null;
      (data as any).repairCenterId = selectedRepairCenterId;
    } else {
      // Admin-owned practice
      data.resellerId = null;
      (data as any).repairCenterId = null;
    }

    if (selectedItemType === "service") {
      // Handle supplier (catalog or temporary)
      if (useTemporarySupplier) {
        data.supplierId = null;
        data.temporarySupplierName = temporarySupplierName.trim();
      } else {
        data.supplierId = selectedSupplierId;
        data.temporarySupplierName = null;
      }
      if (useCustomService) {
        data.customServiceName = customServiceName.trim();
        data.serviceId = null;
      } else {
        data.serviceId = selectedServiceId;
        data.customServiceName = null;
      }
      data.productId = null;
    } else if (selectedItemType === "product") {
      data.productId = practiceProducts.length > 0 ? practiceProducts[0].productId : null;
      data.serviceId = null;
      data.customServiceName = null;
      data.supplierId = null;
      data.temporarySupplierName = null;
    } else if (selectedItemType === "service_with_products") {
      // Handle supplier (catalog or temporary)
      if (useTemporarySupplier) {
        data.supplierId = null;
        data.temporarySupplierName = temporarySupplierName.trim();
      } else {
        data.supplierId = selectedSupplierId;
        data.temporarySupplierName = null;
      }
      if (useCustomService) {
        data.customServiceName = customServiceName.trim();
        data.serviceId = null;
      } else {
        data.serviceId = selectedServiceId;
        data.customServiceName = null;
      }
      data.productId = practiceProducts.length > 0 ? practiceProducts[0].productId : null;
    }

    // Include products array for product or service_with_products type practices
    const submitData = (selectedItemType === "product" || selectedItemType === "service_with_products") && practiceProducts.length > 0
      ? { ...data, products: practiceProducts }
      : data;

    if (editingPractice) {
      updateMutation.mutate({ id: editingPractice.id, data: submitData });
    } else {
      createMutation.mutate(submitData as InsertUtilityPractice);
    }
  };

  const handleEdit = async (practice: UtilityPractice) => {
    setEditingPractice(practice);
    setSelectedItemType((practice.itemType as ItemType) || "service");
    setSelectedSupplierId(practice.supplierId || "");
    setSelectedServiceId(practice.serviceId || "");
    setSelectedProductId(practice.productId || "");
    setSelectedCustomerId(practice.customerId || "");
    setSelectedStatus(practice.status);
    setSelectedPriceType((practice.priceType as PriceType) || "mensile");
    setSupplierReferenceValue(practice.supplierReference || "");
    
    // Set price and commission values
    setMonthlyPriceValue(practice.monthlyPriceCents 
      ? (practice.monthlyPriceCents / 100).toFixed(2) 
      : "");
    setFlatPriceValue(practice.flatPriceCents 
      ? (practice.flatPriceCents / 100).toFixed(2) 
      : "");
    setCommissionValue(practice.commissionAmountCents 
      ? (practice.commissionAmountCents / 100).toFixed(2) 
      : "");
    
    // Set custom service mode
    const hasCustomService = !!(practice as any).customServiceName;
    setUseCustomService(hasCustomService);
    setCustomServiceName((practice as any).customServiceName || "");
    
    // Set temporary supplier mode
    const hasTemporarySupplier = !!(practice as any).temporarySupplierName;
    setUseTemporarySupplier(hasTemporarySupplier);
    setTemporarySupplierName((practice as any).temporarySupplierName || "");
    
    // Set temporary customer mode
    const hasTemporaryCustomer = !!(practice as any).temporaryCustomerName;
    setUseTemporaryCustomer(hasTemporaryCustomer);
    setTemporaryCustomerName((practice as any).temporaryCustomerName || "");
    setTemporaryCustomerEmail((practice as any).temporaryCustomerEmail || "");
    setTemporaryCustomerPhone((practice as any).temporaryCustomerPhone || "");
    
    // Set assignee type
    if ((practice as any).repairCenterId) {
      setAssigneeType("repair_center");
      setSelectedRepairCenterId((practice as any).repairCenterId);
      setSelectedResellerId("");
    } else if (practice.resellerId) {
      setAssigneeType("reseller");
      // Verifica se il resellerId è un sotto-rivenditore (ha parentResellerId)
      const assignedReseller = resellers.find(r => r.id === practice.resellerId);
      if (assignedReseller && (assignedReseller as any).parentResellerId) {
        // È un sotto-rivenditore: imposta il parent e il sub
        setSelectedResellerId((assignedReseller as any).parentResellerId);
        setSelectedSubResellerId(practice.resellerId);
      } else {
        // È un rivenditore padre
        setSelectedResellerId(practice.resellerId);
        setSelectedSubResellerId("");
      }
      setSelectedRepairCenterId("");
    } else {
      setAssigneeType("admin");
      setSelectedResellerId("");
      setSelectedSubResellerId("");
      setSelectedRepairCenterId("");
    }
    
    // Load existing practice products
    if (practice.itemType === "product" || practice.itemType === "service_with_products") {
      try {
        const res = await fetch(`/api/utility/practices/${practice.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.practiceProducts && data.practiceProducts.length > 0) {
            setPracticeProducts(data.practiceProducts.map((pp: any) => ({
              productId: pp.productId,
              quantity: pp.quantity,
              unitPriceCents: pp.unitPriceCents,
              notes: pp.notes || "",
            })));
          } else if (practice.productId) {
            // Fallback to single product
            const product = products.find(p => p.id === practice.productId);
            setPracticeProducts([{
              productId: practice.productId,
              quantity: 1,
              unitPriceCents: product?.unitPrice || 0,
            }]);
          } else {
            setPracticeProducts([]);
          }
        }
      } catch {
        setPracticeProducts([]);
      }
    } else {
      setPracticeProducts([]);
    }
    
    setDialogOpen(true);
  };

  const handleNewPractice = () => {
    setEditingPractice(null);
    setSelectedItemType("service");
    setSelectedSupplierId("");
    setSelectedServiceId("");
    setSelectedProductId("");
    setSelectedCustomerId("");
    setSelectedStatus("bozza");
    setSelectedPriceType("mensile");
    setPracticeProducts([]);
    setUseCustomService(false);
    setCustomServiceName("");
    setUseTemporarySupplier(false);
    setTemporarySupplierName("");
    setUseTemporaryCustomer(false);
    setTemporaryCustomerName("");
    setTemporaryCustomerEmail("");
    setTemporaryCustomerPhone("");
    setShowImportField(false);
    setImportText("");
    setSupplierReferenceValue("");
    setAssigneeType("admin");
    setSelectedResellerId("");
    setSelectedSubResellerId("");
    setSelectedRepairCenterId("");
    setMonthlyPriceValue("");
    setFlatPriceValue("");
    setCommissionValue("");
    setDialogOpen(true);
  };

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    
    if (serviceId) {
      // Use allServices to ensure we find the service regardless of timing
      const service = allServices.find(s => s.id === serviceId) || services.find(s => s.id === serviceId);
      if (service) {
        // Determine price type based on available data
        const hasMonthlyPrice = service.monthlyPriceCents && service.monthlyPriceCents > 0;
        const hasActivationFee = service.activationFeeCents && service.activationFeeCents > 0;
        
        if (hasMonthlyPrice) {
          // Service has monthly price - use mensile type
          setSelectedPriceType("mensile");
          setMonthlyPriceValue((service.monthlyPriceCents! / 100).toFixed(2));
          setFlatPriceValue("");
        } else if (hasActivationFee) {
          // Service has only activation fee - use forfait type  
          setSelectedPriceType("forfait");
          setFlatPriceValue((service.activationFeeCents! / 100).toFixed(2));
          setMonthlyPriceValue("");
        } else {
          // No price defined
          setMonthlyPriceValue("");
          setFlatPriceValue("");
        }
        
        // Calculate commission based on service type
        if (service.commissionOneTime && hasActivationFee && !hasMonthlyPrice) {
          // One-time commission for activation-only services
          setCommissionValue((service.commissionOneTime / 100).toFixed(2));
        } else if (service.commissionFixed) {
          // Fixed commission takes priority
          setCommissionValue((service.commissionFixed / 100).toFixed(2));
        } else if (service.commissionPercent) {
          // Calculate percentage based on the price type
          const basePrice = hasMonthlyPrice ? service.monthlyPriceCents : (hasActivationFee ? service.activationFeeCents : 0);
          if (basePrice) {
            const commissionAmount = (basePrice * service.commissionPercent / 100) / 100;
            setCommissionValue(commissionAmount.toFixed(2));
          } else {
            setCommissionValue("");
          }
        } else {
          setCommissionValue("");
        }
      }
    }
  };

  const addProduct = () => {
    setPracticeProducts([...practiceProducts, { productId: "", quantity: 1, unitPriceCents: 0 }]);
  };

  const removeProduct = (index: number) => {
    setPracticeProducts(practiceProducts.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: keyof PracticeProductItem, value: any) => {
    const updated = [...practiceProducts];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fill price when selecting product
    if (field === "productId" && value) {
      const product = products.find(p => p.id === value);
      if (product && updated[index].unitPriceCents === 0) {
        updated[index].unitPriceCents = product.unitPrice || 0;
      }
    }
    
    setPracticeProducts(updated);
  };

  const calculateProductsTotal = () => {
    return practiceProducts.reduce((sum, p) => sum + (p.quantity * p.unitPriceCents), 0);
  };

  const filteredPractices = practices.filter((practice) => {
    const matchesSearch = practice.practiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (practice.supplierReference && practice.supplierReference.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || practice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const customerUsers = customers;

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/utility">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Pratiche Utility</h1>
              <p className="text-sm text-muted-foreground">Gestisci contratti e pratiche di servizi utility</p>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per numero pratica..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
                data-testid="input-search-practices"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleNewPractice} data-testid="button-new-practice">
            <Plus className="h-4 w-4 mr-2" />
            Nuova Pratica
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredPractices.length === 0 ? (
            <div className="text-center py-8">
              <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nessuna pratica trovata</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N. Pratica</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Assegnatario</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Servizio/Prodotto</TableHead>
                  <TableHead>Prezzo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPractices.map((practice) => {
                  const supplier = suppliers.find(s => s.id === practice.supplierId);
                  const service = allServices.find(s => s.id === practice.serviceId);
                  const product = products.find(p => p.id === practice.productId);
                  const customer = customers.find(c => c.id === practice.customerId);
                  const itemType = practice.itemType || "service";
                  const assignedReseller = practice.resellerId ? resellers.find(r => r.id === practice.resellerId) : null;
                  const assignedCenter = (practice as any).repairCenterId ? repairCenters.find(c => c.id === (practice as any).repairCenterId) : null;
                  return (
                    <TableRow key={practice.id} data-testid={`row-practice-${practice.id}`}>
                      <TableCell className="font-medium">
                        {practice.practiceNumber}
                      </TableCell>
                      <TableCell>
                        {customer ? (
                          <div className="flex items-center gap-1">
                            <UserIcon className="h-3 w-3 text-muted-foreground" />
                            {customer.fullName}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {assignedCenter ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{assignedCenter.name}</span>
                          </div>
                        ) : assignedReseller ? (
                          <div className="flex items-center gap-1">
                            <UserIcon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{assignedReseller.fullName || assignedReseller.username}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <User2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Admin</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {itemType === "service" ? "Servizio" : 
                           itemType === "product" ? "Prodotto" : 
                           itemType === "service_with_products" ? "Servizio + Prodotti" : itemType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(itemType === "service" || itemType === "service_with_products") && (service || (practice as any).customServiceName) ? (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-sm">
                                {(practice as any).customServiceName || service?.name}
                              </span>
                              {(practice as any).customServiceName && (
                                <Badge variant="outline" className="text-xs py-0 px-1">Temp.</Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {service ? categoryLabels[service.category] : ""} {supplier ? `• ${supplier.name}` : ""}
                            </span>
                            {itemType === "service_with_products" && (practice as any).practiceProducts?.length > 0 && (
                              <div className="mt-1 pt-1 border-t">
                                {(practice as any).practiceProducts.slice(0, 2).map((pp: any, idx: number) => {
                                  const prod = products.find(p => p.id === pp.productId);
                                  return (
                                    <div key={idx} className="flex items-center gap-1">
                                      <Package className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs">{prod?.name || "Prodotto"} x{pp.quantity}</span>
                                    </div>
                                  );
                                })}
                                {(practice as any).practiceProducts.length > 2 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{(practice as any).practiceProducts.length - 2} altri
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : itemType === "product" ? (
                          <div className="flex flex-col">
                            {(practice as any).practiceProducts?.length > 0 ? (
                              <>
                                {(practice as any).practiceProducts.slice(0, 2).map((pp: any, idx: number) => {
                                  const prod = products.find(p => p.id === pp.productId);
                                  return (
                                    <div key={idx} className="flex items-center gap-1">
                                      <Package className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-sm">{prod?.name || "Prodotto"} x{pp.quantity}</span>
                                    </div>
                                  );
                                })}
                                {(practice as any).practiceProducts.length > 2 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{(practice as any).practiceProducts.length - 2} altri prodotti
                                  </span>
                                )}
                              </>
                            ) : product ? (
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{product.name}</span>
                              </div>
                            ) : "-"}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {practice.priceType === "forfait" && practice.flatPriceCents
                          ? formatCurrency(practice.flatPriceCents)
                          : practice.monthlyPriceCents 
                            ? formatCurrency(practice.monthlyPriceCents) + "/mese"
                            : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[practice.status]}>
                          {statusLabels[practice.status] || practice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/utility/practices/${practice.id}`}>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              data-testid={`button-view-${practice.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(practice)}
                            data-testid={`button-edit-${practice.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              if (confirm("Sei sicuro di voler eliminare questa pratica?")) {
                                deleteMutation.mutate(practice.id);
                              }
                            }}
                            data-testid={`button-delete-${practice.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPractice ? "Modifica Pratica" : "Nuova Pratica Utility"}
            </DialogTitle>
            <DialogDescription>
              {editingPractice 
                ? "Modifica i dati della pratica."
                : "Crea una nuova pratica di servizio utility."}
            </DialogDescription>
          </DialogHeader>
          
          {!editingPractice && (
            <div className="space-y-2">
              {!showImportField ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImportField(true)}
                  className="w-full"
                  data-testid="button-show-import"
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Importa da testo (copia/incolla)
                </Button>
              ) : (
                <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Incolla il testo dal documento</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowImportField(false);
                        setImportText("");
                      }}
                      data-testid="button-close-import"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Seleziona tutto il testo dal PDF (Ctrl+A), copia (Ctrl+C) e incolla qui (Ctrl+V)..."
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    rows={4}
                    className="text-xs"
                    data-testid="input-import-text"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleImportText}
                    disabled={!importText.trim()}
                    className="w-full"
                    data-testid="button-import-text"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Analizza e Importa
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* SEZIONE 1: Tipo e Assegnazione */}
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Tipo Pratica
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={selectedItemType === "service" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedItemType("service")}
                  data-testid="button-item-type-service"
                >
                  <FileCheck className="h-4 w-4 mr-1" />
                  Servizio
                </Button>
                <Button
                  type="button"
                  variant={selectedItemType === "product" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedItemType("product")}
                  data-testid="button-item-type-product"
                >
                  <Package className="h-4 w-4 mr-1" />
                  Prodotto
                </Button>
                <Button
                  type="button"
                  variant={selectedItemType === "service_with_products" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedItemType("service_with_products")}
                  data-testid="button-item-type-service-with-products"
                >
                  Serv.+Prod.
                </Button>
              </div>
              
              <div className="pt-2 border-t border-border/50">
                <Label className="text-xs text-muted-foreground mb-2 block">Assegna a</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={assigneeType === "admin" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setAssigneeType("admin");
                      setSelectedResellerId("");
                      setSelectedSubResellerId("");
                      setSelectedRepairCenterId("");
                    }}
                    data-testid="button-assignee-admin"
                  >
                    <User2 className="h-4 w-4 mr-1" />
                    Admin
                  </Button>
                  <Button
                    type="button"
                    variant={assigneeType === "reseller" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setAssigneeType("reseller");
                      setSelectedSubResellerId("");
                      setSelectedRepairCenterId("");
                    }}
                    data-testid="button-assignee-reseller"
                  >
                    <UserIcon className="h-4 w-4 mr-1" />
                    Rivenditore
                  </Button>
                  <Button
                    type="button"
                    variant={assigneeType === "repair_center" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setAssigneeType("repair_center");
                      setSelectedResellerId("");
                      setSelectedSubResellerId("");
                    }}
                    data-testid="button-assignee-repair-center"
                  >
                    <Building2 className="h-4 w-4 mr-1" />
                    Centro
                  </Button>
                </div>
                
                {assigneeType === "reseller" && (
                  <div className="space-y-2 mt-2">
                    <Select
                      value={selectedResellerId}
                      onValueChange={(value) => {
                        setSelectedResellerId(value);
                        setSelectedSubResellerId("");
                      }}
                    >
                      <SelectTrigger data-testid="select-reseller">
                        <SelectValue placeholder="Seleziona rivenditore" />
                      </SelectTrigger>
                      <SelectContent>
                        {parentResellers.map((reseller) => (
                          <SelectItem key={reseller.id} value={reseller.id}>
                            {reseller.fullName || reseller.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedResellerId && subResellers.length > 0 && (
                      <Select
                        value={selectedSubResellerId}
                        onValueChange={setSelectedSubResellerId}
                      >
                        <SelectTrigger data-testid="select-sub-reseller">
                          <SelectValue placeholder="Assegna a sotto-rivenditore (opzionale)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- Nessuno (assegna al rivenditore) --</SelectItem>
                          {subResellers.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id}>
                              {sub.fullName || sub.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
                
                {assigneeType === "repair_center" && (
                  <Select
                    value={selectedRepairCenterId}
                    onValueChange={setSelectedRepairCenterId}
                  >
                    <SelectTrigger className="mt-2" data-testid="select-repair-center">
                      <SelectValue placeholder="Seleziona centro riparazione" />
                    </SelectTrigger>
                    <SelectContent>
                      {repairCenters.map((center) => (
                        <SelectItem key={center.id} value={center.id}>
                          {center.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* SEZIONE 2: Fornitore e Servizio */}
            {(selectedItemType === "service" || selectedItemType === "service_with_products") && (
              <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Fornitore e Servizio
                </h4>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Fornitore *</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => {
                          setUseTemporarySupplier(!useTemporarySupplier);
                          if (!useTemporarySupplier) setSelectedSupplierId("");
                          else setTemporarySupplierName("");
                        }}
                        data-testid="button-toggle-supplier-mode"
                      >
                        {useTemporarySupplier ? "Da Catalogo" : "Temporaneo"}
                      </Button>
                    </div>
                    {useTemporarySupplier ? (
                      <div className="relative">
                        <Input
                          value={temporarySupplierName}
                          onChange={(e) => setTemporarySupplierName(e.target.value)}
                          placeholder="Nome fornitore (es: TIM, Vodafone...)"
                          required
                          data-testid="input-temporary-supplier-name"
                        />
                        {temporarySupplierName.length >= 2 && (() => {
                          const matches = suppliers.filter(s => 
                            s.isActive && s.name.toLowerCase().includes(temporarySupplierName.toLowerCase())
                          ).slice(0, 5);
                          if (matches.length === 0) return null;
                          return (
                            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
                              <div className="p-1 text-xs text-muted-foreground border-b">
                                Fornitori esistenti trovati:
                              </div>
                              {matches.map(supplier => (
                                <button
                                  key={supplier.id}
                                  type="button"
                                  className="w-full px-3 py-2 text-left text-sm hover-elevate flex items-center gap-2"
                                  onClick={() => {
                                    setUseTemporarySupplier(false);
                                    setSelectedSupplierId(supplier.id);
                                    setTemporarySupplierName("");
                                  }}
                                  data-testid={`suggestion-supplier-${supplier.id}`}
                                >
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span>{supplier.name}</span>
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <Select 
                        name="supplierId" 
                        value={selectedSupplierId}
                        onValueChange={(val) => {
                          setSelectedSupplierId(val);
                          setSelectedServiceId("");
                        }}
                        required
                      >
                        <SelectTrigger data-testid="select-supplier">
                          <SelectValue placeholder="Seleziona fornitore" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.filter(s => s.isActive).map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Servizio *</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => {
                          setUseCustomService(!useCustomService);
                          if (!useCustomService) setSelectedServiceId("");
                          else setCustomServiceName("");
                        }}
                        data-testid="button-toggle-service-mode"
                      >
                        {useCustomService ? "Da Catalogo" : "Temporaneo"}
                      </Button>
                    </div>
                    {useCustomService ? (
                      <Input
                        value={customServiceName}
                        onChange={(e) => setCustomServiceName(e.target.value)}
                        placeholder="Nome servizio (es: Fibra 1Gbps)"
                        required
                        data-testid="input-custom-service-name"
                      />
                    ) : (
                      <Select 
                        name="serviceId" 
                        value={selectedServiceId}
                        onValueChange={handleServiceChange}
                        disabled={!selectedSupplierId}
                        required
                      >
                        <SelectTrigger data-testid="select-service">
                          <SelectValue placeholder={selectedSupplierId ? "Seleziona servizio" : "Prima seleziona fornitore"} />
                        </SelectTrigger>
                        <SelectContent>
                          {services.filter(s => s.isActive).map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} ({categoryLabels[service.category]})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(selectedItemType === "product" || selectedItemType === "service_with_products") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Prodotti *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addProduct}
                    data-testid="button-add-product"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Aggiungi Prodotto
                  </Button>
                </div>
                
                {practiceProducts.length === 0 ? (
                  <div className="text-center py-4 border rounded-md border-dashed">
                    <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nessun prodotto aggiunto. Clicca "Aggiungi Prodotto" per iniziare.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {practiceProducts.map((item, index) => (
                      <div key={index} className="border rounded-lg p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Prodotto {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeProduct(index)}
                            data-testid={`button-remove-product-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="col-span-3 sm:col-span-3">
                            <Label className="text-xs">Prodotto</Label>
                            <Select
                              value={item.productId}
                              onValueChange={(val) => updateProduct(index, "productId", val)}
                            >
                              <SelectTrigger data-testid={`select-product-${index}`}>
                                <SelectValue placeholder="Seleziona prodotto" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.filter(p => p.isActive).map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} {product.sku ? `(${product.sku})` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Quantità</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateProduct(index, "quantity", parseInt(e.target.value) || 1)}
                              data-testid={`input-quantity-${index}`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Prezzo Unit. (EUR)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={(item.unitPriceCents / 100).toFixed(2)}
                              onChange={(e) => updateProduct(index, "unitPriceCents", Math.round(parseFloat(e.target.value || "0") * 100))}
                              data-testid={`input-unit-price-${index}`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Totale</Label>
                            <div className="h-9 flex items-center px-3 bg-muted rounded-md text-sm font-medium">
                              {formatCurrency(item.quantity * item.unitPriceCents)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {practiceProducts.length > 0 && (
                      <div className="flex justify-end pt-2 border-t">
                        <div className="text-right">
                          <span className="text-sm text-muted-foreground mr-2">Totale Prodotti:</span>
                          <span className="font-bold">{formatCurrency(calculateProductsTotal())}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SEZIONE 3: Cliente */}
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <User2 className="h-4 w-4" />
                  Cliente
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => {
                    setUseTemporaryCustomer(!useTemporaryCustomer);
                    if (!useTemporaryCustomer) {
                      setSelectedCustomerId("");
                    } else {
                      setTemporaryCustomerName("");
                      setTemporaryCustomerEmail("");
                      setTemporaryCustomerPhone("");
                    }
                  }}
                  data-testid="button-toggle-customer-mode"
                >
                  {useTemporaryCustomer ? "Da Anagrafica" : "Nuovo Temporaneo"}
                </Button>
              </div>
              {useTemporaryCustomer ? (
                <div className="space-y-2 p-3 border rounded-md bg-muted/30">
                  <div className="relative">
                    <Label className="text-xs">Nome Cliente *</Label>
                    <Input
                      value={temporaryCustomerName}
                      onChange={(e) => setTemporaryCustomerName(e.target.value)}
                      placeholder="Nome e cognome"
                      required
                      data-testid="input-temporary-customer-name"
                    />
                    {temporaryCustomerName.length >= 2 && (() => {
                      const matches = customerUsers.filter(c => 
                        c.fullName?.toLowerCase().includes(temporaryCustomerName.toLowerCase()) ||
                        c.email?.toLowerCase().includes(temporaryCustomerName.toLowerCase())
                      ).slice(0, 5);
                      if (matches.length === 0) return null;
                      return (
                        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
                          <div className="p-1 text-xs text-muted-foreground border-b">
                            Clienti esistenti trovati:
                          </div>
                          {matches.map(customer => (
                            <button
                              key={customer.id}
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm hover-elevate flex items-center gap-2"
                              onClick={() => {
                                setUseTemporaryCustomer(false);
                                setSelectedCustomerId(customer.id);
                                setTemporaryCustomerName("");
                                setTemporaryCustomerEmail("");
                                setTemporaryCustomerPhone("");
                              }}
                              data-testid={`suggestion-customer-${customer.id}`}
                            >
                              <User2 className="h-4 w-4 text-muted-foreground" />
                              <div className="flex flex-col">
                                <span>{customer.fullName}</span>
                                <span className="text-xs text-muted-foreground">{customer.email}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input
                        type="email"
                        value={temporaryCustomerEmail}
                        onChange={(e) => setTemporaryCustomerEmail(e.target.value)}
                        placeholder="email@esempio.it"
                        data-testid="input-temporary-customer-email"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Telefono</Label>
                      <Input
                        value={temporaryCustomerPhone}
                        onChange={(e) => setTemporaryCustomerPhone(e.target.value)}
                        placeholder="+39..."
                        data-testid="input-temporary-customer-phone"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select 
                    name="customerId" 
                    value={selectedCustomerId}
                    onValueChange={setSelectedCustomerId}
                    required
                  >
                    <SelectTrigger data-testid="select-customer" className="flex-1">
                      <SelectValue placeholder="Seleziona cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerUsers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.fullName} ({customer.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setNewCustomerDialogOpen(true)}
                    title="Nuovo cliente"
                    data-testid="button-new-customer"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* SEZIONE 4: Prezzi e Stato */}
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Prezzi e Stato
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Tipo Prezzo</Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant={selectedPriceType === "mensile" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPriceType("mensile")}
                      className="flex-1"
                      data-testid="button-price-mensile"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Mensile
                    </Button>
                    <Button
                      type="button"
                      variant={selectedPriceType === "forfait" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPriceType("forfait")}
                      className="flex-1"
                      data-testid="button-price-forfait"
                    >
                      <Euro className="h-3 w-3 mr-1" />
                      Forfait
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Stato</Label>
                  <Select 
                    value={selectedStatus}
                    onValueChange={(v) => setSelectedStatus(v as PracticeStatus)}
                  >
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  {selectedPriceType === "mensile" ? (
                    <>
                      <Label className="text-xs">Prezzo Mensile (€)</Label>
                      <Input
                        id="monthlyPriceCents"
                        name="monthlyPriceCents"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={monthlyPriceValue}
                        onChange={(e) => setMonthlyPriceValue(e.target.value)}
                        data-testid="input-monthly-price"
                      />
                    </>
                  ) : (
                    <>
                      <Label className="text-xs">Prezzo Forfait (€)</Label>
                      <Input
                        id="flatPriceCents"
                        name="flatPriceCents"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={flatPriceValue}
                        onChange={(e) => setFlatPriceValue(e.target.value)}
                        data-testid="input-flat-price"
                      />
                    </>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Commissione (€)</Label>
                  <Input
                    id="commissionAmountCents"
                    name="commissionAmountCents"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(e.target.value)}
                    data-testid="input-commission"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Rif. Fornitore</Label>
                  <Input
                    id="supplierReference"
                    name="supplierReference"
                    value={supplierReferenceValue}
                    onChange={(e) => setSupplierReferenceValue(e.target.value)}
                    placeholder="Codice pratica"
                    data-testid="input-supplier-reference"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Note (opzionale)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  placeholder="Note aggiuntive..."
                  defaultValue={editingPractice?.notes || ""}
                  data-testid="input-notes"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                data-testid="button-cancel"
              >
                Annulla
              </Button>
              <Button 
                type="submit"
                disabled={
                  createMutation.isPending || 
                  updateMutation.isPending ||
                  (assigneeType === "reseller" && !selectedResellerId) ||
                  (assigneeType === "repair_center" && !selectedRepairCenterId)
                }
                data-testid="button-save"
              >
                {editingPractice ? "Salva Modifiche" : "Crea Pratica"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog creazione nuovo cliente */}
      <Dialog open={newCustomerDialogOpen} onOpenChange={setNewCustomerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuovo Cliente</DialogTitle>
            <DialogDescription>
              Crea rapidamente un nuovo cliente. Solo il nome è obbligatorio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newCustomerName">Nome Completo *</Label>
              <Input
                id="newCustomerName"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Mario Rossi"
                data-testid="input-new-customer-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newCustomerEmail">Email (opzionale)</Label>
              <Input
                id="newCustomerEmail"
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                placeholder="mario.rossi@email.com"
                data-testid="input-new-customer-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newCustomerPhone">Telefono (opzionale)</Label>
              <Input
                id="newCustomerPhone"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="+39 123 456 7890"
                data-testid="input-new-customer-phone"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewCustomerDialogOpen(false);
                  setNewCustomerName("");
                  setNewCustomerEmail("");
                  setNewCustomerPhone("");
                }}
                data-testid="button-cancel-new-customer"
              >
                Annulla
              </Button>
              <Button
                type="button"
                onClick={handleCreateCustomer}
                disabled={createCustomerMutation.isPending}
                data-testid="button-save-new-customer"
              >
                {createCustomerMutation.isPending ? "Creazione..." : "Crea Cliente"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
