'use client';

interface PasswordStrengthIndicatorProps {
  password: string;
}

type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const calculateStrength = (pwd: string): { level: StrengthLevel; score: number; feedback: string[] } => {
    if (!pwd) {
      return { level: 'weak', score: 0, feedback: [] };
    }

    let score = 0;
    const feedback: string[] = [];

    // Length checks
    if (pwd.length >= 8) score += 1;
    else feedback.push('At least 8 characters');
    
    if (pwd.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(pwd)) score += 1;
    else feedback.push('Add lowercase letters');
    
    if (/[A-Z]/.test(pwd)) score += 1;
    else feedback.push('Add uppercase letters');
    
    if (/[0-9]/.test(pwd)) score += 1;
    else feedback.push('Add numbers');
    
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
    else feedback.push('Add special characters');

    let level: StrengthLevel = 'weak';
    if (score <= 2) level = 'weak';
    else if (score <= 3) level = 'fair';
    else if (score <= 4) level = 'good';
    else level = 'strong';

    return { level, score, feedback };
  };

  const { level, score, feedback } = calculateStrength(password);
  const percentage = (score / 6) * 100;

  const getColor = () => {
    switch (level) {
      case 'weak':
        return 'bg-red-500';
      case 'fair':
        return 'bg-orange-500';
      case 'good':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getTextColor = () => {
    switch (level) {
      case 'weak':
        return 'text-red-600';
      case 'fair':
        return 'text-orange-600';
      case 'good':
        return 'text-yellow-600';
      case 'strong':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getLabel = () => {
    switch (level) {
      case 'weak':
        return 'Weak';
      case 'fair':
        return 'Fair';
      case 'good':
        return 'Good';
      case 'strong':
        return 'Strong';
      default:
        return '';
    }
  };

  if (!password) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-frost-gray rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={`text-xs font-semibold ${getTextColor()}`}>
          {getLabel()}
        </span>
      </div>

      {/* Feedback */}
      {feedback.length > 0 && (
        <div className="text-xs text-midnight-navy/60 space-y-1">
          <p className="font-medium">Password should include:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {feedback.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Strength Requirements Checklist */}
      {password && (
        <div className="text-xs text-midnight-navy/60 space-y-1">
          <div className="flex items-center gap-2">
            <span className={password.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
              {password.length >= 8 ? '✓' : '○'}
            </span>
            <span>At least 8 characters</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
              {/[a-z]/.test(password) ? '✓' : '○'}
            </span>
            <span>Lowercase letter</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
              {/[A-Z]/.test(password) ? '✓' : '○'}
            </span>
            <span>Uppercase letter</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
              {/[0-9]/.test(password) ? '✓' : '○'}
            </span>
            <span>Number</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={/[^a-zA-Z0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
              {/[^a-zA-Z0-9]/.test(password) ? '✓' : '○'}
            </span>
            <span>Special character</span>
          </div>
        </div>
      )}
    </div>
  );
}

