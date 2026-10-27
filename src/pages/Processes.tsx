import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Activity, Cpu, MemoryStick, XCircle, RefreshCw } from "lucide-react";
import { Button, Card, PageHeader, ProgressBar, Segmented } from "../components/ui";
import type { ProcessInfo } from "../types";

export default function Processes() {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [sortBy, setSortBy] = useState<"cpu" | "memory">("cpu");
  const [loading, setLoading] = useState(false);

  const fetchProcesses = async () => {
    setLoading(true);
    try {
      const result = await invoke<ProcessInfo[]>("get_top_processes", {
        sortBy,
      });
      setProcesses(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 4000);
    return () => clearInterval(interval);
  }, [sortBy]);

  const handleKill = async (pid: number) => {
    await invoke("kill_process", { pid });
    fetchProcesses();
  };

  return (
    <div className="sp-stack">
      <PageHeader
        icon={Activity}
        title="Gestionnaire de processus"
        subtitle="Les programmes qui utilisent le plus le processeur ou la mémoire."
        color="teal"
        actions={
          <>
            <Segmented
              value={sortBy}
              onChange={setSortBy}
              options={[
                { id: "cpu", label: "CPU", icon: Cpu },
                { id: "memory", label: "RAM", icon: MemoryStick },
              ]}
            />
            <Button
              icon={RefreshCw}
              spinning={loading}
              onClick={fetchProcesses}
              aria-label="Actualiser la liste"
            />
          </>
        }
      />

      <Card flush>
        <div className="sp-table-wrap">
          <table className="sp-table">
            <thead>
              <tr>
                <th>Processus</th>
                <th>PID</th>
                <th>CPU</th>
                <th>Mémoire</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((p) => (
                <tr key={p.pid}>
                  <td className="font-semibold">{p.name}</td>
                  <td className="sp-muted">{p.pid}</td>
                  <td style={{ minWidth: 150 }}>
                    <div className="flex items-center gap-3">
                      <span className="w-12 shrink-0">{p.cpu_usage.toFixed(1)}%</span>
                      <div className="flex-1">
                        <ProgressBar percent={p.cpu_usage} height={6} />
                      </div>
                    </div>
                  </td>
                  <td>{p.memory_mb.toFixed(0)} Mo</td>
                  <td>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={XCircle}
                      onClick={() => handleKill(p.pid)}
                    >
                      Fermer
                    </Button>
                  </td>
                </tr>
              ))}
              {processes.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 sp-muted">
                    Chargement des processus...
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
