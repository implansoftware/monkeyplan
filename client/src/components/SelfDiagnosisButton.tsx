import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Smartphone, QrCode, Copy, CheckCircle, Loader2, ExternalLink, XCircle, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import QRCode from "qrcode";

interface SelfDiagnosisButtonProps {
  repairOrderId?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

interface DiagnosisSession {
  id: string;
  token: string;
  status: string;
  expiresAt: string;
  createdAt: string;
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
  batteryLevel: number | null;
  notes: string | null;
  deviceInfo: any;
  completedAt: string | null;
}

export function SelfDiagnosisButton({ repairOrderId, variant = "outline", size = "sm" }: SelfDiagnosisButtonProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [diagUrl, setDiagUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const existingSessionsQuery = useQuery<DiagnosisSession[]>({
    queryKey: ["/api/self-diagnosis/repair", repairOrderId],
    queryFn: async () => {
      if (!repairOrderId) return [];
      const res = await fetch(`/api/self-diagnosis/repair/${repairOrderId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!repairOrderId && dialogOpen,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/self-diagnosis/create", {
        repairOrderId: repairOrderId || null,
      });
      return res.json();
    },
    onSuccess: async (session: DiagnosisSession) => {
      const url = `${window.location.origin}/self-diagnosis/${session.token}`;
      setDiagUrl(url);
      try {
        const qrUrl = await QRCode.toDataURL(url, { width: 256, margin: 2 });
        setQrDataUrl(qrUrl);
      } catch {
        setQrDataUrl(null);
      }
      if (repairOrderId) {
        queryClient.invalidateQueries({ queryKey: ["/api/self-diagnosis/repair", repairOrderId] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error", "Errore"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCopy = () => {
    if (diagUrl) {
      navigator.clipboard.writeText(diagUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: t("common.copied", "Copiato!") });
    }
  };

  const handleOpen = () => {
    setDialogOpen(true);
    setQrDataUrl(null);
    setDiagUrl(null);
    setCopied(false);
  };

  const latestCompleted = existingSessionsQuery.data?.find((s) => s.status === "completed");
  const latestPending = existingSessionsQuery.data?.find((s) => s.status === "pending" || s.status === "in_progress");

  return (
    <>
      <Button variant={variant} size={size} onClick={handleOpen} data-testid="button-self-diagnosis">
        <Smartphone className="mr-2 h-4 w-4" />
        {t("diagnosis.selfDiagnosis", "Diagnostica remota")}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              {t("diagnosis.selfDiagnosisTitle", "Diagnostica Remota")}
            </DialogTitle>
            <DialogDescription>
              {t("diagnosis.selfDiagnosisDesc", "Genera un QR code che il cliente può scansionare sul proprio dispositivo per eseguire test diagnostici.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {latestCompleted && (
              <div className="rounded-md border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{t("diagnosis.lastDiagnosisCompleted", "Ultima diagnosi completata")}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { key: "displayTest", label: "Display" },
                    { key: "touchTest", label: "Touch" },
                    { key: "speakerTest", label: "Speaker" },
                    { key: "microphoneTest", label: "Microfono" },
                    { key: "cameraFrontTest", label: "Cam frontale" },
                    { key: "cameraRearTest", label: "Cam posteriore" },
                    { key: "vibrationTest", label: "Vibrazione" },
                    { key: "batteryTest", label: "Batteria" },
                    { key: "connectivityTest", label: "Connettività" },
                    { key: "sensorsTest", label: "Sensori" },
                    { key: "buttonsTest", label: "Pulsanti" },
                  ].map(({ key, label }) => {
                    const val = (latestCompleted as any)[key];
                    return (
                      <div key={key} className="flex items-center justify-between gap-1 text-xs p-1">
                        <span className="text-muted-foreground">{label}</span>
                        {val === true && <Badge variant="default" className="text-[10px] px-1 py-0">OK</Badge>}
                        {val === false && <Badge variant="destructive" className="text-[10px] px-1 py-0">KO</Badge>}
                        {val === null && <Badge variant="secondary" className="text-[10px] px-1 py-0">-</Badge>}
                      </div>
                    );
                  })}
                </div>
                {latestCompleted.batteryLevel !== null && (
                  <p className="text-xs text-muted-foreground">Batteria: {latestCompleted.batteryLevel}%</p>
                )}
                {latestCompleted.notes && (
                  <p className="text-xs text-muted-foreground">Note: {latestCompleted.notes}</p>
                )}
              </div>
            )}

            {latestPending && !diagUrl && (
              <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">{t("diagnosis.pendingSession", "Sessione in corso")}</span>
                  <Badge variant="secondary">{latestPending.status}</Badge>
                </div>
              </div>
            )}

            {!qrDataUrl && !diagUrl && (
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                className="w-full"
                data-testid="button-generate-qr"
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="mr-2 h-4 w-4" />
                )}
                {t("diagnosis.generateQr", "Genera QR Code")}
              </Button>
            )}

            {qrDataUrl && diagUrl && (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <img
                    src={qrDataUrl}
                    alt="QR Code diagnostica"
                    className="rounded-md border"
                    data-testid="img-qr-code"
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  {t("diagnosis.scanQr", "Il cliente deve scansionare questo QR col dispositivo da diagnosticare")}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1" data-testid="button-copy-link">
                    {copied ? <CheckCircle className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    {copied ? t("common.copied", "Copiato") : t("diagnosis.copyLink", "Copia link")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(diagUrl, "_blank")} className="flex-1" data-testid="button-open-link">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t("diagnosis.openLink", "Apri link")}
                  </Button>
                </div>
                <div className="rounded-md bg-muted p-2">
                  <code className="text-xs break-all" data-testid="text-diag-url">{diagUrl}</code>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {t("diagnosis.expiresIn24h", "Il link scade in 24 ore")}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
