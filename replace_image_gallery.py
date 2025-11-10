with open(r'D:\Pagevoo\pagevoo-frontend\src\pages\TemplateBuilder.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The replacement - much simpler component usage
replacement = '''      {/* Image Gallery Modal */}
      {console.log('About to render ImageGallery conditional, showImageGallery:', showImageGallery, 'ref:', imageGalleryRef.current, 'template ID:', template?.id)}
      {(showImageGallery || imageGalleryRef.current) ? (
        <>
          {console.log('Rendering ImageGallery component NOW')}
          <ImageGallery
            isOpen={true}
            onClose={handleImageGalleryClose}
            templateId={template?.id || 0}
            images={template?.images || []}
            onUpload={handleImageUpload}
            onDelete={handleImageDelete}
            onRename={handleImageRename}
          />
        </>
      ) : null}

'''

# Lines 1183-1274 contain the old ImageGallery with inline handlers (92 lines)
# We keep everything before line 1183 (index 1182) and everything after line 1274 (index 1274)
new_content = lines[:1182] + [replacement] + lines[1274:]

with open(r'D:\Pagevoo\pagevoo-frontend\src\pages\TemplateBuilder.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_content)

print("Replaced lines 1183-1274 with simplified ImageGallery component")
print(f"Reduced file by ~{92 - len(replacement.split(chr(10)))} lines")
