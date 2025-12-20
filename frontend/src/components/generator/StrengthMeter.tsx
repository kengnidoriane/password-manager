'use client';

/**
 * StrengthMeter Component
 * 
 * Visual display of password strength with entropy score, crack time estimation,
 * and color-coded strength indicator. Shows feedback for password improvement.
 */

import { useMemo } from 'react';
import { PasswordStrength } from '@/lib/passwordValidation';

interface StrengthMeterProps {
  strength: PasswordStrength;
  className?: string;
}

export function StrengthMeter({ strength, className = '' }: StrengthMeterProps) {
  // Determine strength level and colors
  const strengthLevel = useMemo(() => {
    if (strength.score >= 80) return { level: 'Very Strong', color: 'green', bgColor: 'bg-green-500' };
    if (strength.score >= 60) return { level: 'Strong', color: 'blue', bgColor: 'bg-blue-500' };
    if (strength.score >= 40) return { level: 'Fair', color: 'yellow', bgColor: 'bg-yellow-500' };
    if (strength.score >= 20) return { level: 'Weak', color: 'orange', bgColor: 'bg-orange-500' };
    return { level: 'Very Weak', color: 'red', bgColor: 'bg-red-500' };
  }, [strength.score]);

  // Format entropy for display
  const formattedEntropy = useMemo(() => {
    return Math.round(strength.entropy * 10) / 10;
  }, [strength.entropy]);

  // Get progress bar segments
  const progressSegments = useMemo(() => {
    const segments = [];
    const segmentCount = 5;
    const segmentWidth = 100 / segmentCount;
    
    for (let i = 0; i < segmentCount; i++) {
      const segmentStart = i * segmentWidth;
      const segmentEnd = (i + 1) * segmentWidth;
      const isActive = strength.score > segmentStart;
      
      let segmentColor = 'bg-gray-200 dark:bg-gray-700';
      if (isActive) {
        if (i === 0) segmentColor = 'bg-red-500';
        else if (i === 1) segmentColor = 'bg-orange-500';
        else if (i === 2) segmentColor = 'bg-yellow-500';
        else if (i === 3) segmentColor = 'bg-blue-500';
        else segmentColor = 'bg-green-500';
      }
      
      segments.push({
        id: i,
        color: segmentColor,
        isActive
      });
    }
    
    return segments;
  }, [strength.score]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Strength Level and Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Strength:
          </span>
          <span 
            className={`text-sm font-semibold ${
              strengthLevel.color === 'green' ? 'text-green-600 dark:text-green-400' :
              strengthLevel.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
              strengthLevel.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
              strengthLevel.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
              'text-red-600 dark:text-red-400'
            }`}
          >
            {strengthLevel.level}
          </span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {strength.score}/100
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex space-x-1">
        {progressSegments.map((segment) => (
          <div
            key={segment.id}
            className={`h-2 flex-1 rounded-sm transition-colors duration-200 ${segment.color}`}
          />
        ))}
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500 dark:text-gray-400">Entropy</div>
          <div className="font-medium text-gray-900 dark:text-white">
            {formattedEntropy} bits
          </div>
        </div>
        <div>
          <div className="text-gray-500 dark:text-gray-400">Crack Time</div>
          <div className="font-medium text-gray-900 dark:text-white">
            {strength.crackTime}
          </div>
        </div>
      </div>

      {/* Breach Warning */}
      {strength.isBreached && (
        <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
          <svg 
            className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <div>
            <div className="text-sm font-medium text-red-800 dark:text-red-200">
              Security Alert
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">
              This password has been found in data breaches. Consider using a different password.
            </div>
          </div>
        </div>
      )}

      {/* Feedback */}
      {strength.feedback.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Suggestions:
          </div>
          <ul className="space-y-1">
            {strength.feedback.map((feedback, index) => (
              <li 
                key={index}
                className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <svg 
                  className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{feedback}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strength Description */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {strength.score >= 80 && "Excellent! This password is very secure and would take centuries to crack."}
        {strength.score >= 60 && strength.score < 80 && "Good! This password is strong and would take years to crack."}
        {strength.score >= 40 && strength.score < 60 && "Fair. This password is decent but could be improved."}
        {strength.score >= 20 && strength.score < 40 && "Weak. This password could be cracked in days or months."}
        {strength.score < 20 && "Very weak. This password could be cracked quickly."}
      </div>
    </div>
  );
}