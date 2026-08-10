"use client";

import { X, Edit2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Expense } from "./ExpenseModal";

interface Props {
  expense: Expense;
  onClose: () => void;
  onEdit: () => void;
}

function formatNumber(n: number | null): string {
  return n === null ? "—" : n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPercent(n: number | null): string {
  return n === null ? "—" : `${Math.round(n * 100)}%`;
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="detail-item">
      <label>{label}</label>
      <span>{value ?? "—"}</span>
    </div>
  );
}

export default function ExpenseDetailModal({ expense, onClose, onEdit }: Props) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-shell" style={{ maxWidth: 720 }}>
        <div className="modal-pinned-header">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge bg-blue-100 text-blue-800">{expense.nature}</span>
              <span className="badge bg-gray-100 text-gray-700">{expense.category}</span>
            </div>
            <h2 className="modal-title mt-1">{expense.services || expense.supplier}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary" onClick={onEdit}>
              <Edit2 size={14} /> Edit
            </button>
            <button className="p-1 rounded hover:bg-slate-100" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-scroll-body">
        <div className="detail-section">
          <div className="detail-section-title">Overview</div>
          <div className="detail-grid">
            <Field label="Sub Category" value={expense.subCategory} />
            <Field label="AMP (Year)" value={expense.amp} />
            <Field label="Cost Ctr" value={expense.costCtr} />
            <Field label="Supplier" value={expense.supplier} />
            <Field label="Date Entry" value={formatDate(expense.dateEntry)} />
            <Field label="Effective Date" value={formatDate(expense.effectiveDate)} />
          </div>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">Reference & Agreement</div>
          <div className="detail-grid">
            <Field label="PHN Ref Letter" value={expense.phnRefLetter} />
            <Field label="Agreement/PO" value={expense.agreementPo} />
            <Field label="Type of Renewal" value={expense.typeOfRenewal} />
            <Field label="Quotation No" value={expense.quotationNo} />
            <Field label="Invoice No" value={expense.invoiceNo} />
            <Field label="DO No" value={expense.doNo} />
          </div>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">Service Details</div>
          <div className="detail-grid">
            <Field label="Services" value={expense.services} />
            <Field label="License/Product ID" value={expense.licenseProductId} />
          </div>
          {expense.description && (
            <p className="text-sm text-slate-600 mt-2">{expense.description}</p>
          )}
        </div>

        <div className="detail-section">
          <div className="detail-section-title">Financials</div>
          <div className="detail-grid">
            <Field label="Qty" value={expense.qty} />
            <Field label="Unit (Pcs)" value={expense.unit} />
            <Field label="Price/Unit (RM)" value={formatNumber(expense.unitPrice)} />
            <Field label="Sub Total (RM)" value={formatNumber(expense.subTotalRm)} />
            <Field label="SST (RM)" value={formatPercent(expense.sstRm)} />
            <Field label="SST Total (RM)" value={formatNumber(expense.sstTotalRm)} />
            <Field label="Grand Total (RM)" value={formatNumber(expense.grandTotalRm)} />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
