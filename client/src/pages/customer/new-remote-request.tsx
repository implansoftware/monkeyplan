import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Send, Upload, Image, Trash2, Check, Search, ArrowLeft, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CustomerBranch } from "@shared/schema";
import { useLocation } from "wouter";
import type { DeviceType, DeviceBrand } from "@shared/schema";

interface DeviceModelResult {
  id: string;
  modelName: string;
  brand?: string | null;
  brandId?: string | null;
  typeId?: string | null;
  deviceClass?: string | null;
}

interface DeviceEntry {
  deviceType: string;
  brandId: string;
  brand: string;
  model: string;
  productSearch: string;
  imei: string;
  serial: string;
  quantity: number;
  issueDescription: string;
  photos: File[];
  photoPreviewUrls: string[];
}

const emptyDevice = (): DeviceEntry => ({
  deviceType: "",
  brandId: "",
  brand: "",
  model: "",
  productSearch: "",
  imei: "",
  serial: "",
  quantity: 1,
  issueDescription: "",
  photos: [],
  photoPreviewUrls: [],
});

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function DeviceModelAutocomplete({
  value,
  onChange,
  deviceTypes,
  deviceBrands,
}: {
  value: string;
  onChange: (updates: Partial<DeviceEntry>) => void;
  deviceTypes?: DeviceType[];
  deviceBrands?: DeviceBrand[];
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  const { data: suggestions = [], isLoading } = useQuery<DeviceModelResult[]>({
    queryKey: ["/api/device-models", { search: debouncedSearch }],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [];
      const params = new URLSearchParams({ search: debouncedSearch, limit: "15" });
      const res = await fetch(`/api/device-models?${params}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: debouncedSearch.length >= 2 && isFocused && !selectedId,
  });

  useEffect(() => {
    setIsOpen(suggestions.length > 0 && isFocused && debouncedSearch.length >= 2 && !selectedId);
  }, [suggestions, isFocused, debouncedSearch, selectedId]);

  const handleSelect = (model: DeviceModelResult) => {
    const brandName = model.brand || deviceBrands?.find(b => b.id === model.brandId)?.name || "";
    const typeName = deviceTypes?.find(t => t.id === model.typeId)?.name || "";
    const displayText = brandName ? `${brandName} ${model.modelName}` : model.modelName;
    setSearch(displayText);
    setSelectedId(model.id);
    onChange({
      deviceType: typeName,
      brandId: model.brandId || "",
      brand: brandName,
      model: model.modelName,
      productSearch: displayText,
    });
    setIsOpen(false);
  };

  const handleInputChange = (val: string) => {
    setSearch(val);
    setSelectedId(null);
    if (!val) {
      onChange({ deviceType: "", brandId: "", brand: "", model: "", productSearch: "" });
    } else {
      onChange({ deviceType: "", brandId: "", brand: "", model: "", productSearch: val });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { setIsFocused(true); if (!selectedId) setIsOpen(suggestions.length > 0); }}
          onBlur={() => setTimeout(() => { setIsFocused(false); setIsOpen(false); }, 200)}
          onKeyDown={handleKeyDown}
          placeholder={t("customerPages.cercaDispositivoEsIPhone15GalaxyS24")}
          className="pl-9"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          data-testid="input-device-search"
        />
        {isLoading && isFocused && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md max-h-[240px] overflow-y-auto" role="listbox">
          {suggestions.map((model) => {
            const brandName = model.brand || deviceBrands?.find(b => b.id === model.brandId)?.name || "";
            const typeName = deviceTypes?.find(t => t.id === model.typeId)?.name || "";
            return (
              <button
                key={model.id}
                type="button"
                role="option"
                className="w-full text-left px-3 py-2 text-sm cursor-pointer flex items-center justify-between gap-2 transition-colors"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(model); }}
                data-testid={`suggestion-${model.id}`}
              >
                <span className="font-medium truncate">
                  {brandName ? `${brandName} ` : ""}{model.modelName}
                </span>
                {typeName && (
                  <Badge variant="outline" className="text-xs flex-shrink-0">{typeName}</Badge>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DeviceFormCard({
  device,
  index,
  total,
  onUpdate,
  onRemove,
  onPhotoChange,
  onRemovePhoto,
  deviceTypes,
  deviceBrands,
}: {
  device: DeviceEntry;
  index: number;
  total: number;
  onUpdate: (updates: Partial<DeviceEntry>) => void;
  onRemove: () => void;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (photoIndex: number) => void;
  deviceTypes?: DeviceType[];
  deviceBrands?: DeviceBrand[];
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 p-4 border rounded-md bg-muted/20" data-testid={`card-device-form-${index}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">{index + 1}</span>
          </div>
          <span className="text-sm font-medium">{t("customerPages.deviceLabel")} {index + 1}</span>
        </div>
        {total > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            data-testid={`button-remove-device-${index}`}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t("customerPages.whichDeviceToRepair")}</Label>
        <DeviceModelAutocomplete
          value={device.productSearch}
          onChange={(updates) => onUpdate(updates)}
          deviceTypes={deviceTypes}
          deviceBrands={deviceBrands}
        />
        {device.brand && device.model && (
          <div className="flex items-center gap-1.5 mt-1">
            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs text-muted-foreground">
              {device.deviceType && <span>{device.deviceType} — </span>}
              {device.brand} {device.model}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t("customerPages.describeTheProblem")}</Label>
        <Textarea
          value={device.issueDescription}
          onChange={(e) => onUpdate({ issueDescription: e.target.value })}
          placeholder={t("customerPages.whatIsWrong")}
          rows={3}
          data-testid={`input-issue-${index}`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("common.quantity")}</Label>
          <Input
            type="number"
            min={1}
            value={device.quantity}
            onChange={(e) => onUpdate({ quantity: Math.max(1, parseInt(e.target.value) || 1) })}
            data-testid={`input-quantity-${index}`}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("customerPages.imeiOptional")}</Label>
          <Input
            value={device.imei}
            onChange={(e) => onUpdate({ imei: e.target.value })}
            placeholder={t("customerPages.imeiCode")}
            data-testid={`input-imei-${index}`}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("customerPages.serialOptional")}</Label>
          <Input
            value={device.serial}
            onChange={(e) => onUpdate({ serial: e.target.value })}
            placeholder={t("products.serialNumber")}
            data-testid={`input-serial-${index}`}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t("customerPages.defectPhotosOptional")}</Label>
        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer" data-testid={`label-upload-photos-${index}`}>
            <input type="file" accept="image/*" multiple onChange={onPhotoChange} className="hidden" data-testid={`input-photos-${index}`} />
            <div className="flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm text-muted-foreground">
              <Upload className="h-3.5 w-3.5" />
              {t("customerPages.uploadPhotos")}
            </div>
          </label>
          {device.photoPreviewUrls.map((url, pi) => (
            <div key={pi} className="relative group" data-testid={`photo-preview-${index}-${pi}`}>
              <img src={url} alt={`Preview ${pi + 1}`} className="w-12 h-12 object-cover rounded-md border" />
              <button
                type="button"
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                onClick={() => onRemovePhoto(pi)}
                data-testid={`button-remove-photo-${index}-${pi}`}
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NewRemoteRequest() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [devices, setDevices] = useState<DeviceEntry[]>([emptyDevice()]);
  const [customerNotes, setCustomerNotes] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("none");
  const [requestedCenterId, setRequestedCenterId] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: deviceTypes } = useQuery<DeviceType[]>({
    queryKey: ["/api/device-types"],
  });

  const { data: deviceBrands } = useQuery<DeviceBrand[]>({
    queryKey: ["/api/device-brands"],
  });

  const isBusinessCustomer = !!(user?.partitaIva);
  const { data: myBranches = [] } = useQuery<CustomerBranch[]>({
    queryKey: ["/api/customers", user?.id, "branches"],
    enabled: isBusinessCustomer && !!user?.id,
  });

  const updateDevice = (index: number, updates: Partial<DeviceEntry>) => {
    setDevices((prev) => prev.map((d, i) => (i === index ? { ...d, ...updates } : d)));
  };

  const addDevice = () => {
    setDevices((prev) => [...prev, emptyDevice()]);
  };

  const removeDevice = (index: number) => {
    setDevices((prev) => {
      const removed = prev[index];
      removed.photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDevicePhotoChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      toast({ title: t("customerPages.tooManyFiles"), description: t("customerPages.maxPhotosPerDevice"), variant: "destructive" });
      return;
    }
    const urls = files.map((f) => URL.createObjectURL(f));
    updateDevice(index, { photos: files, photoPreviewUrls: urls });
  };

  const removeDevicePhoto = (deviceIndex: number, photoIndex: number) => {
    setDevices((prev) =>
      prev.map((d, i) => {
        if (i !== deviceIndex) return d;
        const newPhotos = [...d.photos];
        newPhotos.splice(photoIndex, 1);
        const newUrls = [...d.photoPreviewUrls];
        URL.revokeObjectURL(newUrls[photoIndex]);
        newUrls.splice(photoIndex, 1);
        return { ...d, photos: newPhotos, photoPreviewUrls: newUrls };
      })
    );
  };

  const uploadPhotos = async (photos: File[]): Promise<string[]> => {
    if (photos.length === 0) return [];
    const formData = new FormData();
    photos.forEach((p) => formData.append("photos", p));
    const response = await fetch("/api/customer/remote-requests/upload-photos", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!response.ok) throw new Error(await response.text());
    const { photos: urls } = await response.json();
    return urls;
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/customer/remote-requests", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/remote-requests"] });
      devices.forEach((d) => d.photoPreviewUrls.forEach((u) => URL.revokeObjectURL(u)));
      toast({ title: t("customerPages.requestSent"), description: t("customerPages.laTuaRichiestaDiRiparazioneStataInviataCo") });
      navigate("/customer/remote-requests");
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (devices.length === 0) {
      toast({ title: t("auth.error"), description: t("customerPages.addAtLeastOneDevice"), variant: "destructive" });
      return;
    }
    for (const d of devices) {
      const hasDevice = (d.brand && d.model) || d.productSearch;
      if (!hasDevice || !d.issueDescription) {
        toast({ title: t("customerPages.missingData"), description: t("customerPages.selectDeviceAndDescribe"), variant: "destructive" });
        return;
      }
      if (d.quantity < 1) {
        toast({ title: t("auth.error"), description: t("customerPages.laQuantitDeveEssereAlmeno1"), variant: "destructive" });
        return;
      }
    }

    try {
      setIsUploading(true);
      const devicesData = await Promise.all(
        devices.map(async (d) => {
          let photoUrls: string[] = [];
          if (d.photos.length > 0) {
            photoUrls = await uploadPhotos(d.photos);
          }
          return {
            deviceType: d.deviceType || "Altro",
            brand: d.brand || (d.productSearch || "").split(" ")[0] || "N/D",
            model: d.model || d.productSearch || "N/D",
            imei: d.imei || undefined,
            serial: d.serial || undefined,
            quantity: d.quantity,
            issueDescription: d.issueDescription,
            photos: photoUrls.length > 0 ? photoUrls : undefined,
          };
        })
      );

      createMutation.mutate({
        resellerId: user?.resellerId || "",
        requestedCenterId: requestedCenterId === "none" || requestedCenterId === "" ? null : requestedCenterId,
        customerNotes: customerNotes || undefined,
        branchId: selectedBranchId !== "none" ? selectedBranchId : undefined,
        devices: devicesData,
      });
    } catch (error: any) {
      toast({ title: t("customerPages.erroreUploadFoto"), description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const totalDeviceCount = devices.reduce((sum, d) => sum + d.quantity, 0);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/customer/remote-requests")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold" data-testid="text-page-title">{t("customerPages.nuovaRichiestaDiRiparazione")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("customerPages.addFormDesc")}
          </p>
        </div>
      </div>

      <form onSubmit={handleCreateRequest} className="space-y-4">
        {/* Sub-client selector — visible only for business customers with registered clients */}
        {isBusinessCustomer && myBranches.length > 0 && (
          <div className="border rounded-md p-4 space-y-2 bg-muted/20">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Per quale tuo cliente è questa richiesta?</Label>
            </div>
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger data-testid="select-branch-id">
                <SelectValue placeholder="Seleziona cliente finale (opzionale)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Per me stesso —</SelectItem>
                {myBranches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.branchName}{branch.contactName ? ` — ${branch.contactName}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Puoi gestire i tuoi clienti dalla sezione "I miei clienti" nel profilo
            </p>
          </div>
        )}

        {devices.map((device, idx) => (
          <DeviceFormCard
            key={idx}
            device={device}
            index={idx}
            total={devices.length}
            onUpdate={(updates) => updateDevice(idx, updates)}
            onRemove={() => removeDevice(idx)}
            onPhotoChange={(e) => handleDevicePhotoChange(idx, e)}
            onRemovePhoto={(pi) => removeDevicePhoto(idx, pi)}
            deviceTypes={deviceTypes}
            deviceBrands={deviceBrands}
          />
        ))}

        <Button type="button" variant="outline" className="w-full" onClick={addDevice} data-testid="button-add-device">
          <Plus className="h-4 w-4 mr-2" />
          {t("customerPages.addAnotherDevice")}
        </Button>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("customerPages.additionalNotesOptional")}</Label>
          <Textarea
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            placeholder={t("customerPages.otherInfoForCenter")}
            rows={2}
            data-testid="input-customer-notes"
          />
        </div>

        <Card>
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4">
            <p className="text-sm text-muted-foreground">
              {devices.length === 1 ? t("remote.deviceCountLabel", { count: devices.length }) : t("remote.deviceCountLabelPlural", { count: devices.length })} · {t("remote.unitsCount", { qty: totalDeviceCount })}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => navigate("/customer/remote-requests")} data-testid="button-cancel-request">
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={createMutation.isPending || isUploading} data-testid="button-submit-request">
                {createMutation.isPending || isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("customerPages.sendingInProgress")}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {t("customerPages.sendRequest")}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
