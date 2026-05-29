type SimbaMood = 'happy' | 'excited' | 'sad' | 'neutral';

interface SimbaProps {
  mood?: SimbaMood;
  size?: number;
  className?: string;
}

const moodFilter: Record<SimbaMood, string> = {
  happy:   'none',
  excited: 'brightness(1.1) saturate(1.3)',
  sad:     'grayscale(0.4) brightness(0.85)',
  neutral: 'none',
};

export default function Simba({ mood = 'happy', size = 120, className = '' }: SimbaProps) {
  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      <img
        src="/simba-mascot.png"
        alt="Simba"
        width={size}
        height={size}
        style={{ filter: moodFilter[mood], transition: 'filter 0.3s ease' }}
        draggable={false}
      />
      {mood === 'excited' && (
        <span
          className="absolute -top-1 -right-1 text-lg select-none"
          style={{ fontSize: size * 0.2 }}
        >
          ✨
        </span>
      )}
      {mood === 'sad' && (
        <span
          className="absolute bottom-1 right-1 text-lg select-none"
          style={{ fontSize: size * 0.18 }}
        >
          😢
        </span>
      )}
    </div>
  );
}
