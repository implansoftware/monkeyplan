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

interface GuideSectionProps {
  icon: typeof Users;
  title: string;
  description: string;
  features: string[];
}

function GuideSection({ icon: Icon, title, description, features }: GuideSectionProps) {
  return (
    <Card data-testid={`card-guide-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
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
      title: "Centri di Riparazione",
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
      title: "Lavorazioni",
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
      title: "Magazzino",
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
      title: "Fornitori",
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
      title: "Fatturazione",
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
      title: "E-commerce",
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
      title: "Acquisti B2B",
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
      title: "Utility",
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
      title: "Pagamenti",
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
      title: "Impostazioni",
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
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-guide-title">Guida alla Piattaforma</h1>
              <p className="text-sm text-muted-foreground" data-testid="text-guide-subtitle">Scopri tutte le funzionalita di MonkeyPlan per gestire al meglio la tua attivita</p>
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

      <Card className="bg-muted/50" data-testid="card-guide-support">
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
