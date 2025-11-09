import React from 'react'

interface ColorPickerModalProps {
  isOpen: boolean
  onClose: () => void
  tempColor: string
  setTempColor: (color: string) => void
  onApply: () => void
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  isOpen,
  onClose,
  tempColor,
  setTempColor,
  onApply
}) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-4 max-w-sm w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Choose Text Color</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Color Presets */}
        <div className="grid grid-cols-8 gap-2 mb-3">
          {[
            '#000000', '#FFFFFF', '#F3F4F6', '#D1D5DB', '#6B7280', '#374151', '#1F2937', '#111827',
            '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
            '#DC2626', '#D97706', '#059669', '#2563EB', '#7C3AED', '#DB2777', '#0D9488', '#EA580C',
            '#991B1B', '#92400E', '#065F46', '#1E40AF', '#5B21B6', '#9F1239', '#115E59', '#9A3412'
          ].map(color => (
            <button
              key={color}
              onClick={() => setTempColor(color)}
              className={`w-8 h-8 rounded border-2 transition ${
                tempColor === color ? 'border-blue-500 scale-110' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        {/* Hex Input */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">Hex Code</label>
          <input
            type="text"
            value={tempColor}
            onChange={(e) => {
              const value = e.target.value
              if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                setTempColor(value)
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="#000000"
            maxLength={7}
          />
        </div>

        {/* Preview */}
        <div className="mb-3 p-3 border border-gray-300 rounded">
          <div
            className="w-full h-12 rounded flex items-center justify-center text-sm font-medium"
            style={{ backgroundColor: tempColor, color: tempColor }}
          >
            <span style={{
              color: parseInt(tempColor.replace('#', ''), 16) > 0xffffff/2 ? '#000' : '#fff'
            }}>
              Preview
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onApply}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
