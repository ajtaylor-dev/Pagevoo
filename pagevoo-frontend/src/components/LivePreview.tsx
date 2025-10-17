import React, { useEffect, useRef } from 'react'

interface LivePreviewProps {
  isOpen: boolean
  onClose: () => void
  htmlContent: string
  cssContent: string
  title?: string
}

export function LivePreview({ isOpen, onClose, htmlContent, cssContent, title = 'Live Preview' }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (isOpen && iframeRef.current) {
      const iframe = iframeRef.current
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document

      if (iframeDoc) {
        // Inject the complete HTML with CSS
        const fullHTML = htmlContent.replace(
          '<style>',
          `<style>${cssContent}\n`
        )

        iframeDoc.open()
        iframeDoc.write(fullHTML)
        iframeDoc.close()
      }
    }
  }, [isOpen, htmlContent, cssContent])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (iframeRef.current?.contentWindow) {
                  iframeRef.current.contentWindow.location.reload()
                }
              }}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded transition"
              title="Refresh preview"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded transition"
            >
              Close
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-gray-100 p-4 overflow-hidden">
          <div className="w-full h-full bg-white rounded shadow-lg overflow-hidden">
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
              title="Live Preview"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
          <p>Live Preview - This shows how your page will look when published</p>
        </div>
      </div>
    </div>
  )
}
