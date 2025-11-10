import React from 'react'
import { ColorPickerModal } from '../modals/ColorPickerModal'
import { LinkModal } from '../modals/LinkModal'
import { InsertImageModal } from '../modals/InsertImageModal'

interface Template {
  id: number
  name: string
  template_slug?: string
  description: string
  business_type: string
  is_active: boolean
  pages: any[]
  preview_image: string | null
  exclusive_to: 'pro' | 'niche' | null
  technologies: string[]
  features: string[]
  custom_css?: string
  images?: Array<{
    id: string
    filename: string
    path: string
    size: number
    uploaded_at: string
  }>
}

interface FloatingTextEditorProps {
  editingText: { sectionId: number; field: string; value: string } | null
  editorHeight: number
  handleEditorDragStart: (e: React.MouseEvent) => void
  handleCloseTextEditor: () => void
  toggleEditorFullscreen: () => void
  isEditorFullscreen: boolean
  showCodeView: boolean
  setEditingText: (editingText: { sectionId: number; field: string; value: string } | null) => void
  handleTextEdit: (sectionId: number, field: string, value: string) => void
  editorRef: React.RefObject<HTMLDivElement>
  handleTextEditorChange: (html: string) => void
  updateFormattingState: () => void
  handleEditorClick: (e: React.MouseEvent) => void
  handleEditorPaste: (e: React.ClipboardEvent) => void
  applyFormatting: (command: string, value?: string) => void
  currentFormatting: {
    bold: boolean
    italic: boolean
    underline: boolean
    fontSize: string
    color: string
    alignment: string
  }
  applyFontSize: (size: string) => void
  handleOpenColorPicker: () => void
  handleOpenLinkModal: () => void
  handleOpenInsertImageModal: () => void
  setShowCodeView: (show: boolean) => void
  showColorPicker: boolean
  setShowColorPicker: (show: boolean) => void
  tempColor: string
  setTempColor: (color: string) => void
  handleApplyColorFromPicker: () => void
  showLinkModal: boolean
  setShowLinkModal: (show: boolean) => void
  linkText: string
  setLinkText: (text: string) => void
  linkUrl: string
  setLinkUrl: (url: string) => void
  handleApplyLink: () => void
  handleRemoveLink: () => void
  showInsertImageModal: boolean
  setShowInsertImageModal: (show: boolean) => void
  imageInsertMode: 'url' | 'gallery'
  setImageInsertMode: (mode: 'url' | 'gallery') => void
  imageUrl: string
  setImageUrl: (url: string) => void
  selectedGalleryImage: string | null
  setSelectedGalleryImage: (image: string | null) => void
  template: Template | null
  handleInsertImage: () => void
  selectedImage: HTMLImageElement | null
  setSelectedImage: (image: HTMLImageElement | null) => void
  imageAltText: string
  setImageAltText: (text: string) => void
  applyImageAltText: () => void
  imageLink: string
  setImageLink: (link: string) => void
  imageLinkTarget: '_self' | '_blank'
  setImageLinkTarget: (target: '_self' | '_blank') => void
  applyImageLink: () => void
  imageAspectRatio: number
  constrainProportions: boolean
  setConstrainProportions: (constrain: boolean) => void
  imageWidth: number
  handleWidthChange: (width: number) => void
  imageHeight: number
  handleHeightChange: (height: number) => void
  setImageWidthTo100: () => void
  applyImageDimensions: () => void
}

