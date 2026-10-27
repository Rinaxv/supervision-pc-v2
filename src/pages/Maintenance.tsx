import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Trash2, Sparkles, Power, PowerOff, Rocket } from "lucide-react";
import {
  Banner,
  Button,
  Card,
  EmptyState,
  PageHeader,
  StatCard,
} from "../components/ui";
import type { TempCleanupResult, StartupApp } from "../types";

export default function Maintenance() {
  const [tempSize, setTempSize] = useState<number | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [result, setResult] = useState<TempCleanupResult | null>(null);
  const [startupApps, setStartupApps] = useState<StartupApp[]>([]);

  const loadTempSize = async () => {
    const size = await invoke<number>("get_temp_size");
    setTempSize(size);
  };

  const loadStartupApps = async () => {
    const apps = await invoke<StartupApp[]>("get_startup_apps");
    setStartupApps(apps.sort((a, b) => a.name.localeCompare(b.name)));
  };

  useEffect(() => {
    loadTempSize();
    loadStartupApps();
  }, []);

  const handleClean = async () => {
    setCleaning(true);
    try {
      const res = await invoke<TempCleanupResult>("clean_temp_files");
      setResult(res);
      setTempSize(res.after_mb);
    } finally {
      setCleaning(false);
    }
  };

  const toggleStartup = async (name: string, enabled: boolean) => {
    await invoke("toggle_startup_app", { name, enable: !enabled });
    loadStartupApps();
  };

  return (
    <div className="sp-stack">
      <PageHeader
        icon={Sparkles}
        title="Maintenance"
        subtitle="Libérez de l'espace et accélérez le démarrage de Windows."
        color="blue"
      />

      <StatCard
        icon={Trash2}
        label="Fichiers temporaires"
        value={tempSize !== null ? `${tempSize.toFixed(0)} Mo` : "..."}
        sub="Actuellement occupés par des fichiers temporaires"
        color="orange"
      >
        <div>
          <Button icon={Sparkles} onClick={handleClean} disabled={cleaning}>
            {cleaning ? "Nettoyage..." : "Nettoyer maintenant"}
          </Button>
        </div>
      </StatCard>

      {result && (
        <Banner tone="ok">{result.freed_mb.toFixed(0)} Mo libérés avec succès.</Banner>
      )}

      <Card title="Programmes au démarrage de Windows" icon={Rocket}>
        {startupApps.length === 0 ? (
          <EmptyState icon={Rocket} title="Aucun programme de démarrage détecté" />
        ) : (
          <div className="sp-list">
            {startupApps.map((app) => (
              <div key={app.name} className="sp-item">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{app.name}</div>
                  <div className="text-xs sp-muted truncate max-w-md">
                    {app.command}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={app.enabled ? "danger" : "success"}
                  icon={app.enabled ? PowerOff : Power}
                  onClick={() => toggleStartup(app.name, app.enabled)}
                >
                  {app.enabled ? "Désactiver" : "Activer"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
