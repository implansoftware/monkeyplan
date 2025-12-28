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
import { Package, Loader2 } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductWithStock extends Product {
  availableQuantity?: number;
}

interface SearchableProductComboboxProps {
  onSelect: (product: ProductWithStock) => void;
  placeholder?: string;
  warehouseId?: string;
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

export function SearchableProductCombobox({
  onSelect,
  placeholder = "Cerca prodotto...",
  warehouseId,
}: SearchableProductComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);

  const { data: products = [], isLoading } = useQuery<ProductWithStock[]>({
    queryKey: warehouseId 
      ? ["/api/warehouses", warehouseId, "products", { search: debouncedSearch, limit: 20 }]
      : ["/api/products", { search: debouncedSearch, limit: 20 }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("limit", "20");
      
      const url = warehouseId 
        ? `/api/warehouses/${warehouseId}/products?${params.toString()}`
        : `/api/products?${params.toString()}`;
        
      const res = await fetch(url, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
    enabled: open,
  });

  const activeProducts = warehouseId 
    ? products 
    : products.filter((p) => p.isActive);

  const handleSelect = useCallback(
    (product: ProductWithStock) => {
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
          data-testid="combobox-product-search"
        >
          <Package className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Magazzino</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
            data-testid="input-product-search"
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
                  {search ? "Nessun prodotto trovato" : "Digita per cercare..."}
                </CommandEmpty>
              )}
              {!isLoading && activeProducts.length > 0 && (
                <CommandGroup heading="Prodotti">
                  {activeProducts.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.id}
                      onSelect={() => handleSelect(product)}
                      className="cursor-pointer"
                      data-testid={`product-item-${product.id}`}
                    >
                      <div className="flex items-center gap-2 w-full">
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
                          <span className="truncate font-medium">
                            {product.name}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {product.sku} - {formatCurrency((product.unitPrice || 0) / 100)}
                            {product.availableQuantity !== undefined && (
                              <span className="ml-2 text-green-600 dark:text-green-400">
                                (Disp: {product.availableQuantity})
                              </span>
                            )}
                          </span>
                        </div>
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
