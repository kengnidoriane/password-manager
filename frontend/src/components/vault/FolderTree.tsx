'use client';

/**
 * FolderTree Component
 * 
 * Displays a hierarchical tree view of folders for navigation.
 * Supports folder selection, creation, editing, and deletion.
 */

import { useState, useMemo } from 'react';
import { useVault } from '@/hooks/useVault';
import { Folder } from '@/lib/db';

interface FolderTreeNode {
  folder: Folder;
  children: FolderTreeNode[];
  level: number;
}

interface FolderTreeProps {
  selectedFolderId?: string | null;
  onFolderSelect?: (folderId: string | null) => void;
  onFolderCreate?: (parentId?: string) => void;
  onFolderEdit?: (folderId: string) => void;
  onFolderDelete?: (folderId: string) => void;
  showActions?: boolean;
}

export function FolderTree({
  selectedFolderId,
  onFolderSelect,
  onFolderCreate,
  onFolderEdit,
  onFolderDelete,
  showActions = true
}: FolderTreeProps) {
  const { folders, credentials, secureNotes } = useVault();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);

  // Build folder tree structure
  const folderTree = useMemo(() => {
    const buildTree = (parentId?: string, level = 0): FolderTreeNode[] => {
      return folders
        .filter(folder => folder.parentId === parentId)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(folder => ({
          folder,
          children: buildTree(folder.id, level + 1),
          level
        }));
    };

    return buildTree();
  }, [folders]);

  // Get item counts for folders
  const getFolderCounts = (folderId: string) => {
    const credentialCount = credentials.filter(c => c.folderId === folderId && !c.deletedAt).length;
    const noteCount = secureNotes.filter(n => n.folderId === folderId).length;
    return { credentialCount, noteCount };
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFolderClick = (folderId: string) => {
    onFolderSelect?.(folderId);
  };

  const handleAllItemsClick = () => {
    onFolderSelect?.(null);
  };

  const renderFolderNode = (node: FolderTreeNode) => {
    const { folder, children, level } = node;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const hasChildren = children.length > 0;
    const { credentialCount, noteCount } = getFolderCounts(folder.id);
    const totalCount = credentialCount + noteCount;
    const isHovered = hoveredFolder === folder.id;

    return (
      <div key={folder.id}>
        {/* Folder Item */}
        <div
          className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors ${
            isSelected
              ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => handleFolderClick(folder.id)}
          onMouseEnter={() => setHoveredFolder(folder.id)}
          onMouseLeave={() => setHoveredFolder(null)}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="flex-shrink-0 rounded p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <svg
                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          ) : (
            <div className="w-5" />
          )}

          {/* Folder Icon */}
          <svg
            className={`h-4 w-4 flex-shrink-0 ${
              isExpanded ? 'text-blue-500' : 'text-gray-400'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>

          {/* Folder Name */}
          <span className="flex-1 truncate font-medium">{folder.name}</span>

          {/* Item Count */}
          {totalCount > 0 && (
            <span className="flex-shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
              {totalCount}
            </span>
          )}

          {/* Actions */}
          {showActions && (isHovered || isSelected) && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFolderCreate?.(folder.id);
                }}
                className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Create subfolder"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFolderEdit?.(folder.id);
                }}
                className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Edit folder"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFolderDelete?.(folder.id);
                }}
                className="rounded p-1 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                title="Delete folder"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {children.map(child => renderFolderNode(child))}
          </div>
        )}
      </div>
    );
  };

  const allItemsCount = credentials.filter(c => !c.deletedAt).length + secureNotes.length;

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Folders
        </h3>
        {showActions && (
          <button
            onClick={() => onFolderCreate?.()}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            title="Create folder"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
        )}
      </div>

      {/* All Items */}
      <div
        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors ${
          selectedFolderId === null
            ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
        }`}
        onClick={handleAllItemsClick}
      >
        <div className="w-5" />
        <svg
          className="h-4 w-4 flex-shrink-0 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <span className="flex-1 font-medium">All Items</span>
        {allItemsCount > 0 && (
          <span className="flex-shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            {allItemsCount}
          </span>
        )}
      </div>

      {/* Folder Tree */}
      <div className="space-y-0.5">
        {folderTree.length === 0 ? (
          <div className="px-2 py-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No folders yet
            </p>
            {showActions && (
              <button
                onClick={() => onFolderCreate?.()}
                className="mt-2 text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Create your first folder
              </button>
            )}
          </div>
        ) : (
          folderTree.map(node => renderFolderNode(node))
        )}
      </div>
    </div>
  );
}