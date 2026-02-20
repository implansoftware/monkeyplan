import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Monitor, Hand, Battery, Volume2, Camera, Wifi, Vibrate, 
  Gauge, Smartphone, CheckCircle, XCircle, SkipForward, 
  ArrowRight, ArrowLeft, Send, Loader2, AlertCircle, Clock,
  Mic, Speaker
} from "lucide-react";

interface TestResult {
  displayTest: boolean | null;
  touchTest: boolean | null;
  batteryTest: boolean | null;
  audioTest: boolean | null;
  cameraFrontTest: boolean | null;
  cameraRearTest: boolean | null;
  microphoneTest: boolean | null;
  speakerTest: boolean | null;
  vibrationTest: boolean | null;
  connectivityTest: boolean | null;
  sensorsTest: boolean | null;
  buttonsTest: boolean | null;
}

interface SessionInfo {
  id: string;
  token: string;
  status: string;
  expiresAt: string;
}

type TestKey = keyof TestResult;

const TEST_STEPS: { key: TestKey; icon: typeof Monitor; title: string; titleEn: string; description: string; descriptionEn: string }[] = [
  { key: "displayTest", icon: Monitor, title: "Test Display", titleEn: "Display Test", description: "Verranno mostrati colori pieni sullo schermo. Controlla che non ci siano pixel morti o zone scure.", descriptionEn: "Full colors will be shown on screen. Check for dead pixels or dark areas." },
  { key: "touchTest", icon: Hand, title: "Test Touch", titleEn: "Touch Test", description: "Tocca tutte le zone evidenziate sullo schermo per verificare che il touch funzioni ovunque.", descriptionEn: "Touch all highlighted areas to verify touch works everywhere." },
  { key: "speakerTest", icon: Speaker, title: "Test Altoparlante", titleEn: "Speaker Test", description: "Verrà riprodotto un suono. Conferma se riesci a sentirlo chiaramente.", descriptionEn: "A sound will be played. Confirm if you can hear it clearly." },
  { key: "microphoneTest", icon: Mic, title: "Test Microfono", titleEn: "Microphone Test", description: "Parla nel microfono. Verificheremo che il livello audio venga rilevato.", descriptionEn: "Speak into the microphone. We'll verify audio levels are detected." },
  { key: "cameraFrontTest", icon: Camera, title: "Fotocamera Frontale", titleEn: "Front Camera", description: "La fotocamera frontale verrà attivata. Verifica che l'immagine sia chiara.", descriptionEn: "The front camera will be activated. Check that the image is clear." },
  { key: "cameraRearTest", icon: Camera, title: "Fotocamera Posteriore", titleEn: "Rear Camera", description: "La fotocamera posteriore verrà attivata. Verifica che l'immagine sia chiara.", descriptionEn: "The rear camera will be activated. Check that the image is clear." },
  { key: "vibrationTest", icon: Vibrate, title: "Test Vibrazione", titleEn: "Vibration Test", description: "Il dispositivo vibrerà. Conferma se senti la vibrazione.", descriptionEn: "The device will vibrate. Confirm if you feel the vibration." },
  { key: "batteryTest", icon: Battery, title: "Test Batteria", titleEn: "Battery Test", description: "Verifica del livello e stato della batteria.", descriptionEn: "Battery level and status check." },
  { key: "connectivityTest", icon: Wifi, title: "Test Connettività", titleEn: "Connectivity Test", description: "Verifica della connessione di rete del dispositivo.", descriptionEn: "Network connection verification." },
  { key: "sensorsTest", icon: Gauge, title: "Test Sensori", titleEn: "Sensors Test", description: "Muovi il dispositivo per verificare accelerometro e giroscopio.", descriptionEn: "Move the device to check accelerometer and gyroscope." },
  { key: "buttonsTest", icon: Smartphone, title: "Test Pulsanti", titleEn: "Buttons Test", description: "Premi i pulsanti fisici (volume su/giù, accensione). Conferma il funzionamento.", descriptionEn: "Press physical buttons (volume up/down, power). Confirm they work." },
];

