export function StudioArt() {
  return (
    <svg
      className="studio-art"
      viewBox="0 0 560 400"
      role="img"
      aria-label="阳光下的原声吉他、钢琴与绿植插画"
    >
      <defs>
        <linearGradient id="wood" x2="1" y2="1">
          <stop stopColor="#eac493" />
          <stop offset="1" stopColor="#b98252" />
        </linearGradient>
        <linearGradient id="piano-case" x2="0" y2="1">
          <stop stopColor="#405b54" />
          <stop offset="1" stopColor="#203e38" />
        </linearGradient>
      </defs>
      <path d="M74 328V130a178 178 0 0 1 356 0v198" fill="#d9e7db" />
      <circle cx="339" cy="107" r="55" fill="#f5dbad" />
      <path d="M75 258q80-80 180-25t175-26v121H75" fill="#bbd1bf" />
      <path d="M40 335h465" stroke="#829f89" strokeWidth="2" />
      <g transform="translate(302 167) rotate(14)">
        <path
          d="M-32 30C-77 6-107 51-91 86c12 22-19 30-24 58-13 64 100 95 120 35 11-34-13-51-8-73 10-39-4-60-29-76Z"
          fill="url(#wood)"
          stroke="#a97950"
          strokeWidth="3"
        />
        <circle
          cx="-49"
          cy="111"
          r="25"
          fill="#75543b"
          stroke="#f5dec0"
          strokeWidth="6"
        />
        <circle cx="-49" cy="111" r="19" fill="#2c302b" />
        <path d="M-58-126h18l-1 228h-19Z" fill="#5c4a39" />
        <path d="M-60-157h26l-6 43h-19Z" fill="#b88454" />
        {[-144, -133, -122].map((y) => (
          <g key={y}>
            <circle cx="-64" cy={y} r="4" fill="#d6d8cf" />
            <circle cx="-32" cy={y} r="4" fill="#d6d8cf" />
          </g>
        ))}
        <rect x="-72" y="157" width="45" height="9" rx="3" fill="#574535" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={i}
            d={`M${-57 + i * 2.7} -143 L${-57 + i * 2.7} 162`}
            stroke="#f4e5c9"
            strokeWidth=".8"
            opacity=".8"
          />
        ))}
        {[-90, -66, -44, -24, -6, 10, 25, 39, 52, 64, 75, 85].map((y) => (
          <path key={y} d={`M-59 ${y}h18`} stroke="#baa98b" strokeWidth="1" />
        ))}
      </g>
      <g transform="translate(74 267) rotate(-7)">
        <rect width="220" height="90" rx="12" fill="url(#piano-case)" />
        <rect x="11" y="24" width="198" height="54" rx="3" fill="#faf4e7" />
        {Array.from({ length: 13 }, (_, i) => (
          <path key={i} d={`M${25 + i * 14} 24v54`} stroke="#b7bbaf" />
        ))}
        {[0, 1, 3, 4, 5, 7, 8, 10, 11, 12].map((i) => (
          <rect
            key={i}
            x={21 + i * 14}
            y="24"
            width="8"
            height="32"
            rx="1.5"
            fill="#253a34"
          />
        ))}
        <circle cx="15" cy="12" r="3" fill="#dec08f" />
        <path d="M173 12h25" stroke="#a9c1ac" strokeWidth="2" />
      </g>
      <g transform="translate(436 276)">
        <path d="M-16 37h39l-6 35H-9Z" fill="#d5a680" />
        <path
          d="M3 40V-44M4 16l23-30M3 0l-25-25"
          stroke="#577e66"
          strokeWidth="3"
        />
        <ellipse
          cx="-10"
          cy="-24"
          rx="9"
          ry="22"
          transform="rotate(-40 -10 -24)"
          fill="#709b7f"
        />
        <ellipse
          cx="20"
          cy="-17"
          rx="9"
          ry="23"
          transform="rotate(35 20 -17)"
          fill="#4d7b61"
        />
        <ellipse cx="3" cy="-49" rx="9" ry="20" fill="#95b294" />
      </g>
      <g fill="#668674">
        <circle cx="123" cy="126" r="5" />
        <path
          d="M127 126V99l24-5v26"
          fill="none"
          stroke="#668674"
          strokeWidth="3"
        />
        <circle cx="147" cy="120" r="5" />
      </g>
      <path
        d="M451 86v18m-9-9h18M66 201v12m-6-6h12"
        stroke="#91aa8e"
        strokeWidth="2"
      />
    </svg>
  );
}
