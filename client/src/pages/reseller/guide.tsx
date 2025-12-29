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
  CreditCard
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
        "Registra le parti utilizzate e i costi"
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
        "Trasferisci prodotti tra magazzini della rete"
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
        "Personalizza i template delle fatture",
        "Esporta i dati per la contabilita",
        "Monitora i pagamenti in sospeso"
      ]
    },
    {
      icon: Store,
      title: "E-commerce",
      description: "Vendi online ai tuoi clienti",
      features: [
        "Configura il catalogo prodotti per lo shop",
        "Gestisci gli ordini dei clienti online",
        "Traccia spedizioni e consegne",
        "Gestisci resi e rimborsi"
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
        "Traccia lo stato degli ordini"
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
        "Collega le integrazioni esterne"
      ]
    }
  ];

  return (
    <div className="p-6 space-y-6" data-testid="page-reseller-guide">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-guide-title">
          Guida alla Piattaforma
        </h1>
        <p className="text-muted-foreground mt-1" data-testid="text-guide-subtitle">
          Scopri tutte le funzionalita di MonkeyPlan per gestire al meglio la tua attivita
        </p>
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
