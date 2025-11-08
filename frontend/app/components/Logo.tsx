import Link from 'next/link';

interface LogoProps {
  variant?: 'horizontal' | 'stacked';
  showTagline?: boolean;
  className?: string;
  href?: string;
}

export default function Logo({ 
  variant = 'horizontal', 
  showTagline = false,
  className = '',
  href = '/'
}: LogoProps) {
  const StarIcon = () => (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* 8-point compass star */}
      <circle cx="16" cy="16" r="14" fill="#C6A664" opacity="0.2" />
      <path
        d="M16 4 L18 12 L26 14 L18 16 L16 24 L14 16 L6 14 L14 12 Z"
        fill="#9B111E"
        stroke="#C6A664"
        strokeWidth="1"
      />
      <path
        d="M16 8 L17 13 L22 14 L17 15 L16 20 L15 15 L10 14 L15 13 Z"
        fill="#C6A664"
        opacity="0.6"
      />
    </svg>
  );

  const content = (
    <div className={`flex items-center ${variant === 'stacked' ? 'flex-col' : 'flex-row gap-2'} ${className}`}>
      <StarIcon />
      <div className={variant === 'stacked' ? 'text-center mt-2' : ''}>
        <div className="font-display font-extrabold text-crimson text-2xl">
          NorthStar Nupes
        </div>
        {showTagline && (
          <div className="tagline text-sm text-midnight-navy mt-1">
            Guided by Brotherhood. Grounded in Minnesota.
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

