import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Wrench,
  Cpu,
  MemoryStick,
  HardDrive,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  PageHeader,
  RingGauge,
  StatCard,
  TONE_LABEL,
  toneForPercent,
} from "../components/ui";
import type { Tone } from "../components/ui";
import type { DiagnosticReport, FullFixResult } from "../types";

function severityStyle(severity: string): { tone: Tone; icon: LucideIcon } {
  switch (severity) {
    case "critical":
      return { tone: "danger", icon: AlertOctagon };
    case "warning":
      return { tone: "warn", icon: AlertTriangle };
    case "ok":
      return { tone: "ok", icon: CheckCircle2 };
    default:
      return { tone: "info", icon: Info };
  }
}

export default function Diagnostic() {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [scanning, setScanning] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [fixResult, setFixResult] = useState<FullFixResult | null>(null);

  const scan = async () => {
    setScanning(true);
    setFixResult(null);
    try {
      const res = await invoke<DiagnosticReport>("run_diagnostic");
      setReport(res);
    } finally {
      setScanning(false);
    }
  };

  const fixAll = async () => {
    setFixing(true);
    try {
      const res = await invoke<FullFixResult>("run_full_fix");
      setFixResult(res);
      scan();
    } finally {
      setFixing(false);
    }
  };

  const hasRealIssues = report?.issues.some((i) => i.severity !== "ok");

  return (
    <div className="sp-stack">
      <PageHeader
        icon={Stethoscope}
        title="Diagnostic complet"
        subtitle="Un scan, une réparation, un seul clic."
        actions={
          <Button
            icon={Stethoscope}
            spinning={scanning}
            onClick={scan}
            disabled={scanning}
          >
            {scanning ? "Analyse en cours..." : "Scanner mon PC"}
          </Button>
        }
      />

      <AnimatePresence initial={false}>
        {fixResult && (
          <motion.div
            key="fix-result"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <Banner tone="ok">
              Réparation terminée : <strong>{fixResult.closed_apps.length}</strong>{" "}
              application(s) fermée(s) ({fixResult.freed_ram_mb.toFixed(0)} Mo de
              RAM), <strong>{fixResult.freed_disk_mb.toFixed(0)} Mo</strong> de
              disque libérés.
            </Banner>
          </motion.div>
        )}
      </AnimatePresence>

      {!report && !scanning && (
        <Card>
          <EmptyState icon={Sparkles} title="Votre PC n'a pas encore été analysé">
            Clique sur "Scanner mon PC" pour lancer une analyse complète :
            processeur, mémoire, disque, fichiers temporaires et applications
            gourmandes.
          </EmptyState>
        </Card>
      )}

      {scanning && !report && (
        <Card>
          <EmptyState icon={Stethoscope} title="Analyse de votre système en cours..." spin>
            Cela ne prend que quelques secondes.
          </EmptyState>
        </Card>
      )}

      {report && (
        <>
          <div className="sp-grid sp-grid--3">
            <Card title="Processeur" icon={Cpu} className="sp-ringcard">
              <RingGauge percent={report.cpu_usage} label="utilisé" />
              <div className="sp-ringcard__foot">
                <Badge tone={toneForPercent(report.cpu_usage)} dot>
                  {TONE_LABEL[toneForPercent(report.cpu_usage)]}
                </Badge>
              </div>
            </Card>
            <Card title="Mémoire vive" icon={MemoryStick} className="sp-ringcard">
              <RingGauge percent={report.ram_percent} label="utilisée" />
              <div className="sp-ringcard__foot">
                <Badge tone={toneForPercent(report.ram_percent)} dot>
                  {TONE_LABEL[toneForPercent(report.ram_percent)]}
                </Badge>
              </div>
            </Card>
            <Card title="Disque" icon={HardDrive} className="sp-ringcard">
              <RingGauge percent={report.disk_percent} label="occupé" />
              <div className="sp-ringcard__foot">
                <Badge tone={toneForPercent(report.disk_percent)} dot>
                  {TONE_LABEL[toneForPercent(report.disk_percent)]}
                </Badge>
              </div>
            </Card>
          </div>

          <StatCard
            icon={Trash2}
            label="Fichiers temporaires"
            value={`${report.temp_mb.toFixed(0)} Mo`}
            sub="Espace occupé par des fichiers temporaires qui peuvent être supprimés."
            color="orange"
          />

          <Card title="Résultats du scan" icon={Info}>
            <div className="flex flex-col gap-3">
              {report.issues.map((issue, i) => {
                const { tone, icon: SeverityIcon } = severityStyle(issue.severity);
                return (
                  <motion.div
                    key={issue.title + i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.3 }}
                    className={`sp-issue sp-tone--${tone}`}
                  >
                    <SeverityIcon
                      size={20}
                      style={{ color: "var(--tone)", flex: "none", marginTop: 1 }}
                    />
                    <div>
                      <div className="sp-issue__title">{issue.title}</div>
                      <div className="sp-issue__detail">{issue.detail}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>

          {hasRealIssues && (
            <Button
              variant="danger"
              block
              icon={Wrench}
              spinning={fixing}
              onClick={fixAll}
              disabled={fixing}
            >
              {fixing ? "Réparation en cours..." : "Tout réparer en un clic"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
