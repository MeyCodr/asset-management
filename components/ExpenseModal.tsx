"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { X, Tag, ClipboardList, Truck, Calculator, RefreshCw } from "lucide-react";
import {
  BASE_PATH,
  EXPENSE_CATEGORIES,
  EXPENSE_NATURES,
  EXPENSE_COST_CENTERS,
  EXPENSE_RENEWAL_TYPES,
  EXPENSE_UNITS,
  EXPENSE_SST_RATE,
  EXPENSE_SST_RATES,
  expenseYearOptions,
} from "@/lib/utils";
import SearchableSelect from "@/components/SearchableSelect";

export interface Expense {
  id: string;
  nature: string;
  category: string;
  subCategory: string | null;
  amp: string | null;
  costCtr: string | null;
  supplier: string;
  dateEntry: string | null;
  phnRefLetter: string | null;
  agreementPo: string | null;
  typeOfRenewal: string | null;
  quotationNo: string | null;
  invoiceNo: string | null;
  doNo: string | null;
  services: string | null;
  description: string | null;
  licenseProductId: string | null;
  qty: number | null;
  unitPrice: number | null;
  unit: string | null;
  subTotalRm: number | null;
  sstRm: number | null;
  sstTotalRm: number | null;
  grandTotalRm: number | null;
  effectiveDate: string | null;
}

interface Props {
  expense: Expense | null;
  onClose: () => void;
  onSaved: (expense: Expense) => void;
}

const EMPTY_FORM = {
  nature: "",
  category: "",
  subCategory: "",
  amp: "",
  costCtr: "",
  supplier: "",
  dateEntry: "",
  phnRefLetter: "",
  agreementPo: "",
  typeOfRenewal: "",
  quotationNo: "",
  invoiceNo: "",
  doNo: "",
  services: "",
  description: "",
  licenseProductId: "",
  qty: "",
  unitPrice: "",
  unit: "",
  subTotalRm: "",
  sstRm: "",
  sstTotalRm: "",
  grandTotalRm: "",
  effectiveDate: "",
};

type FormState = typeof EMPTY_FORM;
type FieldConfig = {
  name: keyof FormState;
  label: string;
  type?: string;
  required?: boolean;
  options?: readonly string[];
};

function toDateInput(d: string | null | undefined): string {
  if (!d) return "";
  return d.split("T")[0];
}

function toFormState(expense: Expense): FormState {
  return {
    nature: expense.nature,
    category: expense.category,
    subCategory: expense.subCategory ?? "",
    amp: expense.amp ?? "",
    costCtr: expense.costCtr ?? "",
    supplier: expense.supplier,
    dateEntry: toDateInput(expense.dateEntry),
    phnRefLetter: expense.phnRefLetter ?? "",
    agreementPo: expense.agreementPo ?? "",
    typeOfRenewal: expense.typeOfRenewal ?? "",
    quotationNo: expense.quotationNo ?? "",
    invoiceNo: expense.invoiceNo ?? "",
    doNo: expense.doNo ?? "",
    services: expense.services ?? "",
    description: expense.description ?? "",
    licenseProductId: expense.licenseProductId ?? "",
    qty: expense.qty?.toString() ?? "",
    unitPrice: expense.unitPrice?.toString() ?? "",
    unit: expense.unit ?? "",
    subTotalRm: expense.subTotalRm?.toString() ?? "",
    sstRm: expense.sstRm?.toString() ?? "",
    sstTotalRm: expense.sstTotalRm?.toString() ?? "",
    grandTotalRm: expense.grandTotalRm?.toString() ?? "",
    effectiveDate: toDateInput(expense.effectiveDate),
  };
}

