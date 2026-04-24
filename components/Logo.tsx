export default function Logo({ width = 680 }: { width?: number }) {
  return (
    <svg width={width} viewBox="0 0 680 400" xmlns="http://www.w3.org/2000/svg">
      <path d="M200 60 L310 60 L310 210 Q310 260 255 285 Q200 260 200 210 Z" fill="#1a2e5e" />
      <path d="M209 72 L301 72 L301 208 Q301 250 255 272 Q209 250 209 208 Z" fill="#243d7a" />
      <line x1="222" y1="120" x2="288" y2="120" stroke="#4fa3e0" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="222" cy="120" r="4" fill="#4fa3e0" />
      <circle cx="255" cy="120" r="4" fill="#4fa3e0" />
      <circle cx="288" cy="120" r="4" fill="#4fa3e0" />
      <line x1="255" y1="120" x2="255" y2="148" stroke="#4fa3e0" strokeWidth="2" strokeLinecap="round" />
      <line x1="222" y1="148" x2="288" y2="148" stroke="#2ec4b6" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="222" cy="148" r="4" fill="#2ec4b6" />
      <circle cx="255" cy="148" r="4" fill="#2ec4b6" />
      <circle cx="288" cy="148" r="4" fill="#2ec4b6" />
      <line x1="222" y1="148" x2="222" y2="175" stroke="#2ec4b6" strokeWidth="2" strokeLinecap="round" />
      <line x1="288" y1="148" x2="288" y2="175" stroke="#4fa3e0" strokeWidth="2" strokeLinecap="round" />
      <line x1="222" y1="175" x2="288" y2="175" stroke="#f0a500" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="222" cy="175" r="4" fill="#f0a500" />
      <circle cx="255" cy="175" r="4" fill="#f0a500" />
      <circle cx="288" cy="175" r="4" fill="#f0a500" />
      <line x1="232" y1="113" x2="232" y2="127" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.25" />
      <line x1="278" y1="113" x2="278" y2="127" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.25" />
      <circle cx="255" cy="260" r="5" fill="#4fa3e0" />
      <rect x="231" y="73" width="48" height="20" rx="4" fill="#4fa3e0" opacity="0.85" />
      <text x="255" y="87" textAnchor="middle" fontFamily="'Segoe UI', sans-serif" fontSize="11" fontWeight="700" fill="#ffffff" letterSpacing="2">PHN</text>
      <text x="335" y="155" fontFamily="'Segoe UI', sans-serif" fontSize="38" fontWeight="700" fill="#1a2e5e">PHNIAMS</text>
      <text x="336" y="178" fontFamily="'Segoe UI', sans-serif" fontSize="13" fill="#4a6090">IT ASSET MANAGEMENT SYSTEM</text>
      <line x1="335" y1="188" x2="595" y2="188" stroke="#4fa3e0" strokeWidth="1.5" strokeLinecap="round" />
      <text x="336" y="204" fontFamily="'Segoe UI', sans-serif" fontSize="10.5" fill="#7a90b8">Manage · Track · Optimize</text>
    </svg>
  );
}
