import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  Gauge as GaugeIcon,
  Play,
  Clock,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import Gauge from "../components/Gauge";
import { Button, Card, EmptyState, PageHeader, StatCard } from "../components/ui";
import type {
  SpeedTestResult,
  SpeedProgress,
  AppData,
  SpeedTestEntry,
} from "../types";

export default function SpeedTest() {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<
    "idle" | "ping" | "download" | "upload" | "done"
  >("idle");
  const [liveValue, setLiveValue] = useState(0);
  const [result, setResult] = useState<SpeedTestResult | null>(null);
  const [history, setHistory] = useState<SpeedTestEntry[]>([]);

  const loadHistory = async () => {
    const data = await invoke<AppData>("get_app_data");
    setHistory([...data.speed_test_history].reverse());
  };

  useEffect(() => {
    loadHistory();
    const unlisten = listen<SpeedProgress>("speed-test-progress", (event) => {
      setPhase(event.payload.phase as "ping" | "download" | "upload");
      setLiveValue(event.payload.mbps);
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const startTest = async () => {
    setRunning(true);
    setResult(null);
    setLiveValue(0);
    setPhase("ping");
    try {
      const res = await invoke<SpeedTestResult>("run_speed_test");
      setResult(res);
      setLiveValue(res.download_mbps);
      setPhase("done");
      loadHistory();
    } catch {
      setPhase("idle");
    } finally {
      setRunning(false);
    }
  };

  const phaseLabel: Record<string, string> = {
    idle: "Prêt à tester",
    ping: "Mesure du ping...",
    download: "Test de téléchargement...",
    upload: "Test d'envoi...",
    done: "Test terminé",
  };

  return (
    <div className="sp-stack">
      <PageHeader
        icon={GaugeIcon}
        title="Test de vitesse Internet"
        subtitle={phaseLabel[phase]}
        color="blue"
        actions={
          <Button icon={Play} onClick={startTest} disabled={running}>
            {running ? "Test en cours..." : "Lancer le test"}
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col items-center py-2">
          <Gauge
            value={liveValue}
            label={phase === "upload" ? "Envoi" : "Téléchargement"}
          />
        </div>
      </Card>

      {result && (
        <div className="sp-grid sp-grid--3">
          <StatCard
            icon={Clock}
            label="Ping"
            value={`${result.ping_ms.toFixed(0)} ms`}
            color="blue"
          />
          <StatCard
            icon={ArrowDown}
            label="Téléchargement"
            value={`${result.download_mbps.toFixed(1)} Mb/s`}
            color="accent"
          />
          <StatCard
            icon={ArrowUp}
            label="Envoi"
            value={`${result.upload_mbps.toFixed(1)} Mb/s`}
            color="pink"
          />
        </div>
      )}

      <Card title="Historique des tests" icon={GaugeIcon}>
        {history.length === 0 ? (
          <EmptyState icon={GaugeIcon} title="Aucun test effectué pour l'instant">
            Lance un premier test pour établir une référence de débit.
          </EmptyState>
        ) : (
          <div className="sp-list">
            {history.map((h, i) => (
              <div key={i} className="sp-item text-sm">
                <span className="sp-muted">{new Date(h.date).toLocaleString()}</span>
                <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                  {h.download_mbps.toFixed(1)} Mb/s ↓
                </span>
                <span style={{ color: "var(--upload)", fontWeight: 600 }}>
                  {h.upload_mbps.toFixed(1)} Mb/s ↑
                </span>
                <span className="sp-muted">{h.ping_ms.toFixed(0)} ms</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
