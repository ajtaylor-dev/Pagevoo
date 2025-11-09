import { useState } from 'react'

interface UseResizeHandlersProps {
  initialLeftWidth?: number
  initialRightWidth?: number
}

export const useResizeHandlers = ({
  initialLeftWidth = 280,
  initialRightWidth = 320
}: UseResizeHandlersProps = {}) => {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth)
  const [rightWidth, setRightWidth] = useState(initialRightWidth)
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)

  const handleLeftMouseDown = () => setIsResizingLeft(true)
  const handleRightMouseDown = () => setIsResizingRight(true)

  const handleMouseUp = () => {
    setIsResizingLeft(false)
    setIsResizingRight(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isResizingLeft) {
      const newWidth = e.clientX
      if (newWidth >= 200 && newWidth <= 500) {
        setLeftWidth(newWidth)
      }
    }
    if (isResizingRight) {
      const newWidth = window.innerWidth - e.clientX
      if (newWidth >= 250 && newWidth <= 600) {
        setRightWidth(newWidth)
      }
    }
  }

  return {
    leftWidth,
    rightWidth,
    isResizingLeft,
    isResizingRight,
    setLeftWidth,
    setRightWidth,
    handleLeftMouseDown,
    handleRightMouseDown,
    handleMouseUp,
    handleMouseMove
  }
}
