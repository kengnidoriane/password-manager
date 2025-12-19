'use client';

/**
 * CredentialForm Component
 * 
 * Form for creating and editing credentials using React Hook Form + Zod validation.
 * Includes password generator integration and tag/folder selection.
 */

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { credentialSchema, type CredentialFormData } from '@/lib/validations';
import { useVault } from '@/hooks/useVault';
import { Credential } from '@/lib/db';
import { PasswordGeneratorService } from '@/lib/passwordGenerator';

interface CredentialFormProps {
  credential?: Credential;
  onSubmit: (data: CredentialFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CredentialForm({
  credential,
  onSubmit,
  onCancel,
  isLoading = false
}: CredentialFormProps) {
  const { folders, tags, createTag } = useVault();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CredentialFormData>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      title: credential?.title || '',
      username: credential?.username || '',
      password: credential?.password || '',
      url: credential?.url || '',
      notes: credential?.notes || '',
      folderId: credential?.folderId || '',
      tags: credential?.tags || []
    }
  });

  const watchedPassword = watch('password');
  const watchedTags = watch('tags') || [];

  // Password generator options
  const [generatorOptions, setGeneratorOptions] = useState({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeAmbiguous: true
  });

  const handleFormSubmit = async (data: CredentialFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleGeneratePassword = () => {
    try {
      const result = PasswordGeneratorService.generatePassword(generatorOptions);
      setValue('password', result.password);
      setShowPasswordGenerator(false);
    } catch (error) {
      console.error('Password generation error:', error);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      setIsCreatingTag(true);
      const newTag = await createTag({
        name: newTagName.trim(),
        color: '#3B82F6' // Default blue color
      });
      
      // Add the new tag to the current selection
      const currentTags = watchedTags || [];
      setValue('tags', [...currentTags, newTag.id]);
      setNewTagName('');
    } catch (error) {
      console.error('Tag creation error:', error);
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleTagToggle = (tagId: string) => {
    const currentTags = watchedTags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    setValue('tags', newTags);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {credential ? 'Edit Credential' : 'New Credential'}
        </h2>
        <button
          onClick={onCancel}
          className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Title *
          </label>
          <input
            {...register('title')}
            id="title"
            type="text"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            placeholder="e.g., Gmail, Facebook, Work Email"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Username */}
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Username *
          </label>
          <input
            {...register('username')}
            id="username"
            type="text"
            autoComplete="username"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            placeholder="username or email"
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.username.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password *
            </label>
            <button
              type="button"
              onClick={() => setShowPasswordGenerator(!showPasswordGenerator)}
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Generate Password
            </button>
          </div>
          <div className="relative mt-1">
            <input
              {...register('password')}
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm font-mono"
              placeholder="Enter or generate a strong password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              {showPassword ? (
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}

          {/* Password Generator */}
          {showPasswordGenerator && (
            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Password Generator
              </h4>
              
              <div className="space-y-3">
                {/* Length */}
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300">
                    Length: {generatorOptions.length}
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="128"
                    value={generatorOptions.length}
                    onChange={(e) => setGeneratorOptions(prev => ({ ...prev, length: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                {/* Character Types */}
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generatorOptions.includeUppercase}
                      onChange={(e) => setGeneratorOptions(prev => ({ ...prev, includeUppercase: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">A-Z</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generatorOptions.includeLowercase}
                      onChange={(e) => setGeneratorOptions(prev => ({ ...prev, includeLowercase: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">a-z</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generatorOptions.includeNumbers}
                      onChange={(e) => setGeneratorOptions(prev => ({ ...prev, includeNumbers: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">0-9</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generatorOptions.includeSymbols}
                      onChange={(e) => setGeneratorOptions(prev => ({ ...prev, includeSymbols: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">!@#$</span>
                  </label>
                </div>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={generatorOptions.excludeAmbiguous}
                    onChange={(e) => setGeneratorOptions(prev => ({ ...prev, excludeAmbiguous: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Exclude ambiguous characters (0, O, l, I)
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Generate Password
                </button>
              </div>
            </div>
          )}
        </div>

        {/* URL */}
        <div>
          <label
            htmlFor="url"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Website URL
          </label>
          <input
            {...register('url')}
            id="url"
            type="url"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            placeholder="https://example.com"
          />
          {errors.url && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.url.message}
            </p>
          )}
        </div>

        {/* Folder */}
        <div>
          <label
            htmlFor="folderId"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Folder
          </label>
          <select
            {...register('folderId')}
            id="folderId"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
          >
            <option value="">No folder</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags
          </label>
          
          {/* Existing Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag) => {
              const isSelected = watchedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id)}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                  }`}
                  style={isSelected ? { backgroundColor: tag.color + '20', color: tag.color } : {}}
                >
                  {tag.name}
                  {isSelected && (
                    <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Create New Tag */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Create new tag..."
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateTag();
                }
              }}
            />
            <button
              type="button"
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || isCreatingTag}
              className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isCreatingTag ? 'Creating...' : 'Add Tag'}
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Notes
          </label>
          <textarea
            {...register('notes')}
            id="notes"
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            placeholder="Additional notes or information..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting || isLoading ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin inline"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {credential ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              credential ? 'Update Credential' : 'Create Credential'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}