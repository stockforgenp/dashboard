/**
 * Convert Lead to Client Form Modal
 * Converts an inbound retail inquiry / demo lead into an onboarded registered client account.
 */
import React, { useState, useEffect } from "react";
import { MessageSquare, Sparkles, Eye, EyeOff, RefreshCw, UserCheck } from "lucide-react";
import { Modal } from "../common/Modal.tsx";
import { useLanguage } from "../../context/LanguageContext.tsx";
import { useToast } from "../../context/ToastContext.tsx";
import {
  convertEnquiryToClient,
  Enquiry,
} from "../../lib/services/enquiryService.ts";
import { Client, CreateClientInput } from "../../lib/services/clientService.ts";
import { STORE_TYPES } from "./constants.ts";

export interface ConvertLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiry: Enquiry | null;
  onSuccess?: (result: { client: Client; enquiry: Enquiry }) => void;
}

export const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({
  isOpen,
  onClose,
  enquiry,
  onSuccess,
}) => {
  const { isNepali } = useLanguage();
  const { showToast } = useToast();

  const [showConvertPassword, setShowConvertPassword] = useState(false);
  const [isConvertingLoading, setIsConvertingLoading] = useState(false);
  const [convertForm, setConvertForm] = useState<CreateClientInput>({
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

  useEffect(() => {
    if (enquiry && isOpen) {
      setShowConvertPassword(false);
      setConvertForm({
        name: enquiry.full_name || "",
        company_name: enquiry.shop_name || "",
        email: enquiry.email || "",
        phone: enquiry.phone || "",
        password: "",
        client_type: enquiry.store_type || "Grocery & Supermarket",
        address: "",
        pan_number: "",
        status: "active",
        notes: `Converted from Lead/Enquiry ${enquiry.reference_id}.\nLead Message: ${enquiry.message}`,
        plan: "trial",
        durationDays: 14,
      });
    }
  }, [enquiry, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiry) return;

    if (!convertForm.email || !convertForm.email.includes("@")) {
      showToast(
        isNepali
          ? "कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस्"
          : "Please enter a valid email address",
        "error",
      );
      return;
    }

    if (convertForm.password && convertForm.password.length < 6) {
      showToast(
        isNepali
          ? "पासवर्ड कम्तिमा ६ वर्णको हुनुपर्दछ"
          : "Password must be at least 6 characters long",
        "error",
      );
      return;
    }

    setIsConvertingLoading(true);
    try {
      const res = await convertEnquiryToClient(enquiry.id, convertForm);
      showToast(
        isNepali
          ? `सफल! ${res.client.name} दर्ता भएका ग्राहकमा रूपान्तरण भयो`
          : `Converted! ${res.client.name} is now a registered client`,
        "success",
      );
      onSuccess?.(res);
      onClose();
    } catch (err: unknown) {
      showToast((err as Error).message || "Failed to convert enquiry", "error");
    } finally {
      setIsConvertingLoading(false);
    }
  };

  if (!enquiry) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isConvertingLoading) {
          onClose();
        }
      }}
      title={
        isNepali
          ? "ग्राहकमा रूपान्तरण र दर्ता गर्नुहोस्"
          : "Convert Enquiry & Register Client"
      }
      subtitle={
        isNepali
          ? "सोधपुछको सम्पूर्ण विवरण समीक्षा गर्नुहोस् र ठेगाना तथा पासवर्ड जस्ता छुटेका जानकारी भर्नुहोस्"
          : "Review lead details and provide missing information such as address and password"
      }
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Lead Summary Overview Banner */}
        <div className="p-3.5 bg-neutral-900/90 rounded-xl border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              {enquiry.reference_id}
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {enquiry.inquiry_type}
            </span>
          </div>
          {enquiry.message && (
            <div className="text-[11px] text-neutral-400 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80 leading-relaxed max-h-24 overflow-y-auto">
              <span className="text-neutral-500 font-medium block text-[10px] mb-0.5 uppercase tracking-wider">
                {isNepali ? "सोधपुछ सन्देश:" : "Inquiry Message:"}
              </span>
              {enquiry.message}
            </div>
          )}
        </div>

        {/* Store Name & Contact Person */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "पसल / फर्मको नाम" : "Business / Store Name"}
            </label>
            <input
              type="text"
              value={convertForm.company_name}
              onChange={(e) =>
                setConvertForm({
                  ...convertForm,
                  company_name: e.target.value,
                })
              }
              placeholder={
                isNepali
                  ? "जस्तै: श्रेष्ठ सुपरमार्ट"
                  : "e.g. Shrestha Supermart"
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali
                ? "ग्राहक / सम्पर्क व्यक्तिको नाम *"
                : "Client / Owner Name *"}
            </label>
            <input
              type="text"
              required
              value={convertForm.name}
              onChange={(e) =>
                setConvertForm({ ...convertForm, name: e.target.value })
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "इमेल ठेगाना *" : "Email Address *"}
            </label>
            <input
              type="email"
              required
              value={convertForm.email}
              onChange={(e) =>
                setConvertForm({ ...convertForm, email: e.target.value })
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali
                ? "सम्पर्क फोन / मोबाइल *"
                : "Phone / Mobile Number *"}
            </label>
            <input
              type="tel"
              required
              value={convertForm.phone}
              onChange={(e) =>
                setConvertForm({ ...convertForm, phone: e.target.value })
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* Missing Information Highlight: Address & Password */}
        <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-neutral-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {isNepali
                ? "थप आवश्यक विवरण (ठेगाना तथा पासवर्ड)"
                : "Missing Information (Address & Password)"}
            </label>
            <span className="text-[10px] text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              {isNepali ? "अत्यावश्यक" : "Required for Login"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                {isNepali
                  ? "पसलको ठेगाना / स्थान *"
                  : "Store Address / Location *"}
              </label>
              <input
                type="text"
                value={convertForm.address || ""}
                onChange={(e) =>
                  setConvertForm({ ...convertForm, address: e.target.value })
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-medium text-neutral-300">
                  {isNepali
                    ? "ग्राहक लगइन पासवर्ड *"
                    : "Client Login Password *"}
                </label>
                {!convertForm.password && (
                  <span className="text-[10px] text-neutral-500">
                    {isNepali
                      ? "खाली: StockForge2026!"
                      : "Default: StockForge2026!"}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showConvertPassword ? "text" : "password"}
                  value={convertForm.password || ""}
                  onChange={(e) =>
                    setConvertForm({
                      ...convertForm,
                      password: e.target.value,
                    })
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
                  onClick={() => setShowConvertPassword(!showConvertPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                  title={
                    showConvertPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConvertPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Store Type & PAN / VAT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "पसल / ग्राहक प्रकार" : "Retail Store Type"}
            </label>
            <select
              value={convertForm.client_type}
              onChange={(e) =>
                setConvertForm({
                  ...convertForm,
                  client_type: e.target.value,
                })
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

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "स्थायी लेखा नं (PAN / VAT)" : "PAN / VAT Number"}
            </label>
            <input
              type="text"
              value={convertForm.pan_number || ""}
              onChange={(e) =>
                setConvertForm({
                  ...convertForm,
                  pan_number: e.target.value,
                })
              }
              placeholder="60XXXXXXXX"
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* Subscription Plan & Duration */}
        <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-neutral-200">
              {isNepali
                ? "सदस्यता योजना तथा अवधि"
                : "Subscription Plan & Duration"}
            </label>
            <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              {isNepali ? "ग्राहक सदस्यता" : "Client Subscription"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                {isNepali ? "सदस्यता योजना (Plan)" : "Subscription Plan"}
              </label>
              <select
                value={convertForm.plan || "trial"}
                onChange={(e) => {
                  const selectedPlan = e.target.value;
                  let defaultDuration = convertForm.durationDays || 14;
                  if (
                    selectedPlan === "trial" &&
                    (!convertForm.durationDays ||
                      convertForm.durationDays === 30)
                  ) {
                    defaultDuration = 14;
                  } else if (
                    selectedPlan !== "trial" &&
                    convertForm.durationDays === 14
                  ) {
                    defaultDuration = 30;
                  }
                  setConvertForm({
                    ...convertForm,
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
                value={convertForm.durationDays || 14}
                onChange={(e) =>
                  setConvertForm({
                    ...convertForm,
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
              const isSelected = convertForm.durationDays === preset.days;
              return (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() =>
                    setConvertForm({
                      ...convertForm,
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

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1">
            {isNepali
              ? "टिप्पणी तथा नोटहरू"
              : "Internal Notes & Conversion Details"}
          </label>
          <textarea
            rows={2}
            value={convertForm.notes}
            onChange={(e) =>
              setConvertForm({ ...convertForm, notes: e.target.value })
            }
            placeholder={
              isNepali
                ? "सोधपुछ सम्बन्धी अतिरिक्त नोटहरू..."
                : "Notes regarding this conversion..."
            }
            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
          <button
            type="button"
            disabled={isConvertingLoading}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {isNepali ? "रद्द गर्नुहोस्" : "Cancel"}
          </button>
          <button
            type="submit"
            disabled={isConvertingLoading}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {isConvertingLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>
                  {isNepali ? "दर्ता गर्दै..." : "Registering Client..."}
                </span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                <span>
                  {isNepali
                    ? "ग्राहक दर्ता सम्पन्न गर्नुहोस्"
                    : "Complete Client Registration"}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
