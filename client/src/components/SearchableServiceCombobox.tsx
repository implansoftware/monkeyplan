import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Wrench, Loader2 } from "lucide-react";
import type { ServiceItem } from "@shared/schema";

interface ServiceItemWithPrice extends ServiceItem {
  effectivePriceCents: number;
  effectiveLaborMinutes: number;
  priceSource: "base" | "reseller" | "repair_center";
}

interface SearchableServiceComboboxProps {
  onSelect: (service: ServiceItemWithPrice) => void;
  repairCenterId?: string;
  resellerId?: string;
  deviceTypeId?: string;
  brandId?: string;
  modelId?: string;
  placeholder?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function SearchableServiceCombobox({
  onSelect,
  repairCenterId,
  resellerId,
  deviceTypeId,
  brandId,
  modelId,
  placeholder = "Cerca servizio...",
}: SearchableServiceComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);

  const { data: services = [], isLoading } = useQuery<ServiceItemWithPrice[]>({
    queryKey: [
      "/api/service-items",
      { search: debouncedSearch, repairCenterId, resellerId, deviceTypeId, brandId, modelId, limit: 20 },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (repairCenterId) params.set("repairCenterId", repairCenterId);
      if (resellerId) params.set("resellerId", resellerId);
      if (deviceTypeId) params.set("deviceTypeId", deviceTypeId);
      if (brandId) params.set("brandId", brandId);
      if (modelId) params.set("modelId", modelId);
      params.set("limit", "20");
      
      const res = await fetch(`/api/service-items?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
    enabled: open,
  });

  const handleSelect = useCallback(
    (service: ServiceItemWithPrice) => {
      onSelect(service);
      setOpen(false);
      setSearch("");
    },
    [onSelect]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-[140px] justify-start"
          data-testid="combobox-service-search"
        >
          <Wrench className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Catalogo</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
            data-testid="input-service-search"
          />
          <div 
            className="max-h-[300px] overflow-y-auto overscroll-contain"
            onWheel={(e) => e.stopPropagation()}
          >
            <CommandList tabIndex={-1}>
              {isLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {!isLoading && services.length === 0 && (
                <CommandEmpty>
                  {search ? "Nessun servizio trovato" : "Digita per cercare..."}
                </CommandEmpty>
              )}
              {!isLoading && services.length > 0 && (
                <CommandGroup heading="Servizi">
                  {services.map((service) => (
                    <CommandItem
                      key={service.id}
                      value={service.id}
                      onSelect={() => handleSelect(service)}
                      className="cursor-pointer"
                      data-testid={`service-item-${service.id}`}
                    >
                      <div className="flex flex-col w-full">
                        <span className="font-medium">{service.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {service.code} -{" "}
                          {formatCurrency(service.effectivePriceCents / 100)}
                          {service.effectiveLaborMinutes > 0 && (
                            <span className="ml-1">
                              ({service.effectiveLaborMinutes} min)
                            </span>
                          )}
                          {service.priceSource !== "base" && (
                            <span className="ml-1 text-primary">
                              (
                              {service.priceSource === "reseller"
                                ? "Reseller"
                                : "Centro"}
                              )
                            </span>
                          )}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
