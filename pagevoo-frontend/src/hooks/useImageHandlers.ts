import { RefObject } from 'react'

interface UseImageHandlersProps {
  editorRef: RefObject<HTMLDivElement>
  selectedImage: HTMLImageElement | null
  setSelectedImage: (img: HTMLImageElement | null) => void
  imageLink: string
  imageLinkTarget: '_self' | '_blank'
  imageAltText: string
  imageWidth: number
  imageHeight: number
  setImageWidth: (width: number) => void
  setImageHeight: (height: number) => void
  imageAspectRatio: number
  handleTextEditorChange: (html: string) => void
}

export const useImageHandlers = ({
  editorRef,
  selectedImage,
  setSelectedImage,
  imageLink,
  imageLinkTarget,
  imageAltText,
  imageWidth,
  imageHeight,
  setImageWidth,
  setImageHeight,
  imageAspectRatio,
  handleTextEditorChange
}: UseImageHandlersProps) => {

  // Apply link to image
  const applyImageLink = () => {
    if (!selectedImage || !editorRef.current) return

    const currentHtml = editorRef.current.innerHTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = currentHtml

    const images = tempDiv.querySelectorAll('img')
    images.forEach(img => {
      if (img.src === selectedImage.src) {
        const parentElement = img.parentElement

        // If imageLink is empty, remove link if it exists
        if (!imageLink.trim()) {
          if (parentElement && parentElement.tagName === 'A') {
            // Replace the <a> with just the <img>
            parentElement.replaceWith(img)
          }
        } else {
          // If image already has a link, update it
          if (parentElement && parentElement.tagName === 'A') {
            (parentElement as HTMLAnchorElement).href = imageLink
            (parentElement as HTMLAnchorElement).target = imageLinkTarget
          } else {
            // Wrap image in a new link
            const link = document.createElement('a')
            link.href = imageLink
            link.target = imageLinkTarget
            img.parentNode?.insertBefore(link, img)
            link.appendChild(img)
          }
        }
      }
    })

    // Update the editor content
    handleTextEditorChange(tempDiv.innerHTML)

    // Re-select the image after render
    setTimeout(() => {
      if (editorRef.current) {
        const updatedImages = editorRef.current.querySelectorAll('img')
        updatedImages.forEach(img => {
          if (img.src === selectedImage.src) {
            setSelectedImage(img as HTMLImageElement)
            img.classList.add('selected-image')
          }
        })
      }
    }, 100)
  }

  // Apply alt text to image
  const applyImageAltText = () => {
    if (!selectedImage || !editorRef.current) return

    // Update the image alt text directly in the HTML
    const currentHtml = editorRef.current.innerHTML

    // Find the image in the HTML and update its alt attribute
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = currentHtml

    const images = tempDiv.querySelectorAll('img')
    images.forEach(img => {
      if (img.src === selectedImage.src) {
        img.setAttribute('alt', imageAltText)
      }
    })

    // Update the editor content with the modified HTML
    handleTextEditorChange(tempDiv.innerHTML)

    // Update the selected image reference after re-render
    setTimeout(() => {
      if (editorRef.current) {
        const updatedImages = editorRef.current.querySelectorAll('img')
        updatedImages.forEach(img => {
          if (img.src === selectedImage.src) {
            setSelectedImage(img as HTMLImageElement)
            img.classList.add('selected-image')
          }
        })
      }
    }, 100)
  }

  // Apply image dimensions
  const applyImageDimensions = () => {
    if (!selectedImage) {
      alert('No image selected!')
      return
    }

    if (!imageWidth || !imageHeight || imageWidth < 10 || imageHeight < 10) {
      alert('Please enter valid dimensions (minimum 10px)')
      return
    }

    // Update the image styles directly in the HTML
    const currentHtml = editorRef.current?.innerHTML || ''

    // Find the image in the HTML and update its style
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = currentHtml

    const images = tempDiv.querySelectorAll('img')
    images.forEach(img => {
      if (img.src === selectedImage.src) {
        // Get current style and remove old width/height/max-width
        let styleStr = img.getAttribute('style') || ''
        styleStr = styleStr
          .replace(/width:\s*[^;]+;?/gi, '')
          .replace(/height:\s*[^;]+;?/gi, '')
          .replace(/max-width:\s*[^;]+;?/gi, '')
          .trim()

        // Add new dimensions
        if (styleStr && !styleStr.endsWith(';')) styleStr += ';'
        styleStr += ` width: ${imageWidth}px; height: ${imageHeight}px; max-width: none;`

        img.setAttribute('style', styleStr)
      }
    })

    // Update the editor content with the modified HTML
    if (editorRef.current) {
      handleTextEditorChange(tempDiv.innerHTML)
    }

    // Update the selected image reference after re-render
    setTimeout(() => {
      if (editorRef.current) {
        const updatedImages = editorRef.current.querySelectorAll('img')
        updatedImages.forEach(img => {
          if (img.src === selectedImage.src) {
            setSelectedImage(img as HTMLImageElement)
            img.classList.add('selected-image')
          }
        })
      }
    }, 100)

    // Show success feedback
    alert(`Image resized to ${imageWidth}px × ${imageHeight}px`)
  }

  // Set image width to 100%
  const setImageWidthTo100 = () => {
    if (!selectedImage) {
      alert('No image selected!')
      return
    }

    // Update the image styles directly in the HTML
    const currentHtml = editorRef.current?.innerHTML || ''

    // Find the image in the HTML and update its style
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = currentHtml

    const images = tempDiv.querySelectorAll('img')
    images.forEach(img => {
      if (img.src === selectedImage.src) {
        // Get current style and remove old width/height/max-width
        let styleStr = img.getAttribute('style') || ''
        styleStr = styleStr
          .replace(/width:\s*[^;]+;?/gi, '')
          .replace(/height:\s*[^;]+;?/gi, '')
          .replace(/max-width:\s*[^;]+;?/gi, '')
          .trim()

        // Add 100% width and auto height
        if (styleStr && !styleStr.endsWith(';')) styleStr += ';'
        styleStr += ` width: 100%; height: auto; max-width: 100%;`

        img.setAttribute('style', styleStr)
      }
    })

    // Update the editor content with the modified HTML
    if (editorRef.current) {
      handleTextEditorChange(tempDiv.innerHTML)
    }

    // Update the selected image reference and state after re-render
    setTimeout(() => {
      if (editorRef.current) {
        const updatedImages = editorRef.current.querySelectorAll('img')
        updatedImages.forEach(img => {
          if (img.src === selectedImage.src) {
            setSelectedImage(img as HTMLImageElement)
            img.classList.add('selected-image')

            // Update state to reflect actual rendered dimensions
            const parentWidth = img.parentElement?.offsetWidth || img.offsetWidth
            setImageWidth(parentWidth)
            const newHeight = Math.round(parentWidth / imageAspectRatio)
            setImageHeight(newHeight)
          }
        })
      }
    }, 100)

    alert('Image width set to 100%')
  }

  // Apply alignment to image
  const applyImageAlignment = (command: string) => {
    if (!selectedImage || !editorRef.current) return

    let displayStyle = 'block'
    let marginStyle = '0'

    if (command === 'justifyLeft') {
      displayStyle = 'block'
      marginStyle = '0 auto 0 0'
    } else if (command === 'justifyCenter') {
      displayStyle = 'block'
      marginStyle = '0 auto'
    } else if (command === 'justifyRight') {
      displayStyle = 'block'
      marginStyle = '0 0 0 auto'
    }

    // Update the image styles directly in the HTML
    const currentHtml = editorRef.current.innerHTML

    // Find the image in the HTML and update its style
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = currentHtml

    const images = tempDiv.querySelectorAll('img')
    images.forEach(img => {
      if (img.src === selectedImage.src) {
        // Get current style and remove old display/margin
        let styleStr = img.getAttribute('style') || ''
        styleStr = styleStr
          .replace(/display:\s*[^;]+;?/gi, '')
          .replace(/margin:\s*[^;]+;?/gi, '')
          .trim()

        // Add new alignment styles
        if (styleStr && !styleStr.endsWith(';')) styleStr += ';'
        styleStr += ` display: ${displayStyle}; margin: ${marginStyle};`

        img.setAttribute('style', styleStr)
      }
    })

    // Update the editor content with the modified HTML
    handleTextEditorChange(tempDiv.innerHTML)

    // Update the selected image reference after re-render
    setTimeout(() => {
      if (editorRef.current) {
        const updatedImages = editorRef.current.querySelectorAll('img')
        updatedImages.forEach(img => {
          if (img.src === selectedImage.src) {
            setSelectedImage(img as HTMLImageElement)
            img.classList.add('selected-image')
          }
        })
      }
    }, 100)
  }

  return {
    applyImageLink,
    applyImageAltText,
    applyImageDimensions,
    setImageWidthTo100,
    applyImageAlignment
  }
}
