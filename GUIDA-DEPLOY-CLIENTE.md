# Guida Completa: Da Replit a Produzione per il Cliente

## Panoramica

Questa guida copre tutto il percorso per consegnare MonkeyPlan a un cliente:
1. Esportare il codice da Replit a GitHub
2. Deployare su Railway (account del cliente)
3. Configurare database e variabili d'ambiente
4. Collegare un dominio personalizzato
5. Creare l'app mobile nativa con Capacitor

---

## FASE 1: Preparare il Repository GitHub

### 1.1 Crea l'organizzazione GitHub (una volta sola)

1. Vai su https://github.com e accedi con il tuo account
2. Clicca sulla tua foto profilo in alto a destra > "Your organizations"
3. Clicca "New organization" > scegli il piano **Free**
4. Nome organizzazione: il nome della tua software house (es. `monkey-dev-studio`)
5. Completa la creazione

### 1.2 Crea il repository per il cliente

1. Dentro l'organizzazione, clicca "New repository"
2. Nome: `monkeyplan-[nome-cliente]` (es. `monkeyplan-tecnofix`)
3. Visibilità: **Private**
4. NON inizializzare con README (il codice lo carichi da Replit)
5. Clicca "Create repository"

### 1.3 Esporta il codice da Replit a GitHub

Dal terminale di Replit, esegui questi comandi uno alla volta:

```bash
# 1. Assicurati che .gitignore sia corretto
cat .gitignore
# Deve contenere: node_modules, dist, .DS_Store, server/public, *.tar.gz

# 2. Aggiungi il remote GitHub (sostituisci con il tuo URL)
git remote add github https://github.com/TUA-ORGANIZZAZIONE/monkeyplan-nome-cliente.git

# 3. Pusha tutto il codice
git push github main

# Se chiede credenziali, usa un Personal Access Token:
# GitHub > Settings > Developer settings > Personal access tokens > Generate new token
# Permessi necessari: repo (full control)
```

### 1.4 Verifica

- Vai sul repository GitHub e verifica che tutti i file siano presenti
- Controlla che NON ci siano file sensibili (password, chiavi API, .env)

### 1.5 Invita il cliente come collaboratore

1. Vai nel repository > Settings > Collaborators
2. Clicca "Add people"
3. Inserisci l'username o email GitHub del cliente
4. Scegli il ruolo: **Read** (solo lettura) o **Write** (se vuoi che possa vedere le modifiche in tempo reale)

---

## FASE 2: Configurare Railway (Account del Cliente)

### 2.1 Il cliente crea il suo account Railway

1. Il cliente va su https://railway.app
2. Si registra (consigliato: accesso con GitHub)
3. Sceglie il piano **Pro** (20$/mese - necessario per produzione, include 10$/mese di crediti)
4. Inserisce un metodo di pagamento

### 2.2 Il cliente ti aggiunge come membro

1. Il cliente va su Railway > Settings > Members
2. Ti invita con la tua email
3. Tu accetti l'invito

### 2.3 Crea il progetto MonkeyPlan

1. Su Railway, clicca "New Project"
2. Scegli "Deploy from GitHub repo"
3. Seleziona il repository `monkeyplan-nome-cliente`
4. Railway rileva automaticamente che è un progetto Node.js

### 2.4 Aggiungi il Database PostgreSQL

1. Nel progetto Railway, clicca "+ New" (in alto a destra)
2. Scegli "Database" > "Add PostgreSQL"
3. Railway crea il database e genera automaticamente la variabile `DATABASE_URL`
4. Clicca sul servizio PostgreSQL > "Variables" > copia il valore di `DATABASE_URL`

### 2.5 Configura le variabili d'ambiente

Clicca sul servizio del backend (il repo GitHub) > "Variables" > "New Variable".

Aggiungi queste variabili **obbligatorie**:

