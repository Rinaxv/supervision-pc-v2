import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { RefreshCw, Wifi, XCircle } from "lucide-react";
import {
  Banner,
  Button,
  Card,
  EmptyState,
  PageHeader,
  ProgressBar,
} from "../components/ui";
import type { ConnectionInfo } from "../types";

interface AppUsage {
  process_name: string;
  pid: number;
  connectionCount: number;
}

export default function NetworkApps() {
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [killedMessage, setKilledMessage] = useState<string | null>(null);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const result = await invoke<ConnectionInfo[]>("get_active_connections");
      setConnections(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
    const interval = setInterval(fetchConnections, 5000);
    return () => clearInterval(interval);
  }, []);

  const apps: AppUsage[] = useMemo(() => {
    const map = new Map<string, AppUsage>();
    for (const c of connections) {
      const key = `${c.process_name}-${c.pid}`;
      if (!map.has(key)) {
        map.set(key, {
          process_name: c.process_name,
          pid: c.pid,
          connectionCount: 0,
        });
      }
      map.get(key)!.connectionCount += 1;
    }
    return Array.from(map.values())
      .filter((a) => a.process_name !== "Inconnu")
      .sort((a, b) => b.connectionCount - a.connectionCount);
  }, [connections]);

  const maxCount = apps.length > 0 ? apps[0].connectionCount : 1;

  const handleClose = async (pid: number, name: string) => {
    const ok = await invoke<boolean>("kill_process", { pid });
    setKilledMessage(
      ok
        ? `${name} a été fermé.`
        : `Impossible de fermer ${name} (droits administrateur requis).`,
    );
    setTimeout(() => setKilledMessage(null), 4000);
    fetchConnections();
  };

  return (
    <div className="sp-stack">
      <PageHeader
        icon={Wifi}
        title="Qui utilise mon internet ?"
        subtitle="Classement des applications par nombre de connexions réseau actives."
        color="pink"
        actions={
          <Button icon={RefreshCw} spinning={loading} onClick={fetchConnections}>
            Actualiser
          </Button>
        }
      />

      {killedMessage && <Banner tone="danger">{killedMessage}</Banner>}

      <Card title={`${apps.length} application(s) active(s) sur le réseau`} icon={Wifi}>
        {apps.length === 0 ? (
          <EmptyState icon={Wifi} title="Aucune activité réseau détectée pour le moment" />
        ) : (
          <div className="flex flex-col gap-4">
            {apps.map((app) => {
              const percent = (app.connectionCount / maxCount) * 100;
              return (
                <div
                  key={`${app.process_name}-${app.pid}`}
                  className="flex items-center gap-4"
                >
                  <div
                    className="w-40 shrink-0 text-sm font-semibold truncate"
                    title={app.process_name}
                  >
                    {app.process_name}
                  </div>
                  <div className="flex-1">
                    <ProgressBar percent={percent} tone="info" height={10} />
                  </div>
                  <div className="w-28 shrink-0 text-xs sp-muted text-right">
                    {app.connectionCount} connexion
                    {app.connectionCount > 1 ? "s" : ""}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={XCircle}
                    onClick={() => handleClose(app.pid, app.process_name)}
                    title="Fermer cette application"
                  >
                    Fermer
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
