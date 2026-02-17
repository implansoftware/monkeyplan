import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FolderOpen, Plus, Pencil, Trash2, Loader2, GripVertical, Check, ChevronsUpDown,
  Phone, Smartphone, Building2, Lightbulb, Flame, Zap,
  Wifi, Router, Globe, Server, Monitor, Laptop, Tablet, Watch,
  Tv, Radio, Headphones, Speaker, Camera, Printer, HardDrive,
  Cpu, Database, Cloud, Signal, Antenna, Cable, Plug,
  Battery, BatteryCharging, Power, Sun, Moon, Thermometer,
  Droplet, Wind, Snowflake, CloudRain, Umbrella,
  Home, Building, Factory, Store, Warehouse, Hospital, School, Church,
  Car, Truck, Bus, Train, Plane, Ship, Bike, Fuel,
  CreditCard, Wallet, Coins, DollarSign, Euro, Banknote, Receipt,
  FileText, File, Folder, Archive, Package, Box, Gift,
  ShoppingCart, ShoppingBag, Tag, Percent, BarChart, PieChart, TrendingUp,
  Clock, Calendar, Timer, Bell, BellRing,
  Mail, MessageSquare, MessageCircle, Send, Inbox, AtSign,
  Lock, Unlock, Key, Shield, Eye, EyeOff,
  User, Users, UserPlus, UserCheck, Contact, Briefcase,
  Heart, Star, Award, Trophy, Medal, Flag,
  Wrench, Hammer, Scissors, Paintbrush, Palette,
  Music, Play, Pause, Square, Circle, Triangle,
  MapPin, Map, Compass, Navigation, Globe2, Earth,
  Coffee, Utensils, Pizza, Apple, Leaf, Trees, Flower,
  Book, BookOpen, GraduationCap, Lightbulb as LightbulbIcon, Pencil as PencilIcon,
  Settings, Cog, Sliders, ToggleLeft, RefreshCw, RotateCcw,
  Link, ExternalLink, Share, Download, Upload, Save,
  Search, ZoomIn, ZoomOut, Filter, List, Grid,
  CheckCircle, XCircle, AlertCircle, Info, HelpCircle, AlertTriangle,
  type LucideIcon
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UtilityCategory } from "@shared/schema";
import { useTranslation } from "react-i18next";

