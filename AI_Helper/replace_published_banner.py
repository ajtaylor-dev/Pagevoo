with open(r'D:\Pagevoo\pagevoo-frontend\src\pages\TemplateBuilder.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The replacement - simpler component usage
replacement = '''      {/* Published Template Indicator Banner */}
      {isPublished && (
        <PublishedTemplateBanner
          template={template!}
          setTemplate={setTemplate}
          setIsPublished={setIsPublished}
        />
      )}

'''

# Lines 942-971 contain the old Published Template Banner (30 lines)
# We keep everything before line 942 (index 941) and everything after line 971 (index 971)
new_content = lines[:941] + [replacement] + lines[971:]

with open(r'D:\Pagevoo\pagevoo-frontend\src\pages\TemplateBuilder.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_content)

print("Replaced lines 942-971 with PublishedTemplateBanner component")
print(f"Reduced file by ~{30 - len(replacement.split(chr(10)))} lines")
