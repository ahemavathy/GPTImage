'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Download, Loader2, ArrowLeft, Brush, Eraser, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

export default function MaskEditorPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [maskTool, setMaskTool] = useState<'brush' | 'eraser'>('brush')
  const [brushSize, setBrushSize] = useState(20)
  const [isDrawing, setIsDrawing] = useState(false)
  const [error, setError] = useState('')
  const [previewShape, setPreviewShape] = useState<{x: number, y: number, width: number, height: number, type: string} | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const maskCtxRef = useRef<CanvasRenderingContext2D | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, etc.)')
      return
    }

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setError('')
  }

  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const maskCanvas = maskCanvasRef.current
    const previewCanvas = previewCanvasRef.current
    
    if (!canvas || !maskCanvas || !previewCanvas || !previewUrl) return

    const ctx = canvas.getContext('2d')
    const maskCtx = maskCanvas.getContext('2d')
    
    if (!ctx || !maskCtx) return

    const img = new Image()
    img.onload = () => {
      // Use EXACT image dimensions - no scaling to avoid size mismatch
      const { width, height } = img
      
      console.log('Original image dimensions:', { width, height })
      
      // Set all canvases to exact image dimensions
      canvas.width = width
      canvas.height = height
      maskCanvas.width = width
      maskCanvas.height = height
      previewCanvas.width = width
      previewCanvas.height = height
      
      console.log('Canvas dimensions set to:', { width, height })
      
      // Draw the original image at actual size
      ctx.drawImage(img, 0, 0, width, height)
      
      // Initialize mask canvas with semi-transparent white (protected areas)
      maskCtx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      maskCtx.fillRect(0, 0, width, height)
      
      ctxRef.current = ctx
      maskCtxRef.current = maskCtx
    }
    
    img.src = previewUrl
  }, [previewUrl])

  const getMouseCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    
    // Calculate scale factor between display size and actual canvas size
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    // Get mouse position relative to canvas and scale to actual canvas coordinates
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    return { x, y }
  }, [])

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = maskCanvasRef.current
    const ctx = maskCtxRef.current
    if (!canvas || !ctx) return

    setIsDrawing(true)
    const { x, y } = getMouseCoordinates(e)

    // Store starting position for shapes
    canvas.dataset.startX = x.toString()
    canvas.dataset.startY = y.toString()

    if (maskTool === 'brush' || maskTool === 'eraser') {
      ctx.beginPath()
      ctx.moveTo(x, y)
      
      // Draw initial point for brush/eraser
      if (maskTool === 'brush') {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.fillStyle = 'rgba(0, 0, 0, 1)'
        ctx.beginPath()
        ctx.arc(x, y, brushSize / 2, 0, 2 * Math.PI)
        ctx.fill()
      } else if (maskTool === 'eraser') {
        ctx.globalCompositeOperation = 'source-over'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.beginPath()
        ctx.arc(x, y, brushSize / 2, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
  }, [maskTool, brushSize, getMouseCoordinates])

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const canvas = maskCanvasRef.current
    const ctx = maskCtxRef.current
    if (!canvas || !ctx) return

    const { x, y } = getMouseCoordinates(e)

    if (maskTool === 'brush') {
      // Make areas transparent (remove mask)
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = brushSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineTo(x, y)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x, y)
    } else if (maskTool === 'eraser') {
      // Add mask back (make opaque)
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.beginPath()
      ctx.arc(x, y, brushSize / 2, 0, 2 * Math.PI)
      ctx.fill()
    }
  }, [isDrawing, brushSize, maskTool, getMouseCoordinates])

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return
    
    setIsDrawing(false)
    
    const ctx = maskCtxRef.current
    if (ctx) {
      // Clear any path states
      ctx.beginPath()
    }
  }, [isDrawing]);

  const handleMouseLeave = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false)
      const ctx = maskCtxRef.current
      if (ctx) {
        ctx.beginPath()
      }
    }
  }, [isDrawing])

  const clearMask = useCallback(() => {
    const maskCanvas = maskCanvasRef.current
    const ctx = maskCtxRef.current
    if (!maskCanvas || !ctx) return

    // Clear the entire canvas first
    ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
    
    // Reset composite operation to default
    ctx.globalCompositeOperation = 'source-over'
    
    // Fill with semi-transparent white (protected areas)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)
  }, [])

  const downloadMask = useCallback(() => {
    const originalCanvas = canvasRef.current
    const maskCanvas = maskCanvasRef.current
    
    if (!originalCanvas || !maskCanvas) return

    console.log('Creating final mask with dimensions:', {
      width: originalCanvas.width,
      height: originalCanvas.height
    })

    // Verify canvas dimensions match
    if (originalCanvas.width !== maskCanvas.width || originalCanvas.height !== maskCanvas.height) {
      console.warn('Canvas size mismatch detected!', {
        original: { width: originalCanvas.width, height: originalCanvas.height },
        mask: { width: maskCanvas.width, height: maskCanvas.height }
      })
    }

    // Create a new canvas for the final mask with EXACT original image dimensions
    const finalCanvas = document.createElement('canvas')
    const finalCtx = finalCanvas.getContext('2d')
    
    if (!finalCtx) return

    // Set to EXACT original image dimensions (this is critical for Azure API)
    finalCanvas.width = originalCanvas.width
    finalCanvas.height = originalCanvas.height

    // Get mask data at exact original dimensions
    const maskImageData = maskCanvas.getContext('2d')?.getImageData(0, 0, originalCanvas.width, originalCanvas.height)
    if (!maskImageData) {
      console.error('Failed to get mask image data')
      return
    }

    // Create the final mask: start with fully opaque white background
    const finalImageData = finalCtx.createImageData(originalCanvas.width, originalCanvas.height)
    
    // Process each pixel: convert mask overlay to proper alpha channel
    for (let i = 0; i < maskImageData.data.length; i += 4) {
      const maskAlpha = maskImageData.data[i + 3] / 255
      
      if (maskAlpha === 0) {
        // Transparent area in mask overlay = black with full alpha (area to be edited)
        finalImageData.data[i] = 0       // R: black
        finalImageData.data[i + 1] = 0   // G: black
        finalImageData.data[i + 2] = 0   // B: black
        finalImageData.data[i + 3] = 255 // A: fully opaque
      } else {
        // Opaque area in mask overlay = white with full alpha (area to be preserved)
        finalImageData.data[i] = 255     // R: white
        finalImageData.data[i + 1] = 255 // G: white
        finalImageData.data[i + 2] = 255 // B: white
        finalImageData.data[i + 3] = 255 // A: fully opaque
      }
    }

    // Apply the final image data to the canvas
    finalCtx.putImageData(finalImageData, 0, 0)

    console.log('Final mask dimensions (guaranteed exact):', {
      width: finalCanvas.width,
      height: finalCanvas.height,
      matches_original: finalCanvas.width === originalCanvas.width && finalCanvas.height === originalCanvas.height
    })

    // Download the final mask
    finalCanvas.toBlob((blob) => {
      if (!blob) return

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mask-${Date.now()}.png`
      
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      console.log('Mask downloaded successfully with exact dimensions')
    }, 'image/png')
  }, [])

  // Safety: stop drawing when tool changes
  useEffect(() => {
    setIsDrawing(false)
  }, [maskTool])

  // Initialize canvas when image is loaded
  useEffect(() => {
    if (previewUrl) {
      setTimeout(initializeCanvas, 100)
    }
  }, [previewUrl, initializeCanvas])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation Bar */}
      <Navigation />

      <main className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Brush className="w-12 h-12 text-blue-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">Mask Editor</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload an image and create transparent masks for precise editing
            </p>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Image</h2>
            
            {/* File Upload */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer mb-6"
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file) handleFile(file)
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => e.preventDefault()}
            >
              {selectedFile ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full max-h-48 mx-auto rounded-lg border"
                  />
                  <p className="text-sm text-gray-600">{selectedFile.name}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFile(null)
                      setPreviewUrl('')
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm underline"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-gray-600 mb-2">
                      Drag and drop your image here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500">PNG, JPG - Single file only</p>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Tools */}
            {selectedFile && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Mask Tools</h3>
                  
                  {/* Tool Selection */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                      onClick={() => setMaskTool('brush')}
                      className={`flex items-center justify-center px-4 py-2 rounded-lg ${
                        maskTool === 'brush' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <Brush className="w-4 h-4 mr-2" />
                      Brush
                    </button>
                    <button
                      onClick={() => setMaskTool('eraser')}
                      className={`flex items-center justify-center px-4 py-2 rounded-lg ${
                        maskTool === 'eraser' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <Eraser className="w-4 h-4 mr-2" />
                      Eraser
                    </button>
                  </div>

                  {/* Brush Size */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brush Size: {brushSize}px
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={clearMask}
                      className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset Mask
                    </button>
                    <button
                      onClick={downloadMask}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Masked Image
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Brush:</strong> Makes areas transparent (removes mask)</li>
                    <li>• <strong>Eraser:</strong> Restores mask (makes areas opaque)</li>
                    <li>• Transparent areas will show as see-through in the final image</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Canvas Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Mask Editor</h2>
            
            {selectedFile ? (
              <div className="space-y-4">
                <div className="relative border rounded-lg overflow-hidden bg-gray-100" style={{ maxWidth: '100%', maxHeight: '500px' }}>
                  {/* Original Image Canvas (background) */}
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 max-w-full max-h-full object-contain"
                  />
                  
                  {/* Mask Canvas (overlay) */}
                  <canvas
                    ref={maskCanvasRef}
                    className="absolute top-0 left-0 max-w-full max-h-full object-contain"
                  />
                  
                  {/* Interactive Canvas (for mouse events) */}
                  <canvas
                    ref={previewCanvasRef}
                    className="relative block cursor-crosshair max-w-full max-h-full object-contain"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      startDrawing(e)
                    }}
                    onMouseMove={(e) => {
                      e.preventDefault()
                      draw(e)
                    }}
                    onMouseUp={(e) => {
                      e.preventDefault()
                      stopDrawing()
                    }}
                    onMouseLeave={(e) => {
                      e.preventDefault()
                      handleMouseLeave()
                    }}
                    style={{ touchAction: 'none' }}
                  />
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Click and drag to create transparent areas. 
                    <br />
                    Semi-transparent overlay shows masked (protected) areas.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Brush className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Upload an image to start creating masks</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Create precise masks with transparency for advanced image editing</p>
        </div>
        </div>
      </main>
    </div>
  )
}
