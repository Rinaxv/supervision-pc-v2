import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  BatteryFull,
  BatteryWarning,
  Zap,
  HeartPulse,
  Clock,
} from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  ProgressBar,
  RingGauge,
  StatCard,
  toneForPercent,
} from "../components/ui";
import type { BatteryInfoPayload } from "../types";

export default function Battery() {
  const [battery, setBattery] = useState<BatteryInfoPayload | null | undefined>(
    undefined,
  );

  const load = () => {
    invoke<BatteryInfoPayload | null>("get_battery_info").then(setBattery);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (battery === undefined) {
    return (
      <p className="sp-muted" role="status">
        Chargement...
      </p>
    );
  }

  if (battery === null) {
    return (
      <div className="sp-stack">
        <PageHeader
          icon={BatteryFull}
          title="Batterie"
          subtitle="État de charge, santé et autonomie estimée."
        />
        <Card>
          <EmptyState icon={BatteryFull} title="Aucune batterie détectée">
            Cet appareil n'a pas de batterie (PC de bureau).
          </EmptyState>
        </Card>
      </div>
    );
  }

  const isLow = battery.percent <= 20 && !battery.is_charging;
  const healthTone = toneForPercent(100 - battery.health_percent);

  return (
    <div className="sp-stack">
      <PageHeader
        icon={isLow ? BatteryWarning : BatteryFull}
        title="Batterie"
        subtitle="État de charge, santé et autonomie estimée."
        color={isLow ? "red" : "accent"}
      />

      <div className="sp-grid sp-grid--3">
        <Card title="Charge" icon={isLow ? BatteryWarning : BatteryFull} className="sp-ringcard">
          <RingGauge
            percent={battery.percent}
            label="chargée"
            tone={isLow ? "danger" : "ok"}
          />
          <div className="sp-ringcard__foot">
            {battery.is_charging ? (
              <Badge tone="info" dot>
                <Zap size={13} /> En charge
              </Badge>
            ) : isLow ? (
              <Badge tone="danger" dot>
                Batterie faible
              </Badge>
            ) : (
              <Badge tone="ok" dot>
                Sur batterie
              </Badge>
            )}
          </div>
        </Card>

        <StatCard
          icon={HeartPulse}
          label="Santé de la batterie"
          value={`${battery.health_percent.toFixed(0)}%`}
          sub="Capacité actuelle vs capacité d'origine"
          color="pink"
        >
          <ProgressBar percent={battery.health_percent} tone={healthTone} />
        </StatCard>

        <StatCard
          icon={Clock}
          label="Autonomie estimée"
          value={
            battery.time_remaining_min !== null
              ? `${Math.round(battery.time_remaining_min)} min`
              : "—"
          }
          sub={
            battery.time_remaining_min !== null
              ? "Temps restant estimé avant déchargement"
              : "Non disponible pour le moment"
          }
          color="blue"
        />
      </div>
    </div>
  );
}
