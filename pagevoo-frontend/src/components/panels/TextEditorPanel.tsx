import React from 'react'

interface EditingText {
  sectionId: number
  field: string
  value: string
}

interface CurrentFormatting {
  bold: boolean
  italic: boolean
  underline: boolean
  color: string
  fontSize: string
  alignment: string
}

interface TextEditorPanelProps {
  editingText: EditingText | null
  editorHeight: number
  handleEditorDragStart: (e: React.MouseEvent) => void
  toggleEditorFullscreen: () => void
  isEditorFullscreen: boolean
  handleCloseTextEditor: () => void
  currentFormatting: CurrentFormatting
  applyFormatting: (command: string) => void
  editorRef: React.MutableRefObject<HTMLDivElement | null>
  handleTextEditorChange: (html: string) => void
  updateFormattingState: () => void
  handleOpenColorPicker: () => void
  applyFontSize: (size: string) => void
  handleOpenLinkModal: () => void
  handleOpenInsertImageModal: () => void
  showCodeView: boolean
  setShowCodeView: (show: boolean) => void
  setEditingText: (text: EditingText) => void
  handleTextEdit: (sectionId: number, field: string, value: string) => void
  handleEditorClick: (e: React.MouseEvent) => void
  handleEditorPaste: (e: React.ClipboardEvent) => void
  template: any
}

export const TextEditorPanel: React.FC<TextEditorPanelProps> = ({
  editingText,
  editorHeight,
  handleEditorDragStart,
  toggleEditorFullscreen,
  isEditorFullscreen,
  handleCloseTextEditor,
  currentFormatting,
  applyFormatting,
  editorRef,
  handleTextEditorChange,
  updateFormattingState,
  handleOpenColorPicker,
  applyFontSize,
  handleOpenLinkModal,
  handleOpenInsertImageModal,
  showCodeView,
  setShowCodeView,
  setEditingText,
  handleTextEdit,
  handleEditorClick,
  handleEditorPaste,
  template
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
                    // This will be handled by parent component
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
                editorRef.current = el
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
      </div>
    </div>
  )
}
