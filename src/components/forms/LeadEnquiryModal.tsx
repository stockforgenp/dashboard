/**
 * Lead Enquiry Form Modal
 * Used for logging walk-in, phone-in, or inbound customer enquiries & demo leads.
 */
import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal.tsx";
import { useLanguage } from "../../context/LanguageContext.tsx";
import { useToast } from "../../context/ToastContext.tsx";
import {
  createEnquiry,
  Enquiry,
  CreateEnquiryInput,
  EnquiryStatus,
} from "../../lib/services/enquiryService.ts";
import { STORE_TYPES, INQUIRY_TYPE_LABELS } from "./constants.ts";

export interface LeadEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newEnquiry?: Enquiry) => void;
}

export const LeadEnquiryModal: React.FC<LeadEnquiryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { isNepali } = useLanguage();
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState<CreateEnquiryInput>({
    full_name: "",
    shop_name: "",
    email: "",
    phone: "",
    store_type: "Grocery & Supermarket",
    inquiry_type: "on_site_demo",
    subject: "",
    message: "",
    status: "new",
    notes: "",
  });

  useEffect(() => {
    if (isOpen) {
      setEnquiryForm({
        full_name: "",
        shop_name: "",
        email: "",
        phone: "",
        store_type: "Grocery & Supermarket",
        inquiry_type: "on_site_demo",
        subject: "",
        message: "",
        status: "new",
        notes: "",
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryForm.full_name.trim()) {
      showToast(
        isNepali
          ? "कृपया सोधपुछकर्ताको नाम प्रविष्ट गर्नुहोस्"
          : "Please enter inquirer name",
        "error",
      );
      return;
    }
    if (!enquiryForm.phone.trim()) {
      showToast(
        isNepali
          ? "कृपया सम्पर्क नम्बर प्रविष्ट गर्नुहोस्"
          : "Please enter phone number",
        "error",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createEnquiry(enquiryForm);
      showToast(
        isNepali
          ? "सोधपुछ सफलतापूर्वक दर्ता गरियो"
          : "Enquiry logged successfully",
        "success",
      );
      onSuccess?.(created);
      onClose();
    } catch (err: unknown) {
      showToast((err as Error).message || "Failed to log enquiry", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isNepali ? "नयाँ सोधपुछ तथा लिड दर्ता" : "Log New Customer Enquiry & Lead"
      }
      subtitle={
        isNepali
          ? "काउन्टर, फोन वा इमेलबाट आएको पसल सोधपुछ तथा डेमो अनुरोध अभिलेख गर्नुहोस्"
          : "Record walk-in, phone-in, or inbound store inquiry & demo request"
      }
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "सोधपुछकर्ताको नाम *" : "Inquirer Full Name *"}
            </label>
            <input
              type="text"
              required
              value={enquiryForm.full_name}
              onChange={(e) =>
                setEnquiryForm({ ...enquiryForm, full_name: e.target.value })
              }
              placeholder={
                isNepali ? "जस्तै: कृष्ण पौडेल" : "e.g. Krishna Poudel"
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "पसल / व्यवसायको नाम" : "Store / Business Name"}
            </label>
            <input
              type="text"
              value={enquiryForm.shop_name}
              onChange={(e) =>
                setEnquiryForm({ ...enquiryForm, shop_name: e.target.value })
              }
              placeholder={
                isNepali
                  ? "जस्तै: पोखरा डिपार्टमेन्टल स्टोर"
                  : "e.g. Pokhara Departmental Store"
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "सम्पर्क फोन / मोबाइल *" : "Phone Number *"}
            </label>
            <input
              type="tel"
              required
              value={enquiryForm.phone}
              onChange={(e) =>
                setEnquiryForm({ ...enquiryForm, phone: e.target.value })
              }
              placeholder="98XXXXXXXX"
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "इमेल ठेगाना" : "Email Address"}
            </label>
            <input
              type="email"
              value={enquiryForm.email}
              onChange={(e) =>
                setEnquiryForm({ ...enquiryForm, email: e.target.value })
              }
              placeholder="inquiry@store.com.np"
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "सोधपुछको प्रकार" : "Inquiry Category"}
            </label>
            <select
              value={enquiryForm.inquiry_type}
              onChange={(e) =>
                setEnquiryForm({
                  ...enquiryForm,
                  inquiry_type: e.target.value as any,
                })
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              {Object.entries(INQUIRY_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {isNepali ? label.np : label.en}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "पसलको प्रकार" : "Store Type"}
            </label>
            <select
              value={enquiryForm.store_type}
              onChange={(e) =>
                setEnquiryForm({ ...enquiryForm, store_type: e.target.value })
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              {STORE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1">
            {isNepali ? "विषय" : "Subject"}
          </label>
          <input
            type="text"
            value={enquiryForm.subject}
            onChange={(e) =>
              setEnquiryForm({ ...enquiryForm, subject: e.target.value })
            }
            placeholder={
              isNepali
                ? "जस्तै: नयाँ किराना पसलको लागि अन-साइट डेमो चाहिएको"
                : "e.g. Need on-site demo for a new grocery store setup"
            }
            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1">
            {isNepali ? "सोधपुछ सन्देश / प्रश्नहरू *" : "Message / Inquiry Details *"}
          </label>
          <textarea
            required
            rows={3}
            value={enquiryForm.message}
            onChange={(e) =>
              setEnquiryForm({ ...enquiryForm, message: e.target.value })
            }
            placeholder={
              isNepali
                ? "ग्राहकको आवश्यकता र अनुरोधहरूको विस्तृत विवरण..."
                : "Describe client requirements, counter count, demo timeline, etc..."
            }
            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "प्रारम्भिक स्थिति" : "Initial Status"}
            </label>
            <select
              value={enquiryForm.status}
              onChange={(e) =>
                setEnquiryForm({
                  ...enquiryForm,
                  status: e.target.value as EnquiryStatus,
                })
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="new">{isNepali ? "नयाँ" : "New"}</option>
              <option value="contacted">
                {isNepali ? "सम्पर्क गरिएको" : "Contacted"}
              </option>
              <option value="in_progress">
                {isNepali ? "प्रक्रियामा" : "In Progress"}
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "आन्तरिक टिप्पणी" : "Staff Internal Notes"}
            </label>
            <input
              type="text"
              value={enquiryForm.notes}
              onChange={(e) =>
                setEnquiryForm({ ...enquiryForm, notes: e.target.value })
              }
              placeholder={
                isNepali
                  ? "काउन्टरमा आएका / फोनमा कुरा भएका टिप्पणी..."
                  : "Notes from phone call..."
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500"
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
            className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting
              ? isNepali
                ? "दर्ता गर्दै..."
                : "Logging..."
              : isNepali
                ? "सोधपुछ दर्ता गर्नुहोस्"
                : "Log Enquiry"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

