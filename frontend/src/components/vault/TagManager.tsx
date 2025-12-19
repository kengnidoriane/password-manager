'use client';

/**
 * TagManager Component
 * 
 * Manages tags with creation, editing, deletion, and color customization.
 * Shows tag usage statistics and provides filtering capabilities.
 */

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tagSchema, type TagFormData } from '@/lib/validations';
import { useVault } from '@/hooks/useVault';
import { Tag } from '@/lib/db';

interface TagWithStats extends Tag {
  usageCount: number;
}

interface TagManagerProps {
  selectedTags?: string[];
  onTagSelect?: (tagId: string) => void;
  onTagsChange?: (tagIds: string[]) => void;
  showActions?: boolean;
  compact?: boolean;
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
];

export function TagManager({
  selectedTags = [],
  onTagSelect,
  onTagsChange,
  showActions = true,
  compact = false
}: TagManagerProps) {
  const { tags, credentials, secureNotes, createTag, deleteTag } = useVault();
  const [isCreating, setIsCreating] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<TagWithStats | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: '',
      color: DEFAULT_COLORS[0]
    }
  });

  const watchedColor = watch('color');

  // Calculate tag usage statistics
  const tagsWithStats = useMemo((): TagWithStats[] => {
    return tags.map(tag => {
      const credentialUsage = credentials.filter(c => 
        !c.deletedAt && c.tags.includes(tag.id)
      ).length;
      const noteUsage = secureNotes.filter(n => 
        n.tags.includes(tag.id)
      ).length;
      
      return {
        ...tag,
        usageCount: credentialUsage + noteUsage
      };
    }).sort((a, b) => {
      // Sort by usage count (descending), then by name
      if (a.usageCount !== b.usageCount) {
        return b.usageCount - a.usageCount;
      }
      return a.name.localeCompare(b.name);
    });
  }, [tags, credentials, secureNotes]);

  const handleCreateTag = async (data: TagFormData) => {
    try {
      await createTag(data);
      reset();
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setValue('name', tag.name);
    setValue('color', tag.color);
    setIsCreating(true);
  };

  const handleUpdateTag = async (data: TagFormData) => {
    if (!editingTag) return;

    try {
      // Note: This would require an updateTag method in the vault service
      // For now, we'll just close the edit form
      console.log('Update tag:', editingTag.id, data);
      reset();
      setIsCreating(false);
      setEditingTag(null);
    } catch (error) {
      console.error('Failed to update tag:', error);
    }
  };

  const handleDeleteTag = async (tag: TagWithStats) => {
    if (tag.usageCount > 0) {
      setDeletingTag(tag);
      return;
    }

    try {
      await deleteTag(tag.id);
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  const confirmDeleteTag = async () => {
    if (!deletingTag) return;

    try {
      await deleteTag(deletingTag.id);
      setDeletingTag(null);
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  const handleTagClick = (tagId: string) => {
    if (onTagSelect) {
      onTagSelect(tagId);
    } else if (onTagsChange) {
      const newSelectedTags = selectedTags.includes(tagId)
        ? selectedTags.filter(id => id !== tagId)
        : [...selectedTags, tagId];
      onTagsChange(newSelectedTags);
    }
  };

  const cancelCreate = () => {
    reset();
    setIsCreating(false);
    setEditingTag(null);
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {tagsWithStats.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => handleTagClick(tag.id)}
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  isSelected
                    ? 'ring-2 ring-offset-2 ring-blue-500'
                    : 'hover:opacity-80'
                }`}
                style={{ 
                  backgroundColor: tag.color + '20', 
                  color: tag.color,
                  borderColor: tag.color
                }}
              >
                {tag.name}
                {tag.usageCount > 0 && (
                  <span className="ml-1 text-xs opacity-75">
                    {tag.usageCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tags
        </h3>
        {showActions && !isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Tag
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            {editingTag ? 'Edit Tag' : 'Create New Tag'}
          </h4>
          
          <form onSubmit={handleSubmit(editingTag ? handleUpdateTag : handleCreateTag)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
              <input
                {...register('name')}
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Tag name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue('color', color)}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      watchedColor === color
                        ? 'border-gray-900 dark:border-white scale-110'
                        : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <input
                {...register('color')}
                type="color"
                className="mt-2 h-8 w-16 rounded border border-gray-300 dark:border-gray-600"
              />
              {errors.color && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.color.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelCreate}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : (editingTag ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tags List */}
      <div className="space-y-2">
        {tagsWithStats.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
            <p className="text-gray-500 dark:text-gray-400">
              No tags yet. Create your first tag to organize your credentials.
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            {tagsWithStats.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <div
                  key={tag.id}
                  className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                      : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700'
                  }`}
                >
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => handleTagClick(tag.id)}
                  >
                    <div
                      className="h-4 w-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {tag.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {tag.usageCount} item{tag.usageCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {showActions && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditTag(tag)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                        title="Edit tag"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag)}
                        className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        title="Delete tag"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Tag
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete the tag "{deletingTag.name}"? 
              {deletingTag.usageCount > 0 && (
                <span className="block mt-1 text-red-600 dark:text-red-400">
                  This tag is used by {deletingTag.usageCount} item{deletingTag.usageCount !== 1 ? 's' : ''} and will be removed from them.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingTag(null)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTag}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}