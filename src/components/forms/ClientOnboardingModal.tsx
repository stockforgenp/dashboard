/**
 * Client Onboarding & Registration Form Modal
 * Used for onboarding new retail clients or editing existing client profiles.
 */
import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Modal } from "../common/Modal.tsx";
import { useLanguage } from "../../context/LanguageContext.tsx";
import { useToast } from "../../context/ToastContext.tsx";
import {
  createClient,
  updateClient,
  Client,
  CreateClientInput,
} from "../../lib/services/clientService.ts";
import { STORE_TYPES } from "./constants.ts";

export interface ClientOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingClient?: Client | null;
  onSuccess?: (savedClient?: Client) => void;
}

export const ClientOnboardingModal: React.FC<ClientOnboardingModalProps> = ({
  isOpen,
  onClose,
  editingClient = null,
  onSuccess,
}) => {
  const { isNepali } = useLanguage();
  const { showToast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientForm, setClientForm] = useState<CreateClientInput>({
    name: "",
    company_name: "",
    email: "",
    password: "",
    phone: "",
    client_type: "Grocery & Supermarket",
    address: "",
    pan_number: "",
    status: "active",
    notes: "",
    plan: "trial",
    durationDays: 14,
  });

  // Sync form when editingClient changes or modal opens
  useEffect(() => {
    if (editingClient) {
      setShowPassword(false);
      setClientForm({
        name: editingClient.name,
        company_name: editingClient.company_name || "",
        email: editingClient.email || "",
        password: "",
        phone: editingClient.phone,
        client_type: editingClient.client_type,
        address: editingClient.address || "",
        pan_number: editingClient.pan_number || "",
        status: editingClient.status,
        notes: editingClient.notes || "",
        plan: editingClient.subscription?.plan || "trial",
        durationDays: editingClient.subscription?.durationDays || 14,
      });
    } else {
      setShowPassword(false);
      setClientForm({
        name: "",
        company_name: "",
        email: "",
        password: "",
        phone: "",
        client_type: "Grocery & Supermarket",
        address: "",
        pan_number: "",
        status: "active",
        notes: "",
        plan: "trial",
        durationDays: 14,
      });
    }
  }, [editingClient, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name.trim()) {
      showToast(
        isNepali
          ? "कृपया ग्राहक वा सम्पर्क व्यक्तिको नाम लेख्नुहोस्"
          : "Please enter client contact name",
        "error",
      );
      return;
    }
    if (!clientForm.phone?.trim()) {
      showToast(
        isNepali
          ? "कृपया फोन नम्बर प्रविष्ट गर्नुहोस्"
          : "Please enter phone number",
        "error",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingClient) {
        const updated = await updateClient(editingClient.id, clientForm);
        showToast(
          isNepali
            ? "ग्राहक विवरण अद्यावधिक गरियो"
            : "Client updated successfully",
          "success",
        );
        onSuccess?.(updated);
      } else {
        const created = await createClient(clientForm);
        showToast(
          isNepali
            ? "नयाँ ग्राहक सफलतापूर्वक दर्ता भयो"
            : "Client registered successfully",
          "success",
        );
        onSuccess?.(created);
      }
      onClose();
    } catch (err: unknown) {
      showToast((err as Error).message || "Failed to save client", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingClient
          ? isNepali
            ? "ग्राहक विवरण सम्पादन गर्नुहोस्"
            : "Edit Registered Client"
          : isNepali
            ? "नयाँ ग्राहक अनबोर्डिङ तथा दर्ता"
            : "Onboard New Client / Retail Store"
      }
      subtitle={
        isNepali
          ? "पसलको नाम, सम्पर्क विवरण, स्टोर प्रकार, PAN/VAT र लाइसेन्स योजना प्रविष्ट गर्नुहोस्"
          : "Enter business name, phone, store type, fiscal PAN/VAT, and license plan"
      }
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1">
            {isNepali ? "पसल / फर्मको नाम" : "Business / Store Name"}
          </label>
          <input
            type="text"
            value={clientForm.company_name}
            onChange={(e) =>
              setClientForm({ ...clientForm, company_name: e.target.value })
            }
            placeholder={
              isNepali ? "जस्तै: श्रेष्ठ सुपरमार्ट" : "e.g. Shrestha Supermart"
            }
            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali
                ? "ग्राहक / व्यक्तिको नाम *"
                : "Client / Contact Name *"}
            </label>
            <input
              type="text"
              required
              value={clientForm.name}
              onChange={(e) =>
                setClientForm({ ...clientForm, name: e.target.value })
              }
              placeholder={
                isNepali ? "जस्तै: रमेश श्रेष्ठ" : "e.g. Ramesh Shrestha"
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "फोन / मोबाइल नम्बर *" : "Phone / Mobile Number *"}
            </label>
            <input
              type="tel"
              required
              value={clientForm.phone}
              onChange={(e) =>
                setClientForm({ ...clientForm, phone: e.target.value })
              }
              placeholder="98XXXXXXXX"
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "इमेल ठेगाना" : "Email Address"}
            </label>
            <input
              type="email"
              value={clientForm.email}
              onChange={(e) =>
                setClientForm({ ...clientForm, email: e.target.value })
              }
              placeholder="store@example.com"
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "पसलको प्रकार" : "Store / Business Type"}
            </label>
            <select
              value={clientForm.client_type}
              onChange={(e) =>
                setClientForm({ ...clientForm, client_type: e.target.value })
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {STORE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Password (for new clients) */}
        {!editingClient && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-neutral-300">
                {isNepali ? "ग्राहक लगइन पासवर्ड" : "Client Login Password"}
              </label>
              {!clientForm.password && (
                <span className="text-[10px] text-neutral-500">
                  {isNepali
                    ? "खाली: पूर्वनिर्धारित StockForge2026!"
                    : "Default: StockForge2026!"}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={clientForm.password}
                onChange={(e) =>
                  setClientForm({ ...clientForm, password: e.target.value })
                }
                placeholder={
                  isNepali
                    ? "पासवर्ड प्रविष्ट गर्नुहोस् (कम्तिमा ६ वर्ण)"
                    : "Enter password (min 6 characters)"
                }
                className="w-full pl-3 pr-10 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "ठेगाना / सहर" : "Store Address / City"}
            </label>
            <input
              type="text"
              value={clientForm.address}
              onChange={(e) =>
                setClientForm({ ...clientForm, address: e.target.value })
              }
              placeholder={
                isNepali
                  ? "जस्तै: नयाँ सडक, काठमाडौँ"
                  : "e.g. New Road, Kathmandu"
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "स्थायी लेखा नं (PAN / VAT)" : "PAN / VAT Number"}
            </label>
            <input
              type="text"
              value={clientForm.pan_number}
              onChange={(e) =>
                setClientForm({ ...clientForm, pan_number: e.target.value })
              }
              placeholder="60XXXXXXXX"
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* Subscription Section */}
        <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-neutral-200">
              {isNepali
                ? "सदस्यता योजना तथा अवधि"
                : "Subscription Plan & Duration"}
            </label>
            <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              {isNepali ? "लाइसेन्स व्यवस्थापन" : "License Config"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                {isNepali ? "सदस्यता योजना (Plan)" : "Subscription Plan"}
              </label>
              <select
                value={clientForm.plan || "trial"}
                onChange={(e) => {
                  const selectedPlan = e.target.value;
                  let defaultDuration = clientForm.durationDays || 14;
                  if (
                    selectedPlan === "trial" &&
                    (!clientForm.durationDays || clientForm.durationDays === 30)
                  ) {
                    defaultDuration = 14;
                  } else if (
                    selectedPlan !== "trial" &&
                    clientForm.durationDays === 14
                  ) {
                    defaultDuration = 30;
                  }
                  setClientForm({
                    ...clientForm,
                    plan: selectedPlan,
                    durationDays: defaultDuration,
                  });
                }}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="trial">
                  {isNepali
                    ? "परीक्षण (Trial Plan)"
                    : "Trial (14 Days Default)"}
                </option>
                <option value="starter">
                  {isNepali ? "स्टार्टर (Starter Plan)" : "Starter Plan"}
                </option>
                <option value="pro">
                  {isNepali ? "प्रो / स्ट्यान्डर्ड (Pro Plan)" : "Pro Plan"}
                </option>
                <option value="enterprise">
                  {isNepali
                    ? "इन्टरप्राइज (Enterprise Plan)"
                    : "Enterprise Plan"}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                {isNepali ? "योजना अवधि (दिनहरू)" : "Plan Duration (Days)"}
              </label>
              <input
                type="number"
                min="1"
                max="3650"
                required
                value={clientForm.durationDays || 14}
                onChange={(e) =>
                  setClientForm({
                    ...clientForm,
                    durationDays: Math.max(1, parseInt(e.target.value) || 1),
                  })
                }
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-emerald-500 font-mono"
                placeholder="e.g. 14, 30, 90, 365"
              />
            </div>
          </div>

          {/* Quick Duration Preset Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-neutral-500 mr-1">
              {isNepali ? "द्रुत अवधि:" : "Quick Presets:"}
            </span>
            {[
              { label: isNepali ? "१४ दिन" : "14 Days", days: 14 },
              { label: isNepali ? "३० दिन" : "30 Days", days: 30 },
              { label: isNepali ? "६० दिन" : "60 Days", days: 60 },
              {
                label: isNepali ? "९० दिन (३ महिना)" : "90 Days",
                days: 90,
              },
              {
                label: isNepali ? "१८० दिन (६ महिना)" : "180 Days",
                days: 180,
              },
              {
                label: isNepali ? "३६५ दिन (१ वर्ष)" : "365 Days (1 Yr)",
                days: 365,
              },
            ].map((preset) => {
              const isSelected = clientForm.durationDays === preset.days;
              return (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() =>
                    setClientForm({
                      ...clientForm,
                      durationDays: preset.days,
                    })
                  }
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-emerald-600 text-white font-bold"
                      : "bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "स्थिति" : "Account Status"}
            </label>
            <select
              value={clientForm.status}
              onChange={(e) =>
                setClientForm({ ...clientForm, status: e.target.value })
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "टिप्पणी / विवरण" : "Internal Notes"}
            </label>
            <input
              type="text"
              value={clientForm.notes}
              onChange={(e) =>
                setClientForm({ ...clientForm, notes: e.target.value })
              }
              placeholder={
                isNepali ? "विशेष सम्झौता वा नोट..." : "Special notes..."
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
          >
            {isNepali ? "रद्द गर्नुहोस्" : "Cancel"}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting
              ? isNepali
                ? "सुरक्षित गर्दै..."
                : "Saving..."
              : editingClient
                ? isNepali
                  ? "परिवर्तन सुरक्षित गर्नुहोस्"
                  : "Save Changes"
                : isNepali
                  ? "ग्राहक अनबोर्ड गर्नुहोस्"
                  : "Onboard Client"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