function DisplayTestInteractive({ onResult }: { onResult: (pass: boolean) => void }) {
  const [colorIndex, setColorIndex] = useState(0);
  const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFFFF", "#000000"];
  const colorNames = ["Rosso", "Verde", "Blu", "Bianco", "Nero"];

  return (
    <div className="space-y-4">
      <div
        className="w-full h-48 rounded-md border-2 border-border flex items-center justify-center text-2xl font-bold"
        style={{ backgroundColor: colors[colorIndex], color: colorIndex === 4 ? "#FFFFFF" : colorIndex === 3 ? "#000000" : "#FFFFFF" }}
        data-testid="display-test-area"
      >
        {colorNames[colorIndex]}
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {colors.map((c, i) => (
          <Button
            key={i}
            variant={colorIndex === i ? "default" : "outline"}
            size="sm"
            onClick={() => setColorIndex(i)}
            data-testid={`button-color-${i}`}
          >
            {colorNames[i]}
          </Button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground text-center">
        Tutti i colori si vedono correttamente senza difetti?
      </p>
      <div className="flex gap-2 justify-center">
        <Button onClick={() => onResult(true)} data-testid="button-display-pass">
          <CheckCircle className="mr-2 h-4 w-4" /> Si, tutto OK
        </Button>
        <Button variant="destructive" onClick={() => onResult(false)} data-testid="button-display-fail">
          <XCircle className="mr-2 h-4 w-4" /> Ci sono difetti
        </Button>
      </div>
    </div>
  );
}

function TouchTestInteractive({ onResult }: { onResult: (pass: boolean) => void }) {
  const [touched, setTouched] = useState<Set<number>>(new Set());
  const zones = 9;

  const handleTouch = (index: number) => {
    const newTouched = new Set(touched);
    newTouched.add(index);
    setTouched(newTouched);
  };

  const allTouched = touched.size >= zones;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-1 w-full aspect-square max-w-xs mx-auto">
        {Array.from({ length: zones }, (_, i) => (
          <div
            key={i}
            className={`rounded-md border-2 flex items-center justify-center text-lg font-bold cursor-pointer transition-colors ${
              touched.has(i)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted border-border"
            }`}
            onTouchStart={() => handleTouch(i)}
            onClick={() => handleTouch(i)}
            data-testid={`touch-zone-${i}`}
          >
            {touched.has(i) ? <CheckCircle className="h-6 w-6" /> : (i + 1)}
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground text-center">
        Tocca tutte le {zones} zone ({touched.size}/{zones})
      </p>
      {allTouched && (
        <div className="flex gap-2 justify-center">
          <Button onClick={() => onResult(true)} data-testid="button-touch-pass">
            <CheckCircle className="mr-2 h-4 w-4" /> Touch OK
          </Button>
          <Button variant="destructive" onClick={() => onResult(false)} data-testid="button-touch-fail">
            <XCircle className="mr-2 h-4 w-4" /> Problemi touch
          </Button>
        </div>
      )}
    </div>
  );
}

function SpeakerTestInteractive({ onResult }: { onResult: (pass: boolean) => void }) {
  const [played, setPlayed] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTestSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 440;
      oscillator.type = "sine";
      gainNode.gain.value = 0.5;
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        ctx.close();
        setPlayed(true);
      }, 2000);
    } catch {
      setPlayed(true);
    }
  };

  return (
    <div className="space-y-4 text-center">
      <Button onClick={playTestSound} disabled={played} size="lg" data-testid="button-play-sound">
        <Volume2 className="mr-2 h-5 w-5" /> Riproduci suono test
      </Button>
      {played && (
        <>
          <p className="text-sm text-muted-foreground">Hai sentito il suono chiaramente?</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => onResult(true)} data-testid="button-speaker-pass">
              <CheckCircle className="mr-2 h-4 w-4" /> Si, si sente
            </Button>
            <Button variant="destructive" onClick={() => onResult(false)} data-testid="button-speaker-fail">
              <XCircle className="mr-2 h-4 w-4" /> Non si sente
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function MicrophoneTestInteractive({ onResult }: { onResult: (pass: boolean) => void }) {
  const [level, setLevel] = useState(0);
  const [recording, setRecording] = useState(false);
  const [detected, setDetected] = useState(false);
  const animRef = useRef<number | null>(null);

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      setRecording(true);

      const checkLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setLevel(normalized);
        if (normalized > 10) setDetected(true);
        animRef.current = requestAnimationFrame(checkLevel);
      };
      checkLevel();

      setTimeout(() => {
        if (animRef.current) cancelAnimationFrame(animRef.current);
        stream.getTracks().forEach(t => t.stop());
        ctx.close();
        setRecording(false);
      }, 5000);
    } catch {
      setRecording(false);
      onResult(false);
    }
  };

  return (
    <div className="space-y-4 text-center">
      {!recording && !detected && (
        <Button onClick={startMic} size="lg" data-testid="button-start-mic">
          <Mic className="mr-2 h-5 w-5" /> Avvia test microfono
        </Button>
      )}
      {recording && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Parla nel microfono...</p>
          <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-100 rounded-full"
              style={{ width: `${level}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">Livello: {level}%</p>
        </div>
      )}
      {!recording && detected && (
        <div className="flex gap-2 justify-center">
          <Button onClick={() => onResult(true)} data-testid="button-mic-pass">
            <CheckCircle className="mr-2 h-4 w-4" /> Microfono OK
          </Button>
          <Button variant="destructive" onClick={() => onResult(false)} data-testid="button-mic-fail">
            <XCircle className="mr-2 h-4 w-4" /> Non funziona
          </Button>
        </div>
      )}
    </div>
  );
}

function CameraTestInteractive({ facing, onResult }: { facing: "user" | "environment"; onResult: (pass: boolean) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setActive(true);
      }
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  if (error) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-destructive">Impossibile accedere alla fotocamera</p>
        <div className="flex gap-2 justify-center">
          <Button variant="destructive" onClick={() => onResult(false)} data-testid="button-camera-fail">
            <XCircle className="mr-2 h-4 w-4" /> Non funziona
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      {!active && (
        <Button onClick={startCamera} size="lg" data-testid="button-start-camera">
          <Camera className="mr-2 h-5 w-5" /> Attiva fotocamera
        </Button>
      )}
      <video
        ref={videoRef}
        className={`w-full max-w-xs mx-auto rounded-md border ${active ? "" : "hidden"}`}
        playsInline
        muted
        data-testid="camera-preview"
      />
      {active && (
        <div className="flex gap-2 justify-center">
          <Button onClick={() => {
            if (videoRef.current?.srcObject) {
              (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            }
            onResult(true);
          }} data-testid="button-camera-pass">
            <CheckCircle className="mr-2 h-4 w-4" /> Immagine chiara
          </Button>
          <Button variant="destructive" onClick={() => {
            if (videoRef.current?.srcObject) {
              (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            }
            onResult(false);
          }} data-testid="button-camera-fail-active">
            <XCircle className="mr-2 h-4 w-4" /> Problemi
          </Button>
        </div>
      )}
    </div>
  );
}

function VibrationTestInteractive({ onResult }: { onResult: (pass: boolean) => void }) {
  const [vibrated, setVibrated] = useState(false);

  const triggerVibration = () => {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
    setVibrated(true);
  };

  return (
    <div className="space-y-4 text-center">
      <Button onClick={triggerVibration} disabled={vibrated} size="lg" data-testid="button-vibrate">
        <Vibrate className="mr-2 h-5 w-5" /> Attiva vibrazione
      </Button>
      {vibrated && (
        <>
          <p className="text-sm text-muted-foreground">Hai sentito la vibrazione?</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => onResult(true)} data-testid="button-vibration-pass">
              <CheckCircle className="mr-2 h-4 w-4" /> Si, vibra
            </Button>
            <Button variant="destructive" onClick={() => onResult(false)} data-testid="button-vibration-fail">
              <XCircle className="mr-2 h-4 w-4" /> Non vibra
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function BatteryTestInteractive({ onResult, onBatteryLevel }: { onResult: (pass: boolean) => void; onBatteryLevel: (level: number) => void }) {
  const [batteryInfo, setBatteryInfo] = useState<{ level: number; charging: boolean } | null>(null);

  useEffect(() => {
    const getBattery = async () => {
      try {
        const battery = await (navigator as any).getBattery();
        const level = Math.round(battery.level * 100);
        setBatteryInfo({ level, charging: battery.charging });
        onBatteryLevel(level);
      } catch {
        setBatteryInfo(null);
      }
    };
    getBattery();
  }, []);

  if (!batteryInfo) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">API batteria non disponibile su questo dispositivo</p>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => onResult(true)} data-testid="button-battery-pass">
            <CheckCircle className="mr-2 h-4 w-4" /> Batteria OK
          </Button>
          <Button variant="destructive" onClick={() => onResult(false)} data-testid="button-battery-fail">
            <XCircle className="mr-2 h-4 w-4" /> Problemi batteria
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <div className="text-4xl font-bold">{batteryInfo.level}%</div>
      <Badge variant={batteryInfo.charging ? "default" : "secondary"}>
        {batteryInfo.charging ? "In carica" : "Non in carica"}
      </Badge>
      <Progress value={batteryInfo.level} className="h-4" />
      <p className="text-sm text-muted-foreground">La batteria funziona correttamente?</p>
      <div className="flex gap-2 justify-center">
        <Button onClick={() => onResult(true)} data-testid="button-battery-pass">
          <CheckCircle className="mr-2 h-4 w-4" /> Batteria OK
        </Button>
        <Button variant="destructive" onClick={() => onResult(false)} data-testid="button-battery-fail">
          <XCircle className="mr-2 h-4 w-4" /> Problemi
        </Button>
      </div>
    </div>
  );
}

function ConnectivityTestInteractive({ onResult }: { onResult: (pass: boolean) => void }) {
  const online = navigator.onLine;

  return (
    <div className="space-y-4 text-center">
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${online ? "bg-primary/10" : "bg-destructive/10"}`}>
        <Wifi className={`h-6 w-6 ${online ? "text-primary" : "text-destructive"}`} />
        <span className="text-lg font-medium">{online ? "Online" : "Offline"}</span>
      </div>
      <p className="text-sm text-muted-foreground">La connessione funziona correttamente?</p>
      <div className="flex gap-2 justify-center">
        <Button onClick={() => onResult(true)} data-testid="button-connectivity-pass">
          <CheckCircle className="mr-2 h-4 w-4" /> Connessione OK
        </Button>
        <Button variant="destructive" onClick={() => onResult(false)} data-testid="button-connectivity-fail">
          <XCircle className="mr-2 h-4 w-4" /> Problemi
        </Button>
      </div>
    </div>
  );
}

function SensorsTestInteractive({ onResult }: { onResult: (pass: boolean) => void }) {
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 0 });
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const handler = (e: DeviceMotionEvent) => {
      if (e.accelerationIncludingGravity) {
        setAccel({
          x: Math.round((e.accelerationIncludingGravity.x || 0) * 10) / 10,
          y: Math.round((e.accelerationIncludingGravity.y || 0) * 10) / 10,
          z: Math.round((e.accelerationIncludingGravity.z || 0) * 10) / 10,
        });
        setDetected(true);
      }
    };
    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
  }, []);

  return (
    <div className="space-y-4 text-center">
      {detected ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Accelerometro rilevato</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-muted rounded-md">
              <div className="text-xs text-muted-foreground">X</div>
              <div className="font-mono font-bold">{accel.x}</div>
            </div>
            <div className="p-2 bg-muted rounded-md">
              <div className="text-xs text-muted-foreground">Y</div>
              <div className="font-mono font-bold">{accel.y}</div>
            </div>
            <div className="p-2 bg-muted rounded-md">
              <div className="text-xs text-muted-foreground">Z</div>
              <div className="font-mono font-bold">{accel.z}</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Muovi il dispositivo per vedere i valori cambiare</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Muovi il dispositivo per attivare i sensori...</p>
      )}
      <div className="flex gap-2 justify-center">
        <Button onClick={() => onResult(true)} data-testid="button-sensors-pass">
          <CheckCircle className="mr-2 h-4 w-4" /> Sensori OK
        </Button>
        <Button variant="destructive" onClick={() => onResult(false)} data-testid="button-sensors-fail">
          <XCircle className="mr-2 h-4 w-4" /> Non funzionano
        </Button>
      </div>
    </div>
  );
}

