"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown } from "lucide-react";

interface Props {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function SearchableSelect({ options, value, onChange, placeholder = "— Select —", disabled }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) => !query || o.toLowerCase().includes(query.toLowerCase()));

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="form-input flex items-center justify-between gap-2 text-left"
        style={{ width: "100%", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 }}
        onClick={() => { if (!disabled) setOpen((o) => !o); }}
        disabled={disabled}
      >
        {value ? (
          <span className="text-sm truncate">{value}</span>
        ) : (
          <span className="text-slate-400 text-sm">{placeholder}</span>
        )}
        <ChevronDown size={14} className="shrink-0 text-slate-400" />
      </button>

      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
            background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)", zIndex: 50, maxHeight: 280, display: "flex", flexDirection: "column",
          }}
        >
          <div className="p-2 border-b border-slate-100">
            <div className="search-input">
              <Search size={13} color="#9ca3af" />
              <input
                autoFocus
                type="text"
                placeholder="Search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="scroll-light" style={{ overflowY: "auto", flex: 1 }}>
            <div
              className="px-3 py-2 text-sm text-slate-400 cursor-pointer hover:bg-slate-50"
              style={{ borderBottom: "1px solid #f1f5f9" }}
              onMouseDown={() => { onChange(""); setOpen(false); setQuery(""); }}
            >
              — None —
            </div>
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-slate-400 text-center">No matches found.</div>
            ) : (
              filtered.map((opt) => (
                <div
                  key={opt}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-50"
                  style={{ borderBottom: "1px solid #f1f5f9", background: opt === value ? "#eff6ff" : undefined }}
                  onMouseDown={() => { onChange(opt); setOpen(false); setQuery(""); }}
                >
                  {opt}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
