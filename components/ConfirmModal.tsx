"use client";

import { AlertTriangle, X } from "lucide-react";

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "warning" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_STYLES = {
  danger: {
    icon: "bg-red-100",
    iconColor: "#ef4444",
    btn: "btn btn-danger",
  },
  warning: {
    icon: "bg-amber-100",
    iconColor: "#f59e0b",
    btn: "btn",
    btnStyle: { background: "#f59e0b", color: "white" },
  },
  default: {
    icon: "bg-blue-100",
    iconColor: "#3b82f6",
    btn: "btn btn-primary",
  },
};

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  variant = "danger",
  onConfirm,
  onCancel,
}: Props) {
  const v = VARIANT_STYLES[variant];

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={`flex items-center justify-center rounded-full flex-shrink-0 ${v.icon}`}
            style={{ width: 44, height: 44 }}
          >
            <AlertTriangle size={22} color={v.iconColor} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h2 className="modal-title">{title}</h2>
              <button
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                onClick={onCancel}
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={v.btn}
            style={"btnStyle" in v ? v.btnStyle : undefined}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