function SimpleConfirmTest({ description, onResult }: { description: string; onResult: (pass: boolean) => void }) {
  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="flex gap-2 justify-center">
        <Button onClick={() => onResult(true)} data-testid="button-simple-pass">
          <CheckCircle className="mr-2 h-4 w-4" /> Funziona
        </Button>
        <Button variant="destructive" onClick={() => onResult(false)} data-testid="button-simple-fail">
          <XCircle className="mr-2 h-4 w-4" /> Non funziona
        </Button>
      </div>
    </div>
  );
}

export default function SelfDiagnosis({ params }: { params?: { token: string } }) {
  const routeParams = useParams<{ token: string }>();
  const token = params?.token || routeParams?.token;
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(-1);
  const [results, setResults] = useState<TestResult>({
    displayTest: null, touchTest: null, batteryTest: null, audioTest: null,
    cameraFrontTest: null, cameraRearTest: null, microphoneTest: null,
    speakerTest: null, vibrationTest: null, connectivityTest: null,
    sensorsTest: null, buttonsTest: null,
  });
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/self-diagnosis/session/${token}`)
      .then(async (res) => {
        if (res.status === 404) throw new Error("Sessione non trovata. Il link potrebbe non essere valido.");
        if (res.status === 410) throw new Error("Sessione scaduta. Richiedi un nuovo link all'operatore.");
        if (res.status === 409) {
          const data = await res.json();
          setCompleted(true);
          throw new Error("Diagnosi già completata.");
        }
        if (!res.ok) throw new Error("Errore nel caricamento");
        return res.json();
      })
      .then((data: SessionInfo) => {
        setSessionInfo(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  const startDiagnosis = async () => {
    if (!token) return;
    try {
      const ua = navigator.userAgent;
      const deviceInfo = {
        userAgent: ua,
        platform: navigator.platform,
        language: navigator.language,
        screenWidth: screen.width,
        screenHeight: screen.height,
        pixelRatio: window.devicePixelRatio,
      };
      await fetch(`/api/self-diagnosis/session/${token}/start`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceInfo }),
      });
      setCurrentStep(0);
    } catch {
      setError("Errore nell'avvio della diagnosi");
    }
  };

  const handleTestResult = useCallback((key: TestKey, pass: boolean) => {
    setResults((prev) => ({ ...prev, [key]: pass }));
    if (currentStep < TEST_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setCurrentStep(TEST_STEPS.length);
    }
  }, [currentStep]);

  const skipTest = () => {
    if (currentStep < TEST_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setCurrentStep(TEST_STEPS.length);
    }
  };

  const submitResults = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/self-diagnosis/session/${token}/results`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...results,
          batteryLevel,
          notes: notes || null,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenWidth: screen.width,
            screenHeight: screen.height,
            pixelRatio: window.devicePixelRatio,
          },
        }),
      });
      if (!res.ok) throw new Error("Errore nell'invio");
      setCompleted(true);
    } catch {
      setError("Errore nell'invio dei risultati. Riprova.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Caricamento...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            {completed ? (
              <CheckCircle className="h-12 w-12 text-primary" />
            ) : (
              <AlertCircle className="h-12 w-12 text-destructive" />
            )}
            <p className="text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completed) {
    const passCount = Object.values(results).filter((v) => v === true).length;
    const failCount = Object.values(results).filter((v) => v === false).length;
    const skipCount = Object.values(results).filter((v) => v === null).length;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-2" />
            <CardTitle>Diagnosi completata!</CardTitle>
            <CardDescription>I risultati sono stati inviati all'operatore.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{passCount}</div>
                <div className="text-xs text-muted-foreground">Superati</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{failCount}</div>
                <div className="text-xs text-muted-foreground">Falliti</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">{skipCount}</div>
                <div className="text-xs text-muted-foreground">Saltati</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === -1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Smartphone className="h-16 w-16 text-primary mx-auto mb-2" />
            <CardTitle>Diagnostica Dispositivo</CardTitle>
            <CardDescription>
              Verranno eseguiti una serie di test sul tuo dispositivo per verificarne il funzionamento.
              La procedura dura circa 3-5 minuti.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-3 space-y-2">
              <p className="text-sm font-medium">Test inclusi:</p>
              <div className="grid grid-cols-2 gap-1">
                {TEST_STEPS.map((step) => (
                  <div key={step.key} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <step.icon className="h-3 w-3" />
                    {step.title}
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={startDiagnosis} className="w-full" size="lg" data-testid="button-start-diagnosis">
              <ArrowRight className="mr-2 h-5 w-5" /> Inizia diagnosi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep >= TEST_STEPS.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Riepilogo diagnosi</CardTitle>
            <CardDescription>Rivedi i risultati e aggiungi eventuali note</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {TEST_STEPS.map((step) => {
                const val = results[step.key];
                return (
                  <div key={step.key} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted">
                    <div className="flex items-center gap-2">
                      <step.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{step.title}</span>
                    </div>
                    {val === true && <Badge variant="default">OK</Badge>}
                    {val === false && <Badge variant="destructive">Fallito</Badge>}
                    {val === null && <Badge variant="secondary">Saltato</Badge>}
                  </div>
                );
              })}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note aggiuntive (opzionale)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Descrivi eventuali problemi riscontrati..."
                className="resize-none"
                data-testid="input-notes"
              />
            </div>
            <Button onClick={submitResults} className="w-full" size="lg" disabled={submitting} data-testid="button-submit-results">
              {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
              Invia risultati
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const step = TEST_STEPS[currentStep];
  const progress = ((currentStep + 1) / TEST_STEPS.length) * 100;

  const renderTestComponent = () => {
    switch (step.key) {
      case "displayTest":
        return <DisplayTestInteractive onResult={(r) => handleTestResult("displayTest", r)} />;
      case "touchTest":
        return <TouchTestInteractive onResult={(r) => handleTestResult("touchTest", r)} />;
      case "speakerTest":
        return <SpeakerTestInteractive onResult={(r) => handleTestResult("speakerTest", r)} />;
      case "microphoneTest":
        return <MicrophoneTestInteractive onResult={(r) => handleTestResult("microphoneTest", r)} />;
      case "cameraFrontTest":
        return <CameraTestInteractive facing="user" onResult={(r) => handleTestResult("cameraFrontTest", r)} />;
      case "cameraRearTest":
        return <CameraTestInteractive facing="environment" onResult={(r) => handleTestResult("cameraRearTest", r)} />;
      case "vibrationTest":
        return <VibrationTestInteractive onResult={(r) => handleTestResult("vibrationTest", r)} />;
      case "batteryTest":
        return <BatteryTestInteractive onResult={(r) => handleTestResult("batteryTest", r)} onBatteryLevel={(l) => setBatteryLevel(l)} />;
      case "connectivityTest":
        return <ConnectivityTestInteractive onResult={(r) => handleTestResult("connectivityTest", r)} />;
      case "sensorsTest":
        return <SensorsTestInteractive onResult={(r) => handleTestResult("sensorsTest", r)} />;
      case "buttonsTest":
        return <SimpleConfirmTest description="Premi i pulsanti fisici del dispositivo (volume, accensione) e conferma se funzionano." onResult={(r) => handleTestResult("buttonsTest", r)} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between gap-2 mb-2">
            <Badge variant="secondary">{currentStep + 1} / {TEST_STEPS.length}</Badge>
            <Button variant="ghost" size="sm" onClick={skipTest} data-testid="button-skip-test">
              <SkipForward className="mr-1 h-4 w-4" /> Salta
            </Button>
          </div>
          <Progress value={progress} className="h-2 mb-3" />
          <div className="flex items-center gap-3">
            <step.icon className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-lg">{step.title}</CardTitle>
              <CardDescription className="text-xs">{step.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderTestComponent()}
        </CardContent>
      </Card>
    </div>
  );
}
