/**
 * Finance Entry Form Modal
 * Allows entering money earned (Income) and money spent (Expense).
 * For income, provides rich client linking (payment received, subscription, store setup, etc.).
 */
import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  User,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  DollarSign,
  Tag,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Modal } from "../common/Modal.tsx";
import { useLanguage } from "../../context/LanguageContext.tsx";
import { useToast } from "../../context/ToastContext.tsx";
import {
  FinanceTransaction,
  FinanceTransactionType,
  CreateFinanceInput,
  createFinance,
  updateFinance,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
} from "../../lib/services/financeService.ts";
import { Client, getAllClients } from "../../lib/services/clientService.ts";

export interface FinanceEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: FinanceTransactionType;
  editingTransaction?: FinanceTransaction | null;
  clients?: Client[];
  onSuccess?: (transaction: FinanceTransaction) => void;
}

export const FinanceEntryModal: React.FC<FinanceEntryModalProps> = ({
  isOpen,
  onClose,
  initialType = "income",
  editingTransaction = null,
  clients: initialClients = [],
  onSuccess,
}) => {
  const { isNepali } = useLanguage();
  const { showToast } = useToast();

  const [type, setType] = useState<FinanceTransactionType>(initialType);
  const [category, setCategory] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>("Bank Transfer");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const [clients, setClients] = useState<Client[]>(initialClients);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch clients if not already passed
  useEffect(() => {
    if (isOpen && clients.length === 0) {
      setIsLoadingClients(true);
      getAllClients()
        .then((data) => setClients(data))
        .catch((err) => console.warn("Failed to fetch clients for finance modal:", err))
        .finally(() => setIsLoadingClients(false));
    }
  }, [isOpen, clients.length]);

  // Synchronize state when opening modal or editing record
  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setDate(editingTransaction.date || new Date().toISOString().split("T")[0]);
      setPaymentMethod(editingTransaction.paymentMethod || "Bank Transfer");
      setSelectedClientId(editingTransaction.clientId || "");
      setReference(editingTransaction.reference || "");
      setNote(editingTransaction.note || "");

      const isPreset =
        editingTransaction.type === "income"
          ? (DEFAULT_INCOME_CATEGORIES as readonly string[]).includes(editingTransaction.category)
          : (DEFAULT_EXPENSE_CATEGORIES as readonly string[]).includes(editingTransaction.category);

      if (isPreset) {
        setCategory(editingTransaction.category);
        setCustomCategory("");
      } else {
        setCategory("Custom");
        setCustomCategory(editingTransaction.category);
      }
    } else {
      setType(initialType);
      const defaultCat =
        initialType === "income"
          ? DEFAULT_INCOME_CATEGORIES[0]
          : DEFAULT_EXPENSE_CATEGORIES[0];
      setCategory(defaultCat);
      setCustomCategory("");
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
      setPaymentMethod("Bank Transfer");
      setSelectedClientId("");
      setReference("");
      setNote("");
    }
    setFormError(null);
  }, [isOpen, editingTransaction, initialType]);

  // When type changes, switch default category
  const handleTypeChange = (newType: FinanceTransactionType) => {
    setType(newType);
    setFormError(null);
    if (!editingTransaction) {
      const defaultCat =
        newType === "income"
          ? DEFAULT_INCOME_CATEGORIES[0]
          : DEFAULT_EXPENSE_CATEGORIES[0];
      setCategory(defaultCat);
      setCustomCategory("");
    }
  };

  // Selected client helper
  const selectedClient = clients.find((c) => String(c.id) === String(selectedClientId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setFormError(isNepali ? "कृपया मान्य रकम प्रविष्ट गर्नुहोस्" : "Please enter a valid positive amount");
      return;
    }

    const finalCategory = category === "Custom" ? customCategory.trim() : category.trim();
    if (!finalCategory) {
      setFormError(isNepali ? "कृपया कोटी चयन वा प्रविष्ट गर्नुहोस्" : "Please select or specify a category");
      return;
    }

    if (!date) {
      setFormError(isNepali ? "कृपया मिति चयन गर्नुहोस्" : "Please select a transaction date");
      return;
    }

    setIsSubmitting(true);
    try {
      let result: FinanceTransaction;

      const payload: CreateFinanceInput = {
        type,
        category: finalCategory,
        amount: numericAmount,
        date,
        paymentMethod,
        clientId: selectedClientId || undefined,
        clientName: selectedClient?.name || undefined,
        clientShopName: selectedClient?.company_name || selectedClient?.shopName || undefined,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
      };

      if (editingTransaction) {
        result = await updateFinance(editingTransaction.id, {
          ...payload,
          clientId: selectedClientId || null,
          clientName: selectedClient?.name || null,
          clientShopName: selectedClient?.company_name || selectedClient?.shopName || null,
          reference: reference.trim() || null,
          note: note.trim() || null,
        });
        showToast(
          isNepali
            ? `${type === "income" ? "आम्दानी" : "खर्च"} विवरण अद्यावधिक भयो`
            : `${type === "income" ? "Income" : "Expense"} record updated successfully`,
          "success",
        );
      } else {
        result = await createFinance(payload);
        showToast(
          isNepali
            ? `${type === "income" ? "आम्दानी" : "खर्च"} सफलतापूर्वक सुरक्षित गरियो`
            : `${type === "income" ? "Income (Earned)" : "Expense (Spent)"} recorded successfully`,
          "success",
        );
      }

      onSuccess?.(result);
      onClose();
    } catch (err: any) {
      console.error("Failed to save finance record:", err);
      const msg = err.message || (isNepali ? "विवरण सुरक्षित गर्न सकिएन" : "Failed to save finance transaction");
      setFormError(msg);
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories =
    type === "income" ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingTransaction
          ? isNepali
            ? `${type === "income" ? "आम्दानी" : "खर्च"} सम्पादन गर्नुहोस्`
            : `Edit ${type === "income" ? "Income" : "Expense"} Record`
          : isNepali
            ? `${type === "income" ? "आम्दानी प्रविष्ट गर्नुहोस् (कमाई)" : "खर्च प्रविष्ट गर्नुहोस् (खर्चिएको)"}`
            : `Record ${type === "income" ? "Income (Earned)" : "Expense (Spent)"}`
      }
      subtitle={
        type === "income"
          ? isNepali
            ? "ग्राहक भुक्तानी, सदस्यता नवीकरण, वा अन्य आम्दानी विवरण सुरक्षित गर्नुहोस्।"
            : "Record client payments received, subscription fees, or other earnings."
          : isNepali
            ? "सञ्चालन खर्च, सर्भर, तलब, वा अन्य व्यापारिक खर्चहरू सुरक्षित गर्नुहोस्।"
            : "Log business operations, hosting, payroll, or business expenses."
      }
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{formError}</span>
          </div>
        )}

        {/* Type Toggle: Earned (Income) vs Spent (Expense) */}
        {!editingTransaction && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-950 border border-neutral-800 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange("income")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                type === "income"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>{isNepali ? "कमाई / आम्दानी (Income)" : "Earned (Income)"}</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("expense")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                type === "expense"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-950"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>{isNepali ? "खर्चिएको / खर्च (Expense)" : "Spent (Expense)"}</span>
            </button>
          </div>
        )}

        {/* Amount & Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center justify-between">
              <span>{isNepali ? "रकम (Amount)" : "Amount"} <span className="text-rose-400">*</span></span>
              <span className="text-[10px] text-neutral-500 font-mono">NPR (Rs.)</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold font-mono text-neutral-400">
                Rs.
              </div>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full pl-10 pr-3 py-2.5 bg-neutral-950 border rounded-xl text-sm font-mono font-bold focus:outline-none transition-colors ${
                  type === "income"
                    ? "border-neutral-800 text-emerald-400 focus:border-emerald-500"
                    : "border-neutral-800 text-rose-400 focus:border-rose-500"
                }`}
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span>{isNepali ? "मिति (Date)" : "Date"} <span className="text-rose-400">*</span></span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 font-mono focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Client Linking (High Priority for Income, Optional for Expense) */}
        <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-200 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isNepali ? "सम्बन्धित ग्राहक / पसल (Link Client)" : "Link Client / Store"}</span>
            </label>
            <span className="text-[10px] text-neutral-500">
              {type === "income" ? (isNepali ? "भुक्तानी जोड्नुहोस्" : "e.g. Payment Received") : (isNepali ? "ऐच्छिक" : "Optional")}
            </span>
          </div>

          <div className="relative">
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              disabled={isLoadingClients}
              className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="">{isNepali ? "-- कुनै ग्राहक जोडिएको छैन (सामान्य) --" : "-- None / General Walk-in / Unlinked --"}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company_name ? `• ${c.company_name}` : ""} ({c.email || c.phone || "Active"})
                </option>
              ))}
            </select>
          </div>

          {selectedClient && (
            <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-emerald-300">{selectedClient.name}</span>
                  {selectedClient.company_name && (
                    <span className="text-neutral-400 ml-1.5 truncate">
                      ({selectedClient.company_name})
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/20 shrink-0">
                Linked Client
              </span>
            </div>
          )}
        </div>

        {/* Category & Payment Method Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-neutral-400" />
              <span>{isNepali ? "कोटी (Category)" : "Category"} <span className="text-rose-400">*</span></span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="Custom">{isNepali ? "+ अन्य नयाँ कोटी..." : "+ Custom Category..."}</option>
            </select>

            {category === "Custom" && (
              <input
                type="text"
                required
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder={isNepali ? "कोटीको नाम लेख्नुहोस्..." : "Enter custom category..."}
                className="w-full mt-2 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
              <span>{isNepali ? "भुक्तानी माध्यम (Payment Method)" : "Payment Method"}</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              {DEFAULT_PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reference / Invoice / Bill ID */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-neutral-400" />
              <span>{isNepali ? "बिल वा सन्दर्भ नम्बर (Reference #)" : "Reference / Invoice / Txn ID"}</span>
            </span>
            <span className="text-[10px] text-neutral-500">{isNepali ? "ऐच्छिक" : "Optional"}</span>
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={
              type === "income"
                ? "e.g. INV-2026-001, Bank Txn 994829"
                : "e.g. AWS-BILL-MAY, Cheque #004"
            }
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
          />
        </div>

        {/* Note / Memo */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center justify-between">
            <span>{isNepali ? "कैफियत वा विवरण (Notes / Description)" : "Notes / Remarks"}</span>
            <span className="text-[10px] text-neutral-500">{isNepali ? "ऐच्छिक" : "Optional"}</span>
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              type === "income"
                ? isNepali
                  ? "जस्तै: १ वर्षको प्रो सदस्यता शुल्क बापत प्राप्त रकम..."
                  : "e.g. Annual Pro subscription payment received via bank transfer..."
                : isNepali
                  ? "जस्तै: क्लाउड डेटाबेस सर्भर होस्टिङ खर्च..."
                  : "e.g. Monthly cloud server and database hosting expenses..."
            }
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
          />
        </div>

        {/* Form Actions */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {isNepali ? "रद्द गर्नुहोस्" : "Cancel"}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-2 ${
              type === "income"
                ? "bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950"
                : "bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-950"
            }`}
          >
            {isSubmitting ? (
              <span className="inline-block animate-spin mr-1">⏳</span>
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>
              {editingTransaction
                ? isNepali ? "अद्यावधिक गर्नुहोस्" : "Save Changes"
                : isNepali
                  ? `${type === "income" ? "आम्दानी सुरक्षित गर्नुहोस्" : "खर्च सुरक्षित गर्नुहोस्"}`
                  : `Save ${type === "income" ? "Income (Earned)" : "Expense (Spent)"}`}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
