with open(r'D:\Pagevoo\pagevoo-frontend\src\pages\TemplateBuilder.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The replacement component usage
replacement = '''    {/* Floating Rich Text Editor */}
    <FloatingTextEditor
      editingText={editingText}
      editorHeight={editorHeight}
      handleEditorDragStart={handleEditorDragStart}
      handleCloseTextEditor={handleCloseTextEditor}
      toggleEditorFullscreen={toggleEditorFullscreen}
      isEditorFullscreen={isEditorFullscreen}
      showCodeView={showCodeView}
      setEditingText={setEditingText}
      handleTextEdit={handleTextEdit}
      editorRef={editorRef}
      handleTextEditorChange={handleTextEditorChange}
      updateFormattingState={updateFormattingState}
      handleEditorClick={handleEditorClick}
      handleEditorPaste={handleEditorPaste}
      applyFormatting={applyFormatting}
      currentFormatting={currentFormatting}
      applyFontSize={applyFontSize}
      handleOpenColorPicker={handleOpenColorPicker}
      handleOpenLinkModal={handleOpenLinkModal}
      handleOpenInsertImageModal={handleOpenInsertImageModal}
      setShowCodeView={setShowCodeView}
      showColorPicker={showColorPicker}
      setShowColorPicker={setShowColorPicker}
      tempColor={tempColor}
      setTempColor={setTempColor}
      handleApplyColorFromPicker={handleApplyColorFromPicker}
      showLinkModal={showLinkModal}
      setShowLinkModal={setShowLinkModal}
      linkText={linkText}
      setLinkText={setLinkText}
      linkUrl={linkUrl}
      setLinkUrl={setLinkUrl}
      handleApplyLink={handleApplyLink}
      handleRemoveLink={handleRemoveLink}
      showInsertImageModal={showInsertImageModal}
      setShowInsertImageModal={setShowInsertImageModal}
      imageInsertMode={imageInsertMode}
      setImageInsertMode={setImageInsertMode}
      imageUrl={imageUrl}
      setImageUrl={setImageUrl}
      selectedGalleryImage={selectedGalleryImage}
      setSelectedGalleryImage={setSelectedGalleryImage}
      template={template}
      handleInsertImage={handleInsertImage}
      selectedImage={selectedImage}
      setSelectedImage={setSelectedImage}
      imageAltText={imageAltText}
      setImageAltText={setImageAltText}
      applyImageAltText={applyImageAltText}
      imageLink={imageLink}
      setImageLink={setImageLink}
      imageLinkTarget={imageLinkTarget}
      setImageLinkTarget={setImageLinkTarget}
      applyImageLink={applyImageLink}
      imageAspectRatio={imageAspectRatio}
      constrainProportions={constrainProportions}
      setConstrainProportions={setConstrainProportions}
      imageWidth={imageWidth}
      handleWidthChange={handleWidthChange}
      imageHeight={imageHeight}
      handleHeightChange={handleHeightChange}
      setImageWidthTo100={setImageWidthTo100}
      applyImageDimensions={applyImageDimensions}
    />

'''

# Lines 1160-1684 contain the old floating text editor (525 lines)
# We keep everything before line 1160 (index 1159) and everything after line 1684 (index 1684)
new_content = lines[:1159] + [replacement] + lines[1684:]

with open(r'D:\Pagevoo\pagevoo-frontend\src\pages\TemplateBuilder.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_content)

print("Replaced lines 1160-1684 with FloatingTextEditor component")
print(f"Reduced file by ~{525 - len(replacement.split(chr(10)))} lines")
