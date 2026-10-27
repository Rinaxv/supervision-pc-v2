import "./App.css";
import { useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import RightPanel from "./components/RightPanel";
import { Banner } from "./components/ui";
import Dashboard from "./pages/Dashboard";
import Connections from "./pages/Connections";
import NetworkApps from "./pages/NetworkApps";
import DataUsage from "./pages/DataUsage";
import SpeedTest from "./pages/SpeedTest";
import WifiHealth from "./pages/WifiHealth";
import Processes from "./pages/Processes";
import Maintenance from "./pages/Maintenance";
import Battery from "./pages/Battery";
import QuickActions from "./pages/QuickActions";
import Historique from "./pages/Historique";
import DiskIO from "./pages/DiskIO";
import Diagnostic from "./pages/Diagnostic";
import DiskCleaner from "./pages/DiskCleaner";
import Drivers from "./pages/Drivers";
import WindowsUpdate from "./pages/WindowsUpdate";
import type {
  SystemMetrics,
  NetworkMetrics,
  HistoryPoint,
  Theme,
  Page,
} from "./types";

const THEME_IDS: Theme[] = ["lavande", "sombre", "menthe", "custom"];

/** Lit le thème enregistré. Les anciens noms (dark / light) sont convertis. */
function readStoredTheme(): Theme {
  const saved = localStorage.getItem("app-theme");
  if (saved === "dark") return "sombre";
  if (saved === "light") return "lavande";
  return THEME_IDS.includes(saved as Theme) ? (saved as Theme) : "lavande";
}

function App() {
  const [page, setPage] = useState<Page>("diagnostic");

  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [network, setNetwork] = useState<NetworkMetrics | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [suspiciousApps, setSuspiciousApps] = useState<string[]>([]);

  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  const [accentColor, setAccentColor] = useState<string>(
    () => localStorage.getItem("app-accent") || "#8b5cf6",
  );
  const [panelOpen, setPanelOpen] = useState<boolean>(
    () => localStorage.getItem("app-panel") !== "closed",
  );

  const contentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
    if (theme === "custom") {
      document.documentElement.style.setProperty("--accent", accentColor);
    } else {
      document.documentElement.style.removeProperty("--accent");
    }
  }, [theme, accentColor]);

  useEffect(() => {
    localStorage.setItem("app-accent", accentColor);
  }, [accentColor]);

  useEffect(() => {
    localStorage.setItem("app-panel", panelOpen ? "open" : "closed");
  }, [panelOpen]);

  // Revient en haut de la page quand on change de section
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [page]);

  useEffect(() => {
    const unlistenSystem = listen<SystemMetrics>("system-metrics", (event) => {
      setMetrics(event.payload);
    });

    const unlistenNetwork = listen<NetworkMetrics>(
      "network-metrics",
      (event) => {
        setNetwork(event.payload);
        setHistory((prev) => {
          const next = [
            ...prev,
            {
              t: prev.length,
              download: event.payload.download_kbps,
              upload: event.payload.upload_kbps,
            },
          ];
          return next.length > 30 ? next.slice(next.length - 30) : next;
        });
      },
    );

    const unlistenSuspicious = listen<string>("suspicious-app", (event) => {
      setSuspiciousApps((prev) => [...prev, event.payload]);
    });

    return () => {
      unlistenSystem.then((f) => f());
      unlistenNetwork.then((f) => f());
      unlistenSuspicious.then((f) => f());
    };
  }, []);

  return (
    <div className="sp-app">
      <div className="sp-frame">
        <Sidebar page={page} setPage={setPage} />

        <div className="sp-main">
          <TopBar
            setPage={setPage}
            theme={theme}
            setTheme={setTheme}
            accentColor={accentColor}
            setAccentColor={setAccentColor}
            live={metrics !== null}
            panelOpen={panelOpen}
            togglePanel={() => setPanelOpen((o) => !o)}
          />

          <div className={`sp-body ${panelOpen ? "sp-body--panel" : ""}`}>
            <main className="sp-content" ref={contentRef}>
              {suspiciousApps.length > 0 && (
                <div className="flex flex-col gap-2 mb-5">
                  {suspiciousApps.map((name, i) => (
                    <Banner
                      key={i}
                      tone="danger"
                      onClose={() =>
                        setSuspiciousApps((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                    >
                      Nouvelle application détectée sur le réseau :{" "}
                      <strong>{name}</strong>
                    </Banner>
                  ))}
                </div>
              )}

              {page === "dashboard" && (
                <Dashboard
                  metrics={metrics}
                  network={network}
                  history={history}
                  onNavigate={setPage}
                />
              )}
              {page === "quick-actions" && <QuickActions />}
              {page === "disk-cleaner" && <DiskCleaner />}
              {page === "connections" && <Connections />}
              {page === "network-apps" && <NetworkApps />}
              {page === "disk-io" && <DiskIO />}
              {page === "data-usage" && <DataUsage />}
              {page === "speed-test" && <SpeedTest />}
              {page === "wifi-health" && <WifiHealth network={network} />}
              {page === "processes" && <Processes />}
              {page === "maintenance" && <Maintenance />}
              {page === "battery" && <Battery />}
              {page === "historique" && <Historique />}
              {page === "diagnostic" && <Diagnostic />}
              {page === "drivers" && <Drivers />}
              {page === "windows-update" && <WindowsUpdate />}
            </main>

            {panelOpen && (
              <aside className="sp-aside">
                <RightPanel
                  metrics={metrics}
                  network={network}
                  history={history}
                  suspiciousCount={suspiciousApps.length}
                  onNavigate={setPage}
                />
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
