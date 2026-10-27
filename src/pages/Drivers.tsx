import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { CircuitBoard, Search } from "lucide-react";
import { Badge, Banner, Button, Card, Field, PageHeader } from "../components/ui";
import type { DriverInfo } from "../types";

export default function Drivers() {
  const [drivers, setDrivers] = useState<DriverInfo[]>([]);
  const [threshold, setThreshold] = useState(2);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const result = await invoke<DriverInfo[]>("get_driver_report", {
        thresholdYears: threshold,
      });
      setDrivers(result);
      setScanned(true);
    } finally {
      setLoading(false);
    }
  };

  const oldCount = drivers.filter((d) => d.is_old).length;

  return (
    <div className="sp-stack">
      <PageHeader
        icon={CircuitBoard}
        title="Pilotes obsolètes"
        subtitle="Liste des pilotes installés, avec leur ancienneté. Aucune mise à jour n'est effectuée automatiquement."
        color="orange"
      />

      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Seuil d'ancienneté (années)">
            <input
              type="number"
              min={1}
              step={0.5}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="sp-input w-32"
            />
          </Field>
          <Button icon={Search} onClick={analyze} disabled={loading}>
            {loading ? "Analyse en cours..." : "Analyser les pilotes"}
          </Button>
        </div>
      </Card>

      {scanned && (
        <Banner tone={oldCount > 0 ? "danger" : "ok"}>
          {oldCount > 0
            ? `${oldCount} pilote(s) dépassent le seuil de ${threshold} an(s) sur ${drivers.length} détecté(s).`
            : `Tous les pilotes détectés (${drivers.length}) sont dans le seuil d'ancienneté.`}
        </Banner>
      )}

      <Card flush title={`${drivers.length} pilote(s)`} icon={CircuitBoard}>
        <div className="sp-table-wrap max-h-120">
          <table className="sp-table">
            <thead>
              <tr>
                <th>Périphérique</th>
                <th>Fabricant</th>
                <th>Version</th>
                <th>Date</th>
                <th>Ancienneté</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d, i) => (
                <tr key={i} className={d.is_old ? "sp-row--alert" : ""}>
                  <td className="font-semibold">{d.device_name}</td>
                  <td className="sp-muted">{d.manufacturer}</td>
                  <td className="sp-muted">{d.version}</td>
                  <td className="sp-muted">{d.date}</td>
                  <td>
                    <Badge tone={d.is_old ? "danger" : "ok"}>
                      {d.age_years.toFixed(1)} an(s)
                      {d.is_old ? " — obsolète" : ""}
                    </Badge>
                  </td>
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 sp-muted">
                    {scanned
                      ? "Aucun pilote détecté."
                      : "Lance une analyse pour voir la liste des pilotes."}
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
