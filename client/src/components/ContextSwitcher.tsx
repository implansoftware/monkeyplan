import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building, Store, Users } from "lucide-react";

interface ContextOption {
  id: string;
  name: string;
  email?: string;
  city?: string;
}

interface ContextOptionsResponse {
  childResellers: ContextOption[];
  repairCenters: ContextOption[];
}

interface ActingAs {
  type: 'reseller' | 'repair_center';
  id: string;
  name: string;
}

interface ContextResponse {
  actingAs: ActingAs | null;
}

export function ContextSwitcher() {
  const { data: options, isLoading: isLoadingOptions } = useQuery<ContextOptionsResponse>({
    queryKey: ['/api/reseller/context-options'],
  });

  const { data: context, isLoading: isLoadingContext } = useQuery<ContextResponse>({
    queryKey: ['/api/reseller/context'],
  });

  const invalidateAllContextDependentQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/reseller/context'] });
    queryClient.invalidateQueries({ queryKey: ['/api/reseller'] });
    queryClient.invalidateQueries({ 
      predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === 'string' && (
          key.startsWith('/api/repair-orders') ||
          key.startsWith('/api/customers') ||
          key.startsWith('/api/repair-centers')
        );
      }
    });
  };

  const setContextMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      return apiRequest('POST', '/api/reseller/context', { type, id });
    },
    onSuccess: invalidateAllContextDependentQueries,
  });

  const clearContextMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', '/api/reseller/context');
    },
    onSuccess: invalidateAllContextDependentQueries,
  });

  const hasOptions = options && (options.childResellers.length > 0 || options.repairCenters.length > 0);

  if (isLoadingOptions || isLoadingContext) {
    return null;
  }

  if (!hasOptions) {
    return null;
  }

  const handleValueChange = (value: string) => {
    if (value === 'all') {
      clearContextMutation.mutate();
    } else {
      const [type, id] = value.split(':');
      setContextMutation.mutate({ type, id });
    }
  };

  const currentValue = context?.actingAs 
    ? `${context.actingAs.type}:${context.actingAs.id}`
    : 'all';

  return (
    <div className="flex flex-col gap-1.5 px-3" data-testid="context-switcher">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
        <Users className="h-3 w-3" />
        <span>Visualizza come</span>
      </div>
      <Select 
        value={currentValue} 
        onValueChange={handleValueChange}
        disabled={setContextMutation.isPending || clearContextMutation.isPending}
      >
        <SelectTrigger 
          className="w-full h-8 text-sm"
          data-testid="select-context-trigger"
        >
          <SelectValue placeholder="Seleziona contesto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" data-testid="select-context-all">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Store className="h-4 w-4 flex-shrink-0" />
              <span>Tutti i miei dati</span>
            </div>
          </SelectItem>
          
          {options && options.childResellers.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Sub-Rivenditori
              </div>
              {options.childResellers.map((reseller) => (
                <SelectItem 
                  key={reseller.id} 
                  value={`reseller:${reseller.id}`}
                  data-testid={`select-context-reseller-${reseller.id}`}
                >
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Store className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{reseller.name}</span>
                  </div>
                </SelectItem>
              ))}
            </>
          )}
          
          {options && options.repairCenters.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Centri di Riparazione
              </div>
              {options.repairCenters.map((center) => (
                <SelectItem 
                  key={center.id} 
                  value={`repair_center:${center.id}`}
                  data-testid={`select-context-center-${center.id}`}
                >
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Building className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{center.name}</span>
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
      
      {context?.actingAs && (
        <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mt-1">
          {context.actingAs.type === 'reseller' ? (
            <Store className="h-3 w-3 flex-shrink-0" />
          ) : (
            <Building className="h-3 w-3 flex-shrink-0" />
          )}
          <span className="truncate">Visualizzando: {context.actingAs.name}</span>
        </div>
      )}
    </div>
  );
}
