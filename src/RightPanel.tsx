import { ArrowDown, ArrowUp, DownloadCloud, Sparkles, Stethoscope, Zap } from "lucide-react";
import { ProgressBar, ShortcutTile, Sparkline, formatSpeed, toneForPercent } from "./ui";
import type { HistoryPoint, NetworkMetrics, Page, SystemMetrics } from "../types";

function LiveRow({ label, percent }: { label: string; percent: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[13px] mb-1.5">
        <span className="font-semibold">{label}</span>
        <span className={`sp-tone--${toneForPercent(percent)} sp-text--tone font-bold`}>
          {percent.toFixed(0)}%
        </span>
      </div>
      <ProgressBar percent={percent} height={7} />
    </div>
  );
}

function percentOf(used: number, total: number): number {
  return total > 0 ? (used / total) * 100 : 0;
}

export default function RightPanel({
  metrics,
  network,
  history,
  suspiciousCount,
  onNavigate,
}: {
  metrics: SystemMetrics | null;
  network: NetworkMetrics | null;
  history: HistoryPoint[];
  suspiciousCount: number;
  onNavigate: (p: Page) => void;
}) {
  return (
    <>
      <section>
        <h3>État du PC en direct</h3>
        {metrics ? (
          <div className="flex flex-col gap-3.5">
            <LiveRow label="Processeur" percent={metrics.cpu_usage} />
            <LiveRow label="Mémoire vive" percent={percentOf(metrics.ram_used, metrics.ram_total)} />
            <LiveRow label="Disque" percent={percentOf(metrics.disk_used, metrics.disk_total)} />
          </div>
        ) : (
          <p className="sp-muted text-[13px]">En attente des premières mesures...</p>
        )}
      </section>

      <section>
        <h3>Réseau</h3>
        {network ? (
          <div className="sp-card" style={{ padding: 14 }}>
            <div className="flex items-center justify-between text-[13px] mb-1">
              <span className="flex items-center gap-1.5 sp-muted">
                <ArrowDown size={14} /> Réception
              </span>
              <strong style={{ color: "var(--accent)" }}>{formatSpeed(network.download_kbps)}</strong>
            </div>
            <div className="flex items-center justify-between text-[13px] mb-3">
              <span className="flex items-center gap-1.5 sp-muted">
                <ArrowUp size={14} /> Envoi
              </span>
              <strong style={{ color: "var(--upload)" }}>{formatSpeed(network.upload_kbps)}</strong>
            </div>
            <Sparkline values={history.map((h) => h.download)} color="var(--accent)" height={64} />
          </div>
        ) : (
          <p className="sp-muted text-[13px]">En attente des mesures réseau...</p>
        )}
      </section>

      {suspiciousCount > 0 && (
        <section>
          <h3>Alertes</h3>
          <p className="text-[13px]" style={{ color: "var(--danger)", fontWeight: 600 }}>
            {suspiciousCount} nouvelle(s) application(s) détectée(s) sur le réseau.
          </p>
        </section>
      )}

      <section>
        <h3>Raccourcis</h3>
        <div className="sp-tiles">
          <ShortcutTile icon={Stethoscope} label="Diagnostic complet" color="accent" onClick={() => onNavigate("diagnostic")} />
          <ShortcutTile icon={Zap} label="Actions rapides" color="pink" onClick={() => onNavigate("quick-actions")} />
          <ShortcutTile icon={Sparkles} label="Maintenance" color="blue" onClick={() => onNavigate("maintenance")} />
          <ShortcutTile icon={DownloadCloud} label="Mises à jour Windows" color="orange" onClick={() => onNavigate("windows-update")} />
        </div>
      </section>
    </>
  );
}
