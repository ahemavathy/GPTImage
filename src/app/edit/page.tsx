'use client'

import { useState } from 'react'
import { Upload, Edit3, Download, Loader2, ArrowLeft, X } from 'lucide-react'
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
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Optional Mask Image</h3>
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

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Powered by Azure OpenAI GPT Image Edit API</p>
        </div>
        </div>
      </main>
    </div>
  )
}
