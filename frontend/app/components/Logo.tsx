import Link from 'next/link';

interface LogoProps {
  variant?: 'horizontal' | 'stacked';
  showTagline?: boolean;
  tagline?: 'primary' | 'secondary';
  className?: string;
  href?: string;
}

export default function Logo({ 
  variant = 'horizontal', 
  showTagline = false,
  tagline = 'primary',
  className = '',
  href = '/'
}: LogoProps) {
  const LogoIcon = () => (
    <div className="relative flex-shrink-0">
      {/* Animated background star emblem - subtle shimmer and rotation */}
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 animate-star-rotate"
        style={{ opacity: 0.15 }}
      >
        {/* Rotating star emblem - symbolic of unity */}
        <path
          d="M20 2 L22 10 L30 12 L22 14 L20 22 L18 14 L10 12 L18 10 Z"
          fill="#C6A664"
          className="animate-shimmer"
        />
        <path
          d="M20 6 L21 11 L26 12 L21 13 L20 18 L19 13 L14 12 L19 11 Z"
          fill="#C6A664"
          opacity="0.5"
          className="animate-shimmer"
          style={{ animationDelay: '0.5s' }}
        />
      </svg>
      {/* Main logo */}
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        {/* Stylized '1' merging into diamond/star with subtle 'K' */}
        {/* Diamond/Star base */}
        <path
          d="M20 4 L24 12 L32 14 L24 16 L20 24 L16 16 L8 14 L16 12 Z"
          fill="#8A0C13"
          stroke="#C6A664"
          strokeWidth="0.5"
        />
        {/* Inner diamond for depth */}
        <path
          d="M20 8 L22 13 L27 14 L22 15 L20 20 L18 15 L13 14 L18 13 Z"
          fill="#C6A664"
          opacity="0.4"
        />
        {/* Stylized '1' shape integrated into the design */}
        <path
          d="M18 4 L18 20 L16 18 L16 22 L20 24 L24 22 L24 18 L22 20 L22 4 Z"
          fill="#8A0C13"
        />
        {/* Subtle 'K' integration - left side of the 1 */}
        <path
          d="M16 8 L14 10 L14 14 L16 12 L16 8 Z"
          fill="#C6A664"
          opacity="0.8"
        />
        <path
          d="M16 12 L14 14 L16 16 L18 14 L16 12 Z"
          fill="#C6A664"
          opacity="0.6"
        />
      </svg>
    </div>
  );

  const taglineText = tagline === 'primary' 
    ? 'One Tribe.  One Step.  One Kappa.'
    : 'Connected by the Bond.';

  const content = (
    <div className={`flex items-center ${variant === 'stacked' ? 'flex-col' : 'flex-row gap-2'} ${className}`}>
      <LogoIcon />
      <div className={variant === 'stacked' ? 'text-center mt-2' : ''}>
        <div className="font-display font-bold text-crimson text-2xl">
          1Kappa
        </div>
        {showTagline && (
          <div className="tagline text-sm text-midnight-navy mt-1">
            {taglineText}
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

