import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { History as HistoryIcon, Zap, Trash2, MemoryStick } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, EmptyState, IconChip, PageHeader } from "../components/ui";
import type { Swatch } from "../components/ui";
import type { AppData, ActionLogEntry } from "../types";

function actionStyle(action: string): { icon: LucideIcon; color: Swatch } {
  if (action.includes("Focus")) return { icon: Zap, color: "accent" };
  if (action.includes("disque") || action.includes("Nettoyage"))
    return { icon: Trash2, color: "pink" };
  return { icon: MemoryStick, color: "green" };
}

export default function Historique() {
  const [log, setLog] = useState<ActionLogEntry[]>([]);

  useEffect(() => {
    invoke<AppData>("get_app_data").then((data) => {
      setLog([...data.actions_log].reverse());
    });
  }, []);

  return (
    <div className="sp-stack">
      <PageHeader
        icon={HistoryIcon}
        title="Historique des actions"
        subtitle="Actions effectuées par l'application, de la plus récente à la plus ancienne."
        color="blue"
      />

      <Card title="Actions effectuées par l'application" icon={HistoryIcon}>
        {log.length === 0 ? (
          <EmptyState icon={HistoryIcon} title="Aucune action enregistrée pour l'instant">
            Utilise le Mode Focus ou le nettoyage de disque pour voir apparaître
            un historique ici.
          </EmptyState>
        ) : (
          <div className="sp-timeline">
            {log.map((entry, i) => {
              const { icon, color } = actionStyle(entry.action);
              return (
                <div key={i}>
                  <IconChip icon={icon} color={color} size={38} />
                  <div>
                    <div className="text-sm font-bold">{entry.action}</div>
                    <div className="text-sm sp-muted">{entry.detail}</div>
                    <div className="text-xs sp-muted mt-1">
                      {new Date(entry.date).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
