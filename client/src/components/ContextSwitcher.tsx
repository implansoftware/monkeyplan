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
import { Badge } from "@/components/ui/badge";

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

  const setContextMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      return apiRequest('POST', '/api/reseller/context', { type, id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/context'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller'] });
    },
  });

  const clearContextMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', '/api/reseller/context');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/context'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller'] });
    },
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
    <div className="flex flex-col gap-2 px-2" data-testid="context-switcher">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Users className="h-3 w-3" />
        <span>Visualizza come</span>
      </div>
      <Select 
        value={currentValue} 
        onValueChange={handleValueChange}
        disabled={setContextMutation.isPending || clearContextMutation.isPending}
      >
        <SelectTrigger 
          className="w-full h-9"
          data-testid="select-context-trigger"
        >
          <SelectValue placeholder="Seleziona contesto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" data-testid="select-context-all">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4" />
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
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    <span>{reseller.name}</span>
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
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>{center.name}</span>
                    {center.city && (
                      <Badge variant="outline" className="text-xs">
                        {center.city}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
      
      {context?.actingAs && (
        <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          {context.actingAs.type === 'reseller' ? (
            <Store className="h-3 w-3" />
          ) : (
            <Building className="h-3 w-3" />
          )}
          <span>Stai visualizzando: {context.actingAs.name}</span>
        </div>
      )}
    </div>
  );
}