| Variabile | Valore | Note |
|---|---|---|
| `DATABASE_URL` | (auto-collegato) | Railway lo collega automaticamente se clicchi "Add Reference" |
| `SESSION_SECRET` | (genera una stringa casuale di 64 caratteri) | Usa: `openssl rand -hex 32` |
| `NODE_ENV` | `production` | |
| `PORT` | `5000` | Railway assegna la porta, ma il codice ascolta su 5000 |

Variabili **opzionali** (in base ai moduli attivati per il cliente):

| Variabile | Quando serve |
|---|---|
| `MAPBOX_ACCESS_TOKEN` | Se il cliente usa le mappe per appuntamenti/consegne |
| `FONEDAY_API_TOKEN` | Se il cliente usa il fornitore Foneday per ricambi |
| `MOBILESENTRIX_CONSUMER_KEY` | Se il cliente usa MobileSentrix |
| `MOBILESENTRIX_CONSUMER_NAME` | Se il cliente usa MobileSentrix |
| `MOBILESENTRIX_CONSUMER_SECRET` | Se il cliente usa MobileSentrix |
| `PAYPAL_CLIENT_ID` | Se il cliente accetta pagamenti PayPal |
| `PAYPAL_CLIENT_SECRET` | Se il cliente accetta pagamenti PayPal |
| `STRIPE_SECRET_KEY` | Se il cliente accetta pagamenti Stripe |

### 2.6 Configura il Build e Start

Nel servizio backend su Railway, vai su "Settings":

- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Root Directory**: `/` (lascia vuoto o `/`)

Il build esegue:
```
vite build && esbuild server/index-prod.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js
```

Lo start esegue:
```
NODE_ENV=production node dist/index.js
```

### 2.7 Inizializza il Database

Dopo il primo deploy, devi creare le tabelle nel database.

**Opzione A - Da Railway (consigliato):**

1. Nel progetto Railway, clicca "+ New" > "Empty Service"
2. Questo crea un servizio temporaneo con un terminale
3. Oppure usa la Railway CLI:

```bash
# Installa Railway CLI sul tuo PC
npm install -g @railway/cli

# Accedi
railway login

# Collega al progetto
railway link

# Esegui il push dello schema al database
railway run npx drizzle-kit push
```

**Opzione B - Da Replit (più facile):**

Puoi anche puntare temporaneamente il DATABASE_URL di Replit al database Railway, fare il push, e poi rimettere quello originale.

### 2.8 Collega il dominio personalizzato

1. Nel servizio backend > "Settings" > "Networking" > "Custom Domain"
2. Inserisci il dominio del cliente (es. `app.tecnofix.it`)
3. Railway ti dà un record CNAME da configurare
4. Il cliente (o tu) vai nel pannello DNS del dominio e aggiungi:
   - Tipo: `CNAME`
   - Nome: `app` (o quello che preferisci)
   - Valore: quello fornito da Railway (es. `xxxx.up.railway.app`)
5. Attendi la propagazione DNS (da pochi minuti a 48 ore)
6. HTTPS si attiva automaticamente

---

## FASE 3: Aggiornamenti Futuri

### 3.1 Workflow per le modifiche

Ogni volta che devi fare una modifica per il cliente:

```bash
# 1. Lavori sul codice in Replit (o nel tuo IDE locale)

# 2. Testi le modifiche in Replit

# 3. Quando sei soddisfatto, pusha su GitHub
git add .
git commit -m "Descrizione della modifica"
git push github main

# 4. Railway rileva il push e fa il deploy automatico (entro 2-3 minuti)
```

### 3.2 Migrazioni database

Se modifichi lo schema del database (nuove tabelle, colonne, ecc.):

```bash
# Dopo aver pushato il codice su GitHub
railway run npx drizzle-kit push
```

### 3.3 Monitoraggio

- Railway Dashboard: log in tempo reale, metriche CPU/RAM, cronologia deploy
- Se qualcosa va storto: Railway > servizio > "Deployments" > clicca sul deploy fallito per vedere i log di errore

---

## FASE 4: App Mobile Nativa con Expo (React Native)

Expo ti permette di creare un'app nativa iOS e Android che comunica con il backend MonkeyPlan tramite API REST. L'app mobile è un progetto separato dal backend web.

