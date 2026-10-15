/**
 * Shared Form Constants for StockForge CRM Hub
 */

export const STORE_TYPES = [
  "Grocery & Supermarket",
  "Grocery Mart",
  "Supermarket",
  "Hardware & Construction",
  "Hardware Store",
  "Dairy, Oils & Liquids",
  "Electronics & Mobile",
  "Pharmacy & Health",
  "Clothing & Boutique",
  "Wholesale Dealer",
  "Other",
] as const;

export const INQUIRY_TYPE_LABELS: Record<string, { en: string; np: string }> = {
  on_site_demo: { en: "On-Site Demo Request", np: "अन-साइट डेमो अनुरोध" },
  vat_compliance: { en: "Invoicing & Tax Setup", np: "बिलिङ तथा कर प्रणाली" },
  hardware_pairing: {
    en: "Hardware / Printer Pairing",
    np: "प्रिन्टर तथा हार्डवेयर",
  },
  multi_unit_help: {
    en: "Multi-Unit Inventory Guidance",
    np: "एकाइ तथा मौज्दात सहयोग",
  },
  wholesale_deployment: {
    en: "Enterprise / Multi-Counter",
    np: "बहु-काउन्टर प्रणाली",
  },
  general_support: { en: "General Support Inquiry", np: "सामान्य सोधपुछ" },
};

