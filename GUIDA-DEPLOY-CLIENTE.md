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

## FASE 4: App Mobile Nativa con Capacitor

Capacitor (di Ionic) ti permette di trasformare l'app web MonkeyPlan in un'app nativa iOS e Android senza riscrivere niente.

### 4.1 Prerequisiti

Sul tuo computer di sviluppo (Mac consigliato per iOS):

- **Node.js 18+** installato
- **Android Studio** (per Android)
- **Xcode** (per iOS, solo su Mac)
- Il codice del progetto clonato da GitHub

```bash
# Clona il progetto sul tuo PC
git clone https://github.com/TUA-ORGANIZZAZIONE/monkeyplan-nome-cliente.git
cd monkeyplan-nome-cliente
npm install
```

### 4.2 Installa Capacitor

```bash
# Installa le dipendenze Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android

# Inizializza Capacitor
npx cap init "MonkeyPlan" "com.nomecliente.monkeyplan" --web-dir dist/public
```

Questo crea il file `capacitor.config.ts`. Modificalo così:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nomecliente.monkeyplan',
  appName: 'MonkeyPlan',
  webDir: 'dist/public',
  server: {
    // OPZIONE A: App ibrida (carica dal server remoto)
    // Vantaggi: aggiornamenti istantanei senza passare dagli store
    url: 'https://app.nomecliente.it',
    cleartext: false,

    // OPZIONE B: App locale (bundle dentro l'app)
    // Vantaggi: funziona offline, più veloce al primo caricamento
    // Commenta "url" sopra e usa webDir per servire i file locali
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#10b981',
    },
    StatusBar: {
      style: 'dark',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
```

**NOTA IMPORTANTE - Quale opzione scegliere:**
- **Opzione A (url remoto)**: L'app è una "shell" che carica il sito web. Ogni modifica al sito si vede subito nell'app senza aggiornare sugli store. Consigliata per MonkeyPlan.
- **Opzione B (bundle locale)**: L'app contiene tutto il codice. Serve un aggiornamento sugli store per ogni modifica. Utile se serve funzionamento offline.

### 4.3 Aggiungi le piattaforme

```bash
# Aggiungi Android
npx cap add android

# Aggiungi iOS (solo su Mac)
npx cap add ios
```

### 4.4 Plugin nativi utili

Installa i plugin per funzionalità native:

```bash
# Notifiche push
npm install @capacitor/push-notifications

# Fotocamera (per foto prodotti, documenti, ecc.)
npm install @capacitor/camera

# Condivisione file
npm install @capacitor/share

# Informazioni dispositivo
npm install @capacitor/device

# Barra di stato
npm install @capacitor/status-bar

# Splash screen
npm install @capacitor/splash-screen

# Tastiera (per gestire la tastiera su mobile)
npm install @capacitor/keyboard

# Scanner di barcode/QR (utile per magazzino)
npm install @capawesome/capacitor-barcode-scanner

# Sincronizza i plugin con i progetti nativi
npx cap sync
```

### 4.5 Configura l'icona e lo splash screen

1. Crea le immagini:
   - `resources/icon.png` - 1024x1024px (icona dell'app)
   - `resources/splash.png` - 2732x2732px (schermata di caricamento)

2. Genera tutte le dimensioni automaticamente:
```bash
npm install -g @capacitor/assets
npx capacitor-assets generate
```

### 4.6 Build e Test Android

```bash
# Builda il frontend
npm run build

# Copia i file nel progetto Android
npx cap sync android

# Apri in Android Studio
npx cap open android
```

In Android Studio:
1. Attendi che Gradle finisca il sync
2. Collega un telefono Android via USB (o usa l'emulatore)
3. Clicca il bottone "Run" (triangolo verde)

### 4.7 Build e Test iOS (solo Mac)

```bash
# Builda il frontend
npm run build

# Copia i file nel progetto iOS
npx cap sync ios

# Apri in Xcode
npx cap open ios
```

In Xcode:
1. Seleziona il team di sviluppo (richiede Apple Developer Account - 99$/anno)
2. Seleziona il dispositivo o simulatore
3. Clicca "Run"

### 4.8 Pubblicazione sugli Store

#### Google Play Store:

1. In Android Studio: Build > Generate Signed Bundle/APK > Android App Bundle
2. Crea un keystore (conservalo in un posto sicuro, non perderlo MAI)
3. Genera il file .aab
4. Vai su https://play.google.com/console
5. Crea una nuova app, compila le informazioni
6. Carica il file .aab
7. Compila la scheda dello store (screenshot, descrizione, icona)
8. Invia per revisione (1-3 giorni)
9. Costo: 25$ una tantum per l'account Google Play Developer

#### Apple App Store:

1. In Xcode: Product > Archive
2. Clicca "Distribute App" > App Store Connect
3. Vai su https://appstoreconnect.apple.com
4. Crea una nuova app, compila le informazioni
5. La build arriva automaticamente da Xcode
6. Compila la scheda dello store (screenshot, descrizione)
7. Invia per revisione (1-7 giorni, Apple è più severa)
8. Costo: 99$/anno per l'Apple Developer Program

### 4.9 Aggiornare l'App Mobile

**Se usi Opzione A (url remoto) - CONSIGLIATA:**
- Ogni modifica al sito web si riflette automaticamente nell'app
- Devi aggiornare sugli store solo se cambi plugin nativi o configurazione Capacitor

**Se usi Opzione B (bundle locale):**
```bash
# Dopo aver modificato il codice
npm run build
npx cap sync
# Poi rebuild e pubblica da Android Studio / Xcode
```

**Per aggiornamenti senza passare dallo store (Opzione B):**
```bash
# Installa il plugin Live Update di Capgo (alternativa a Ionic Appflow)
npm install @capgo/capacitor-updater
```

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