const ICON_OPTIONS: { value: string; labelKey: string; icon: LucideIcon; tags: string[] }[] = [
  { value: "Phone", labelKey: "icons.phone", icon: Phone, tags: ["telefono", "fisso", "chiamata", "phone", "call"] },
  { value: "Smartphone", labelKey: "icons.smartphone", icon: Smartphone, tags: ["cellulare", "mobile", "telefono", "smartphone"] },
  { value: "Building2", labelKey: "icons.building", icon: Building2, tags: ["palazzo", "ufficio", "centralino", "building", "office"] },
  { value: "Lightbulb", labelKey: "icons.lightbulb", icon: Lightbulb, tags: ["luce", "energia", "elettrico", "light", "bulb"] },
  { value: "Flame", labelKey: "icons.flame", icon: Flame, tags: ["gas", "fuoco", "riscaldamento", "fire", "flame"] },
  { value: "Zap", labelKey: "icons.lightning", icon: Zap, tags: ["elettricità", "energia", "luce", "electricity", "lightning"] },
  { value: "Wifi", labelKey: "icons.wifi", icon: Wifi, tags: ["internet", "wireless", "rete", "wifi"] },
  { value: "Router", labelKey: "icons.router", icon: Router, tags: ["internet", "rete", "modem", "router"] },
  { value: "Globe", labelKey: "icons.globe", icon: Globe, tags: ["internet", "mondo", "web", "globe", "world"] },
  { value: "Server", labelKey: "icons.server", icon: Server, tags: ["hosting", "cloud", "dati", "server", "data"] },
  { value: "Monitor", labelKey: "icons.monitor", icon: Monitor, tags: ["schermo", "computer", "display", "monitor", "screen"] },
  { value: "Laptop", labelKey: "icons.laptop", icon: Laptop, tags: ["portatile", "computer", "notebook", "laptop"] },
  { value: "Tablet", labelKey: "icons.tablet", icon: Tablet, tags: ["ipad", "tavoletta", "mobile", "tablet"] },
  { value: "Tv", labelKey: "icons.tv", icon: Tv, tags: ["televisione", "schermo", "video", "tv", "television"] },
  { value: "Radio", labelKey: "icons.radio", icon: Radio, tags: ["audio", "musica", "onde", "radio"] },
  { value: "Headphones", labelKey: "icons.headphones", icon: Headphones, tags: ["audio", "musica", "ascolto", "headphones"] },
  { value: "Camera", labelKey: "icons.camera", icon: Camera, tags: ["foto", "video", "sicurezza", "camera", "photo"] },
  { value: "Printer", labelKey: "icons.printer", icon: Printer, tags: ["stampa", "ufficio", "documento", "printer"] },
  { value: "HardDrive", labelKey: "icons.hardDrive", icon: HardDrive, tags: ["memoria", "storage", "dati", "hard drive", "disk"] },
  { value: "Cloud", labelKey: "icons.cloud", icon: Cloud, tags: ["nuvola", "storage", "online", "cloud"] },
  { value: "Signal", labelKey: "icons.signal", icon: Signal, tags: ["rete", "copertura", "mobile", "signal", "network"] },
  { value: "Cable", labelKey: "icons.cable", icon: Cable, tags: ["fibra", "connessione", "ethernet", "cable", "fiber"] },
  { value: "Plug", labelKey: "icons.plug", icon: Plug, tags: ["corrente", "elettricità", "presa", "plug", "socket"] },
  { value: "Battery", labelKey: "icons.battery", icon: Battery, tags: ["energia", "autonomia", "carica", "battery"] },
  { value: "Power", labelKey: "icons.power", icon: Power, tags: ["on", "off", "alimentazione", "power"] },
  { value: "Sun", labelKey: "icons.sun", icon: Sun, tags: ["solare", "fotovoltaico", "energia", "sun", "solar"] },
  { value: "Thermometer", labelKey: "icons.thermometer", icon: Thermometer, tags: ["temperatura", "clima", "riscaldamento", "thermometer", "temperature"] },
  { value: "Droplet", labelKey: "icons.droplet", icon: Droplet, tags: ["acqua", "idrico", "liquido", "water", "droplet"] },
  { value: "Wind", labelKey: "icons.wind", icon: Wind, tags: ["eolico", "aria", "ventilazione", "wind"] },
  { value: "Snowflake", labelKey: "icons.snowflake", icon: Snowflake, tags: ["freddo", "climatizzazione", "aria", "snowflake", "cold"] },
  { value: "Home", labelKey: "icons.home", icon: Home, tags: ["abitazione", "domestico", "residenziale", "home", "house"] },
  { value: "Building", labelKey: "icons.palazzo", icon: Building, tags: ["condominio", "ufficio", "commerciale", "building", "office"] },
  { value: "Factory", labelKey: "icons.factory", icon: Factory, tags: ["industria", "produzione", "manifattura", "factory", "industry"] },
  { value: "Store", labelKey: "icons.store", icon: Store, tags: ["commercio", "retail", "vendita", "store", "shop"] },
  { value: "Warehouse", labelKey: "icons.warehouse", icon: Warehouse, tags: ["deposito", "logistica", "stoccaggio", "warehouse"] },
  { value: "Hospital", labelKey: "icons.hospital", icon: Hospital, tags: ["sanità", "medico", "salute", "hospital", "health"] },
  { value: "Car", labelKey: "icons.car", icon: Car, tags: ["veicolo", "trasporto", "mobilità", "car", "vehicle"] },
  { value: "Fuel", labelKey: "icons.fuel", icon: Fuel, tags: ["benzina", "diesel", "rifornimento", "fuel", "gas"] },
  { value: "CreditCard", labelKey: "icons.creditCard", icon: CreditCard, tags: ["pagamento", "banca", "finanza", "credit card", "payment"] },
  { value: "Wallet", labelKey: "icons.wallet", icon: Wallet, tags: ["soldi", "pagamento", "finanza", "wallet", "money"] },
  { value: "Coins", labelKey: "icons.coins", icon: Coins, tags: ["soldi", "denaro", "risparmio", "coins", "money"] },
  { value: "Receipt", labelKey: "icons.receipt", icon: Receipt, tags: ["fattura", "bolletta", "pagamento", "receipt", "invoice"] },
  { value: "FileText", labelKey: "icons.document", icon: FileText, tags: ["contratto", "pratica", "testo", "document", "file"] },
  { value: "Package", labelKey: "icons.package", icon: Package, tags: ["spedizione", "consegna", "prodotto", "package", "delivery"] },
  { value: "ShoppingCart", labelKey: "icons.shoppingCart", icon: ShoppingCart, tags: ["acquisto", "spesa", "ecommerce", "cart", "shopping"] },
  { value: "Clock", labelKey: "icons.clock", icon: Clock, tags: ["tempo", "orario", "durata", "clock", "time"] },
  { value: "Calendar", labelKey: "icons.calendar", icon: Calendar, tags: ["data", "appuntamento", "scadenza", "calendar", "date"] },
  { value: "Bell", labelKey: "icons.bell", icon: Bell, tags: ["notifica", "avviso", "allarme", "bell", "notification"] },
  { value: "Mail", labelKey: "icons.mail", icon: Mail, tags: ["posta", "messaggio", "comunicazione", "email", "mail"] },
  { value: "MessageSquare", labelKey: "icons.message", icon: MessageSquare, tags: ["chat", "sms", "comunicazione", "message", "chat"] },
  { value: "Lock", labelKey: "icons.lock", icon: Lock, tags: ["sicurezza", "protezione", "accesso", "lock", "security"] },
  { value: "Shield", labelKey: "icons.shield", icon: Shield, tags: ["sicurezza", "protezione", "difesa", "shield", "security"] },
  { value: "User", labelKey: "icons.user", icon: User, tags: ["persona", "account", "profilo", "user", "person"] },
  { value: "Users", labelKey: "icons.users", icon: Users, tags: ["gruppo", "team", "persone", "users", "group"] },
  { value: "Briefcase", labelKey: "icons.briefcase", icon: Briefcase, tags: ["lavoro", "business", "ufficio", "briefcase", "work"] },
  { value: "Wrench", labelKey: "icons.wrench", icon: Wrench, tags: ["riparazione", "manutenzione", "tecnico", "attrezzo", "wrench", "repair"] },
  { value: "Hammer", labelKey: "icons.hammer", icon: Hammer, tags: ["riparazione", "costruzione", "lavoro", "hammer", "repair"] },
  { value: "Settings", labelKey: "icons.settings", icon: Settings, tags: ["configurazione", "opzioni", "sistema", "settings", "config"] },
  { value: "Link", labelKey: "icons.link", icon: Link, tags: ["collegamento", "connessione", "url", "link"] },
  { value: "CheckCircle", labelKey: "icons.checkCircle", icon: CheckCircle, tags: ["conferma", "ok", "approvato", "check", "confirm"] },
  { value: "AlertCircle", labelKey: "icons.alertCircle", icon: AlertCircle, tags: ["avviso", "errore", "problema", "alert", "warning"] },
  { value: "Info", labelKey: "icons.info", icon: Info, tags: ["informazione", "aiuto", "dettagli", "info", "information"] },
  { value: "HelpCircle", labelKey: "icons.helpCircle", icon: HelpCircle, tags: ["domanda", "supporto", "assistenza", "help", "support"] },
];

