import React from 'react';

export default function Logo({ 
  dark = false, 
  size = "md", 
  withText = true, 
  withSubtext = false, 
  withDivider = false,
  className = "" 
}) {
  // Scaling based on size prop
  const scales = {
    xs: { icon: 20, text: 'text-sm', gap: 'gap-1.5' },
    sm: { icon: 24, text: 'text-base', gap: 'gap-2' },
    md: { icon: 32, text: 'text-xl', gap: 'gap-2.5' },
    lg: { icon: 40, text: 'text-2xl', gap: 'gap-3' },
    xl: { icon: 56, text: 'text-4xl', gap: 'gap-4' },
  };

  const scale = scales[size] || scales.md;

  // Colors from the branding image
  const tealColor = "#0D9488"; // Teal/Dark Green
  const blueColor = "#3B82F6"; // Blue for "AI" and Leaf
  const subtextColor = "#3B82F6"; // Blue for subtext

  return (
    <div className={`flex items-center ${scale.gap} ${className}`}>
      {/* Logo Icon */}
      <div className="relative shrink-0 flex items-center justify-center" style={{ width: scale.icon, height: scale.icon }}>
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Professional "N" with curved flourishes */}
          <path 
            d="M20 25V75H38V48L62 75H80V25H62V52L38 25H20Z" 
            fill={tealColor} 
          />
          
          {/* Professional Leaf positioned like in the image */}
          <g transform="translate(68, 12) rotate(15) scale(0.35)">
            <path 
              d="M50 0C50 0 100 30 100 65C100 100 50 130 50 130C50 130 0 100 0 65C0 30 50 0 50 0Z" 
              fill={blueColor} 
            />
            <path 
              d="M50 0V130" 
              stroke="white" 
              strokeWidth="6" 
              strokeLinecap="round"
            />
            <path 
              d="M50 40L25 25M50 70L20 50M50 100L30 85M50 40L75 25M50 70L80 50M50 100L70 85" 
              stroke="white" 
              strokeWidth="4" 
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>

      {withDivider && (
        <div className={`h-8 w-px ${dark ? 'bg-slate-700' : 'bg-slate-200'} mx-1`} />
      )}

      {/* Brand Text */}
      {withText && (
        <div className="flex flex-col leading-none">
          <div 
            className={`font-extrabold tracking-tighter ${scale.text}`}
            style={{ letterSpacing: '-0.04em' }}
          >
            <span style={{ color: tealColor }}>Nutri</span>
            <span style={{ color: blueColor }}>AI</span>
          </div>
          
          {withSubtext && (
            <div 
              className="text-[13px] font-bold tracking-[0.1em] mt-1 uppercase"
              style={{ color: subtextColor, fontSize: 'max(8px, 0.4em)' }}
            >
              Your Personal Nutritionist
            </div>
          )}
        </div>
      )}
    </div>
  );
}
