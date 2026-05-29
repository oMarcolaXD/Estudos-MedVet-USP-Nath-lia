type SimbaMood = 'happy' | 'excited' | 'sad' | 'neutral';

interface SimbaProps {
  mood?: SimbaMood;
  size?: number;
  className?: string;
}

export default function Simba({ mood = 'happy', size = 120, className = '' }: SimbaProps) {
  const eyeColor = mood === 'sad' ? '#555' : '#2a6e00';
  const mouthPath =
    mood === 'happy' || mood === 'excited'
      ? 'M44,50 Q50,56 56,50'
      : mood === 'sad'
      ? 'M44,54 Q50,49 56,54'
      : 'M44,52 Q50,52 56,52';

  const tailPath =
    mood === 'excited'
      ? 'M82,85 Q102,65 96,48 Q90,35 80,48'
      : 'M82,88 Q100,75 96,58 Q92,45 80,58';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 110 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Tail */}
      <path
        d={tailPath}
        stroke="#D4853A"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Body */}
      <ellipse cx="52" cy="78" rx="28" ry="22" fill="#E8963F" />

      {/* Body stripes */}
      <path d="M38,70 Q52,67 66,70" stroke="#C67020" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M36,78 Q52,75 68,78" stroke="#C67020" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* Belly */}
      <ellipse cx="52" cy="80" rx="14" ry="12" fill="#F5C98A" />

      {/* Left paw */}
      <ellipse cx="30" cy="97" rx="9" ry="6" fill="#E8963F" />
      {/* Left paw toes */}
      <ellipse cx="25" cy="100" rx="3" ry="2" fill="#D4853A" />
      <ellipse cx="30" cy="101" rx="3" ry="2" fill="#D4853A" />
      <ellipse cx="35" cy="100" rx="3" ry="2" fill="#D4853A" />

      {/* Right paw */}
      <ellipse cx="74" cy="97" rx="9" ry="6" fill="#E8963F" />
      {/* Right paw toes */}
      <ellipse cx="69" cy="100" rx="3" ry="2" fill="#D4853A" />
      <ellipse cx="74" cy="101" rx="3" ry="2" fill="#D4853A" />
      <ellipse cx="79" cy="100" rx="3" ry="2" fill="#D4853A" />

      {/* Head */}
      <circle cx="52" cy="40" r="24" fill="#E8963F" />

      {/* Head stripes */}
      <path d="M44,18 Q52,15 60,18" stroke="#C67020" strokeWidth="2" fill="none" strokeLinecap="round" />
      <line x1="52" y1="14" x2="52" y2="20" stroke="#C67020" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="45" y1="15" x2="47" y2="21" stroke="#C67020" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="59" y1="15" x2="57" y2="21" stroke="#C67020" strokeWidth="1.5" strokeLinecap="round" />

      {/* Left ear */}
      <polygon points="30,22 22,5 42,18" fill="#E8963F" />
      <polygon points="30,20 25,9 38,17" fill="#F5A0A8" />

      {/* Right ear */}
      <polygon points="74,22 82,5 62,18" fill="#E8963F" />
      <polygon points="74,20 79,9 66,17" fill="#F5A0A8" />

      {/* Cheek blush */}
      <ellipse cx="35" cy="46" rx="6" ry="4" fill="#FFBFB0" opacity="0.5" />
      <ellipse cx="69" cy="46" rx="6" ry="4" fill="#FFBFB0" opacity="0.5" />

      {/* Eyes */}
      <ellipse cx="43" cy="39" rx="5.5" ry={mood === 'excited' ? 4 : 6} fill={eyeColor} />
      <ellipse cx="61" cy="39" rx="5.5" ry={mood === 'excited' ? 4 : 6} fill={eyeColor} />

      {/* Pupils */}
      <ellipse cx="43" cy="40" rx="2.8" ry={mood === 'excited' ? 2 : 3.5} fill="#111" />
      <ellipse cx="61" cy="40" rx="2.8" ry={mood === 'excited' ? 2 : 3.5} fill="#111" />

      {/* Eye shine */}
      <circle cx="44.5" cy="38" r="1.2" fill="white" />
      <circle cx="62.5" cy="38" r="1.2" fill="white" />

      {/* Nose */}
      <ellipse cx="52" cy="47" rx="3.5" ry="2.5" fill="#FF8C94" />

      {/* Mouth */}
      <path d={mouthPath} stroke="#7A3A00" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* Whiskers left */}
      <line x1="20" y1="45" x2="43" y2="47" stroke="#A0856A" strokeWidth="1" opacity="0.7" />
      <line x1="20" y1="49" x2="43" y2="49" stroke="#A0856A" strokeWidth="1" opacity="0.7" />
      <line x1="22" y1="53" x2="43" y2="51" stroke="#A0856A" strokeWidth="1" opacity="0.7" />

      {/* Whiskers right */}
      <line x1="84" y1="45" x2="61" y2="47" stroke="#A0856A" strokeWidth="1" opacity="0.7" />
      <line x1="84" y1="49" x2="61" y2="49" stroke="#A0856A" strokeWidth="1" opacity="0.7" />
      <line x1="82" y1="53" x2="61" y2="51" stroke="#A0856A" strokeWidth="1" opacity="0.7" />

      {/* Excited sparkles */}
      {mood === 'excited' && (
        <>
          <text x="88" y="25" fontSize="12" textAnchor="middle">✨</text>
          <text x="12" y="28" fontSize="10" textAnchor="middle">⭐</text>
        </>
      )}
    </svg>
  );
}