const COLOR_OPTIONS = [
  { value: "#0088FE", labelKey: "colors.blue" },
  { value: "#00C49F", labelKey: "colors.aquaGreen" },
  { value: "#FFBB28", labelKey: "colors.yellow" },
  { value: "#FF8042", labelKey: "colors.orange" },
  { value: "#8884d8", labelKey: "colors.purple" },
  { value: "#82ca9d", labelKey: "colors.green" },
  { value: "#e74c3c", labelKey: "colors.red" },
  { value: "#3498db", labelKey: "colors.lightBlue" },
];

function getIconComponent(iconName: string | null) {
  const option = ICON_OPTIONS.find(o => o.value === iconName);
  return option?.icon || Zap;
}

function IconPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const filteredIcons = useMemo(() => {
    if (!search.trim()) return ICON_OPTIONS;
    const searchLower = search.toLowerCase();
    return ICON_OPTIONS.filter(
      (opt) =>
        t(opt.labelKey).toLowerCase().includes(searchLower) ||
        opt.value.toLowerCase().includes(searchLower) ||
        opt.tags.some((tag) => tag.includes(searchLower))
    );
  }, [search]);
  
  const selectedOption = ICON_OPTIONS.find((o) => o.value === value);
  const SelectedIcon = selectedOption?.icon || Zap;
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          data-testid="button-icon-picker"
        >
          <div className="flex flex-wrap items-center gap-2">
            <SelectedIcon className="h-4 w-4" />
            <span>{selectedOption ? t(selectedOption.labelKey) : t("utility.selectIcon")}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={t("common.search")} 
            value={search}
            onValueChange={setSearch}
            data-testid="input-search-icon"
          />
          <CommandList>
            <CommandEmpty>{t("utility.noIconFound")}</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-[250px]">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 p-2">
                  {filteredIcons.map((option) => {
                    const IconComp = option.icon;
                    const isSelected = value === option.value;
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant={isSelected ? "default" : "ghost"}
                        size="icon"
                        className="relative"
                        onClick={() => {
                          onChange(option.value);
                          setOpen(false);
                          setSearch("");
                        }}
                        title={t(option.labelKey)}
                        data-testid={`button-icon-${option.value}`}
                      >
                        <IconComp className="h-4 w-4" />
                        {isSelected && (
                          <Check className="h-3 w-3 absolute -top-1 -right-1 text-primary-foreground bg-primary rounded-full p-0.5" />
                        )}
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function AdminUtilityCategories() {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<UtilityCategory | null>(null);
  const [form, setForm] = useState({
    slug: "",
    name: "",
    description: "",
    icon: "Zap",
    color: "#0088FE",
    sortOrder: 0,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<UtilityCategory | null>(null);

  const { data: categories = [], isLoading } = useQuery<UtilityCategory[]>({
    queryKey: ["/api/utility/categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return apiRequest("POST", "/api/admin/utility/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/categories"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: t("utility.categoryCreated"), description: t("utility.categoryCreated") });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UtilityCategory> }) => {
      return apiRequest("PATCH", `/api/admin/utility/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/categories"] });
      setDialogOpen(false);
      setEditingCategory(null);
      resetForm();
      toast({ title: t("utility.categoryUpdated") });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/utility/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/categories"] });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      toast({ title: t("utility.categoryDeleted") });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/admin/utility/categories/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/categories"] });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setForm({
      slug: "",
      name: "",
      description: "",
      icon: "Zap",
      color: "#0088FE",
      sortOrder: 0,
    });
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    resetForm();
    const maxOrder = categories.reduce((max, c) => Math.max(max, c.sortOrder), 0);
    setForm(prev => ({ ...prev, sortOrder: maxOrder + 1 }));
    setDialogOpen(true);
  };

  const openEditDialog = (category: UtilityCategory) => {
    setEditingCategory(category);
    setForm({
      slug: category.slug,
      name: category.name,
      description: category.description || "",
      icon: category.icon || "Zap",
      color: category.color || "#0088FE",
      sortOrder: category.sortOrder,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: t("common.error"), description: t("utility.nameAndSlugRequired"), variant: "destructive" });
      return;
    }
    
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (category: UtilityCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete.id);
    }
  };

  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <FolderOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t("utility.utilityCategoryCatalog")}</h1>
            <p className="text-muted-foreground">{t("utility.manageCategoriesForUtility")}</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-wrap items-center gap-3">
          <FolderOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t("utility.utilityCategoryCatalog")}</h1>
            <p className="text-muted-foreground">{t("utility.manageCategoriesForUtility")}</p>
          </div>
        </div>
        <Button onClick={openCreateDialog} data-testid="button-add-category">
          <Plus className="h-4 w-4 mr-2" />
          {t("utility.newCategory")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("utility.categoriesCount")} ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("utility.noCategories")}</p>
              <p className="text-sm">{t("utility.createFirstCategory")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">{t("utility.order")}</TableHead>
                  <TableHead>{t("utility.icon")}</TableHead>
                  <TableHead>{t("common.name")}</TableHead>
                  <TableHead>{t("utility.slugLabel")}</TableHead>
                  <TableHead>{t("common.description")}</TableHead>
                  <TableHead>{t("products.color")}</TableHead>
                  <TableHead>{t("common.active")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCategories.map((category) => {
                  const IconComponent = getIconComponent(category.icon);
                  return (
                    <TableRow key={category.id} data-testid={`row-category-${category.id}`}>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1 text-muted-foreground">
                          <GripVertical className="h-4 w-4" />
                          {category.sortOrder}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: category.color || "#0088FE" }}
                        >
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{category.slug}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-48 truncate">
                        {category.description || "-"}
                      </TableCell>
                      <TableCell>
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: category.color || "#0088FE" }}
                          title={category.color || "Default"}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={category.isActive}
                          onCheckedChange={(checked) => 
                            toggleActiveMutation.mutate({ id: category.id, isActive: checked })
                          }
                          data-testid={`switch-active-${category.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditDialog(category)}
                            data-testid={`button-edit-${category.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(category)}
                            data-testid={`button-delete-${category.id}`}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? t("utility.editCategory") : t("utility.newCategory")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("common.name")} *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("utility.examplePhoneName")}
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("utility.slugLabel")} *</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder={t("utility.slugPlaceholder")}
                  disabled={!!editingCategory}
                  data-testid="input-slug"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{t("common.description")}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t("utility.categoryDescription")}
                rows={2}
                data-testid="input-description"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("utility.icon")}</Label>
                <IconPicker 
                  value={form.icon} 
                  onChange={(icon) => setForm({ ...form, icon })} 
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t("products.color")}</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        form.color === option.value ? "ring-2 ring-primary ring-offset-2" : ""
                      }`}
                      style={{ backgroundColor: option.value }}
                      onClick={() => setForm({ ...form, color: option.value })}
                      title={t(option.labelKey)}
                      data-testid={`button-color-${option.value}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("settings.displayOrder")}</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                min={0}
                data-testid="input-sort-order"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-submit"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingCategory ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.confirmDeleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("utility.deleteCategoryConfirm", { name: categoryToDelete?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
