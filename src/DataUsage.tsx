import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  Database,
  AlertTriangle,
  TrendingUp,
  CalendarDays,
  Gauge,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Badge,
  Button,
  Card,
  Field,
  PageHeader,
  ProgressBar,
  StatCard,
  chartTooltipStyle,
} from "../components/ui";
import type { AppData, DataUsagePayload } from "../types";

const GB = 1_073_741_824;
const MB = 1024 * 1024;

function formatSize(bytes: number) {
  return bytes >= GB
    ? `${(bytes / GB).toFixed(2)} Go`
    : `${(bytes / MB).toFixed(0)} Mo`;
}

export default function DataUsage() {
  const [usage, setUsage] = useState<DataUsagePayload | null>(null);
  const [appData, setAppData] = useState<AppData | null>(null);
  const [limitInput, setLimitInput] = useState("");

  const loadAppData = () => {
    invoke<AppData>("get_app_data").then((data) => {
      setAppData(data);
      setLimitInput(data.data_limit_gb > 0 ? String(data.data_limit_gb) : "");
    });
  };

  useEffect(() => {
    loadAppData();
    const unlisten = listen<DataUsagePayload>("data-usage", (event) => {
      setUsage(event.payload);
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const saveLimit = async () => {
    const gb = parseFloat(limitInput);
    if (!isNaN(gb) && gb > 0) {
      await invoke("set_data_limit", { gb });
      loadAppData();
    }
  };

  const monthlyBytes = usage?.monthly_bytes ?? 0;
  const chartData = (usage?.daily ?? []).map(([date, bytes]) => ({
    day: date.slice(-2),
    mo: Number((bytes / MB).toFixed(1)),
  }));

  const avgDaily = chartData.length > 0 ? monthlyBytes / chartData.length : 0;

  const monthlyHistory = appData
    ? Object.entries(appData.monthly_usage)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-12)
        .map(([month, bytes]) => ({
          month: month.slice(2),
          go: Number((bytes / GB).toFixed(2)),
        }))
    : [];

  const exceeded = usage && usage.limit_gb > 0 && usage.percent >= 100;
  const warning =
    usage && usage.limit_gb > 0 && usage.percent >= 90 && !exceeded;

  return (
    <div className="sp-stack">
      <PageHeader
        icon={Database}
        title="Consommation de données"
        subtitle="Suivez ce que votre PC consomme chaque jour et chaque mois, et fixez un seuil d'alerte."
        color="blue"
      />

      <div className="sp-grid sp-grid--3">
        <StatCard
          icon={Database}
          label="Ce mois-ci"
          value={formatSize(monthlyBytes)}
          color="accent"
        >
          {usage && usage.limit_gb > 0 ? (
            <>
              <ProgressBar
                percent={usage.percent}
                tone={exceeded ? "danger" : warning ? "warn" : "ok"}
              />
              <div className="sp-stat__sub">
                {usage.percent.toFixed(0)}% de {usage.limit_gb} Go
              </div>
              {exceeded && (
                <div>
                  <Badge tone="danger" dot>
                    <AlertTriangle size={13} /> Limite mensuelle dépassée
                  </Badge>
                </div>
              )}
              {warning && (
                <div>
                  <Badge tone="warn" dot>
                    <AlertTriangle size={13} /> Limite bientôt atteinte
                  </Badge>
                </div>
              )}
            </>
          ) : (
            <div className="sp-stat__sub">Aucune limite configurée.</div>
          )}
        </StatCard>

        <StatCard
          icon={TrendingUp}
          label="Moyenne quotidienne"
          value={formatSize(avgDaily)}
          sub={`sur ${chartData.length} jour(s) ce mois-ci`}
          color="pink"
        />

        <Card title="Seuil mensuel" icon={Gauge}>
          <div className="flex flex-col gap-4">
            <Field label="Limite en Go">
              <input
                type="number"
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                placeholder="ex: 10"
                className="sp-input w-full"
              />
            </Field>
            <Button onClick={saveLimit}>Enregistrer</Button>
          </div>
        </Card>
      </div>

      <div className="sp-grid sp-grid--2">
        <Card
          title="Consommation quotidienne du mois (Mo)"
          icon={CalendarDays}
          className="h-72"
        >
          <ResponsiveContainer width="100%" height="82%">
            <BarChart data={chartData}>
              <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="mo" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card
          title="Historique par mois (Go)"
          icon={CalendarDays}
          className="h-72"
        >
          <ResponsiveContainer width="100%" height="82%">
            <BarChart data={monthlyHistory}>
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="go" fill="var(--upload)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
