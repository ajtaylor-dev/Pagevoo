with open(r'D:\Pagevoo\pagevoo-frontend\src\pages\TemplateBuilder.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The replacement - hook usage
replacement = '''
  // Template Builder Effects (useEffects)
  useTemplateBuilderEffects({
    templateRef,
    template,
    setTemplate,
    templateId,
    setCurrentPage,
    setLoading,
    setHistory,
    setHistoryIndex,
    setCanUndo,
    setCanRedo,
    setIsPublished,
    setHasUnsavedChanges,
    canUndo,
    canRedo,
    hasUnsavedChanges,
    handleNew,
    handleSave,
    handleUndo,
    handleRedo,
    handleLoad,
    showFileMenu,
    setShowFileMenu,
    showEditMenu,
    setShowEditMenu,
    showInsertMenu,
    setShowInsertMenu,
    showViewMenu,
    setShowViewMenu,
    fileMenuRef,
    editMenuRef,
    insertMenuRef,
    viewMenuRef,
    selectedSection,
    setShowSectionCSS,
    currentPage,
    showSourceCodeModal,
    setEditableHTML,
    showStylesheetModal,
    setEditableCSS
  })

'''

# Lines 264-449 contain the useEffect blocks (186 lines)
# We keep everything before line 264 (index 263) and everything after line 449 (index 449)
new_content = lines[:263] + [replacement] + lines[449:]

with open(r'D:\Pagevoo\pagevoo-frontend\src\pages\TemplateBuilder.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_content)

print("Replaced lines 264-449 with useTemplateBuilderEffects hook")
print(f"Reduced file by ~{186 - len(replacement.split(chr(10)))} lines")
