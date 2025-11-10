with open(r'D:\Pagevoo\pagevoo-frontend\src\pages\TemplateBuilder.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The replacement component usage
replacement = '''            {/* Page Selector */}
            <PageSelectorBar
              currentPage={currentPage}
              template={template}
              setCurrentPage={setCurrentPage}
              setShowCSSPanel={setShowCSSPanel}
              setShowSectionCSS={setShowSectionCSS}
              setSelectedSection={setSelectedSection}
              setShowRightSidebar={setShowRightSidebar}
              cssInspectorMode={cssInspectorMode}
              setCssInspectorMode={setCssInspectorMode}
              handleSetHomepage={handleSetHomepage}
              handleDeletePage={handleDeletePage}
              setShowAddPageModal={setShowAddPageModal}
            />

'''

# Lines 994-1065 contain the old Page Selector Bar (72 lines)
# We keep everything before line 994 (index 993) and everything after line 1065 (index 1065)
new_content = lines[:993] + [replacement] + lines[1066:]

with open(r'D:\Pagevoo\pagevoo-frontend\src\pages\TemplateBuilder.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_content)

print("Replaced lines 994-1066 with PageSelectorBar component")
print(f"Reduced file by ~{72 - len(replacement.split(chr(10)))} lines")
