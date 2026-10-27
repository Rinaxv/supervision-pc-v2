import {
  LayoutDashboard,
  Network,
  Wifi,
  Database,
  Gauge as GaugeIcon,
  Signal,
  Activity,
  Sparkles,
  BatteryFull,
  Zap,
  History,
  HardDrive,
  Stethoscope,
  FolderSearch,
  CircuitBoard,
  DownloadCloud,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Page } from "../types";

export interface NavItem {
  id: Page;
  /** Nom complet (recherche, info-bulle) */
  label: string;
  /** Nom court affiché sous l'icône dans la barre latérale */
  short: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "diagnostic", label: "Diagnostic complet", short: "Diagnostic", icon: Stethoscope },
  { id: "dashboard", label: "Tableau de bord", short: "Tableau de bord", icon: LayoutDashboard },
  { id: "quick-actions", label: "Actions rapides", short: "Actions rapides", icon: Zap },
  { id: "windows-update", label: "Mises à jour Windows", short: "Mises à jour", icon: DownloadCloud },
  { id: "drivers", label: "Pilotes obsolètes", short: "Pilotes", icon: CircuitBoard },
  { id: "disk-cleaner", label: "Analyse du disque", short: "Analyse disque", icon: FolderSearch },
  { id: "connections", label: "Connexions actives", short: "Connexions", icon: Network },
  { id: "network-apps", label: "Qui utilise mon internet ?", short: "Qui utilise internet", icon: Wifi },
  { id: "disk-io", label: "Activité disque", short: "Activité disque", icon: HardDrive },
  { id: "data-usage", label: "Consommation data", short: "Consommation", icon: Database },
  { id: "speed-test", label: "Test de vitesse", short: "Test de vitesse", icon: GaugeIcon },
  { id: "wifi-health", label: "Santé du Wi-Fi", short: "Santé Wi-Fi", icon: Signal },
  { id: "processes", label: "Processus", short: "Processus", icon: Activity },
  { id: "maintenance", label: "Maintenance", short: "Maintenance", icon: Sparkles },
  { id: "battery", label: "Batterie", short: "Batterie", icon: BatteryFull },
  { id: "historique", label: "Historique des actions", short: "Historique", icon: History },
];
