import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  HardDriveDownload,
  Image as ImageIcon,
  Film,
  Music,
  File as FileIcon,
  Trash2,
  Copy,
  Clock,
  HardDrive,
  FolderSearch,
  Folder,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Banner,
  Button,
  Card,
  EmptyState,
  Field,
  IconChip,
  PageHeader,
  ProgressBar,
  Segmented,
} from "../components/ui";
import type { Swatch } from "../components/ui";
import type {
  ScanTarget,
  DiskPartition,
  FileEntry,
  DuplicateGroup,
  DeleteFilesResult,
  ScanProgress,
} from "../types";

function fileStyle(type: string): { icon: LucideIcon; color: Swatch } {
  if (type === "image") return { icon: ImageIcon, color: "accent" };
  if (type === "video") return { icon: Film, color: "pink" };
  if (type === "audio") return { icon: Music, color: "green" };
  return { icon: FileIcon, color: "blue" };
}

export default function DiskCleaner() {
  const [tab, setTab] = useState<"old" | "duplicates">("old");
  const [targets, setTargets] = useState<ScanTarget[]>([]);
  const [partitions, setPartitions] = useState<DiskPartition[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(
    new Set(),
  );
  const [selectedPartitions, setSelectedPartitions] = useState<Set<string>>(
    new Set(),
  );
  const [minSizeMb, setMinSizeMb] = useState(50);
  const [minMonths, setMinMonths] = useState(6);
  const [oldFiles, setOldFiles] = useState<FileEntry[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);

  useEffect(() => {
    invoke<ScanTarget[]>("get_scan_targets").then((list) => {
      setTargets(list);
      setSelectedTargets(new Set(list.map((t) => t.path)));
    });
    invoke<DiskPartition[]>("get_disk_partitions").then(setPartitions);

    const unlistenOld = listen<ScanProgress>("old-scan-progress", (e) =>
      setProgress(e.payload),
    );
    const unlistenDup = listen<ScanProgress>("duplicate-scan-progress", (e) =>
      setProgress(e.payload),
    );

    return () => {
      unlistenOld.then((f) => f());
      unlistenDup.then((f) => f());
    };
  }, []);

  const toggleTarget = (path: string) => {
    setSelectedTargets((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const togglePartition = (path: string) => {
    setSelectedPartitions((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const toggleFile = (path: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const allSelectedPaths = () => [...selectedTargets, ...selectedPartitions];

  const scanOld = async () => {
    setScanning(true);
    setMessage(null);
    setProgress(null);
    setSelectedFiles(new Set());
    try {
      const result = await invoke<FileEntry[]>("scan_old_large_files", {
        paths: allSelectedPaths(),
        minSizeMb,
        minDays: minMonths * 30,
      });
      setOldFiles(result);
    } finally {
      setScanning(false);
    }
  };

  const scanDup = async () => {
    setScanning(true);
    setMessage(null);
    setProgress(null);
    setSelectedFiles(new Set());
    try {
      const result = await invoke<DuplicateGroup[]>("scan_duplicates", {
        paths: allSelectedPaths(),
      });
      setDuplicateGroups(result);
    } finally {
      setScanning(false);
    }
  };

  const autoSelectDuplicates = () => {
    const toSelect = new Set<string>();
    duplicateGroups.forEach((group) => {
      group.files.slice(1).forEach((f) => toSelect.add(f.path));
    });
    setSelectedFiles(toSelect);
  };

  const deleteSelected = async () => {
    setDeleting(true);
    try {
      const result = await invoke<DeleteFilesResult>("delete_files", {
        paths: Array.from(selectedFiles),
      });
      setMessage(
        `${result.deleted} fichier(s) supprimé(s) — ${result.freed_mb.toFixed(0)} Mo libérés.`,
      );
      setSelectedFiles(new Set());
      if (tab === "old") scanOld();
      else scanDup();
    } finally {
      setDeleting(false);
    }
  };

  const noTargetSelected =
    selectedTargets.size === 0 && selectedPartitions.size === 0;

  const progressPercent =
    progress && progress.total > 0
      ? Math.min((progress.current / progress.total) * 100, 100)
      : 100;

  return (
    <div className="sp-stack">
      <PageHeader
        icon={FolderSearch}
        title="Analyse du disque"
        subtitle="Fichiers volumineux non modifiés depuis longtemps et fichiers en double (images, vidéos, audio, documents)."
        color="orange"
      />

      <Card title="Dossiers personnels à analyser" icon={Folder}>
        <div className="flex flex-wrap gap-2">
          {targets.map((t) => (
            <label key={t.path} className="sp-chipcheck">
              <input
                type="checkbox"
                checked={selectedTargets.has(t.path)}
                onChange={() => toggleTarget(t.path)}
                className="sp-checkbox"
              />
              {t.label}
            </label>
          ))}
        </div>
      </Card>

      <Card title="Partitions / disques détectés" icon={HardDrive}>
        {partitions.length === 0 ? (
          <p className="text-sm sp-muted">Aucune partition détectée.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {partitions.map((p) => (
              <label
                key={p.mount_point}
                className="sp-chipcheck"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  gap: 8,
                  borderRadius: 16,
                  padding: "10px 16px",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedPartitions.has(p.mount_point)}
                      onChange={() => togglePartition(p.mount_point)}
                      className="sp-checkbox"
                    />
                    <span className="font-semibold">{p.mount_point}</span>
                    <span className="sp-muted">{p.name || "Disque local"}</span>
                  </div>
                  <span className="text-xs sp-muted">
                    {p.used_gb.toFixed(0)} Go utilisés / {p.total_gb.toFixed(0)} Go
                  </span>
                </div>
                <ProgressBar
                  percent={p.total_gb > 0 ? (p.used_gb / p.total_gb) * 100 : 0}
                  height={6}
                />
              </label>
            ))}
          </div>
        )}
        <p className="text-xs sp-muted mt-3">
          Les dossiers systèmes (Windows, Program Files, ProgramData) sont
          automatiquement exclus de l'analyse même si une partition entière est
          sélectionnée.
        </p>
      </Card>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { id: "old", label: "Fichiers anciens & volumineux" },
          { id: "duplicates", label: "Doublons" },
        ]}
      />

      {message && <Banner tone="ok">{message}</Banner>}

      {scanning && progress && (
        <Card>
          <div className="flex items-center justify-between text-xs sp-muted mb-2">
            <span>{progress.phase}</span>
            <span>
              {progress.current} / {progress.total || "?"}
            </span>
          </div>
          <ProgressBar percent={progressPercent} tone="info" height={6} />
        </Card>
      )}

      {tab === "old" && (
        <>
          <Card>
            <div className="flex flex-wrap items-end gap-4">
              <Field label="Taille minimum (Mo)">
                <input
                  type="number"
                  value={minSizeMb}
                  onChange={(e) => setMinSizeMb(Number(e.target.value))}
                  className="sp-input w-32"
                />
              </Field>
              <Field label="Non modifié depuis (mois)">
                <input
                  type="number"
                  value={minMonths}
                  onChange={(e) => setMinMonths(Number(e.target.value))}
                  className="sp-input w-32"
                />
              </Field>
              <Button
                icon={HardDriveDownload}
                onClick={scanOld}
                disabled={scanning || noTargetSelected}
              >
                {scanning ? "Analyse..." : "Analyser"}
              </Button>
            </div>
          </Card>

          <Card flush>
            <div className="max-h-105 overflow-y-auto">
              {oldFiles.length === 0 ? (
                <EmptyState icon={FolderSearch} title="Aucun résultat pour l'instant" color="orange">
                  Lance une analyse pour trouver les fichiers volumineux et
                  anciens.
                </EmptyState>
              ) : (
                <div className="sp-list">
                  {oldFiles.map((f) => {
                    const { icon, color } = fileStyle(f.file_type);
                    return (
                      <label
                        key={f.path}
                        className="sp-item px-5 cursor-pointer hover:bg-(--bg-main)"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedFiles.has(f.path)}
                            onChange={() => toggleFile(f.path)}
                            className="sp-checkbox"
                          />
                          <IconChip icon={icon} color={color} size={34} />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate max-w-md">
                              {f.name}
                            </div>
                            <div className="text-xs sp-muted truncate max-w-md">
                              {f.path}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 text-xs sp-muted">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {f.last_modified}
                          </span>
                          <span className="font-bold" style={{ color: "var(--text-main)" }}>
                            {f.size_mb.toFixed(0)} Mo
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {tab === "duplicates" && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              icon={Copy}
              onClick={scanDup}
              disabled={scanning || noTargetSelected}
            >
              {scanning ? "Analyse..." : "Rechercher les doublons"}
            </Button>
            {duplicateGroups.length > 0 && (
              <Button variant="ghost" onClick={autoSelectDuplicates}>
                Sélectionner automatiquement les doublons (garder 1 exemplaire)
              </Button>
            )}
          </div>

          {duplicateGroups.length === 0 ? (
            <Card>
              <EmptyState icon={Copy} title="Aucun doublon trouvé pour l'instant" color="orange">
                Lance une analyse pour rechercher les fichiers en double.
              </EmptyState>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {duplicateGroups.map((group, i) => {
                const { icon, color } = fileStyle(group.file_type);
                return (
                  <Card key={i}>
                    <div className="flex items-center gap-3 text-xs sp-muted mb-3">
                      <IconChip icon={icon} color={color} size={30} />
                      {group.files.length} copies — {group.size_mb.toFixed(1)} Mo
                      chacune
                    </div>
                    <div className="flex flex-col gap-2">
                      {group.files.map((f, idx) => (
                        <label
                          key={f.path}
                          className="flex items-center gap-3 text-sm cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFiles.has(f.path)}
                            onChange={() => toggleFile(f.path)}
                            className="sp-checkbox"
                          />
                          <span
                            className="truncate"
                            style={
                              idx === 0
                                ? { color: "var(--ok)", fontWeight: 600 }
                                : undefined
                            }
                          >
                            {f.path}
                          </span>
                          {idx === 0 && (
                            <span
                              className="text-xs shrink-0"
                              style={{ color: "var(--ok)" }}
                            >
                              (à garder)
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {selectedFiles.size > 0 && (
        <Button
          variant="danger"
          block
          icon={Trash2}
          onClick={deleteSelected}
          disabled={deleting}
        >
          {deleting
            ? "Suppression..."
            : `Supprimer la sélection (${selectedFiles.size})`}
        </Button>
      )}
    </div>
  );
}
