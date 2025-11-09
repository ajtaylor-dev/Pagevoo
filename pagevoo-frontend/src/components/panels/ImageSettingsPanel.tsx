import React from 'react'

interface ImageSettingsPanelProps {
  selectedImage: HTMLImageElement | null
  onClose: () => void
  imageAltText: string
  setImageAltText: (text: string) => void
  applyImageAltText: () => void
  imageLink: string
  setImageLink: (url: string) => void
  imageLinkTarget: string
  setImageLinkTarget: (target: string) => void
  applyImageLink: () => void
  imageWidth: number
  imageHeight: number
  handleWidthChange: (width: number) => void
  handleHeightChange: (height: number) => void
  constrainProportions: boolean
  setConstrainProportions: (constrain: boolean) => void
  imageAspectRatio: number
  setImageWidthTo100: () => void
  applyImageDimensions: () => void
}

export const ImageSettingsPanel: React.FC<ImageSettingsPanelProps> = ({
  selectedImage,
  onClose,
  imageAltText,
  setImageAltText,
  applyImageAltText,
  imageLink,
  setImageLink,
  imageLinkTarget,
  setImageLinkTarget,
  applyImageLink,
  imageWidth,
  imageHeight,
  handleWidthChange,
  handleHeightChange,
  constrainProportions,
  setConstrainProportions,
  imageAspectRatio,
  setImageWidthTo100,
  applyImageDimensions
}) => {
  if (!selectedImage) return null

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 z-[9998] w-80 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold">Image Settings</h4>
        <button
          onClick={onClose}
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
  )
}
