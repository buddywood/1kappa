interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'text' | 'card' | 'circle';
  width?: string;
  height?: string;
}

export default function Skeleton({ 
  className = '', 
  variant = 'default',
  width,
  height 
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  const variantClasses = {
    default: '',
    text: 'h-4',
    card: 'h-32',
    circle: 'rounded-full',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`min-h-screen bg-cream flex items-center justify-center ${className}`}>
      <div className="w-full max-w-md px-4">
        <Skeleton variant="default" className="h-12 w-full mb-4" />
        <Skeleton variant="text" className="w-3/4 mb-2" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
    </div>
  );
}

