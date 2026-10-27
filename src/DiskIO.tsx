import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { HardDrive, XCircle, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Banner,
  Button,
  Card,
  PageHeader,
  StatCard,
  chartTooltipStyle,
} from "../components/ui";
import type { DiskIoMetrics, DiskIoPoint } from "../types";

function formatKbps(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(1)} Mo/s` : `${v.toFixed(0)} Ko/s`;
}

export default function DiskIO() {
  const [current, setCurrent] = useState<DiskIoMetrics | null>(null);
  const [history, setHistory] = useState<DiskIoPoint[]>([]);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const unlisten = listen<DiskIoMetrics>("disk-io", (event) => {
      setCurrent(event.payload);
      setHistory((prev) => {
        const next = [
          ...prev,
          {
            t: prev.length,
            read: event.payload.read_kbps,
            write: event.payload.write_kbps,
          },
        ];
        return next.length > 30 ? next.slice(next.length - 30) : next;
      });
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const closeResponsible = async () => {
    if (!current?.top_writer) return;
    setClosing(true);
    try {
      await invoke("close_processes", { pids: [current.top_writer.pid] });
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="sp-stack">
      <PageHeader
        icon={HardDrive}
        title="Activité disque en temps réel"
        subtitle="Lecture et écriture du disque, et l'application qui le sollicite le plus."
        color="orange"
      />

      {current?.is_heavy && current.top_writer && (
        <Banner
          tone="danger"
          action={
            <Button
              variant="danger"
              size="sm"
              icon={XCircle}
              onClick={closeResponsible}
              disabled={closing}
            >
              Fermer l'application
            </Button>
          }
        >
          Forte activité disque détectée — application responsable probable :{" "}
          <strong>{current.top_writer.name}</strong>
        </Banner>
      )}

      <div className="sp-grid sp-grid--2">
        <StatCard
          icon={ArrowDownToLine}
          label="Lecture disque"
          value={current ? formatKbps(current.read_kbps) : "..."}
          color="accent"
        />
        <StatCard
          icon={ArrowUpFromLine}
          label="Écriture disque"
          value={current ? formatKbps(current.write_kbps) : "..."}
          color="pink"
        />
      </div>

      <Card className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <XAxis dataKey="t" hide />
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(v: unknown) => formatKbps(Number(v) || 0)}
            />
            <Legend
              wrapperStyle={{ color: "var(--text-muted)", fontSize: "13px" }}
              formatter={(value) => (value === "read" ? "Lecture" : "Écriture")}
            />
            <Area
              type="monotone"
              dataKey="read"
              name="read"
              stroke="var(--accent)"
              fill="var(--accent)"
              fillOpacity={0.18}
              strokeWidth={2.5}
            />
            <Area
              type="monotone"
              dataKey="write"
              name="write"
              stroke="var(--upload)"
              fill="var(--upload)"
              fillOpacity={0.12}
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
