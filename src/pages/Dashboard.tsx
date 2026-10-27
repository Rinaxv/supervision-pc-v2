import {
  Cpu,
  MemoryStick,
  HardDrive,
  ArrowDown,
  ArrowUp,
  Wifi,
  LayoutDashboard,
  Stethoscope,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  Hero,
  PageHeader,
  RingGauge,
  StatCard,
  TONE_LABEL,
  chartTooltipStyle,
  formatSpeed,
  toneForPercent,
} from "../components/ui";
import type {
  SystemMetrics,
  NetworkMetrics,
  HistoryPoint,
  Page,
} from "../types";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

function tooltipFormatter(
  value: string | number | (string | number)[],
): [string, string] {
  const num = Array.isArray(value) ? Number(value[0]) : Number(value);
  return [formatSpeed(Number.isFinite(num) ? num : 0), ""];
}

function legendFormatter(value: string): string {
  return value === "download" ? "Débit descendant" : "Débit montant";
}

export default function Dashboard({
  metrics,
  network,
  history,
  onNavigate,
}: {
  metrics: SystemMetrics | null;
  network: NetworkMetrics | null;
  history: HistoryPoint[];
  onNavigate: (page: Page) => void;
}) {
  const toGo = (bytes: number) => (bytes / 1024 / 1024 / 1024).toFixed(1);
  const ramPercent = metrics ? (metrics.ram_used / metrics.ram_total) * 100 : 0;
  const diskPercent = metrics
    ? (metrics.disk_used / metrics.disk_total) * 100
    : 0;

  let heroText = "Les premières mesures de votre PC arrivent dans un instant...";
  if (metrics) {
    const worst = toneForPercent(
      Math.max(metrics.cpu_usage, ramPercent, diskPercent),
    );
    const summary = `Processeur ${metrics.cpu_usage.toFixed(0)} %, mémoire ${ramPercent.toFixed(0)} %, disque ${diskPercent.toFixed(0)} %.`;
    const verdict =
      worst === "ok"
        ? "Votre PC fonctionne normalement."
        : worst === "warn"
          ? "Certaines ressources sont très sollicitées."
          : "Une ressource est presque saturée : un diagnostic est conseillé.";
    heroText = `${verdict} ${summary}`;
  }

  return (
    <div className="sp-stack">
      <Hero
        title={greeting()}
        text={heroText}
        action={
          <Button
            variant="hero"
            icon={Stethoscope}
            onClick={() => onNavigate("diagnostic")}
          >
            Lancer un diagnostic complet
          </Button>
        }
      />

      <PageHeader
        icon={LayoutDashboard}
        title="Tableau de bord"
        subtitle="Les ressources de votre PC et l'activité réseau, en temps réel."
      />

      {!metrics ? (
        <Card>
          <EmptyState icon={Cpu} title="Chargement des métriques...">
            Les mesures du processeur, de la mémoire et du disque s'affichent
            dès leur réception.
          </EmptyState>
        </Card>
      ) : (
        <div className="sp-grid sp-grid--3">
          <Card title="Processeur" icon={Cpu} className="sp-ringcard">
            <RingGauge percent={metrics.cpu_usage} label="utilisé" />
            <div className="sp-ringcard__foot">
              <Badge tone={toneForPercent(metrics.cpu_usage)} dot>
                {TONE_LABEL[toneForPercent(metrics.cpu_usage)]}
              </Badge>
              <span>Utilisation CPU en temps réel</span>
            </div>
          </Card>
          <Card title="Mémoire vive" icon={MemoryStick} className="sp-ringcard">
            <RingGauge percent={ramPercent} label="utilisée" />
            <div className="sp-ringcard__foot">
              <Badge tone={toneForPercent(ramPercent)} dot>
                {TONE_LABEL[toneForPercent(ramPercent)]}
              </Badge>
              <span>
                {toGo(metrics.ram_used)} Go / {toGo(metrics.ram_total)} Go
              </span>
            </div>
          </Card>
          <Card title="Disque" icon={HardDrive} className="sp-ringcard">
            <RingGauge percent={diskPercent} label="occupé" />
            <div className="sp-ringcard__foot">
              <Badge tone={toneForPercent(diskPercent)} dot>
                {TONE_LABEL[toneForPercent(diskPercent)]}
              </Badge>
              <span>
                {toGo(metrics.disk_used)} Go / {toGo(metrics.disk_total)} Go
              </span>
            </div>
          </Card>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2">
        <Wifi size={19} style={{ color: "var(--accent)" }} />
        <h2 className="text-lg font-bold">Réseau</h2>
      </div>

      {network?.is_peak && (
        <Banner tone="danger">
          Pic de trafic réseau détecté — utilisation anormalement élevée
        </Banner>
      )}

      {network ? (
        <>
          <div className="sp-grid sp-grid--2">
            <StatCard
              icon={ArrowDown}
              label="Débit descendant"
              value={formatSpeed(network.download_kbps)}
              color="accent"
              tone={network.is_peak ? "danger" : undefined}
            />
            <StatCard
              icon={ArrowUp}
              label="Débit montant"
              value={formatSpeed(network.upload_kbps)}
              color="pink"
            />
          </div>

          <Card className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <XAxis dataKey="t" hide />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={tooltipFormatter}
                />
                <Legend
                  wrapperStyle={{
                    color: "var(--text-muted)",
                    fontSize: "13px",
                  }}
                  formatter={legendFormatter}
                />
                <Area
                  type="monotone"
                  dataKey="download"
                  name="download"
                  stroke="var(--accent)"
                  fill="var(--accent)"
                  fillOpacity={0.18}
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="upload"
                  name="upload"
                  stroke="var(--upload)"
                  fill="var(--upload)"
                  fillOpacity={0.12}
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </>
      ) : (
        <Card>
          <EmptyState icon={Wifi} title="En attente des mesures réseau...">
            Le trafic montant et descendant s'affiche dès la première mesure.
          </EmptyState>
        </Card>
      )}
    </div>
  );
}