function round2(n: number): string {
  return (Math.round(n * 100) / 100).toString();
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  const { name, label, type, required, options } = field;
  return (
    <div>
      <label className="form-label">
        {label} {required && "*"}
      </label>
      {type === "searchable-select" ? (
        <SearchableSelect
          options={options ?? []}
          value={value}
          onChange={(v) => onChange({ target: { name, value: v } } as unknown as React.ChangeEvent<HTMLSelectElement>)}
        />
      ) : type === "select" ? (
        <select name={name} value={value} onChange={onChange} className="form-input" required={required}>
          <option value="">— Select —</option>
          {options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          type={type ?? "text"}
          value={value}
          onChange={onChange}
          className="form-input"
          step={type === "number" ? "0.01" : undefined}
          required={required}
        />
      )}
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="detail-section-title flex items-center gap-2">
      <Icon size={14} />
      {children}
    </div>
  );
}

interface LicenseRef {
  refLetter: string | null;
  renewalStart: string | null;
  vendor: string;
  licenseKey: string | null;
  name: string;
}

export default function ExpenseModal({ expense, onClose, onSaved }: Props) {
  const isEdit = !!expense;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>(expense ? toFormState(expense) : EMPTY_FORM);
  const [licenses, setLicenses] = useState<LicenseRef[]>([]);
  const totalsManuallyEdited = useRef(isEdit);
  const effectiveDateManuallyEdited = useRef(isEdit);
  const supplierManuallyEdited = useRef(isEdit);
  const licenseProductIdManuallyEdited = useRef(isEdit);
  const servicesManuallyEdited = useRef(isEdit);

  useEffect(() => {
    fetch(`${BASE_PATH}/api/licenses`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: LicenseRef[]) => setLicenses(data))
      .catch(() => setLicenses([]));
  }, []);

  const refLetterOptions = Array.from(
    new Set(licenses.map((l) => l.refLetter).filter((r): r is string => !!r))
  ).sort();

  // Default Effective Date / Supplier / License-Product ID / Services from the
  // selected license, until the user overrides any of them directly.
  useEffect(() => {
    if (!form.phnRefLetter) return;
    const license = licenses.find((l) => l.refLetter === form.phnRefLetter);
    if (!license) return;
    setForm((f) => ({
      ...f,
      effectiveDate: !effectiveDateManuallyEdited.current && license.renewalStart ? license.renewalStart.split("T")[0] : f.effectiveDate,
      supplier: !supplierManuallyEdited.current && license.vendor ? license.vendor : f.supplier,
      licenseProductId: !licenseProductIdManuallyEdited.current && license.licenseKey ? license.licenseKey : f.licenseProductId,
      services: !servicesManuallyEdited.current && license.name ? license.name : f.services,
    }));
  }, [form.phnRefLetter, licenses]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleTotalsChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    totalsManuallyEdited.current = true;
    handleChange(e);
  }

  function handleEffectiveDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    effectiveDateManuallyEdited.current = true;
    handleChange(e);
  }

  function handleSupplierChange(e: React.ChangeEvent<HTMLInputElement>) {
    supplierManuallyEdited.current = true;
    handleChange(e);
  }

  function handleLicenseProductIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    licenseProductIdManuallyEdited.current = true;
    handleChange(e);
  }

  function handleServicesChange(e: React.ChangeEvent<HTMLInputElement>) {
    servicesManuallyEdited.current = true;
    handleChange(e);
  }

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setForm((f) => ({ ...f, category: e.target.value, subCategory: "" }));
  }

  const subCategories = EXPENSE_CATEGORIES.find((c) => c.name === form.category)?.subCategories ?? [];

  // C = A×B (Sub Total), E = C×D (SST Total), F = E+C (Grand Total) — D (SST) defaults
  // to the standard rate but is a free input, matching the source spreadsheet's formulas.
  function recalcTotals() {
    const qty = parseFloat(form.qty) || 0;
    const unitPrice = parseFloat(form.unitPrice) || 0;
    const subTotalRm = qty * unitPrice;
    const sstRate = form.sstRm ? parseFloat(form.sstRm) || 0 : EXPENSE_SST_RATE;
    const sstTotalRm = subTotalRm * sstRate;
    const grandTotalRm = sstTotalRm + subTotalRm;
    setForm((f) => ({
      ...f,
      subTotalRm: round2(subTotalRm),
      sstRm: f.sstRm || round2(sstRate),
      sstTotalRm: round2(sstTotalRm),
      grandTotalRm: round2(grandTotalRm),
    }));
  }

  // Auto-calculate totals from Qty/Unit Price until the user edits a totals field directly
  useEffect(() => {
    if (totalsManuallyEdited.current) return;
    if (!form.qty && !form.unitPrice) return;
    recalcTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.qty, form.unitPrice]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nature || !form.category || !form.supplier) {
      setError("Nature, category, and supplier are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = isEdit ? `${BASE_PATH}/api/expenses/${expense.id}` : `${BASE_PATH}/api/expenses`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save expense");
        return;
      }
      onSaved(await res.json());
    } catch (e) {
      setError("Network error");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const yearOptions = expenseYearOptions();

  // Include the current value even if it's no longer a valid license ref letter
  // (legacy data, or the license was since deleted), so editing never silently blanks it.
  const phnRefLetterOptions =
    form.phnRefLetter && !refLetterOptions.includes(form.phnRefLetter)
      ? [...refLetterOptions, form.phnRefLetter].sort()
      : refLetterOptions;

  const referenceFields: FieldConfig[] = [
    { name: "amp", label: "AMP (Year)", type: "select", options: yearOptions },
    { name: "costCtr", label: "Cost Ctr", type: "select", options: EXPENSE_COST_CENTERS },
    { name: "typeOfRenewal", label: "Type of Renewal", type: "select", options: EXPENSE_RENEWAL_TYPES },
    { name: "phnRefLetter", label: "PHN Ref Letter", type: "searchable-select", options: phnRefLetterOptions },
    { name: "agreementPo", label: "Agreement/PO" },
    { name: "quotationNo", label: "Quotation No" },
    { name: "invoiceNo", label: "Invoice No" },
    { name: "doNo", label: "DO No" },
  ];

  const orderFields: FieldConfig[] = [
    { name: "dateEntry", label: "Date Entry", type: "date" },
  ];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-shell" style={{ maxWidth: 920 }}>
        <div className="modal-pinned-header">
          <h2 className="modal-title">{isEdit ? "Edit Expense" : "Add Expense"}</h2>
          <button className="p-1 rounded hover:bg-slate-100" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col" style={{ flex: 1, minHeight: 0 }}>
          <div className="modal-scroll-body">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Classification */}
            <div className="detail-section">
              <SectionTitle icon={Tag}>Classification</SectionTitle>
              <div className="form-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                <div>
                  <label className="form-label">Nature *</label>
                  <select name="nature" value={form.nature} onChange={handleChange} className="form-input" required>
                    <option value="">— Select —</option>
                    {EXPENSE_NATURES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Category *</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleCategoryChange}
                    className="form-input"
                    required
                  >
                    <option value="">— Select —</option>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Sub Category</label>
                  <select
                    name="subCategory"
                    value={form.subCategory}
                    onChange={handleChange}
                    className="form-input"
                    disabled={!form.category}
                  >
                    <option value="">— Select —</option>
                    {subCategories.map((sc) => (
                      <option key={sc} value={sc}>
                        {sc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Reference & Agreement */}
            <div className="detail-section">
              <SectionTitle icon={ClipboardList}>Reference & Agreement</SectionTitle>
              <div className="form-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                {referenceFields.map((field) => (
                  <FieldInput key={field.name} field={field} value={form[field.name]} onChange={handleChange} />
                ))}
              </div>
            </div>

            {/* Order Details */}
            <div className="detail-section">
              <SectionTitle icon={Truck}>Order Details</SectionTitle>
              <div className="form-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                <div>
                  <label className="form-label">Supplier *</label>
                  <input
                    name="supplier"
                    value={form.supplier}
                    onChange={handleSupplierChange}
                    className="form-input"
                    required
                  />
                  {!supplierManuallyEdited.current && form.phnRefLetter && (
                    <div className="text-xs text-slate-400 mt-1">Defaulted from the license&apos;s Vendor</div>
                  )}
                </div>
                {orderFields.map((field) => (
                  <FieldInput key={field.name} field={field} value={form[field.name]} onChange={handleChange} />
                ))}
                <div>
                  <label className="form-label">Effective Date</label>
                  <input
                    name="effectiveDate"
                    type="date"
                    value={form.effectiveDate}
                    onChange={handleEffectiveDateChange}
                    className="form-input"
                  />
                  {!effectiveDateManuallyEdited.current && form.phnRefLetter && (
                    <div className="text-xs text-slate-400 mt-1">
                      Defaulted from the license&apos;s Period Renewal Start
                    </div>
                  )}
                </div>
                <div>
                  <label className="form-label">Services</label>
                  <input
                    name="services"
                    value={form.services}
                    onChange={handleServicesChange}
                    className="form-input"
                  />
                  {!servicesManuallyEdited.current && form.phnRefLetter && (
                    <div className="text-xs text-slate-400 mt-1">Defaulted from the license&apos;s Name</div>
                  )}
                </div>
                <div>
                  <label className="form-label">License/Product ID</label>
                  <input
                    name="licenseProductId"
                    value={form.licenseProductId}
                    onChange={handleLicenseProductIdChange}
                    className="form-input"
                  />
                  {!licenseProductIdManuallyEdited.current && form.phnRefLetter && (
                    <div className="text-xs text-slate-400 mt-1">Defaulted from the license&apos;s License Key</div>
                  )}
                </div>
                <div className="form-grid-full">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="form-input"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Financials */}
            <div
              className="rounded-lg p-4 mb-2"
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="detail-section-title flex items-center gap-2"
                  style={{ marginBottom: 0, paddingBottom: 0, border: "none" }}
                >
                  <Calculator size={14} />
                  Financials
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => {
                    totalsManuallyEdited.current = false;
                    recalcTotals();
                  }}
                >
                  <RefreshCw size={11} />
                  Recalculate ({(EXPENSE_SST_RATE * 100).toFixed(0)}% SST)
                </button>
              </div>

              <div className="form-grid mb-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                <div>
                  <label className="form-label">Qty</label>
                  <input
                    name="qty"
                    type="number"
                    step="0.01"
                    value={form.qty}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Unit (Pcs)</label>
                  <select name="unit" value={form.unit} onChange={handleChange} className="form-input">
                    <option value="">— Select —</option>
                    {EXPENSE_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Price/Unit (RM)</label>
                  <input
                    name="unitPrice"
                    type="number"
                    step="0.01"
                    value={form.unitPrice}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-grid mb-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                <div>
                  <label className="form-label">Sub Total (RM)</label>
                  <input
                    name="subTotalRm"
                    type="number"
                    step="0.01"
                    value={form.subTotalRm}
                    onChange={handleTotalsChange}
                    className="form-input text-right font-mono"
                  />
                </div>
                <div>
                  <label className="form-label">SST (RM)</label>
                  <select
                    name="sstRm"
                    value={form.sstRm}
                    onChange={handleTotalsChange}
                    className="form-input text-right font-mono"
                  >
                    <option value="">— Select —</option>
                    {EXPENSE_SST_RATES.map((rate) => (
                      <option key={rate} value={rate}>
                        {Math.round(rate * 100)}%
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">SST Total (RM)</label>
                  <input
                    name="sstTotalRm"
                    type="number"
                    step="0.01"
                    value={form.sstTotalRm}
                    onChange={handleTotalsChange}
                    className="form-input text-right font-mono"
                  />
                </div>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                <div className="form-grid-full">
                  <label className="form-label">Grand Total (RM)</label>
                  <input
                    name="grandTotalRm"
                    type="number"
                    step="0.01"
                    value={form.grandTotalRm}
                    onChange={handleTotalsChange}
                    className="form-input text-right font-mono font-semibold"
                    style={{ color: "#0f172a", fontSize: "1.125rem" }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-pinned-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