### 4.1 Prerequisiti

Sul tuo computer di sviluppo (Mac consigliato per iOS):

- **Node.js 18+** installato
- **Android Studio** (per Android)
- **Xcode** (per iOS, solo su Mac)
- **Expo Go** installata sul telefono per test rapidi (scaricala dagli store)

### 4.2 Crea il progetto Expo

```bash
# Crea un nuovo progetto Expo in una cartella separata
npx create-expo-app@latest monkeyplan-app --template blank-typescript
cd monkeyplan-app
```

Questo crea un progetto React Native con TypeScript, completamente separato dal backend MonkeyPlan.

### 4.3 Struttura del progetto app

```
monkeyplan-app/
├── app/                    # Schermate (Expo Router - file-based routing)
│   ├── (auth)/             # Schermate autenticazione
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/             # Schermate principali con tab bar
│   │   ├── dashboard.tsx
│   │   ├── repairs.tsx
│   │   ├── tickets.tsx
│   │   ├── inventory.tsx
│   │   └── profile.tsx
│   ├── _layout.tsx         # Layout principale
│   └── index.tsx           # Entry point
├── components/             # Componenti riutilizzabili
├── hooks/                  # Hook personalizzati
├── services/               # Chiamate API al backend
│   └── api.ts              # Client API configurato
├── types/                  # Tipi TypeScript (condivisi col backend)
├── app.json                # Configurazione Expo
└── package.json
```

### 4.4 Installa le dipendenze essenziali

```bash
# Navigazione (file-based routing come Next.js)
npx expo install expo-router expo-linking expo-constants expo-status-bar

# Storage sicuro per il token di sessione
npx expo install expo-secure-store

# Notifiche push
npx expo install expo-notifications expo-device

# Fotocamera (foto prodotti, documenti)
npx expo install expo-camera expo-image-picker

# Scanner barcode/QR (utile per magazzino)
npx expo install expo-barcode-scanner

# Icone
npx expo install @expo/vector-icons

# Gestione stato e fetch
npm install @tanstack/react-query axios
```

### 4.5 Configura il client API

Crea il file `services/api.ts` per comunicare con il backend MonkeyPlan:

```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// URL del backend MonkeyPlan su Railway
const API_BASE_URL = 'https://app.nomecliente.it';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor per aggiungere il token di sessione
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('session_token');
  if (token) {
    config.headers.Cookie = token;
  }
  return config;
});

// Interceptor per salvare il cookie di sessione dalla risposta
api.interceptors.response.use(
  async (response) => {
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      await SecureStore.setItemAsync('session_token', setCookie[0]);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Sessione scaduta, torna al login
      SecureStore.deleteItemAsync('session_token');
    }
    return Promise.reject(error);
  }
);

// Funzioni API che corrispondono alle route del backend MonkeyPlan
export const authAPI = {
  login: (data: { username: string; password: string }) =>
    api.post('/api/login', data),
  logout: () => api.post('/api/logout'),
  getUser: () => api.get('/api/user'),
  register: (data: any) => api.post('/api/register', data),
};

export const repairsAPI = {
  getAll: () => api.get('/api/repairs'),
  getById: (id: string) => api.get(`/api/repairs/${id}`),
  create: (data: any) => api.post('/api/repairs', data),
  update: (id: string, data: any) => api.patch(`/api/repairs/${id}`, data),
};

export const ticketsAPI = {
  getAll: () => api.get('/api/tickets'),
  getById: (id: string) => api.get(`/api/tickets/${id}`),
  create: (data: any) => api.post('/api/tickets', data),
};

export const inventoryAPI = {
  getProducts: () => api.get('/api/products'),
  getWarehouses: () => api.get('/api/warehouses'),
};

export const notificationsAPI = {
  getAll: () => api.get('/api/notifications'),
  markRead: (id: string) => api.patch(`/api/notifications/${id}/read`),
};

export default api;
```

### 4.6 Configura app.json

Modifica `app.json` per il cliente:

