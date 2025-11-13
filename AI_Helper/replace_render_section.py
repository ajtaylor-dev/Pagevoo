with open(r'D:\Pagevoo\pagevoo-frontend\src\pages\TemplateBuilder.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The replacement - hook usage
replacement = '''
  // Render Section Hook
  const { renderSection } = useRenderSection({
    selectedSection,
    editingText,
    handleOpenTextEditor,
    handleGridColumnUpdate,
    currentPage,
    template,
    mobileMenuOpen,
    setMobileMenuOpen,
    hoveredSection,
    setHoveredSection,
    setSelectedSection,
    showCSSPanel,
    setShowCSSPanel,
    cssInspectorMode,
    handleMoveSidebar,
    handleMoveSection,
    handleToggleSectionLock,
    handleDeleteSection
  })

'''

# Lines 756-846 contain the old renderSection function (91 lines)
# We keep everything before line 756 (index 755) and everything after line 846 (index 846)
new_content = lines[:755] + [replacement] + lines[846:]

with open(r'D:\Pagevoo\pagevoo-frontend\src\pages\TemplateBuilder.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_content)

print("Replaced lines 756-846 with useRenderSection hook")
print(f"Reduced file by ~{91 - len(replacement.split(chr(10)))} lines")
