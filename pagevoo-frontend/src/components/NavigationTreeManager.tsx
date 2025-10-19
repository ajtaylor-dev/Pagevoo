import React, { useState, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface NavigationLink {
  id?: number | string
  label: string
  linkType: 'page' | 'url'
  pageId?: number | null
  url: string
  subItems?: NavigationLink[]
}

interface TreeNodeProps {
  link: NavigationLink
  depth: number
  pages: any[]
  onUpdate: (linkId: string | number, updates: Partial<NavigationLink>) => void
  onDelete: (linkId: string | number) => void
  onAddChild: (parentId: string | number) => void
  onToggleCollapse: (linkId: string | number) => void
  isCollapsed: boolean
  collapsedIds: Set<string | number>
  selectedIds: Set<string | number>
  onToggleSelect: (linkId: string | number, isShiftKey: boolean) => void
  allowSubItems?: boolean
}

function TreeNode({
  link,
  depth,
  pages,
  onUpdate,
  onDelete,
  onAddChild,
  onToggleCollapse,
  isCollapsed,
  collapsedIds,
  selectedIds,
  onToggleSelect,
  allowSubItems = true,
}: TreeNodeProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [labelValue, setLabelValue] = useState(link.label)

  // Update labelValue when link.label changes
  React.useEffect(() => {
    setLabelValue(link.label)
  }, [link.label])

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id || Date.now() })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const hasChildren = link.subItems && link.subItems.length > 0
  const isSelected = selectedIds.has(link.id || '')

  const handleSaveLabel = () => {
    if (labelValue.trim()) {
      onUpdate(link.id!, { label: labelValue.trim() })
    }
    setIsEditingLabel(false)
  }

  const handleLinkTypeChange = (newType: 'page' | 'url') => {
    onUpdate(link.id!, { linkType: newType, pageId: null, url: '' })
  }

  const getIcon = () => {
    if (hasChildren) {
      return isCollapsed ? '📁' : '📂'
    }
    if (link.linkType === 'page') {
      return '📄'
    }
    return '🔗'
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 hover:bg-gray-50 rounded group ${
          isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''
        }`}
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
      >
        {/* Checkbox for selection */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onToggleSelect(link.id!, e.shiftKey)}
          className="w-4 h-4 text-blue-600 rounded"
        />

        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          title="Drag to reorder"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </div>

        {/* Collapse toggle */}
        {hasChildren && (
          <button
            onClick={() => onToggleCollapse(link.id!)}
            className="text-gray-500 hover:text-gray-700 w-4 h-4 flex items-center justify-center"
          >
            {isCollapsed ? '▶' : '▼'}
          </button>
        )}

        {/* Icon */}
        <span className="text-lg">{getIcon()}</span>

        {/* Label editing */}
        {isEditingLabel ? (
          <input
            type="text"
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onBlur={handleSaveLabel}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveLabel()
              if (e.key === 'Escape') {
                setLabelValue(link.label)
                setIsEditingLabel(false)
              }
            }}
            autoFocus
            className="flex-1 px-2 py-1 border border-blue-500 rounded text-sm"
          />
        ) : (
          <span
            onDoubleClick={() => setIsEditingLabel(true)}
            className="flex-1 text-sm cursor-pointer"
            title="Double-click to edit"
          >
            {link.label}
          </span>
        )}

        {/* Link type & target */}
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <select
            value={link.linkType}
            onChange={(e) => handleLinkTypeChange(e.target.value as 'page' | 'url')}
            className="border border-gray-300 rounded px-1 py-0.5 text-xs"
          >
            <option value="page">Page</option>
            <option value="url">URL</option>
          </select>

          {link.linkType === 'page' ? (
            <select
              value={link.pageId || ''}
              onChange={(e) => onUpdate(link.id!, { pageId: parseInt(e.target.value) })}
              className="border border-gray-300 rounded px-1 py-0.5 text-xs max-w-[120px]"
            >
              <option value="">Select page</option>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name} {page.is_homepage ? '(Home)' : ''}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={link.url}
              onChange={(e) => onUpdate(link.id!, { url: e.target.value })}
              placeholder="https://..."
              className="border border-gray-300 rounded px-1 py-0.5 text-xs w-32"
            />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Add child button - only show for dropdown navbars */}
          {allowSubItems && (
            <button
              onClick={() => onAddChild(link.id!)}
              className="p-1 hover:bg-green-100 rounded text-green-600"
              title="Add sub-item"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}

          {/* Edit button */}
          <button
            onClick={() => setIsEditingLabel(true)}
            className="p-1 hover:bg-blue-100 rounded text-blue-600"
            title="Edit label"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Delete button */}
          <button
            onClick={() => onDelete(link.id!)}
            className="p-1 hover:bg-red-100 rounded text-red-600"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Render children if not collapsed */}
      {hasChildren && !isCollapsed && link.subItems && (
        <div className="border-l-2 border-gray-200 ml-4">
          {link.subItems.map((child, childIndex) => (
            <TreeNode
              key={child.id || `child-${childIndex}`}
              link={child}
              depth={depth + 1}
              pages={pages}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onToggleCollapse={onToggleCollapse}
              isCollapsed={collapsedIds.has(child.id!)}
              collapsedIds={collapsedIds}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              allowSubItems={allowSubItems}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface NavigationTreeManagerProps {
  links: NavigationLink[]
  pages: any[]
  onChange: (links: NavigationLink[]) => void
  sectionType?: string
}

export default function NavigationTreeManager({
  links,
  pages,
  onChange,
  sectionType,
}: NavigationTreeManagerProps) {
  // Only allow subitems for dropdown navbars
  const allowSubItems = sectionType === 'navbar-dropdown'
  const [collapsedIds, setCollapsedIds] = useState<Set<string | number>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set())
  const [clipboard, setClipboard] = useState<{ action: 'cut' | 'copy'; items: NavigationLink[] } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Ensure all links have IDs and proper structure
  // Use a counter to generate stable IDs within a single render
  const ensureIds = (items: any[], idCounter: { current: number }): NavigationLink[] => {
    if (!items || items.length === 0) return []

    return items.map((item) => {
      // Handle old string format
      if (typeof item === 'string') {
        return {
          id: `link-${++idCounter.current}`,
          label: item,
          linkType: 'page' as const,
          pageId: null,
          url: '',
        }
      }

      // Handle object format - preserve existing IDs
      return {
        id: item.id || `link-${++idCounter.current}`,
        label: item.label || 'Untitled Link',
        linkType: item.linkType || 'page',
        pageId: item.pageId || null,
        url: item.url || '',
        subItems: item.subItems ? ensureIds(item.subItems, idCounter) : [],
      }
    })
  }

  // Memoize the links with IDs to prevent regenerating IDs on every render
  const linksWithIds = useMemo(() => {
    const idCounter = { current: Date.now() }
    return ensureIds(links || [], idCounter)
  }, [links])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const flattenLinks = (items: NavigationLink[]): NavigationLink[] => {
      return items.reduce((acc: NavigationLink[], item) => {
        acc.push(item)
        if (item.subItems) {
          acc.push(...flattenLinks(item.subItems))
        }
        return acc
      }, [])
    }

    const findAndReorder = (items: NavigationLink[]): NavigationLink[] => {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        return arrayMove(items, oldIndex, newIndex)
      }

      return items.map((item) => ({
        ...item,
        subItems: item.subItems ? findAndReorder(item.subItems) : [],
      }))
    }

    onChange(findAndReorder(linksWithIds))
  }

  const handleUpdate = (linkId: string | number, updates: Partial<NavigationLink>) => {
    const updateInTree = (items: NavigationLink[]): NavigationLink[] => {
      return items.map((item) => {
        if (item.id === linkId) {
          return { ...item, ...updates }
        }
        if (item.subItems) {
          return { ...item, subItems: updateInTree(item.subItems) }
        }
        return item
      })
    }

    onChange(updateInTree(linksWithIds))
  }

  const handleDelete = (linkId: string | number) => {
    if (!confirm('Delete this link and all its sub-items?')) return

    const deleteFromTree = (items: NavigationLink[]): NavigationLink[] => {
      return items
        .filter((item) => item.id !== linkId)
        .map((item) => ({
          ...item,
          subItems: item.subItems ? deleteFromTree(item.subItems) : [],
        }))
    }

    onChange(deleteFromTree(linksWithIds))
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      newSet.delete(linkId)
      return newSet
    })
  }

  const handleAddChild = (parentId: string | number) => {
    const addChild = (items: NavigationLink[]): NavigationLink[] => {
      return items.map((item) => {
        if (item.id === parentId) {
          const newChild: NavigationLink = {
            id: `link-${Date.now()}-${Math.random()}`,
            label: 'New Link',
            linkType: 'page',
            pageId: null,
            url: '',
          }
          return {
            ...item,
            subItems: [...(item.subItems || []), newChild],
          }
        }
        if (item.subItems) {
          return { ...item, subItems: addChild(item.subItems) }
        }
        return item
      })
    }

    onChange(addChild(linksWithIds))
  }

  const handleToggleCollapse = (linkId: string | number) => {
    setCollapsedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(linkId)) {
        newSet.delete(linkId)
      } else {
        newSet.add(linkId)
      }
      return newSet
    })
  }

  const handleToggleSelect = (linkId: string | number, isShiftKey: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(linkId)) {
        newSet.delete(linkId)
      } else {
        newSet.add(linkId)
      }
      return newSet
    })
  }

  const handleAddTopLevel = () => {
    const newLink: NavigationLink = {
      id: `link-${Date.now()}-${Math.random()}`,
      label: 'New Link',
      linkType: 'page',
      pageId: null,
      url: '',
    }
    onChange([...linksWithIds, newLink])
  }

  const handleCut = () => {
    const selectedLinks = linksWithIds.filter((link) => selectedIds.has(link.id!))
    setClipboard({ action: 'cut', items: selectedLinks })
  }

  const handleCopy = () => {
    const selectedLinks = linksWithIds.filter((link) => selectedIds.has(link.id!))
    setClipboard({ action: 'copy', items: selectedLinks })
  }

  const handlePaste = () => {
    if (!clipboard) return

    const newItems = clipboard.items.map((item, idx) => ({
      ...item,
      id: `link-${Date.now()}-${idx}-${Math.random()}`,
    }))

    if (clipboard.action === 'cut') {
      const idsToRemove = new Set(clipboard.items.map((item) => item.id))
      const filtered = linksWithIds.filter((link) => !idsToRemove.has(link.id))
      onChange([...filtered, ...newItems])
      setClipboard(null)
    } else {
      onChange([...linksWithIds, ...newItems])
    }

    setSelectedIds(new Set())
  }

  const handleDeleteSelected = () => {
    if (!confirm(`Delete ${selectedIds.size} selected item(s)?`)) return

    const deleteFromTree = (items: NavigationLink[]): NavigationLink[] => {
      return items
        .filter((item) => !selectedIds.has(item.id!))
        .map((item) => ({
          ...item,
          subItems: item.subItems ? deleteFromTree(item.subItems) : [],
        }))
    }

    onChange(deleteFromTree(linksWithIds))
    setSelectedIds(new Set())
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b">
        <button
          onClick={handleAddTopLevel}
          className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Link
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCut}
            disabled={selectedIds.size === 0}
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Cut (Ctrl+X)"
          >
            Cut
          </button>
          <button
            onClick={handleCopy}
            disabled={selectedIds.size === 0}
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Copy (Ctrl+C)"
          >
            Copy
          </button>
          <button
            onClick={handlePaste}
            disabled={!clipboard}
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Paste (Ctrl+V)"
          >
            Paste
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete selected"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Selection info */}
      {selectedIds.size > 0 && (
        <div className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded">
          {selectedIds.size} item(s) selected
        </div>
      )}

      {/* Tree view */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={linksWithIds.map((l) => l.id!)} strategy={verticalListSortingStrategy}>
          <div className="border rounded-lg bg-white max-h-[500px] overflow-y-auto">
            {linksWithIds.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="mb-2">No navigation links yet</p>
                <p className="text-sm">Click "Add Link" to create your first link</p>
              </div>
            ) : (
              linksWithIds.map((link) => (
                <TreeNode
                  key={link.id}
                  link={link}
                  depth={0}
                  pages={pages}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onAddChild={handleAddChild}
                  onToggleCollapse={handleToggleCollapse}
                  isCollapsed={collapsedIds.has(link.id!)}
                  collapsedIds={collapsedIds}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  allowSubItems={allowSubItems}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Help text */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Double-click label to edit</p>
        <p>• Drag handle to reorder</p>
        {allowSubItems && <p>• Click + to add sub-item</p>}
        <p>• Use checkboxes for bulk operations</p>
      </div>
    </div>
  )
}
