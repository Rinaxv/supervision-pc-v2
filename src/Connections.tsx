import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { RefreshCw, Search, Network } from "lucide-react";
import { Badge, Button, Card, PageHeader } from "../components/ui";
import type { Tone } from "../components/ui";
import type { ConnectionInfo } from "../types";

function stateTone(state: string): Tone | undefined {
  const s = state.toUpperCase();
  if (s.includes("ESTABLISHED")) return "ok";
  if (s.includes("LISTEN")) return "warn";
  return undefined;
}

export default function Connections() {
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

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
    if (!autoRefresh) return;
    const interval = setInterval(fetchConnections, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return connections.filter(
      (c) =>
        c.process_name.toLowerCase().includes(q) ||
        c.local_addr.includes(q) ||
        c.remote_addr.includes(q) ||
        String(c.pid).includes(q),
    );
  }, [connections, search]);

  return (
    <div className="sp-stack">
      <PageHeader
        icon={Network}
        title="Connexions actives"
        subtitle="Toutes les connexions réseau ouvertes sur ce PC et le programme qui les utilise."
        actions={
          <>
            <label className="flex items-center gap-2 text-xs sp-muted font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="sp-checkbox"
              />
              Auto-actualisation
            </label>
            <Button icon={RefreshCw} spinning={loading} onClick={fetchConnections}>
              Actualiser
            </Button>
          </>
        }
      />

      <div className="sp-searchbox">
        <Search size={16} />
        <input
          type="text"
          placeholder="Filtrer par processus, IP ou PID..."
          aria-label="Filtrer les connexions"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card flush title={`${filtered.length} connexion(s)`} icon={Network}>
        <div className="sp-table-wrap max-h-130">
          <table className="sp-table">
            <thead>
              <tr>
                <th>Protocole</th>
                <th>Adresse locale</th>
                <th>Adresse distante</th>
                <th>État</th>
                <th>Processus</th>
                <th>PID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i}>
                  <td>
                    <Badge tone={c.protocol === "TCP" ? "accent" : "upload"}>
                      {c.protocol}
                    </Badge>
                  </td>
                  <td>
                    {c.local_addr}:{c.local_port}
                  </td>
                  <td className="sp-muted">
                    {c.remote_port ? `${c.remote_addr}:${c.remote_port}` : "-"}
                  </td>
                  <td>
                    <Badge tone={stateTone(c.state)}>{c.state}</Badge>
                  </td>
                  <td className="font-semibold">{c.process_name}</td>
                  <td className="sp-muted">{c.pid}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 sp-muted">
                    Aucune connexion trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
