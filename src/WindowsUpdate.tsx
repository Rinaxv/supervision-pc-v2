import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { motion, AnimatePresence } from "framer-motion";
import {
  DownloadCloud,
  HardDrive,
  Clock,
  CalendarClock,
  RefreshCw,
  Play,
  Pause,
  PlayCircle,
  CheckCircle2,
  ShieldAlert,
  Power,
} from "lucide-react";
import {
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  Field,
  PageHeader,
  StatCard,
} from "../components/ui";
import type { WindowsUpdateReport, InstallUpdatesResult } from "../types";

function formatMinutes(min: number) {
  if (min < 1) return "< 1 min";
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h} h ${m} min`;
}

/** Fait apparaître / disparaître une bannière en douceur. */
const bannerMotion = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: "easeOut" as const },
};

export default function WindowsUpdate() {
  const [report, setReport] = useState<WindowsUpdateReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installResult, setInstallResult] =
    useState<InstallUpdatesResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [bgActive, setBgActive] = useState<string[]>([]);
  const [wuStatus, setWuStatus] = useState<"active" | "paused">("active");
  const [pauseHours, setPauseHours] = useState(24);
  const [pausing, setPausing] = useState(false);

  const loadStatus = async () => {
    const status = await invoke<string>("get_wu_service_status");
    setWuStatus(status === "paused" ? "paused" : "active");
  };

  useEffect(() => {
    loadStatus();
    const unlisten = listen<string[]>("wu-background-activity", (e) =>
      setBgActive(e.payload),
    );
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const analyze = async () => {
    setLoading(true);
    setInstallResult(null);
    try {
      const result = await invoke<WindowsUpdateReport>(
        "get_windows_update_report",
      );
      setReport(result);
    } finally {
      setLoading(false);
    }
  };

  const installNow = async () => {
    setInstalling(true);
    setActionError(null);
    setInstallResult(null);
    try {
      const result = await invoke<InstallUpdatesResult>(
        "install_windows_updates",
      );
      if (result.success) {
        setInstallResult(result);
        analyze();
      } else {
        setActionError(result.message);
      }
    } catch (e) {
      setActionError(String(e));
    } finally {
      setInstalling(false);
    }
  };

  const pauseNow = async () => {
    setPausing(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const msg = await invoke<string>("pause_windows_updates", {
        hours: pauseHours,
      });
      setActionMessage(msg);
      loadStatus();
    } catch (e) {
      setActionError(String(e));
    } finally {
      setPausing(false);
    }
  };

  const resumeNow = async () => {
    setPausing(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const msg = await invoke<string>("resume_windows_updates");
      setActionMessage(msg);
      loadStatus();
    } catch (e) {
      setActionError(String(e));
    } finally {
      setPausing(false);
    }
  };

  const daysLate = report ? report.days_since_last_update : -1;
  const isLate = daysLate >= 30;
  const maxSize = report
    ? Math.max(...report.pending.map((p) => p.size_mb), 1)
    : 1;

  return (
    <div className="sp-stack">
      <PageHeader
        icon={DownloadCloud}
        title="Mises à jour Windows"
        subtitle="Taille, durée estimée, installation et pause des mises à jour."
        color="orange"
        actions={
          <Button icon={RefreshCw} spinning={loading} onClick={analyze} disabled={loading}>
            {loading ? "Analyse en cours..." : "Analyser les mises à jour"}
          </Button>
        }
      />

      <AnimatePresence initial={false}>
        {actionError && (
          <motion.div key="err" {...bannerMotion}>
            <Banner tone="danger">{actionError}</Banner>
          </motion.div>
        )}
        {actionMessage && (
          <motion.div key="msg" {...bannerMotion}>
            <Banner tone="ok">{actionMessage}</Banner>
          </motion.div>
        )}
        {installResult && (
          <motion.div key="install" {...bannerMotion}>
            <Banner tone="ok">
              {installResult.message}
              {installResult.installed_count > 0 &&
                ` (${installResult.installed_count} installée(s))`}
              {installResult.reboot_required &&
                " — redémarrage requis pour finaliser."}
            </Banner>
          </motion.div>
        )}
        {bgActive.length > 0 && (
          <motion.div key="bg" {...bannerMotion}>
            <Banner tone="danger" icon={ShieldAlert}>
              Windows Update tourne actuellement en arrière-plan (
              {bgActive.join(", ")}) — c'est probablement la cause d'un
              ralentissement réseau.
            </Banner>
          </motion.div>
        )}
      </AnimatePresence>

      <Card
        title="Statut du service"
        icon={Power}
        action={
          <Badge tone={wuStatus === "paused" ? "warn" : "ok"} dot>
            {wuStatus === "paused" ? "En pause" : "Actif"}
          </Badge>
        }
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="text-xs sp-muted max-w-md">
            Nécessite les droits administrateur. La réactivation se fait
            automatiquement après la durée choisie, ou manuellement à tout
            moment.
          </p>
          {wuStatus === "paused" ? (
            <Button
              variant="success"
              icon={PlayCircle}
              onClick={resumeNow}
              disabled={pausing}
            >
              Réactiver maintenant
            </Button>
          ) : (
            <div className="flex items-end gap-3">
              <Field label="Durée (heures)">
                <input
                  type="number"
                  min={1}
                  value={pauseHours}
                  onChange={(e) => setPauseHours(Number(e.target.value))}
                  className="sp-input w-24"
                />
              </Field>
              <Button
                variant="warn"
                icon={Pause}
                onClick={pauseNow}
                disabled={pausing}
              >
                Mettre en pause
              </Button>
            </div>
          )}
        </div>
      </Card>

      {!report && !loading && (
        <Card>
          <EmptyState icon={DownloadCloud} title="Aucune analyse pour le moment" color="orange">
            Clique sur "Analyser les mises à jour" pour interroger Windows
            Update (peut prendre jusqu'à 30 secondes).
          </EmptyState>
        </Card>
      )}

      {report && (
        <>
          <div className="sp-grid sp-grid--4">
            <StatCard
              icon={HardDrive}
              label="Taille totale"
              value={`${report.total_size_gb.toFixed(2)} Go`}
              color="accent"
            />
            <StatCard
              icon={DownloadCloud}
              label="Téléchargement"
              value={formatMinutes(report.estimated_download_minutes)}
              color="pink"
            />
            <StatCard
              icon={Clock}
              label="Installation"
              value={formatMinutes(report.estimated_install_minutes)}
              color="green"
            />
            <StatCard
              icon={CalendarClock}
              label="Dernière mise à jour"
              value={daysLate >= 0 ? `Il y a ${daysLate} j` : "Inconnue"}
              sub={report.last_install_date || undefined}
              color={isLate ? "orange" : "green"}
              tone={isLate ? "warn" : undefined}
            />
          </div>

          {report.pending.length > 0 && (
            <Button
              block
              icon={Play}
              spinning={installing}
              onClick={installNow}
              disabled={installing}
            >
              {installing
                ? "Téléchargement et installation en cours (plusieurs minutes)..."
                : "Télécharger et installer maintenant"}
            </Button>
          )}

          <Card
            flush
            title={`${report.pending.length} mise(s) à jour en attente`}
            icon={DownloadCloud}
          >
            <div className="max-h-96 overflow-y-auto">
              {report.pending.length === 0 && (
                <EmptyState icon={CheckCircle2} title="Le système est à jour" color="green">
                  Aucune mise à jour en attente.
                </EmptyState>
              )}
              {report.pending.map((u, i) => (
                <div
                  key={i}
                  className="relative px-5 py-3 border-b border-(--border) last:border-0"
                >
                  <div
                    className="absolute inset-y-0 left-0"
                    style={{
                      width: `${(u.size_mb / maxSize) * 100}%`,
                      background:
                        "color-mix(in srgb, var(--accent) 10%, transparent)",
                    }}
                  />
                  <div className="relative flex items-center justify-between">
                    <span className="text-sm truncate max-w-md">{u.title}</span>
                    <span className="text-xs sp-muted font-semibold shrink-0 ml-3">
                      {(u.size_mb / 1024).toFixed(2)} Go
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
