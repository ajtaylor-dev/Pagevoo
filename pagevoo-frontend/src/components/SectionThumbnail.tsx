import React from 'react'

interface SectionConfig {
  type: string
  label: string
  cols?: number
  rows?: number
}

interface SectionThumbnailProps {
  section: SectionConfig
}

export const SectionThumbnail: React.FC<SectionThumbnailProps> = ({ section }) => {
  if (section.cols) {
    // Core grid section - render visual thumbnail
    const gridItems = Array(section.cols * section.rows!).fill(null)
    return (
      <div className="w-full aspect-video bg-white rounded border border-gray-300 p-1 flex items-center justify-center">
        <div
          className="grid gap-0.5 w-full h-full"
          style={{ gridTemplateColumns: `repeat(${section.cols}, 1fr)` }}
        >
          {gridItems.map((_, idx) => (
            <div key={idx} className="bg-[#d4e5d0] rounded-sm border border-[#d4e5d0]"></div>
          ))}
        </div>
      </div>
    )
  } else {
    // Special section - show icon placeholder
    return (
      <div className="w-full aspect-video bg-gradient-to-br from-[#e8f0e6] to-[#d4e5d0] rounded border border-[#d4e5d0] flex items-center justify-center">
        <div className="text-2xl font-bold text-[#5a7a54]">
          {section.label.charAt(0)}
        </div>
      </div>
    )
  }
}