export const FloatingTextEditor: React.FC<FloatingTextEditorProps> = ({
  editingText,
  editorHeight,
  handleEditorDragStart,
  handleCloseTextEditor,
  toggleEditorFullscreen,
  isEditorFullscreen,
  showCodeView,
  setEditingText,
  handleTextEdit,
  editorRef,
  handleTextEditorChange,
  updateFormattingState,
  handleEditorClick,
  handleEditorPaste,
  applyFormatting,
  currentFormatting,
  applyFontSize,
  handleOpenColorPicker,
  handleOpenLinkModal,
  handleOpenInsertImageModal,
  setShowCodeView,
  showColorPicker,
  setShowColorPicker,
  tempColor,
  setTempColor,
  handleApplyColorFromPicker,
  showLinkModal,
  setShowLinkModal,
  linkText,
  setLinkText,
  linkUrl,
  setLinkUrl,
  handleApplyLink,
  handleRemoveLink,
  showInsertImageModal,
  setShowInsertImageModal,
  imageInsertMode,
  setImageInsertMode,
  imageUrl,
  setImageUrl,
  selectedGalleryImage,
  setSelectedGalleryImage,
  template,
  handleInsertImage,
  selectedImage,
  setSelectedImage,
  imageAltText,
  setImageAltText,
  applyImageAltText,
  imageLink,
  setImageLink,
  imageLinkTarget,
  setImageLinkTarget,
  applyImageLink,
  imageAspectRatio,
  constrainProportions,
  setConstrainProportions,
  imageWidth,
  handleWidthChange,
  imageHeight,
  handleHeightChange,
  setImageWidthTo100,
  applyImageDimensions
}) => {
  if (!editingText) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-500 shadow-2xl z-50 animate-slide-up"
      style={{ height: `${editorHeight}px` }}
    >
      {/* Resize Handle */}
      <div
        onMouseDown={handleEditorDragStart}
        className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-400 bg-blue-500 transition flex items-center justify-center group"
      >
        <div className="w-12 h-1 bg-white rounded-full opacity-60 group-hover:opacity-100 transition"></div>
      </div>

      <div className="max-w-7xl mx-auto p-4 h-full flex flex-col" style={{ paddingTop: '12px' }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">
            Text Editor - {editingText.field}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleEditorFullscreen}
              className="text-gray-400 hover:text-gray-600 transition"
              title={isEditorFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isEditorFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h6v6" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
            <button
              onClick={handleCloseTextEditor}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200 flex-wrap">
          {/* Bold */}
          <button
            onClick={() => applyFormatting('bold')}
            className={`px-3 py-1.5 rounded border transition ${
              currentFormatting.bold
                ? 'bg-blue-500 text-white border-blue-600'
                : 'hover:bg-white border-transparent hover:border-gray-300'
            }`}
            title="Bold (Ctrl+B)"
          >
            <strong className="text-sm">B</strong>
          </button>

          {/* Italic */}
          <button
            onClick={() => applyFormatting('italic')}
            className={`px-3 py-1.5 rounded border transition ${
              currentFormatting.italic
                ? 'bg-blue-500 text-white border-blue-600'
                : 'hover:bg-white border-transparent hover:border-gray-300'
            }`}
            title="Italic (Ctrl+I)"
          >
            <em className="text-sm">I</em>
          </button>

          {/* Underline */}
          <button
            onClick={() => applyFormatting('underline')}
            className={`px-3 py-1.5 rounded border transition ${
              currentFormatting.underline
                ? 'bg-blue-500 text-white border-blue-600'
                : 'hover:bg-white border-transparent hover:border-gray-300'
            }`}
            title="Underline (Ctrl+U)"
          >
            <span className="text-sm underline">U</span>
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          {/* Font Family */}
          <select
            onChange={(e) => {
              if (!editorRef.current) return
              editorRef.current.focus()
              document.execCommand('fontName', false, e.target.value)
              setTimeout(() => {
                if (editorRef.current) {
                  handleTextEditorChange(editorRef.current.innerHTML)
                  updateFormattingState()
                }
              }, 10)
            }}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-white transition max-w-[120px]"
            title="Font Family"
            defaultValue=""
          >
            <option value="" disabled>Font</option>
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            <option value="Courier New">Courier New</option>
            <option value="Verdana">Verdana</option>
            <option value="Trebuchet MS">Trebuchet MS</option>
          </select>

          {/* Heading Level */}
          <select
            onChange={(e) => {
              if (!editorRef.current) return
              editorRef.current.focus()
              document.execCommand('formatBlock', false, e.target.value)
              setTimeout(() => {
                if (editorRef.current) {
                  handleTextEditorChange(editorRef.current.innerHTML)
                  updateFormattingState()
                  // Force canvas update by triggering state change
                  if (template && editingText) {
                    // Note: This may need adjustment based on parent component
                  }
                }
              }, 10)
              // Reset select to default after applying
              e.target.value = ''
            }}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-white transition"
            title="Heading Level"
            value=""
          >
            <option value="" disabled>Heading</option>
            <option value="p">Normal</option>
            <option value="h1">H1</option>
            <option value="h2">H2</option>
            <option value="h3">H3</option>
            <option value="h4">H4</option>
          </select>

          {/* Text Color */}
          <button
            onClick={handleOpenColorPicker}
            className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded hover:bg-white transition"
            title="Text Color"
          >
            <div
              className="w-6 h-6 rounded border border-gray-400"
              style={{ backgroundColor: currentFormatting.color }}
            />
            <span className="text-xs text-gray-600 font-mono">{currentFormatting.color}</span>
          </button>

          {/* Font Size */}
          <select
            value={currentFormatting.fontSize}
            onChange={(e) => applyFontSize(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-white transition"
            title="Font Size"
          >
            <option value="10px">10px</option>
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
            <option value="28px">28px</option>
            <option value="32px">32px</option>
            <option value="36px">36px</option>
            <option value="48px">48px</option>
            <option value="64px">64px</option>
          </select>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          {/* Alignment */}
          <button
            onClick={() => applyFormatting('justifyLeft')}
            className={`px-2 py-1.5 rounded border transition ${
              currentFormatting.alignment === 'left'
                ? 'bg-blue-500 text-white border-blue-600'
                : 'hover:bg-white border-transparent hover:border-gray-300'
            }`}
            title="Align Left"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => applyFormatting('justifyCenter')}
            className={`px-2 py-1.5 rounded border transition ${
              currentFormatting.alignment === 'center'
                ? 'bg-blue-500 text-white border-blue-600'
                : 'hover:bg-white border-transparent hover:border-gray-300'
            }`}
            title="Align Center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => applyFormatting('justifyRight')}
            className={`px-2 py-1.5 rounded border transition ${
              currentFormatting.alignment === 'right'
                ? 'bg-blue-500 text-white border-blue-600'
                : 'hover:bg-white border-transparent hover:border-gray-300'
            }`}
            title="Align Right"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M14 12h6M4 18h16" />
            </svg>
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          {/* Lists */}
          <button
            onClick={() => applyFormatting('insertUnorderedList')}
            className="px-2 py-1.5 hover:bg-white rounded border border-transparent hover:border-gray-300 transition"
            title="Bullet List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              <circle cx="2" cy="6" r="1" fill="currentColor" />
              <circle cx="2" cy="12" r="1" fill="currentColor" />
              <circle cx="2" cy="18" r="1" fill="currentColor" />
            </svg>
          </button>
          <button
            onClick={() => applyFormatting('insertOrderedList')}
            className="px-2 py-1.5 hover:bg-white rounded border border-transparent hover:border-gray-300 transition"
            title="Numbered List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          {/* Link */}
          <button
            onClick={handleOpenLinkModal}
            className="px-2 py-1.5 hover:bg-white rounded border border-transparent hover:border-gray-300 transition"
            title="Insert/Edit Link"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>

          {/* Insert Image */}
          <button
            onClick={handleOpenInsertImageModal}
            className="px-2 py-1.5 hover:bg-white rounded border border-transparent hover:border-gray-300 transition"
            title="Insert Image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          {/* Clear Formatting */}
          <button
            onClick={() => applyFormatting('removeFormat')}
            className="px-3 py-1.5 text-xs hover:bg-white rounded border border-transparent hover:border-gray-300 transition"
            title="Clear Formatting"
          >
            Clear
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          {/* Code View Toggle */}
          <button
            onClick={() => setShowCodeView(!showCodeView)}
            className={`px-3 py-1.5 text-xs rounded border transition ${
              showCodeView
                ? 'bg-gray-700 text-white border-gray-800'
                : 'hover:bg-white border-transparent hover:border-gray-300'
            }`}
            title="Toggle Code View"
          >
            {'</>'}
          </button>
        </div>

        {showCodeView ? (
          <textarea
            value={editingText.value}
            onChange={(e) => {
              setEditingText({ ...editingText, value: e.target.value })
              handleTextEdit(editingText.sectionId, editingText.field, e.target.value)
            }}
            className="flex-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs overflow-y-auto bg-gray-900 text-green-400"
            spellCheck={false}
          />
        ) : (
          <div
            ref={(el) => {
              if (el) {
                (editorRef as any).current = el
                // Always sync the innerHTML with current editingText.value
                if (el.innerHTML !== editingText.value) {
                  el.innerHTML = editingText.value
                }
              }
            }}
            contentEditable
            onInput={(e) => handleTextEditorChange(e.currentTarget.innerHTML)}
            onMouseUp={updateFormattingState}
            onKeyUp={updateFormattingState}
            onFocus={updateFormattingState}
            onClick={handleEditorClick}
            onPaste={handleEditorPaste}
            className="flex-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans text-base overflow-y-auto bg-white wysiwyg-editor"
            suppressContentEditableWarning
          />
        )}

        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>
            {showCodeView
              ? 'Edit HTML directly. Switch back to visual mode to see formatted preview.'
              : 'Use the toolbar to format your text. Changes are applied live to the canvas above.'
            }
          </span>
          <span className="font-mono text-[10px]">
            {showCodeView ? 'HTML' : 'WYSIWYG'}
          </span>
        </div>

        {/* Color Picker Modal */}
        <ColorPickerModal
          isOpen={showColorPicker}
          onClose={() => setShowColorPicker(false)}
          tempColor={tempColor}
          setTempColor={setTempColor}
          onApply={handleApplyColorFromPicker}
        />

        {/* Link Modal */}
        <LinkModal
          isOpen={showLinkModal}
          onClose={() => setShowLinkModal(false)}
          linkText={linkText}
          setLinkText={setLinkText}
          linkUrl={linkUrl}
          setLinkUrl={setLinkUrl}
          onApply={handleApplyLink}
          onRemove={handleRemoveLink}
        />

        {/* Insert Image Modal */}
        <InsertImageModal
          isOpen={showInsertImageModal}
          onClose={() => setShowInsertImageModal(false)}
          imageInsertMode={imageInsertMode}
          setImageInsertMode={setImageInsertMode}
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          selectedGalleryImage={selectedGalleryImage}
          setSelectedGalleryImage={setSelectedGalleryImage}
          template={template}
          onInsert={handleInsertImage}
        />

        {/* Image Resize Controls */}
        {selectedImage && (
          <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 z-[9998] w-80 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">Image Settings</h4>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {/* Alt Text Input */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Alt Text (Accessibility)
                </label>
                <input
                  type="text"
                  value={imageAltText}
                  onChange={(e) => setImageAltText(e.target.value)}
                  onBlur={applyImageAltText}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe this image..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Helps screen readers and SEO
                </p>
              </div>

              {/* Link Input */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Link URL (Optional)
                </label>
                <input
                  type="url"
                  value={imageLink}
                  onChange={(e) => setImageLink(e.target.value)}
                  onBlur={applyImageLink}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="link-new-tab"
                    checked={imageLinkTarget === '_blank'}
                    onChange={(e) => {
                      setImageLinkTarget(e.target.checked ? '_blank' : '_self')
                      if (imageLink) applyImageLink()
                    }}
                    className="w-3 h-3 text-blue-600 rounded"
                  />
                  <label htmlFor="link-new-tab" className="text-xs text-gray-600 cursor-pointer select-none">
                    Open in new tab
                  </label>
                </div>
                {imageLink && (
                  <button
                    onClick={() => {
                      setImageLink('')
                      setImageLinkTarget('_self')
                      applyImageLink()
                    }}
                    className="text-xs text-red-600 hover:text-red-700 mt-1"
                  >
                    Remove Link
                  </button>
                )}
              </div>

              <div className="border-t border-gray-200 my-3"></div>

              {/* Width Input */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Width (px)</label>
                <input
                  type="number"
                  value={imageWidth}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="50"
                />
              </div>

              {/* Height Input */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Height (px)</label>
                <input
                  type="number"
                  value={imageHeight}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="50"
                />
              </div>

              {/* Constrain Proportions Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="constrain-proportions"
                  checked={constrainProportions}
                  onChange={(e) => setConstrainProportions(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="constrain-proportions" className="text-xs text-gray-700 cursor-pointer select-none">
                  Constrain Proportions
                </label>
              </div>

              {/* Aspect Ratio Info */}
              <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                <p>Aspect Ratio: {imageAspectRatio.toFixed(2)}</p>
              </div>

              {/* Buttons */}
              <div className="space-y-2 mt-3">
                {/* Set to 100% Button */}
                <button
                  onClick={setImageWidthTo100}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition"
                >
                  Set Width to 100%
                </button>

                {/* Apply Button */}
                <button
                  onClick={applyImageDimensions}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
                >
                  Apply Custom Size
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
