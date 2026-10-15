/**
 * Client Review Form Modal
 * Used for logging verified customer happiness reviews and store ratings.
 */
import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Modal } from "../common/Modal.tsx";
import { useLanguage } from "../../context/LanguageContext.tsx";
import { useToast } from "../../context/ToastContext.tsx";
import {
  createClientReview,
  ClientReview,
  CreateClientReviewInput,
} from "../../lib/services/reviewService.ts";
import { Client } from "../../lib/services/clientService.ts";

export interface ClientReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients?: Client[];
  prefillClient?: Client | null;
  onSuccess?: (newReview?: ClientReview) => void;
}

export const ClientReviewModal: React.FC<ClientReviewModalProps> = ({
  isOpen,
  onClose,
  clients = [],
  prefillClient = null,
  onSuccess,
}) => {
  const { isNepali } = useLanguage();
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<CreateClientReviewInput>({
    client_name: "",
    shop_name: "",
    location: "",
    rating: 5,
    review_text: "",
    client_id: null,
  });

  useEffect(() => {
    if (isOpen) {
      if (prefillClient) {
        setForm({
          client_name: prefillClient.name,
          shop_name: prefillClient.company_name || "",
          location: prefillClient.address || "",
          rating: 5,
          review_text: "",
          client_id: String(prefillClient.id),
        });
      } else {
        setForm({
          client_name: "",
          shop_name: "",
          location: "",
          rating: 5,
          review_text: "",
          client_id: null,
        });
      }
    }
  }, [isOpen, prefillClient]);

  const handleClientSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setForm((prev) => ({ ...prev, client_id: null }));
      return;
    }
    const found = clients.find((c) => String(c.id) === selectedId);
    if (found) {
      setForm((prev) => ({
        ...prev,
        client_name: found.name,
        shop_name: found.company_name || "",
        location: found.address || "",
        client_id: String(found.id),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_name.trim()) {
      showToast(
        isNepali
          ? "कृपया ग्राहक वा पसलको नाम प्रविष्ट गर्नुहोस्"
          : "Please enter client or store name",
        "warning",
      );
      return;
    }
    if (!form.review_text.trim()) {
      showToast(
        isNepali
          ? "कृपया ग्राहकको प्रतिक्रिया वा समीक्षा प्रविष्ट गर्नुहोस्"
          : "Please enter review feedback",
        "warning",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createClientReview(form);
      showToast(
        isNepali
          ? "ग्राहक समीक्षा सफलतापूर्वक सुरक्षित गरियो"
          : "Client review saved successfully",
        "success",
      );
      onSuccess?.(created);
      onClose();
    } catch (err: unknown) {
      showToast((err as Error).message || "Failed to save review", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isNepali
          ? "सन्तुष्ट ग्राहकको समीक्षा थप्नुहोस्"
          : "Add Happy Client Review"
      }
      subtitle={
        isNepali
          ? "आन्तरिक ड्यासबोर्डमा सुरक्षित गरिन्छ (सार्वजनिक वेबसाइटमा देखिँदैन)"
          : "Private internal dashboard record (not displayed on public website)"
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick select from existing registered clients */}
        {clients.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              {isNepali
                ? "दर्ता भएका ग्राहकबाट छान्नुहोस् (वैकल्पिक)"
                : "Select Registered Client (Optional)"}
            </label>
            <select
              value={form.client_id || ""}
              onChange={handleClientSelectChange}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="">
                {isNepali
                  ? "-- नयाँ वा बाहिरी ग्राहक लेख्नुहोस् --"
                  : "-- Type manually or pick registered store --"}
              </option>
              {clients.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name} {c.company_name ? `(${c.company_name})` : ""} -{" "}
                  {c.phone}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Client Name */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            {isNepali ? "ग्राहकको नाम *" : "Client / Storekeeper Name *"}
          </label>
          <input
            type="text"
            required
            value={form.client_name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, client_name: e.target.value }))
            }
            placeholder={
              isNepali ? "जस्तै: रमेश श्रेष्ठ" : "e.g. Ramesh Shrestha"
            }
            className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Shop Name & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              {isNepali ? "पसल / मार्टको नाम" : "Store / Mart Name"}
            </label>
            <input
              type="text"
              value={form.shop_name || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, shop_name: e.target.value }))
              }
              placeholder={
                isNepali
                  ? "जस्तै: न्यूरोड किराना भण्डार"
                  : "e.g. New Road Mart"
              }
              className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-200 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              {isNepali ? "ठेगाना / सहर" : "Location / City"}
            </label>
            <input
              type="text"
              value={form.location || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder={isNepali ? "जस्तै: काठमाडौँ" : "e.g. Kathmandu"}
              className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Rating selector */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            {isNepali
              ? "सन्तुष्टि मूल्याङ्कन (Rating) *"
              : "Satisfaction Rating *"}
          </label>
          <div className="flex items-center gap-2 py-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setForm((prev) => ({ ...prev, rating: star }))}
                className="p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= form.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-neutral-700"
                  }`}
                />
              </button>
            ))}
            <span className="text-xs font-bold text-amber-400 ml-2">
              {form.rating} {isNepali ? "तारा" : "Stars"}
            </span>
          </div>
        </div>

        {/* Review text */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            {isNepali
              ? "ग्राहकको प्रतिक्रिया / अनुभव *"
              : "Review Feedback / Experience *"}
          </label>
          <textarea
            required
            rows={4}
            value={form.review_text}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, review_text: e.target.value }))
            }
            placeholder={
              isNepali
                ? "ग्राहकको अनुभव यहाँ लेख्नुहोस् (जस्तै: अफलाइन बिलिङ र प्रिन्टर एकदमै छिटो चल्यो...)"
                : "Write their feedback here (e.g. Offline billing is very fast, printer prints receipts seamlessly...)"
            }
            className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
          >
            {isNepali ? "रद्द गर्नुहोस्" : "Cancel"}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSubmitting
              ? isNepali
                ? "सुरक्षित गर्दै..."
                : "Saving..."
              : isNepali
                ? "समीक्षा सुरक्षित गर्नुहोस्"
                : "Save Review"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

