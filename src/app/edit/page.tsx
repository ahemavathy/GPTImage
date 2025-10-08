'use client'

import { useState } from 'react'
import { Upload, Edit3, Download, Loader2, ArrowLeft, X, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

interface EditResponse {
  url?: string
  revisedPrompt?: string
  images?: Array<{url: string, revisedPrompt: string}>
  totalGenerated?: number
  inputImages: string[]
  totalInputImages: number
  note?: string
}

export default function EditImagePage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [selectedMask, setSelectedMask] = useState<File | null>(null)
  const [maskPreviewUrl, setMaskPreviewUrl] = useState<string>('')
  const [editPrompt, setEditPrompt] = useState('')
  const [numberOfImages, setNumberOfImages] = useState(1)
  const [isEditing, setIsEditing] = useState(false)
  const [editedImage, setEditedImage] = useState<EditResponse | null>(null)
  const [error, setError] = useState('')
  const [showMaskSection, setShowMaskSection] = useState(false)
  
  // Prompt enhancement state
  const [showPromptEnhancer, setShowPromptEnhancer] = useState(false)
  const [enhancementOptions, setEnhancementOptions] = useState({
    material: '',
    color: '',
    finish: '',
    surface: '',
    background: '',
    lighting: '',
    cameraAngle: '',
    style: ''
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    handleFiles(files)
  }

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => file.type.startsWith('image/'))
    if (validFiles.length === 0) {
      setError('Please select valid image files (PNG, JPG, etc.)')
      return
    }

    if (validFiles.length !== files.length) {
      setError(`${files.length - validFiles.length} files were skipped (not images)`)
    } else {
      setError('')
    }

    setSelectedFiles(validFiles)
    
    // Create preview URLs
    const urls = validFiles.map(file => URL.createObjectURL(file))
    setPreviewUrls(urls)
    setEditedImage(null)
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newUrls = previewUrls.filter((_, i) => i !== index)
    
    // Clean up the removed URL
    URL.revokeObjectURL(previewUrls[index])
    
    setSelectedFiles(newFiles)
    setPreviewUrls(newUrls)
  }

  const clearAllFiles = () => {
    // Clean up existing preview URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url))
    
    setSelectedFiles([])
    setPreviewUrls([])
    setSelectedMask(null)
    setMaskPreviewUrl('')
    setEditedImage(null)
    setError('')
  }

  // Prompt enhancement options
  const promptOptions = {
    material: ['ceramic', 'glass', 'matte metal', 'stainless steel', 'wood', 'plastic'],
    color: ['white', 'black', 'pastel blue', 'navy blue', 'cream', 'gray', 'clear'],
    finish: ['glossy', 'matte', 'textured', 'smooth', 'brushed', 'polished'],
    surface: ['wooden table', 'marble countertop', 'concrete slab', 'glass table', 'leather surface', 'fabric surface'],
    background: ['plain white', 'blurred kitchen', 'outdoor café scene', 'modern office', 'cozy home', 'neutral backdrop'],
    lighting: ['soft ambient light', 'studio lighting', 'natural sunlight', 'dramatic shadows', 'golden hour light', 'bright daylight'],
    cameraAngle: ['top-down', 'front view', '45° angle', 'close-up macro shot', 'side view', 'three-quarter view'],
    style: ['photorealistic', 'minimalistic', 'lifestyle shot', 'flat lay', 'product photography', 'artistic']
  }

  const generateEnhancedPrompt = () => {
    let structuredPrompt = ''
    
    // Start with the basic prompt if provided
    if (editPrompt.trim()) {
      structuredPrompt = editPrompt.trim()
    }
    
    // Build product description: [finish] [color] [material] [product]
    const productParts: string[] = []
    if (enhancementOptions.finish) productParts.push(enhancementOptions.finish)
    if (enhancementOptions.color) productParts.push(enhancementOptions.color)
    if (enhancementOptions.material) productParts.push(enhancementOptions.material)
    
    // If we have product attributes, apply them to the main subject
    if (productParts.length > 0) {
      const productDescription = productParts.join(' ')
      if (structuredPrompt) {
        // If there's already a prompt, enhance it with product attributes
        structuredPrompt = `${productDescription} ${structuredPrompt}`
      } else {
        // If no base prompt, start with product attributes
        structuredPrompt = `${productDescription} product`
      }
    }
    
    // Add surface/background: "on [surface]" or "with [background]"
    let surfaceBackground = ''
    if (enhancementOptions.surface) {
      surfaceBackground = `on a ${enhancementOptions.surface}`
    }
    if (enhancementOptions.background) {
      surfaceBackground = `with ${enhancementOptions.background}`
    }
    
    // Build the final structured prompt
    const finalParts: string[] = []
    if (structuredPrompt) finalParts.push(structuredPrompt)
    if (surfaceBackground) finalParts.push(surfaceBackground)
    if (enhancementOptions.lighting) finalParts.push(enhancementOptions.lighting)
    if (enhancementOptions.cameraAngle) finalParts.push(enhancementOptions.cameraAngle)
    if (enhancementOptions.style) finalParts.push(`${enhancementOptions.style} style`)
    
    // Always add professional photo attributes
    //finalParts.push('high-resolution', 'studio shot')
    
    return finalParts.join(', ')
  }

  const applyEnhancedPrompt = () => {
    const enhanced = generateEnhancedPrompt()
    setEditPrompt(enhanced)
    setShowPromptEnhancer(false)
  }

  const resetEnhancementOptions = () => {
    setEnhancementOptions({
      material: '',
      color: '',
      finish: '',
      surface: '',
      background: '',
      lighting: '',
      cameraAngle: '',
      style: ''
    })
  }



  const handleMaskSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate that mask is PNG format with alpha channel
      if (!file.type.includes('png') && !file.name.toLowerCase().endsWith('.png')) {
        setError('Mask image must be in PNG format with alpha channel (transparency). Please save your mask as PNG.')
        return
      }
      
      if (file.size > 4 * 1024 * 1024) { // 4MB limit for masks
        setError('Mask file size must be less than 4MB')
        return
      }
      
      setSelectedMask(file)
      const url = URL.createObjectURL(file)
      setMaskPreviewUrl(url)
      setError('')
    }
  }

  const editImage = async () => {
    if (selectedFiles.length === 0 || !editPrompt.trim()) {
      setError('Please select at least one image and enter an edit prompt')
      return
    }

    setIsEditing(true)
    setError('')
    setEditedImage(null)

    try {
      const formData = new FormData()
      selectedFiles.forEach((file, index) => {
        formData.append(`image-${index}`, file)
      })
      formData.append('prompt', editPrompt)
      formData.append('numberOfImages', numberOfImages.toString())
      
      // Add mask if provided
      if (selectedMask) {
        formData.append('mask', selectedMask)
      }

      const response = await fetch('/api/edit-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to edit images')
      }

      const data: EditResponse = await response.json()
      
      if (!data.images) {
        throw new Error('No edited image received from API')
      }
      
      setEditedImage(data)
    } catch (err) {
      console.error('Error editing images:', err)
      setError(err instanceof Error ? err.message : 'Failed to edit images')
    } finally {
      setIsEditing(false)
    }
  }

  const downloadImage = async (imageUrl?: string, index?: number) => {
    const url = imageUrl || editedImage?.url
    if (!url) return

    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      
      const suffix = index !== undefined ? `_${index + 1}` : ''
      const filename = url.split('/').pop() || `edited-image${suffix}-${Date.now()}.png`
      a.download = filename
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download error:', err)
      setError('Failed to download image')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation Bar */}
      <Navigation />

      <main className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Edit3 className="w-12 h-12 text-purple-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">AI Image Editor</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload your images and describe how you want them edited using AI
            </p>
          </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Images</h2>
          
          {/* File Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer mb-6"
            onClick={() => document.getElementById('file-upload')?.click()}
            onDrop={(e) => {
              e.preventDefault()
              const files = Array.from(e.dataTransfer.files)
              handleFiles(files)
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => e.preventDefault()}
          >
            {selectedFiles.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(index)
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      document.getElementById('file-upload')?.click()
                    }}
                    className="text-purple-600 hover:text-purple-700 text-sm underline"
                  >
                    Add more images
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      clearAllFiles()
                    }}
                    className="text-red-600 hover:text-red-700 text-sm underline"
                  >
                    Clear all images
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-gray-600 mb-2">
                    Drag and drop your images here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500">PNG, JPG - Single or multiple files supported</p>
                </div>
              </div>
            )}
          </div>

          <input
            id="file-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Mask Upload Section */}
          <div className="mt-8">
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors mb-4"
              onClick={() => setShowMaskSection(!showMaskSection)}
              title="Click to toggle mask section"
            >
              <h3 className="text-lg font-semibold text-gray-700">
                Mask Image (Optional)
                {selectedMask && <span className="ml-2 text-blue-600 text-sm">• Active</span>}
              </h3>
              {showMaskSection ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
            
            {showMaskSection && (
              <div className="transition-all duration-300 ease-in-out overflow-hidden">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('mask-upload')?.click()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files[0]
                    if (file) handleMaskSelect({ target: { files: [file] } } as any)
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => e.preventDefault()}
                >
                  {selectedMask ? (
                    <div className="space-y-3">
                      <img
                        src={maskPreviewUrl}
                        alt="Mask preview"
                        className="w-24 h-24 object-cover rounded-lg border mx-auto"
                      />
                      <p className="text-sm text-gray-600">{selectedMask.name}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedMask(null)
                          setMaskPreviewUrl('')
                        }}
                        className="text-purple-600 hover:text-purple-700 text-sm underline"
                      >
                        Remove mask
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-gray-600 mb-2 text-sm">
                          Drag and drop PNG mask image here, or click to browse
                        </p>
                        <div className="text-xs text-gray-500 mb-3 bg-blue-50 p-3 rounded border border-blue-200">
                          <strong>Mask Requirements:</strong>
                          <ul className="mt-1 space-y-1 text-left">
                            <li>• Must be PNG format with transparency (alpha channel)</li>
                            <li>• Transparent areas = areas to be edited</li>
                            <li>• Opaque areas = areas to keep unchanged</li>
                            <li>• Should match the size of your main image</li>
                            <li>• Maximum 4MB file size</li>
                          </ul>
                        </div>
                        <Link 
                          href="/mask" 
                          className="inline-block bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors mb-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Create Mask →
                        </Link>
                      </div>
                      <p className="text-xs text-gray-500">PNG with alpha channel - Optional</p>
                    </div>
                  )}
                </div>

                <input
                  id="mask-upload"
                  type="file"
                  accept="image/png,.png"
                  onChange={handleMaskSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Edit Prompt */}
          <div className="mt-6">
            <label htmlFor="edit-prompt" className="block text-lg font-semibold text-gray-800 mb-3">
              Describe Your Edit
            </label>
            <textarea
              id="edit-prompt"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="e.g., Change the background to a sunset, add sunglasses to the person, make the colors more vibrant"
              className="w-full h-32 p-4 border-2 border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-gray-900 placeholder-gray-500 bg-white"
              disabled={isEditing}
            />
            
            {/* Prompt Enhancement Button */}
            <div className="mt-3 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowPromptEnhancer(true)}
                disabled={isEditing}
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                ✨ Enhance Prompt
              </button>
              
              {/* Preview enhanced prompt */}
              {(enhancementOptions.material || enhancementOptions.color || enhancementOptions.finish || 
                enhancementOptions.surface || enhancementOptions.background || enhancementOptions.lighting || 
                enhancementOptions.cameraAngle || enhancementOptions.style) && (
                <div className="text-xs text-gray-500 max-w-md">
                  Preview: {generateEnhancedPrompt().substring(0, 100)}...
                </div>
              )}
            </div>
          </div>

          {/* Number of Images */}
          <div className="mt-6">
            <label htmlFor="numberOfImages" className="block text-lg font-semibold text-gray-800 mb-3">
              Number of Images to Generate
            </label>
            <select
              id="numberOfImages"
              value={numberOfImages}
              onChange={(e) => setNumberOfImages(parseInt(e.target.value))}
              className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-gray-900 bg-white"
              disabled={isEditing}
            >
              <option value={1} className="text-gray-900">1 Image</option>
              <option value={2} className="text-gray-900">2 Images</option>
              <option value={3} className="text-gray-900">3 Images</option>
              <option value={4} className="text-gray-900">4 Images</option>
            </select>
            <p className="text-sm text-gray-600 mt-2">
              Generate multiple variations of your edited image
            </p>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={editImage}
            disabled={isEditing || selectedFiles.length === 0 || !editPrompt.trim()}
            className="mt-6 w-full bg-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
          >
            {isEditing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Editing Your Image...
              </>
            ) : (
              <>
                <Edit3 className="w-5 h-5 mr-2" />
                Edit Image{selectedFiles.length > 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              Debug: editedImage exists: {editedImage ? 'Yes' : 'No'}
              {editedImage && (
                <>
                  <br />Has single URL: {editedImage.url ? 'Yes' : 'No'}
                  <br />Has multiple images: {editedImage.images ? `Yes (${editedImage.images.length})` : 'No'}
                  <br />Total Generated: {editedImage.totalGenerated || 'N/A'}
                  <br />Input Images: {editedImage.totalInputImages}
                  {editedImage.url && <><br />Single URL: {editedImage.url}</>}
                  {editedImage.images && (
                    <>
                      <br />Multiple URLs: {editedImage.images.map((img, i) => `${i + 1}: ${img.url}`).join(', ')}
                    </>
                  )}
                </>
              )}
            </p>
          </div>
        )}

        {/* Edited Result Section */}
        {editedImage && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Your Edited Image{editedImage.images && editedImage.images.length > 1 ? 's' : ''}
            </h2>
            
            {/* Handle multiple images */}
            {editedImage.images && editedImage.images.length > 0 ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {editedImage.images.map((image, index) => (
                    <div key={index} className="flex flex-col items-center space-y-4">
                      <div className="relative bg-gray-50 rounded-lg p-4">
                        <img
                          src={image.url}
                          alt={`Edited Result ${index + 1}`}
                          className="max-w-full h-auto rounded-lg shadow-md max-h-96 object-contain"
                          onLoad={() => console.log(`Edited image ${index + 1} loaded successfully`)}
                          onError={(e) => {
                            console.error(`Edited image ${index + 1} failed to load:`, e)
                            setError(`Failed to load edited image ${index + 1}`)
                          }}
                        />
                      </div>
                      
                      <div className="text-center max-w-md">
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Variation {index + 1}:</strong> {image.revisedPrompt}
                        </p>
                      </div>

                      <button
                        onClick={() => downloadImage(image.url, index)}
                        className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center text-sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Image {index + 1}
                      </button>
                    </div>
                  ))}
                </div>
                
                {editedImage.note && (
                  <div className="text-center">
                    <p className="text-sm text-blue-600 mb-2">
                      <strong>Note:</strong> {editedImage.note}
                    </p>
                  </div>
                )}
                
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Generated {editedImage.totalGenerated} image(s) from {editedImage.totalInputImages} input image(s)
                  </p>
                </div>
              </div>
            ) : (
              /* Handle single image (backward compatibility) */
              <div className="flex flex-col items-center space-y-6">
                <div className="relative bg-gray-50 rounded-lg p-8 max-w-md">
                  <img
                    src={editedImage.url}
                    alt="Edited Result"
                    className="max-w-full h-auto rounded-lg shadow-md"
                    onLoad={() => console.log('Edited image loaded successfully')}
                    onError={(e) => {
                      console.error('Edited image failed to load:', e)
                      setError('Failed to load edited image')
                    }}
                  />
                </div>

                <div className="text-center max-w-2xl">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>AI Interpretation:</strong> {editedImage.revisedPrompt}
                  </p>
                  {editedImage.note && (
                    <p className="text-sm text-blue-600 mb-2">
                      <strong>Note:</strong> {editedImage.note}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Processed {editedImage.totalInputImages} input image(s)
                  </p>
                </div>

                <button
                  onClick={() => downloadImage(editedImage.url, 0)}
                  className="bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Edited Image
                </button>
              </div>
            )}
          </div>
        )}

        {/* Prompt Enhancement Modal */}
        {showPromptEnhancer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Enhance Your Prompt</h3>
                  <button
                    onClick={() => setShowPromptEnhancer(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Details */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Product Details</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Material</label>
                      <select
                        value={enhancementOptions.material}
                        onChange={(e) => setEnhancementOptions(prev => ({...prev, material: e.target.value}))}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="" className="text-gray-900">Select material</option>
                        {promptOptions.material.map(option => (
                          <option key={option} value={option} className="text-gray-900">{option}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                      <select
                        value={enhancementOptions.color}
                        onChange={(e) => setEnhancementOptions(prev => ({...prev, color: e.target.value}))}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="" className="text-gray-900">Select color</option>
                        {promptOptions.color.map(option => (
                          <option key={option} value={option} className="text-gray-900">{option}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Finish</label>
                      <select
                        value={enhancementOptions.finish}
                        onChange={(e) => setEnhancementOptions(prev => ({...prev, finish: e.target.value}))}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="" className="text-gray-900">Select finish</option>
                        {promptOptions.finish.map(option => (
                          <option key={option} value={option} className="text-gray-900">{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Background & Surface */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Background & Surface</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Surface</label>
                      <select
                        value={enhancementOptions.surface}
                        onChange={(e) => setEnhancementOptions(prev => ({...prev, surface: e.target.value}))}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="" className="text-gray-900">Select surface</option>
                        {promptOptions.surface.map(option => (
                          <option key={option} value={option} className="text-gray-900">{option}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Background</label>
                      <select
                        value={enhancementOptions.background}
                        onChange={(e) => setEnhancementOptions(prev => ({...prev, background: e.target.value}))}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="" className="text-gray-900">Select background</option>
                        {promptOptions.background.map(option => (
                          <option key={option} value={option} className="text-gray-900">{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Lighting */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Lighting</h4>
                    <select
                      value={enhancementOptions.lighting}
                      onChange={(e) => setEnhancementOptions(prev => ({...prev, lighting: e.target.value}))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="" className="text-gray-900">Select lighting</option>
                      {promptOptions.lighting.map(option => (
                        <option key={option} value={option} className="text-gray-900">{option}</option>
                      ))}
                    </select>
                  </div>

                  {/* Camera Angle */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Camera Angle</h4>
                    <select
                      value={enhancementOptions.cameraAngle}
                      onChange={(e) => setEnhancementOptions(prev => ({...prev, cameraAngle: e.target.value}))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="" className="text-gray-900">Select camera angle</option>
                      {promptOptions.cameraAngle.map(option => (
                        <option key={option} value={option} className="text-gray-900">{option}</option>
                      ))}
                    </select>
                  </div>

                  {/* Style */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Style</h4>
                    <select
                      value={enhancementOptions.style}
                      onChange={(e) => setEnhancementOptions(prev => ({...prev, style: e.target.value}))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="" className="text-gray-900">Select style</option>
                      {promptOptions.style.map(option => (
                        <option key={option} value={option} className="text-gray-900">{option}</option>
                      ))}
                    </select>
                  </div>


                </div>

                {/* Enhanced Prompt Preview */}
                {generateEnhancedPrompt() && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="text-sm font-medium text-blue-800 mb-2">Enhanced Prompt Preview:</h5>
                    <p className="text-sm text-blue-700 italic">"{generateEnhancedPrompt()}"</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex justify-between">
                  <button
                    onClick={resetEnhancementOptions}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Reset All
                  </button>
                  
                  <div className="space-x-3">
                    <button
                      onClick={() => setShowPromptEnhancer(false)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={applyEnhancedPrompt}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Apply Enhanced Prompt
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Powered by Azure OpenAI GPT Image Edit API</p>
        </div>
        </div>
      </main>
    </div>
  )
}
