'use client';

/**
 * GeneratorConfig Component
 * 
 * Provides sliders and checkboxes for configuring password generation options.
 * Includes length slider, character type checkboxes, and ambiguous character exclusion.
 */

import { useState, useCallback } from 'react';
import { GeneratorOptions } from '@/lib/passwordGenerator';

interface GeneratorConfigProps {
  options: GeneratorOptions;
  onChange: (options: GeneratorOptions) => void;
  disabled?: boolean;
}

export function GeneratorConfig({ options, onChange, disabled = false }: GeneratorConfigProps) {
  const [localOptions, setLocalOptions] = useState<GeneratorOptions>(options);

  const handleOptionChange = useCallback((updates: Partial<GeneratorOptions>) => {
    const newOptions = { ...localOptions, ...updates };
    setLocalOptions(newOptions);
    onChange(newOptions);
  }, [localOptions, onChange]);

  const handleLengthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const length = parseInt(e.target.value, 10);
    handleOptionChange({ length });
  }, [handleOptionChange]);

  const handleCharacterTypeChange = useCallback((
    type: keyof Pick<GeneratorOptions, 'includeUppercase' | 'includeLowercase' | 'includeNumbers' | 'includeSymbols' | 'excludeAmbiguous'>
  ) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      handleOptionChange({ [type]: e.target.checked });
    };
  }, [handleOptionChange]);

  // Check if at least one character type is selected
  const hasValidCharacterTypes = localOptions.includeUppercase || 
    localOptions.includeLowercase || 
    localOptions.includeNumbers || 
    localOptions.includeSymbols;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Password Options
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {localOptions.length} characters
        </div>
      </div>

      {/* Length Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label 
            htmlFor="length-slider"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Length
          </label>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {localOptions.length}
          </span>
        </div>
        <div className="relative">
          <input
            id="length-slider"
            type="range"
            min="8"
            max="128"
            value={localOptions.length}
            onChange={handleLengthChange}
            disabled={disabled}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
            style={{
              background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((localOptions.length - 8) / (128 - 8)) * 100}%, #E5E7EB ${((localOptions.length - 8) / (128 - 8)) * 100}%, #E5E7EB 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>8</span>
            <span>128</span>
          </div>
        </div>
      </div>

      {/* Character Types */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Character Types
        </h4>
        
        <div className="grid grid-cols-1 gap-3">
          {/* Uppercase Letters */}
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={localOptions.includeUppercase}
              onChange={handleCharacterTypeChange('includeUppercase')}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Uppercase Letters
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                A, B, C, D, E, F...
              </div>
            </div>
          </label>

          {/* Lowercase Letters */}
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={localOptions.includeLowercase}
              onChange={handleCharacterTypeChange('includeLowercase')}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Lowercase Letters
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                a, b, c, d, e, f...
              </div>
            </div>
          </label>

          {/* Numbers */}
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={localOptions.includeNumbers}
              onChange={handleCharacterTypeChange('includeNumbers')}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Numbers
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                0, 1, 2, 3, 4, 5...
              </div>
            </div>
          </label>

          {/* Symbols */}
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={localOptions.includeSymbols}
              onChange={handleCharacterTypeChange('includeSymbols')}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Symbols
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                !, @, #, $, %, ^...
              </div>
            </div>
          </label>
        </div>

        {/* Validation Error */}
        {!hasValidCharacterTypes && (
          <div className="text-sm text-red-600 dark:text-red-400">
            At least one character type must be selected
          </div>
        )}
      </div>

      {/* Additional Options */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Additional Options
        </h4>
        
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={localOptions.excludeAmbiguous}
            onChange={handleCharacterTypeChange('excludeAmbiguous')}
            disabled={disabled}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
          />
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Exclude Ambiguous Characters
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Avoid characters like 0, O, l, I that can be confused
            </div>
          </div>
        </label>
      </div>

      {/* Quick Presets */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Quick Presets
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleOptionChange({
              length: 16,
              includeUppercase: true,
              includeLowercase: true,
              includeNumbers: true,
              includeSymbols: true,
              excludeAmbiguous: false
            })}
            disabled={disabled}
            className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Strong (16)
          </button>
          
          <button
            type="button"
            onClick={() => handleOptionChange({
              length: 20,
              includeUppercase: true,
              includeLowercase: true,
              includeNumbers: true,
              includeSymbols: true,
              excludeAmbiguous: false
            })}
            disabled={disabled}
            className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Very Strong (20)
          </button>
          
          <button
            type="button"
            onClick={() => handleOptionChange({
              length: 16,
              includeUppercase: true,
              includeLowercase: true,
              includeNumbers: true,
              includeSymbols: false,
              excludeAmbiguous: true
            })}
            disabled={disabled}
            className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Memorable (16)
          </button>
        </div>
      </div>
    </div>
  );
}