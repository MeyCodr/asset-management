"use client";

import { Landmark } from "lucide-react";

export default function FinAssetsPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">IT Fin Asset</h1>
          <p className="page-subtitle">
            Manage IT financial assets, depreciation, and valuations
          </p>
        </div>
      </div>

      <div className="card empty-state">
        <Landmark size={48} className="mx-auto mb-3" style={{ color: "#d1d5db" }} />
        <div className="text-lg font-medium text-slate-700 mb-1">
          Coming soon
        </div>
        <div className="text-sm text-slate-500">
          IT financial asset management is not yet available.
        </div>
      </div>
    </div>
  );
}
