import { useState } from 'react';

const categoryConfig = {
  'Antibiotics': { gradient: ['#ef4444', '#f97316'], icon: '💊' },
  'Pain Relief': { gradient: ['#3b82f6', '#6366f1'], icon: '🩹' },
  'Cardiovascular': { gradient: ['#ec4899', '#f43f5e'], icon: '❤️' },
  'Diabetes': { gradient: ['#8b5cf6', '#a855f7'], icon: '💉' },
  'Vitamins': { gradient: ['#22c55e', '#10b981'], icon: '🍊' },
  'Respiratory': { gradient: ['#06b6d4', '#0ea5e9'], icon: '🫁' },
  'Gastrointestinal': { gradient: ['#f59e0b', '#eab308'], icon: '🧬' },
  'Dermatology': { gradient: ['#d946ef', '#c026d3'], icon: '🧴' },
};

function GradientFallback({ medicine, size, s, config }) {
  const formIcons = {
    'Tablet': '💊', 'Capsule': '💊', 'Syrup': '🧪', 'Injection': '💉', 'Cream': '🧴',
  };
  const formIcon = formIcons[medicine.form] || '💊';

  return (
    <>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.1,
        background: `radial-gradient(circle at 20% 80%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)`,
      }} />
      <div style={{
        position: 'absolute', top: size === 'sm' ? 6 : 12, left: size === 'sm' ? 6 : 12,
        fontSize: s.iconSize, opacity: 0.8,
      }}>{formIcon}</div>
      <div style={{
        fontSize: s.fontSize, lineHeight: 1, marginBottom: size === 'sm' ? 2 : 8,
        textShadow: '0 2px 8px rgba(0,0,0,0.2)', position: 'relative', zIndex: 1,
      }}>{config.icon}</div>
      <div style={{
        color: 'white', fontWeight: 800,
        fontSize: size === 'lg' ? '1.1rem' : size === 'sm' ? '0.65rem' : '0.8rem',
        textAlign: 'center', padding: '0 8px', position: 'relative', zIndex: 1,
        textShadow: '0 1px 3px rgba(0,0,0,0.3)', maxWidth: '90%',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{medicine.brandName}</div>
      {size !== 'sm' && (
        <div style={{
          color: 'rgba(255,255,255,0.7)', fontSize: s.nameSize, fontWeight: 500,
          position: 'relative', zIndex: 1, marginTop: 2,
        }}>{medicine.strength} · {medicine.form}</div>
      )}
    </>
  );
}

export default function MedicineImage({ medicine, size = 'md', className = '' }) {
  const [imgError, setImgError] = useState(false);
  const config = categoryConfig[medicine.category] || { gradient: ['#64748b', '#475569'], icon: '💊' };
  const hasImage = medicine.image && !imgError;

  const sizes = {
    sm: { height: 80, fontSize: '1.5rem', iconSize: '1rem', nameSize: '0.6rem' },
    md: { height: 180, fontSize: '3rem', iconSize: '1.5rem', nameSize: '0.75rem' },
    lg: { height: 300, fontSize: '5rem', iconSize: '2rem', nameSize: '0.9rem' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div
      className={className}
      style={{
        height: s.height,
        background: hasImage ? '#f8fafc' : `linear-gradient(135deg, ${config.gradient[0]}, ${config.gradient[1]})`,
        borderRadius: size === 'lg' ? 16 : size === 'sm' ? 8 : 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {hasImage ? (
        <img
          src={medicine.image}
          alt={medicine.brandName}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: size === 'sm' ? 4 : size === 'lg' ? 12 : 8,
          }}
        />
      ) : (
        <GradientFallback medicine={medicine} size={size} s={s} config={config} />
      )}

      {/* Prescription badge */}
      {medicine.requiresPrescription && (
        <div style={{
          position: 'absolute',
          top: size === 'sm' ? 6 : 12,
          right: size === 'sm' ? 6 : 12,
          background: hasImage ? 'rgba(239,68,68,0.9)' : 'rgba(0,0,0,0.5)',
          color: 'white',
          padding: size === 'sm' ? '2px 6px' : '4px 10px',
          borderRadius: 999,
          fontSize: size === 'sm' ? '0.55rem' : '0.7rem',
          fontWeight: 600,
          backdropFilter: 'blur(4px)',
        }}>
          Rx
        </div>
      )}
    </div>
  );
}
