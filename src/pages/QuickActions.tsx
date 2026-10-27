import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Zap, MemoryStick, Trash2, RefreshCw } from "lucide-react";
import {
  Banner,
  BigTile,
  Button,
  Card,
  EmptyState,
  PageHeader,
} from "../components/ui";
import type { ProcessInfo, ClosedResult, TempCleanupResult } from "../types";

export default function QuickActions() {
  const [ramProcesses, setRamProcesses] = useState<ProcessInfo[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const loadProcesses = async () => {
    const list = await invoke<ProcessInfo[]>("get_top_ram_processes");
    setRamProcesses(list);
    setSelected(new Set(list.slice(0, 3).map((p) => p.pid)));
  };

  useEffect(() => {
    loadProcesses();
  }, []);

  const toggle = (pid: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(pid) ? next.delete(pid) : next.add(pid);
      return next;
    });
  };

  const closeSelected = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await invoke<ClosedResult>("close_processes", {
        pids: Array.from(selected),
      });
      setResult(
        `${res.closed.length} application(s) fermée(s) — ${res.freed_mb.toFixed(0)} Mo de RAM libérés.`,
      );
      loadProcesses();
    } finally {
      setLoading(false);
    }
  };

  const runFocusMode = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await invoke<ClosedResult>("run_focus_mode");
      setResult(
        res.closed.length > 0
          ? `Mode Focus activé : ${res.closed.length} application(s) fermée(s), ${res.freed_mb.toFixed(0)} Mo libérés.`
          : "Aucune application gourmande à fermer pour le moment.",
      );
      loadProcesses();
    } finally {
      setLoading(false);
    }
  };

  const cleanDisk = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await invoke<TempCleanupResult>("clean_temp_files");
      setResult(`Disque nettoyé : ${res.freed_mb.toFixed(0)} Mo libérés.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sp-stack">
      <PageHeader
        icon={Zap}
        title="Actions rapides"
        subtitle="Libérez des ressources en un clic."
        color="pink"
      />

      {result && <Banner tone="ok">{result}</Banner>}

      <div className="sp-grid sp-grid--2">
        <BigTile
          icon={Zap}
          title="Mode Focus"
          description="Ferme automatiquement les applications gourmandes en un clic pour libérer des ressources."
          color="accent"
          onClick={runFocusMode}
          disabled={loading}
        />
        <BigTile
          icon={Trash2}
          title="Nettoyer le disque maintenant"
          description="Supprime les fichiers temporaires accumulés pour libérer de l'espace disque."
          color="pink"
          onClick={cleanDisk}
          disabled={loading}
        />
      </div>

      <Card
        title="Libérer de la RAM — choisis les applications à fermer"
        icon={MemoryStick}
        action={
          <Button
            size="sm"
            variant="ghost"
            icon={RefreshCw}
            onClick={loadProcesses}
            aria-label="Actualiser la liste"
          />
        }
      >
        {ramProcesses.length === 0 ? (
          <EmptyState icon={MemoryStick} title="Aucune application gourmande détectée" />
        ) : (
          <div className="sp-list mb-4">
            {ramProcesses.map((p) => (
              <label key={p.pid} className="sp-item cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(p.pid)}
                    onChange={() => toggle(p.pid)}
                    className="sp-checkbox"
                  />
                  <span className="text-sm font-semibold">{p.name}</span>
                </div>
                <span className="text-sm sp-muted">{p.memory_mb.toFixed(0)} Mo</span>
              </label>
            ))}
          </div>
        )}

        <Button
          variant="danger"
          onClick={closeSelected}
          disabled={loading || selected.size === 0}
        >
          Fermer la sélection ({selected.size})
        </Button>
      </Card>
    </div>
  );
}