```json
{
  "expo": {
    "name": "MonkeyPlan",
    "slug": "monkeyplan",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#10b981"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.nomecliente.monkeyplan",
      "infoPlist": {
        "NSCameraUsageDescription": "Serve per fotografare prodotti e documenti",
        "NSPhotoLibraryUsageDescription": "Serve per caricare immagini di prodotti"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#10b981"
      },
      "package": "com.nomecliente.monkeyplan",
      "permissions": ["CAMERA", "READ_EXTERNAL_STORAGE", "VIBRATE"]
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-camera",
        {
          "cameraPermission": "Consenti a MonkeyPlan di accedere alla fotocamera"
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#10b981"
        }
      ]
    ],
    "scheme": "monkeyplan"
  }
}
```

### 4.7 Prepara le icone e splash screen

1. Crea le immagini nella cartella `assets/`:
   - `icon.png` - 1024x1024px (icona dell'app)
   - `adaptive-icon.png` - 1024x1024px (icona Android con sfondo adattivo)
   - `splash.png` - 1284x2778px (schermata di caricamento)
   - `notification-icon.png` - 96x96px (icona notifiche, solo bianco e trasparente)

### 4.8 Test durante lo sviluppo

```bash
# Avvia il server di sviluppo Expo
npx expo start

# Opzioni di test:
# - Scansiona il QR code con Expo Go sul telefono (stesso WiFi)
# - Premi 'a' per aprire nell'emulatore Android
# - Premi 'i' per aprire nel simulatore iOS (solo Mac)
```

### 4.9 Backend: abilita CORS per l'app mobile

Sul backend MonkeyPlan, assicurati che le richieste dall'app mobile siano accettate.
Aggiungi o verifica la configurazione CORS nel server Express:

```typescript
// In server/app.ts o dove configuri Express
import cors from 'cors';

app.use(cors({
  origin: true,  // Accetta tutte le origini (per l'app mobile)
  credentials: true,  // Necessario per i cookie di sessione
}));
```

In alternativa, se l'app mobile usa un token invece dei cookie di sessione, puoi aggiungere un endpoint di login che restituisce un token JWT. Questo è più pulito per le app mobile.

### 4.10 Build di produzione con EAS (Expo Application Services)

EAS Build compila l'app nel cloud, non serve avere Android Studio o Xcode sul tuo PC.

```bash
# Installa EAS CLI
npm install -g eas-cli

# Accedi con il tuo account Expo
eas login

# Configura EAS per il progetto
eas build:configure
```

Questo crea il file `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      },
      "ios": {
        "appleId": "tua@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABC123DEF"
      }
    }
  }
}
```

### 4.11 Build e Pubblicazione

#### Build Android:

```bash
# Build APK per test interno (condividi direttamente il file)
eas build --platform android --profile preview

# Build AAB per Google Play Store
eas build --platform android --profile production

# Pubblica direttamente su Google Play (dopo la prima volta manuale)
eas submit --platform android --profile production
```

Costo account Google Play Developer: **25$ una tantum**

#### Build iOS:

```bash
# Build per TestFlight (test interno)
eas build --platform ios --profile production

# Pubblica su App Store tramite TestFlight
eas submit --platform ios --profile production
```

Costo Apple Developer Program: **99$/anno**

#### Prima pubblicazione (da fare manualmente una volta):

**Google Play:**
1. Vai su https://play.google.com/console
2. Crea una nuova app, compila le informazioni
3. Carica il file .aab generato da EAS Build
4. Compila la scheda dello store (screenshot, descrizione, icona)
5. Invia per revisione (1-3 giorni)

**Apple App Store:**
1. Vai su https://appstoreconnect.apple.com
2. Crea una nuova app con il Bundle ID corretto
3. La build arriva automaticamente da EAS Submit
4. Compila la scheda dello store (screenshot, descrizione)
5. Invia per revisione (1-7 giorni)

### 4.12 Aggiornamenti dell'App

**Aggiornamenti OTA (Over-The-Air) - senza passare dagli store:**

Expo supporta aggiornamenti istantanei per modifiche al codice JavaScript (UI, logica, ecc.). Non serve che l'utente aggiorni dallo store.

```bash
# Pubblica un aggiornamento OTA
eas update --branch production --message "Fix bug lista riparazioni"
```

L'app si aggiorna automaticamente al prossimo avvio. Funziona per:
- Modifiche alla UI
- Nuove schermate
- Fix di bug nel codice JS/TS
- Aggiornamento testi e traduzioni

NON funziona per (serve rebuild + aggiornamento store):
- Aggiunta di nuovi plugin nativi (camera, notifiche, ecc.)
- Modifica delle configurazioni in app.json
- Aggiornamento versione SDK di Expo

### 4.13 Repository dell'app mobile

L'app mobile va in un repository GitHub **separato** dal backend:

```
TUA-ORGANIZZAZIONE/
├── monkeyplan-nome-cliente        # Backend (web + API)
└── monkeyplan-nome-cliente-app    # App mobile (Expo)
```

Così puoi aggiornare backend e app mobile indipendentemente.

### 4.14 Costi Expo/EAS

| Servizio | Piano Free | Piano Production |
|---|---|---|
| EAS Build | 30 build/mese | 1000+ build/mese (99$/mese) |
| EAS Update (OTA) | 1000 utenti | Illimitati (99$/mese) |
| EAS Submit | Incluso | Incluso |

Per la maggior parte dei clienti, il **piano Free** di EAS è più che sufficiente.

---

## FASE 5: Checklist Consegna al Cliente

### Documentazione da fornire:

- [ ] Credenziali di accesso admin alla piattaforma
- [ ] Accesso al repository GitHub (come collaboratore)
- [ ] Accesso al progetto Railway (come membro)
- [ ] Documentazione utente base (come usare il software)
- [ ] Contratto di manutenzione firmato

### Account e accessi da configurare:

- [ ] Account Railway del cliente con metodo di pagamento
- [ ] Database PostgreSQL su Railway
- [ ] Dominio personalizzato configurato
- [ ] Variabili d'ambiente tutte impostate
- [ ] SSL/HTTPS attivo (automatico con Railway)
- [ ] Account Google Play Developer (se app Android)
- [ ] Account Apple Developer (se app iOS)

### Test pre-consegna:

- [ ] Login/registrazione funzionante
- [ ] Tutte le funzionalità attive testate
- [ ] Database con dati iniziali (categorie, servizi base, ecc.)
- [ ] Email/notifiche funzionanti
- [ ] App mobile installata e testata su dispositivo reale
- [ ] Performance accettabile (tempo di caricamento < 3 secondi)
- [ ] Backup database configurato

---

## FASE 6: Manutenzione Continuativa

### Attività periodiche:

| Frequenza | Attività |
|---|---|
| Settimanale | Controllo log errori su Railway |
| Mensile | Aggiornamento dipendenze di sicurezza (`npm audit fix`) |
| Mensile | Verifica backup database |
| Trimestrale | Aggiornamento Capacitor e plugin nativi |
| Annuale | Rinnovo certificati Apple Developer |
| Al bisogno | Nuove funzionalità su richiesta del cliente |

### Struttura contratto manutenzione suggerita:

| Servizio | Incluso nel canone |
|---|---|
| Monitoraggio server e uptime | Si |
| Bugfix critici (entro 24h) | Si |
| Bugfix non critici (entro 5gg lavorativi) | Si |
| Aggiornamenti di sicurezza | Si |
| Backup giornaliero database | Si |
| Nuove funzionalità | A preventivo separato |
| Supporto telefonico/email | Max X ore/mese |

---

## Riepilogo Costi per il Cliente

| Voce | Costo | Frequenza |
|---|---|---|
| Railway Pro | ~20-30$/mese | Mensile |
| Dominio | ~10-15 euro/anno | Annuale |
| Google Play Developer | 25$ | Una tantum |
| Apple Developer | 99$/anno | Annuale |
| **Canone manutenzione (tuo)** | **Da concordare** | **Mensile** |
