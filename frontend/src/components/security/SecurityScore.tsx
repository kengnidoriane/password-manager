'use client';

/**
 * SecurityScore Component
 * 
 * Displays the overall security score with visual rating.
 * Requirements: 8.2, 8.4
 */

interface SecurityScoreProps {
  score: number;
  totalCredentials: number;
}

export function SecurityScore({ score, totalCredentials }: SecurityScoreProps) {
  // Determine score color and label
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    if (score >= 40) return 'bg-orange-600';
    return 'bg-red-600';
  };

  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);
  const scoreBgColor = getScoreBgColor(score);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
        Security Score
      </h2>
      
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-baseline gap-2">
            <span className={`text-5xl font-bold ${scoreColor}`}>
              {score}
            </span>
            <span className="text-2xl text-gray-500 dark:text-gray-400">/100</span>
          </div>
          <p className={`text-lg font-medium ${scoreColor}`}>
            {scoreLabel}
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Based on {totalCredentials} credential{totalCredentials !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Circular progress indicator */}
        <div className="relative h-32 w-32">
          <svg className="h-32 w-32 -rotate-90 transform">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 100)}`}
              className={scoreBgColor}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${scoreColor}`}>
              {score}%
            </span>
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="mt-6 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your security score is calculated based on:
        </p>
        <ul className="ml-4 list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li>Password strength (entropy)</li>
          <li>Password reuse across credentials</li>
          <li>Password age (90+ days old)</li>
        </ul>
      </div>
    </div>
  );
}
