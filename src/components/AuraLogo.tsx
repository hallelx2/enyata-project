export function AuraLogo({
  className = "w-8 h-8",
  withText = false,
  textClassName = "text-2xl",
}: {
  className?: string;
  withText?: boolean;
  textClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient
            id="auraGradient"
            x1="0"
            y1="0"
            x2="100"
            y2="100"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#003ec7" />
            <stop offset="1" stopColor="#0052ff" />
          </linearGradient>
          <linearGradient
            id="shieldGradient"
            x1="50"
            y1="0"
            x2="50"
            y2="100"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#40dbdc" />
            <stop offset="1" stopColor="#65f7f9" />
          </linearGradient>
        </defs>

        {/* The Aura / Escrow Ring representing the continuous payment & data loop */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="url(#auraGradient)"
          strokeWidth="10"
          strokeDasharray="200 80"
          strokeLinecap="round"
          className="origin-center -rotate-45"
        />

        {/* The Shield representing Escrow and Security */}
        <path
          d="M50 20 L75 30 V50 C75 70 50 85 50 85 C50 85 25 70 25 50 V30 L50 20 Z"
          fill="url(#shieldGradient)"
          opacity="0.9"
        />

        {/* The Medical Cross representing Clinical Readiness in the negative space */}
        <path
          d="M46 40 H54 V46 H60 V54 H54 V60 H46 V54 H40 V46 H46 V40 Z"
          fill="#ffffff"
        />
      </svg>
      {withText && (
        <span
          className={`font-extrabold text-primary tracking-tight font-headline ${textClassName}`}
        >
          AuraHealth
        </span>
      )}
    </div>
  );
}
