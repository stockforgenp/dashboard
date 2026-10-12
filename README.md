# StockForge - Super Admin Console

The centralized management console for StockForge Super Administrators to manage clients, enterprise POS licenses, subscription histories, inbound sales inquiries, and client feedback.

## Features

- **Executive Analytics**: Real-time breakdown of MRR, active clients, license statuses, and revenue trends.
- **Client & License Lifecycle**: Create, view, suspend, or renew client software subscriptions and device limits.
- **Inbound Enquiries**: Process and manage demo requests and contact inquiries submitted via the platform.
- **Verified Client Reviews**: Review, curate, and moderate client satisfaction ratings and testimonials.
- **Security & RBAC**: Direct integration with StockForge Backend REST APIs protected by JWT and Firebase Auth.

## Getting Started

### Prerequisites
- Node.js (v18+)
- StockForge Backend API running (default: `http://localhost:5000`)

### Installation & Development
```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

### Production Build
```bash
npm run build
```
