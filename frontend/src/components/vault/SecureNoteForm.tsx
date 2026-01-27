'use client';

/**
 * SecureNoteForm Component
 * 
 * Form for creating and editing secure notes with rich text editor and file attachments.
 * Supports file uploads up to 10MB with progress indicators and attachment management.
 */

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useVault } from '@/hooks/useVault';
import { SecureNote } from '@/lib/db';

// File attachment interface
interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // Base64 encoded file data
}

// Form validation schema
const secureNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required'),
  folderId: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

type SecureNoteFormData = z.infer<typeof secureNoteSchema>;

interface SecureNoteFormProps {
  note?: SecureNote;
  onSave: (data: SecureNoteFormData & { attachments: FileAttachment[] }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SecureNoteForm({ 
  note, 
  onSave, 
  onCancel, 
  isLoading = false 
}: SecureNoteFormProps) {
  const { folders, tags, createTag } = useVault();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newTagName, setNewTagName] = useState('');
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Parse existing attachments from note content if editing
  const parseAttachments = (content: string): { content: string; attachments: FileAttachment[] } => {
    try {
      // Look for attachment metadata in content
      const attachmentRegex = /\[ATTACHMENT:([^\]]+)\]/g;
      const matches = Array.from(content.matchAll(attachmentRegex));
      const parsedAttachments: FileAttachment[] = [];
      let cleanContent = content;

      matches.forEach(match => {
        try {
          const attachmentData = JSON.parse(match[1]);
          parsedAttachments.push(attachmentData);
          cleanContent = cleanContent.replace(match[0], '');
        } catch (e) {
          console.warn('Failed to parse attachment data:', e);
        }
      });

      return { content: cleanContent.trim(), attachments: parsedAttachments };
    } catch (e) {
      return { content, attachments: [] };
    }
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<SecureNoteFormData>({
    resolver: zodResolver(secureNoteSchema),
    defaultValues: {
      title: note?.title || '',
      content: note?.content || '',
      folderId: note?.folderId || '',
      tags: note?.tags || [],
    },
  });

  // Initialize form with existing note data
  useEffect(() => {
    if (note) {
      const { content, attachments: parsedAttachments } = parseAttachments(note.content);
      reset({
        title: note.title,
        content,
        folderId: note.folderId || '',
        tags: note.tags || [],
      });
      setAttachments(parsedAttachments);
    }
  }, [note, reset]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [watch('content')]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64Data = result.split(',')[1]; // Remove data URL prefix

        const newAttachment: FileAttachment = {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64Data,
        };

        setAttachments(prev => [...prev, newAttachment]);
        setIsUploading(false);
        setUploadProgress(0);
      };

      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(progress);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File upload failed:', error);
      alert('Failed to upload file');
      setIsUploading(false);
      setUploadProgress(0);
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const downloadAttachment = (attachment: FileAttachment) => {
    try {
      const blob = new Blob([Uint8Array.from(atob(attachment.data), c => c.charCodeAt(0))], {
        type: attachment.type
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download attachment:', error);
      alert('Failed to download file');
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const newTag = await createTag({
        name: newTagName.trim(),
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`, // Random color
      });

      // Add the new tag to the current selection
      const currentTags = watch('tags');
      setValue('tags', [...currentTags, newTag.id], { shouldDirty: true });

      setNewTagName('');
      setShowNewTagInput(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
      alert('Failed to create tag');
    }
  };

  const onSubmit = async (data: SecureNoteFormData) => {
    try {
      // Combine content with attachment metadata
      let finalContent = data.content;
      if (attachments.length > 0) {
        const attachmentMetadata = attachments.map(att => 
          `[ATTACHMENT:${JSON.stringify(att)}]`
        ).join('\n');
        finalContent = `${data.content}\n\n${attachmentMetadata}`;
      }

      await onSave({
        ...data,
        content: finalContent,
        attachments,
      });
    } catch (error) {
      console.error('Failed to save secure note:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
        {note ? 'Edit Secure Note' : 'Create Secure Note'}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Title *
          </label>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                id="title"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Enter note title"
              />
            )}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
          )}
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Content *
          </label>
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                ref={textareaRef}
                id="content"
                rows={8}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your secure note content..."
                style={{ minHeight: '200px', resize: 'vertical' }}
              />
            )}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.content.message}</p>
          )}
        </div>

        {/* File Attachments */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Attachments
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
            >
              <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Add File
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept="*/*"
          />

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Attachment List */}
          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-100 dark:bg-blue-900">
                      <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(attachment.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => downloadAttachment(attachment)}
                      className="rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      title="Download"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      className="rounded-md p-1 text-red-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300"
                      title="Remove"
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
                </div>
              ))}
            </div>
          )}

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Maximum file size: 10MB. All files are encrypted before storage.
          </p>
        </div>

        {/* Folder Selection */}
        <div>
          <label htmlFor="folderId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Folder
          </label>
          <Controller
            name="folderId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id="folderId"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">No Folder</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        {/* Tags */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tags
            </label>
            <button
              type="button"
              onClick={() => setShowNewTagInput(true)}
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              + New Tag
            </button>
          </div>

          {/* New Tag Input */}
          {showNewTagInput && (
            <div className="mt-2 flex items-center space-x-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                className="flex-1 rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateTag();
                  } else if (e.key === 'Escape') {
                    setShowNewTagInput(false);
                    setNewTagName('');
                  }
                }}
              />
              <button
                type="button"
                onClick={handleCreateTag}
                className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-500"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewTagInput(false);
                  setNewTagName('');
                }}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Tag Selection */}
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = field.value.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        const newTags = isSelected
                          ? field.value.filter(id => id !== tag.id)
                          : [...field.value, tag.id];
                        field.onChange(newTags);
                      }}
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                      }`}
                      style={isSelected ? { backgroundColor: tag.color + '20', color: tag.color } : {}}
                    >
                      {tag.name}
                      {isSelected && (
                        <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 border-t border-gray-200 pt-6 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !isDirty}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading && (
              <svg
                className="mr-2 h-4 w-4 animate-spin"
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
            )}
            {note ? 'Update Note' : 'Create Note'}
          </button>
        </div>
      </form>
    </div>
  );
}