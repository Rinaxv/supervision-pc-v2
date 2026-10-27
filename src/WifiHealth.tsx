import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { QRCodeSVG } from "qrcode.react";
import {
  Wifi,
  TrendingDown,
  CheckCircle,
  Share2,
  Eye,
  EyeOff,
  Signal,
} from "lucide-react";
import {
  Banner,
  Button,
  Card,
  EmptyState,
  PageHeader,
} from "../components/ui";
import type {
  NetworkMetrics,
  AppData,
  ConnectionInfo,
  WifiCredentials,
} from "../types";

export default function WifiHealth({
  network,
}: {
  network: NetworkMetrics | null;
}) {
  const [baseline, setBaseline] = useState<number | null>(null);
  const [topApps, setTopApps] = useState<{ name: string; count: number }[]>([]);
  const [wifi, setWifi] = useState<WifiCredentials | null>(null);
  const [wifiError, setWifiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingWifi, setLoadingWifi] = useState(false);

  useEffect(() => {
    invoke<AppData>("get_app_data").then((data) => {
      if (data.speed_test_history.length > 0) {
        setBaseline(
          Math.max(...data.speed_test_history.map((h) => h.download_mbps)),
        );
      }
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const conns = await invoke<ConnectionInfo[]>("get_active_connections");
      const map = new Map<string, number>();
      conns.forEach((c) => {
        if (c.process_name === "Inconnu") return;
        map.set(c.process_name, (map.get(c.process_name) ?? 0) + 1);
      });
      const sorted = Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTopApps(sorted);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentMbps = network ? network.download_kbps / 1000 : 0;
  const ratio = baseline && baseline > 0 ? currentMbps / baseline : null;
  const isSlow = ratio !== null && ratio < 0.3 && currentMbps < 5;

  const generateQr = async () => {
    setLoadingWifi(true);
    setWifiError(null);
    setWifi(null);
    try {
      const result = await invoke<WifiCredentials>("get_wifi_credentials");
      setWifi(result);
    } catch (e) {
      setWifiError(String(e));
    } finally {
      setLoadingWifi(false);
    }
  };

  const qrValue = wifi
    ? wifi.password
      ? `WIFI:T:WPA;S:${wifi.ssid};P:${wifi.password};;`
      : `WIFI:T:nopass;S:${wifi.ssid};;`
    : "";

  return (
    <div className="sp-stack">
      <PageHeader
        icon={Signal}
        title="Santé du Wi-Fi"
        subtitle="Détection des ralentissements, partage de la connexion et applications les plus actives."
        color="teal"
      />

      {isSlow ? (
        <Banner tone="danger" icon={TrendingDown}>
          <div>Ralentissement détecté</div>
          <div className="text-xs font-normal mt-0.5">
            Débit actuel ({currentMbps.toFixed(1)} Mb/s) bien en dessous de
            votre meilleur test ({baseline?.toFixed(1)} Mb/s)
          </div>
        </Banner>
      ) : (
        <Banner tone="ok" icon={CheckCircle}>
          <div>Connexion normale</div>
          <div className="text-xs font-normal mt-0.5">
            {baseline
              ? `Débit actuel : ${currentMbps.toFixed(1)} Mb/s (référence : ${baseline.toFixed(1)} Mb/s)`
              : "Lancez un test de vitesse pour établir une référence."}
          </div>
        </Banner>
      )}

      <Card
        title="Partager ma connexion Wi-Fi"
        icon={Share2}
        action={
          <Button size="sm" onClick={generateQr} disabled={loadingWifi}>
            {loadingWifi ? "Génération..." : "Générer le QR code"}
          </Button>
        }
      >
        {wifiError && (
          <Banner tone="danger">
            Impossible de récupérer les informations Wi-Fi : {wifiError}.
            Essayez de lancer l'application en tant qu'administrateur.
          </Banner>
        )}

        {wifi && (
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-white p-4 rounded-2xl border border-(--border)">
              <QRCodeSVG value={qrValue} size={160} />
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <div className="text-xs sp-muted">Réseau</div>
                <div className="font-bold text-lg">{wifi.ssid}</div>
              </div>
              {wifi.password && (
                <div>
                  <div className="text-xs sp-muted">Mot de passe</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">
                      {showPassword
                        ? wifi.password
                        : "•".repeat(wifi.password.length)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={showPassword ? EyeOff : Eye}
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                    />
                  </div>
                </div>
              )}
              <p className="text-xs sp-muted max-w-xs">
                Scannez ce QR code avec un smartphone pour rejoindre ce réseau
                Wi-Fi automatiquement.
              </p>
            </div>
          </div>
        )}

        {!wifi && !wifiError && (
          <p className="text-sm sp-muted">
            Génère un QR code pour que tes invités rejoignent ton Wi-Fi en un
            scan.
          </p>
        )}
      </Card>

      <Card title="Applications les plus actives sur le réseau" icon={Wifi}>
        {topApps.length === 0 ? (
          <EmptyState icon={Wifi} title="Aucune activité détectée">
            La liste se met à jour toutes les 5 secondes.
          </EmptyState>
        ) : (
          <div className="sp-list">
            {topApps.map((app) => (
              <div key={app.name} className="sp-item text-sm">
                <span className="font-semibold">{app.name}</span>
                <span className="sp-muted">{app.count} connexion(s)</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
