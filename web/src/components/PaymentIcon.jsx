// Simple generic line-art glyphs (not brand logos) - kept monochrome so the
// payment selector stays inside the app's single accent-color theme.

function Card() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <line x1="2" y1="9.5" x2="22" y2="9.5" />
      <rect x="5" y="13" width="4" height="2.5" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Phone() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="7" y="2" width="10" height="20" rx="2.5" />
      <line x1="10" y1="18" x2="14" y2="18" />
      <path d="M4 9c1.6-1.6 3.8-1.6 5.4 0" strokeLinecap="round" />
      <path d="M2 6.5c2.8-2.8 6.7-2.8 9.5 0" strokeLinecap="round" />
    </svg>
  );
}

function Wallet() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path d="M16 11h3v3h-3a1.5 1.5 0 0 1 0-3Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Cash() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <line x1="5" y1="9" x2="5" y2="9" strokeLinecap="round" />
      <line x1="19" y1="15" x2="19" y2="15" strokeLinecap="round" />
    </svg>
  );
}

const ICONS = {
  CARD: Card,
  APPLE_PAY: Phone,
  GOOGLE_PAY: Phone,
  PAYPAL: Wallet,
  COD: Cash
};

export default function PaymentIcon({ type }) {
  const Icon = ICONS[type] || Card;
  return <Icon />;
}
