import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Store, Users, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface EntityItem {
  type: string;
  id: string;
  name: string;
  parentId: string | null;
  parentName?: string;
}

export type AdminEntityType = "all" | "reseller" | "sub-reseller" | "repair-center";

interface AdminEntityFilterSelectorProps {
  entityType: AdminEntityType;
  setEntityType: (type: AdminEntityType) => void;
  selectedEntityId: string;
  setSelectedEntityId: (id: string) => void;
}

export function AdminEntityFilterSelector({
  entityType,
  setEntityType,
  selectedEntityId,
  setSelectedEntityId,
}: AdminEntityFilterSelectorProps) {
  const { t } = useTranslation();
  const { data: entities = [] } = useQuery<EntityItem[]>({
    queryKey: ["/api/admin/hr/entities"],
  });

  const resellers = entities.filter(e => e.type === 'reseller');
  const subResellers = entities.filter(e => e.type === 'sub-reseller');
  const repairCenters = entities.filter(e => e.type === 'repair-center');

  const getEntityName = () => {
    if (entityType === "all") return t("common.allEntities");
    if (entityType === "reseller" && selectedEntityId) {
      const r = resellers.find(s => s.id === selectedEntityId);
      return r?.name || "Reseller";
    }
    if (entityType === "sub-reseller" && selectedEntityId) {
      const sr = subResellers.find(s => s.id === selectedEntityId);
      return sr?.name || "Sub-Reseller";
    }
    if (entityType === "repair-center" && selectedEntityId) {
      const rc = repairCenters.find(r => r.id === selectedEntityId);
      return rc?.name || "Centro";
    }
    return t("common.select");
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-muted-foreground">{t("common.viewDataOf")}</span>
      
      <Select
        value={entityType}
        onValueChange={(value: AdminEntityType) => {
          setEntityType(value);
          setSelectedEntityId("");
        }}
      >
        <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-admin-entity-type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex flex-wrap items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>{t("common.allEntities")}</span>
            </div>
          </SelectItem>
          {resellers.length > 0 && (
            <SelectItem value="reseller">
              <div className="flex flex-wrap items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>Reseller ({resellers.length})</span>
              </div>
            </SelectItem>
          )}
          {subResellers.length > 0 && (
            <SelectItem value="sub-reseller">
              <div className="flex flex-wrap items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Sub-Reseller ({subResellers.length})</span>
              </div>
            </SelectItem>
          )}
          {repairCenters.length > 0 && (
            <SelectItem value="repair-center">
              <div className="flex flex-wrap items-center gap-2">
                <Store className="h-4 w-4" />
                <span>{t("hr.repairCentersCount", { count: repairCenters.length })}</span>
              </div>
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {entityType !== "all" && (
        <Select
          value={selectedEntityId}
          onValueChange={setSelectedEntityId}
        >
          <SelectTrigger className="w-full sm:w-[250px]" data-testid="select-admin-entity-id">
            <SelectValue placeholder={t("staff.selectEntity")} />
          </SelectTrigger>
          <SelectContent>
            {entityType === "reseller" && resellers.map(r => (
              <SelectItem key={r.id} value={r.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <span>{r.name}</span>
                </div>
              </SelectItem>
            ))}
            {entityType === "sub-reseller" && subResellers.map(sr => (
              <SelectItem key={sr.id} value={sr.id}>
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span>{sr.name}</span>
                  </div>
                  {sr.parentName && (
                    <span className="text-xs text-muted-foreground ml-6">
                      {t("hr.parent")}: {sr.parentName}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
            {entityType === "repair-center" && repairCenters.map(rc => (
              <SelectItem key={rc.id} value={rc.id}>
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <Store className="h-4 w-4 text-green-500" />
                    <span>{rc.name}</span>
                  </div>
                  {rc.parentName && (
                    <span className="text-xs text-muted-foreground ml-6">
                      {t("hr.reseller")}: {rc.parentName}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {entityType !== "all" && selectedEntityId && (
        <Badge variant="secondary" className="ml-2">
          {getEntityName()}
        </Badge>
      )}
      
      {entityType === "all" && (
        <Badge variant="outline" className="ml-2">
          <Globe className="h-3 w-3 mr-1" />
          {t("hr.globalVisibility")}
        </Badge>
      )}
    </div>
  );
}

export function useAdminEntityFilter() {
  const [entityType, setEntityType] = useState<AdminEntityType>("all");
  const [selectedEntityId, setSelectedEntityId] = useState("");

  const getQueryParams = () => {
    if (entityType === "all") return {};
    if (!selectedEntityId) return {};
    return { entityType, entityId: selectedEntityId };
  };

  return {
    entityType,
    setEntityType,
    selectedEntityId,
    setSelectedEntityId,
    getQueryParams,
  };
}

import { useState } from "react";
