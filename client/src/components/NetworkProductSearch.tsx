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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Network, Truck, Loader2, Package, Building } from "lucide-react";

interface NetworkProduct {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  availableQuantity: number;
  warehouseName?: string;
  warehouseId?: string;
  ownerName?: string;
  ownerId?: string;
  ownerType?: string;
  supplierName?: string;
  supplierId?: string;
  supplierType?: string;
  imageUrl?: string;
  source: "network" | "supplier";
}

interface NetworkSearchResults {
  network: NetworkProduct[];
  suppliers: NetworkProduct[];
}

interface NetworkProductSearchProps {
  onSelect: (product: NetworkProduct) => void;
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
  }).format(amount / 100);
}

export function NetworkProductSearch({
  onSelect,
  placeholder = "Cerca nella rete...",
}: NetworkProductSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"network" | "suppliers">("network");
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery<NetworkSearchResults>({
    queryKey: ["/api/network/products/search", { search: debouncedSearch }],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        return { network: [], suppliers: [] };
      }
      const params = new URLSearchParams();
      params.set("search", debouncedSearch);
      params.set("limit", "20");
      
      const res = await fetch(`/api/network/products/search?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
    enabled: open && debouncedSearch.length >= 2,
  });

  const networkProducts = data?.network || [];
  const supplierProducts = data?.suppliers || [];
  const activeProducts = activeTab === "network" ? networkProducts : supplierProducts;

  const handleSelect = useCallback(
    (product: NetworkProduct) => {
      onSelect(product);
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
          data-testid="combobox-network-search"
        >
          <Network className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Rete</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-2 border-b">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "network" | "suppliers")}>
            <TabsList className="w-full">
              <TabsTrigger value="network" className="flex-1 gap-1" data-testid="tab-network">
                <Building className="h-3.5 w-3.5" />
                Rete
                {networkProducts.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {networkProducts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="suppliers" className="flex-1 gap-1" data-testid="tab-suppliers">
                <Truck className="h-3.5 w-3.5" />
                Fornitori
                {supplierProducts.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {supplierProducts.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
            data-testid="input-network-search"
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
              {!isLoading && activeProducts.length === 0 && (
                <CommandEmpty>
                  {search.length < 2 
                    ? "Digita almeno 2 caratteri..." 
                    : activeTab === "network"
                      ? "Nessun prodotto trovato nella rete"
                      : "Nessun prodotto trovato nei cataloghi fornitori"
                  }
                </CommandEmpty>
              )}
              {!isLoading && activeProducts.length > 0 && (
                <CommandGroup heading={activeTab === "network" ? "Magazzini Rete" : "Cataloghi Fornitori"}>
                  {activeProducts.map((product, index) => {
                    // Create unique key combining source, id, and warehouse/supplier
                    const uniqueKey = product.source === "network" 
                      ? `${product.source}-${product.id}-${product.warehouseId || index}`
                      : `${product.source}-${product.id}-${product.supplierId || index}`;
                    return (
                    <CommandItem
                      key={uniqueKey}
                      value={uniqueKey}
                      onSelect={() => handleSelect(product)}
                      className="cursor-pointer"
                      data-testid={`network-product-item-${product.id}-${index}`}
                    >
                      <div className="flex flex-wrap items-center gap-2 w-full">
                        <div className="w-8 h-8 flex-shrink-0 rounded border overflow-hidden">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Package className="h-3 w-3 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="truncate font-medium text-sm">
                            {product.name}
                          </span>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="truncate">{product.sku}</span>
                            <span>-</span>
                            <span>{formatCurrency(product.unitPrice)}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            {product.source === "network" ? (
                              <Badge variant="outline" className="text-xs h-5 px-1.5">
                                <Building className="h-3 w-3 mr-1" />
                                {product.ownerName}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs h-5 px-1.5">
                                <Truck className="h-3 w-3 mr-1" />
                                {product.supplierName}
                              </Badge>
                            )}
                            <span className={`text-xs ${product.availableQuantity > 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                              {product.availableQuantity > 0 
                                ? `Disp: ${product.availableQuantity}` 
                                : "Non disponibile"
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  )})}

                </CommandGroup>
              )}
            </CommandList>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
