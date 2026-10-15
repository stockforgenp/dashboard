/**
 * Clients & Enquiries View (Legacy Wrapper)
 * @deprecated Clients and Enquiries have been separated into dedicated pages:
 * - ClientsView (`/clients`)
 * - EnquiriesView (`/enquiries`)
 */
import React from "react";
import { ClientsView } from "./ClientsView.tsx";
import { EnquiriesView } from "./EnquiriesView.tsx";

interface ClientsEnquiriesViewProps {
  initialTab?: "clients" | "enquiries";
}

export const ClientsEnquiriesView: React.FC<ClientsEnquiriesViewProps> = ({
  initialTab = "clients",
}) => {
  return initialTab === "enquiries" ? <EnquiriesView /> : <ClientsView />;
};

export default ClientsEnquiriesView;
