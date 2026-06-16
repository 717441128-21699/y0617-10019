import { useState } from "react";
import { useParticleStore } from "@/store/useParticleStore";
import { ConflictItem, ConflictResolveMode } from "@/store/particleStore";
import { X, RotateCcw, SkipForward, FilePlus, Check } from "lucide-react";

export default function ConflictDialog() {
  const {
    pendingConflicts,
    resolveConflict,
    clearConflicts,
    conflictDefaultMode,
    setConflictDefaultMode,
  } = useParticleStore();

  const [renameInputs, setRenameInputs] = useState<Record<string, string>>({});

  if (pendingConflicts.length === 0) return null;

  const kindLabel: Record<ConflictItem["kind"], string> = {
    preset: "预设",
    recording: "录制",
    group: "分组",
  };

  const applyToAll = (mode: ConflictResolveMode) => {
    for (const c of pendingConflicts) {
      if (mode === "rename") {
        const base = c.name;
        const suffix = ` (${new Date().getSeconds()})`;
        resolveConflict(c.id, mode, base + suffix);
      } else {
        resolveConflict(c.id, mode);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl bg-black/90 border border-rose-500/30 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-gradient-to-r from-rose-500/10 to-transparent">
          <h3 className="text-sm font-bold text-rose-200 tracking-wider uppercase">
            ⚠ 导入冲突 ({pendingConflicts.length})
          </h3>
          <button
            onClick={clearConflicts}
            className="p-1 rounded-md hover:bg-white/10 text-slate-400"
            title="关闭（跳过所有未处理）"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-2.5 flex items-center gap-2 border-b border-white/5 bg-white/[0.02]">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 mr-1">全部处理：</span>
          <button
            onClick={() => applyToAll("overwrite")}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-200 text-[11px]"
          >
            <RotateCcw size={11} /> 覆盖全部
          </button>
          <button
            onClick={() => applyToAll("skip")}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-500/15 hover:bg-slate-500/25 border border-slate-400/30 text-slate-300 text-[11px]"
          >
            <SkipForward size={11} /> 跳过全部
          </button>
          <button
            onClick={() => applyToAll("rename")}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-200 text-[11px]"
          >
            <FilePlus size={11} /> 另存全部
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {pendingConflicts.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/10"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider
                    ${c.kind === "preset" ? "bg-fuchsia-500/20 text-fuchsia-300"
                      : c.kind === "recording" ? "bg-sky-500/20 text-sky-300"
                      : "bg-amber-500/20 text-amber-300"}`}
                  >
                    {kindLabel[c.kind]}
                  </span>
                  <span className="text-slate-200 text-xs font-medium truncate">
                    {c.name}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 pl-1">
                已存在：<span className="text-slate-400">{c.existingName}</span>
              </div>
              <div className="flex gap-1.5 items-center flex-wrap">
                <button
                  onClick={() => resolveConflict(c.id, "overwrite")}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-200 text-[10px] uppercase tracking-wider"
                >
                  <RotateCcw size={10} /> 覆盖
                </button>
                <button
                  onClick={() => resolveConflict(c.id, "skip")}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[10px] uppercase tracking-wider"
                >
                  <SkipForward size={10} /> 跳过
                </button>
                <div className="flex items-center gap-1 flex-1 min-w-[120px]">
                  <input
                    type="text"
                    value={renameInputs[c.id] ?? `${c.name} (2)`}
                    onChange={(e) =>
                      setRenameInputs((m) => ({ ...m, [c.id]: e.target.value }))
                    }
                    className="flex-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400/40"
                    placeholder="新名称"
                  />
                  <button
                    onClick={() => {
                      const n = renameInputs[c.id] ?? `${c.name} (2)`;
                      resolveConflict(c.id, "rename", n);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-200 text-[10px] uppercase tracking-wider"
                  >
                    <Check size={10} /> 另存
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-2.5 border-t border-white/5 flex items-center justify-between bg-black/30">
          <div className="text-[10px] text-slate-500">
            剩余：<span className="text-slate-300 tabular-nums">{pendingConflicts.length}</span>
          </div>
          <button
            onClick={clearConflicts}
            className="px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] uppercase tracking-wider"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
