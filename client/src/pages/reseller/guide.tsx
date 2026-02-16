import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Wrench, 
  Package, 
  FileText, 
  Warehouse, 
  Truck,
  ShoppingCart,
  Store,
  Zap,
  Building,
  Settings,
  CreditCard,
  Shield,
  BarChart3,
  Link2,
  Calendar,
  RefreshCcw,
  PackageCheck,
  LayoutDashboard
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface GuideSectionProps {
  icon: typeof Users;
  title: string;
  description: string;
  features: string[];
}

function GuideSection({ icon: Icon, title, description, features }: GuideSectionProps) {
  return (
    <Card className="rounded-2xl" data-testid={`card-guide-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary mt-1">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function ResellerGuide() {
  const { t } = useTranslation();
  const sections: GuideSectionProps[] = [
    {
      icon: LayoutDashboard,
      title: "Dashboard Personalizzabile",
      description: "Configura la tua dashboard secondo le tue esigenze",
      features: [
        "Personalizza i widget visibili nella dashboard",
        "Riordina i widget trascinandoli nella posizione desiderata",
        "Nascondi i widget che non utilizzi frequentemente",
        "Le preferenze sono salvate per ogni utente"
      ]
    },
    {
      icon: Users,
      title: "Gestione Clienti",
      description: "Gestisci la tua base clienti in modo efficiente",
      features: [
        "Aggiungi nuovi clienti con tutti i dati anagrafici",
        "Visualizza lo storico delle riparazioni per cliente",
        "Gestisci i contatti e le preferenze di comunicazione",
        "Assegna clienti ai tuoi centri di riparazione"
      ]
    },
    {
      icon: Building,
      title: t("admin.repairCenters.title"),
      description: "Gestisci i tuoi centri di riparazione e il loro personale",
      features: [
        "Crea e configura nuovi centri di riparazione",
        "Assegna tecnici e personale ai centri",
        "Monitora le prestazioni di ogni centro",
        "Configura gli orari di apertura e appuntamenti"
      ]
    },
    {
      icon: Wrench,
      title: t("sidebar.items.jobs"),
      description: "Gestisci le riparazioni dall'accettazione alla consegna",
      features: [
        "Crea nuove riparazioni con il wizard guidato",
        "Traccia lo stato di avanzamento di ogni riparazione",
        "Gestisci preventivi e approvazioni cliente",
        "Registra le parti utilizzate e i costi",
        "Crea diagnosi e preventivi durante l'accettazione"
      ]
    },
    {
      icon: Shield,
      title: "Garanzie e Assicurazioni",
      description: "Offri estensioni di garanzia ai tuoi clienti",
      features: [
        "Crea prodotti garanzia personalizzati",
        "Offri garanzie direttamente dalla pagina riparazione",
        "Visualizza analytics sulle vendite garanzie",
        "Genera fatture automatiche per le garanzie vendute",
        "I clienti possono visualizzare le loro garanzie nel portale"
      ]
    },
    {
      icon: Warehouse,
      title: t("warehouse.title"),
      description: "Controlla l'inventario dei ricambi e accessori",
      features: [
        "Visualizza le giacenze in tempo reale",
        "Gestisci i movimenti di magazzino",
        "Imposta soglie minime per i riordini",
        "Trasferisci prodotti tra magazzini della rete",
        "Lo stock viene aggiornato automaticamente su ordini e vendite"
      ]
    },
    {
      icon: RefreshCcw,
      title: "Gestione Stock Automatica",
      description: "Lo stock si aggiorna automaticamente con ogni operazione",
      features: [
        "Ordini e-commerce scalano lo stock dal magazzino",
        "Ordini B2B trasferiscono stock tra magazzini",
        "Ricezione merce da fornitori aggiorna le giacenze",
        "Annullamento ordini ripristina automaticamente lo stock",
        "Movimenti di magazzino tracciati per ogni operazione"
      ]
    },
    {
      icon: Package,
      title: "Ricambi e Accessori",
      description: "Catalogo completo di ricambi e accessori",
      features: [
        "Sfoglia il catalogo ricambi per dispositivo",
        "Verifica compatibilita e disponibilita",
        "Gestisci i prezzi di vendita al cliente",
        "Ordina ricambi dai fornitori integrati"
      ]
    },
    {
      icon: Link2,
      title: "Integrazioni Fornitori",
      description: "Collegati ai principali fornitori di ricambi",
      features: [
        "Integrazione con SIFAR per ricambi originali",
        "Integrazione con Foneday per accessori",
        "Integrazione con MobileSentrix",
        "Integrazione con TrovaUsati per l'usato",
        "Ordini automatici con aggiornamento stock"
      ]
    },
    {
      icon: Truck,
      title: t("suppliers.title"),
      description: "Gestisci i tuoi fornitori e gli ordini",
      features: [
        "Configura i fornitori con i loro listini",
        "Crea ordini di acquisto",
        "Traccia le spedizioni in arrivo",
        "Gestisci resi e contestazioni"
      ]
    },
    {
      icon: FileText,
      title: t("settings.billing"),
      description: "Gestione completa della fatturazione",
      features: [
        "Genera fatture automatiche per le riparazioni",
        "Fatturazione automatica su ordini e-commerce",
        "Fatturazione automatica su vendita garanzie",
        "Esporta i dati per la contabilita",
        "Monitora i pagamenti in sospeso"
      ]
    },
    {
      icon: BarChart3,
      title: "Sibill",
      description: "Integrazione per fatturazione elettronica",
      features: [
        "Collega il tuo account Sibill",
        "Sincronizza fatture e documenti",
        "Riconciliazione bancaria automatica",
        "Gestione conti e transazioni"
      ]
    },
    {
      icon: Store,
      title: t("sidebar.sections.ecommerce"),
      description: "Vendi online ai tuoi clienti",
      features: [
        "Configura il catalogo prodotti per lo shop",
        "Gestisci gli ordini dei clienti online",
        "Verifica disponibilita stock in tempo reale",
        "Traccia spedizioni e consegne",
        "Gestisci resi e rimborsi con ripristino stock"
      ]
    },
    {
      icon: ShoppingCart,
      title: t("sidebar.sections.purchasesB2B"),
      description: "Ordina dalla piattaforma centrale",
      features: [
        "Sfoglia il catalogo B2B dell'admin",
        "Effettua ordini all'ingrosso",
        "Visualizza i prezzi riservati",
        "Traccia lo stato degli ordini",
        "Ricevi lo stock direttamente nel tuo magazzino"
      ]
    },
    {
      icon: PackageCheck,
      title: "Ordini B2B Centri Riparazione",
      description: "Gestisci gli ordini dai tuoi centri di riparazione",
      features: [
        "Ricevi ordini dai centri della tua rete",
        "Approva o rifiuta le richieste",
        "Spedisci merce con trasferimento stock automatico",
        "Traccia consegne e conferme di ricezione",
        "Fatturazione automatica alla spedizione"
      ]
    },
    {
      icon: Calendar,
      title: "Presenze e HR",
      description: "Gestisci le presenze del personale",
      features: [
        "Registra entrate e uscite del personale",
        "Visualizza lo storico presenze",
        "Calcola ore lavorate automaticamente",
        "Gestisci ferie e permessi"
      ]
    },
    {
      icon: Zap,
      title: t("utility.title"),
      description: "Gestisci pratiche per servizi aggiuntivi",
      features: [
        "Configura i fornitori di servizi utility",
        "Crea pratiche per luce, gas, telefonia",
        "Gestisci le commissioni sulle pratiche",
        "Monitora i report delle attivita"
      ]
    },
    {
      icon: CreditCard,
      title: t("sidebar.items.payments"),
      description: "Gestisci incassi e pagamenti",
      features: [
        "Registra i pagamenti dei clienti",
        "Configura metodi di pagamento accettati",
        "Visualizza lo storico transazioni",
        "Gestisci rimborsi e note di credito"
      ]
    },
    {
      icon: Settings,
      title: t("settings.title"),
      description: "Configura il tuo account e preferenze",
      features: [
        "Personalizza i dati aziendali",
        "Configura le notifiche email",
        "Gestisci il team e i permessi",
        "Collega le integrazioni esterne",
        "Gestisci sub-reseller e fatturazione autonoma"
      ]
    }
  ];

  return (
    <div className="p-6 space-y-6" data-testid="page-reseller-guide">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 15 L45 15 L37 22 L40 32 L30 26 L20 32 L23 22 L15 15 L25 15 Z' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white" data-testid="text-guide-title">Guida alla Piattaforma</h1>
              <p className="text-sm text-white/80" data-testid="text-guide-subtitle">Scopri tutte le funzionalita di MonkeyPlan per gestire al meglio la tua attivita</p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <GuideSection key={section.title} {...section} />
        ))}
      </div>

      <Card className="bg-muted/50 rounded-2xl" data-testid="card-guide-support">
        <CardHeader>
          <CardTitle className="text-lg">Hai bisogno di aiuto?</CardTitle>
          <CardDescription>
            Se hai domande o problemi, il nostro team di supporto e sempre disponibile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Apri un ticket dalla sezione "Assistenza" per ricevere supporto personalizzato. 
            Il nostro team rispondera nel piu breve tempo possibile.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
