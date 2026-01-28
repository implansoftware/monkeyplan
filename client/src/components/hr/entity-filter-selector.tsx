import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Store, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SubReseller {
  id: string;
  fullName: string;
  ragioneSociale?: string;
}

interface RepairCenter {
  id: string;
  name: string;
  city?: string;
}

export type EntityType = "own" | "sub-reseller" | "repair-center";

interface EntityFilterSelectorProps {
  entityType: EntityType;
  setEntityType: (type: EntityType) => void;
  selectedEntityId: string;
  setSelectedEntityId: (id: string) => void;
  showRepairCenters?: boolean;
}

export function EntityFilterSelector({
  entityType,
  setEntityType,
  selectedEntityId,
  setSelectedEntityId,
  showRepairCenters = true,
}: EntityFilterSelectorProps) {
  const { data: subResellers = [] } = useQuery<SubReseller[]>({
    queryKey: ["/api/reseller/sub-resellers"],
  });

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
    enabled: showRepairCenters,
  });

  const isOwnTeam = entityType === "own";

  const getEntityName = () => {
    if (entityType === "sub-reseller" && selectedEntityId) {
      const sr = subResellers.find(s => s.id === selectedEntityId);
      return sr?.ragioneSociale || sr?.fullName || "Sub-Reseller";
    }
    if (entityType === "repair-center" && selectedEntityId) {
      const rc = repairCenters.find(r => r.id === selectedEntityId);
      return rc?.name || "Centro";
    }
    return "Il mio Team";
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-muted-foreground">Visualizza dati di:</span>
      
      <Select
        value={entityType}
        onValueChange={(value: EntityType) => {
          setEntityType(value);
          setSelectedEntityId("");
        }}
      >
        <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-entity-type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="own">
            <div className="flex flex-wrap items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Il mio Team</span>
            </div>
          </SelectItem>
          {subResellers.length > 0 && (
            <SelectItem value="sub-reseller">
              <div className="flex flex-wrap items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>Sub-Reseller</span>
              </div>
            </SelectItem>
          )}
          {showRepairCenters && repairCenters.length > 0 && (
            <SelectItem value="repair-center">
              <div className="flex flex-wrap items-center gap-2">
                <Store className="h-4 w-4" />
                <span>Centro Riparazione</span>
              </div>
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {entityType === "sub-reseller" && subResellers.length > 0 && (
        <Select
          value={selectedEntityId}
          onValueChange={setSelectedEntityId}
        >
          <SelectTrigger className="w-full sm:w-[220px]" data-testid="select-sub-reseller">
            <SelectValue placeholder="Seleziona sub-reseller..." />
          </SelectTrigger>
          <SelectContent>
            {subResellers.map((sr) => (
              <SelectItem key={sr.id} value={sr.id}>
                {sr.ragioneSociale || sr.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {entityType === "repair-center" && repairCenters.length > 0 && (
        <Select
          value={selectedEntityId}
          onValueChange={setSelectedEntityId}
        >
          <SelectTrigger className="w-full sm:w-[220px]" data-testid="select-repair-center">
            <SelectValue placeholder="Seleziona centro..." />
          </SelectTrigger>
          <SelectContent>
            {repairCenters.map((rc) => (
              <SelectItem key={rc.id} value={rc.id}>
                {rc.name}
                {rc.city && <span className="text-muted-foreground ml-1">({rc.city})</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {!isOwnTeam && selectedEntityId && (
        <Badge variant="outline" className="ml-2">
          Dati di: {getEntityName()}
        </Badge>
      )}
    </div>
  );
}

export function useEntityFilter() {
  return {
    buildQueryParams: (entityType: EntityType, entityId: string) => {
      if (entityType === "own" || !entityId) return "";
      return `?entityType=${entityType}&entityId=${entityId}`;
    },
    isReadOnly: (entityType: EntityType, entityId: string) => {
      return entityType !== "own" && !!entityId;
    },
  };
}
