'use client'

import { useState, useRef } from 'react'
import { Upload, Edit3, Download, Loader2, ArrowLeft, RotateCcw, History, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import Navigation from '../../components/Navigation'

interface EditResult {
  url: string
  revisedPrompt: string
  timestamp: number
  editPrompt: string
  usedMask?: boolean
}

interface EditHistory {
  edits: EditResult[]
  currentIndex: number
}

export default function IterativeEditPage() {
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [originalPreview, setOriginalPreview] = useState<string>('')
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('')
  const [editPrompt, setEditPrompt] = useState('')
  const [maskFile, setMaskFile] = useState<File | null>(null)
  const [maskPreview, setMaskPreview] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [history, setHistory] = useState<EditHistory>({ edits: [], currentIndex: -1 })
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [showUploadSection, setShowUploadSection] = useState(true)
  const [showMaskSection, setShowMaskSection] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const maskInputRef = useRef<HTMLInputElement>(null)

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

    setOriginalFile(file)
    const url = URL.createObjectURL(file)
    setOriginalPreview(url)
    setCurrentImageUrl(url)
    setError('')
    
    // Reset history when new image is uploaded
    setHistory({ edits: [], currentIndex: -1 })
    
    // Auto-collapse upload section after image upload (mask section stays collapsed)
    setShowUploadSection(false)
  }

  const handleMaskSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleMaskFile(file)
    }
  }

  const handleMaskFile = (file: File) => {
    // Validate that mask is PNG format with alpha channel
    if (!file.type.includes('png') && !file.name.toLowerCase().endsWith('.png')) {
      setError('Mask image must be in PNG format with alpha channel (transparency). Please save your mask as PNG.')
      return
    }
    
    if (file.size > 4 * 1024 * 1024) { // 4MB limit for masks
      setError('Mask file size must be less than 4MB')
      return
    }
    
    setMaskFile(file)
    const url = URL.createObjectURL(file)
    setMaskPreview(url)
    setError('')
    
    // Keep mask section open so user can see the uploaded mask
  }

  const clearImage = () => {
    if (originalPreview) {
      URL.revokeObjectURL(originalPreview)
    }
    if (maskPreview) {
      URL.revokeObjectURL(maskPreview)
    }
    // Clean up edit history URLs
    history.edits.forEach(edit => {
      if (edit.url.startsWith('blob:')) {
        URL.revokeObjectURL(edit.url)
      }
    })
    
    setOriginalFile(null)
    setOriginalPreview('')
    setCurrentImageUrl('')
    setMaskFile(null)
    setMaskPreview('')
    setHistory({ edits: [], currentIndex: -1 })
    setError('')
    setEditPrompt('')
    
    // Reset section visibility to initial state
    setShowUploadSection(true)
    setShowMaskSection(false)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (maskInputRef.current) {
      maskInputRef.current.value = ''
    }
  }

  const getCurrentImageForEdit = async (): Promise<File> => {
    // If we're editing the original image, use the original file
    if (history.currentIndex === -1 && originalFile) {
      return originalFile
    }
    
    // Otherwise, convert the current image URL to a File
    const response = await fetch(currentImageUrl)
    const blob = await response.blob()
    return new File([blob], `edited-image-${history.currentIndex + 1}.png`, { type: 'image/png' })
  }

  const applyEdit = async () => {
    if (!currentImageUrl || !editPrompt.trim()) {
      setError('Please upload an image and enter an edit prompt')
      return
    }

    setIsEditing(true)
    setError('')

    try {
      const imageFile = await getCurrentImageForEdit()
      
      const formData = new FormData()
      formData.append('image-0', imageFile)
      formData.append('prompt', editPrompt)
      formData.append('numberOfImages', '1')
      
      // Add mask if provided
      if (maskFile) {
        formData.append('mask', maskFile)
      }

      const response = await fetch('/api/edit-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to edit image')
      }

      const data = await response.json()
      console.log('Edit API response:', data) // Debug log
      
      // Handle both old single image format and new multiple images format
      let editedUrl: string
      let revisedPrompt: string
      
      if (data.images && Array.isArray(data.images) && data.images.length > 0) {
        // New format: multiple images array
        editedUrl = data.images[0].url
        revisedPrompt = data.images[0].revisedPrompt
        console.log('Using new format - images array:', data.images.length, 'images')
      } else if (data.url) {
        // Old format: single image
        editedUrl = data.url
        revisedPrompt = data.revisedPrompt || 'No prompt revision available'
        console.log('Using old format - single url')
      } else {
        console.error('Unexpected API response format:', data)
        throw new Error('No edited image received from API')
      }

      // Create new edit result
      const newEdit: EditResult = {
        url: editedUrl,
        revisedPrompt: revisedPrompt,
        timestamp: Date.now(),
        editPrompt: editPrompt,
        usedMask: !!maskFile
      }

      // Update history and current image
      const newHistory = { ...history }
      
      // If we're not at the latest edit, truncate future edits
      if (newHistory.currentIndex < newHistory.edits.length - 1) {
        // Clean up URLs for removed edits
        for (let i = newHistory.currentIndex + 1; i < newHistory.edits.length; i++) {
          if (newHistory.edits[i].url.startsWith('blob:')) {
            URL.revokeObjectURL(newHistory.edits[i].url)
          }
        }
        newHistory.edits = newHistory.edits.slice(0, newHistory.currentIndex + 1)
      }
      
      // Add new edit
      newHistory.edits.push(newEdit)
      newHistory.currentIndex = newHistory.edits.length - 1
      
      setHistory(newHistory)
      setCurrentImageUrl(editedUrl)
      setEditPrompt('')
      
    } catch (err) {
      console.error('Error editing image:', err)
      setError(err instanceof Error ? err.message : 'Failed to edit image')
    } finally {
      setIsEditing(false)
    }
  }

  const goToHistoryStep = (index: number) => {
    if (index === -1) {
      // Go back to original
      setCurrentImageUrl(originalPreview)
      setHistory({ ...history, currentIndex: -1 })
    } else if (index >= 0 && index < history.edits.length) {
      setCurrentImageUrl(history.edits[index].url)
      setHistory({ ...history, currentIndex: index })
    }
  }

  const undoEdit = () => {
    if (history.currentIndex > -1) {
      goToHistoryStep(history.currentIndex - 1)
    }
  }

  const redoEdit = () => {
    if (history.currentIndex < history.edits.length - 1) {
      goToHistoryStep(history.currentIndex + 1)
    }
  }

  const downloadCurrentImage = async () => {
    if (!currentImageUrl) return

    try {
      const response = await fetch(currentImageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const isOriginal = history.currentIndex === -1
      const filename = isOriginal 
        ? `original-${Date.now()}.png`
        : `edited-step-${history.currentIndex + 1}-${Date.now()}.png`
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error downloading image:', err)
      setError('Failed to download image')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
      {/* Navigation Bar */}
      <Navigation />

      <main className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1"></div>
              <div className="flex items-center">
                <Edit3 className="w-12 h-12 text-purple-600 mr-3" />
                <h1 className="text-4xl font-bold text-gray-900">Iterative Image Editor</h1>
              </div>
              <div className="flex-1 flex justify-end">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center text-purple-600 hover:text-purple-700 transition-colors bg-white rounded-lg px-3 py-2 shadow-md"
                >
                  <History className="w-5 h-5 mr-2" />
                  History
                </button>
              </div>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Upload an image and make iterative edits. Each edit builds on the previous result, creating a complete editing workflow.
            </p>
          </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Upload & Controls */}
          <div className="xl:col-span-1 space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors"
                onClick={() => {
                  console.log('Upload section toggle clicked, current state:', showUploadSection)
                  setShowUploadSection(!showUploadSection)
                }}
                title="Click to toggle upload section"
              >
                <h2 className="text-xl font-bold text-gray-900">Upload Image</h2>
                {showUploadSection ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
              
              {showUploadSection && (
                <div className="mt-4 transition-all duration-300 ease-in-out overflow-hidden">
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const file = e.dataTransfer.files[0]
                      if (file) handleFile(file)
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={(e) => e.preventDefault()}
                  >
                    {originalFile ? (
                      <div className="space-y-3">
                        <img
                          src={originalPreview}
                          alt="Original"
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <p className="text-sm text-gray-600">{originalFile.name}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            clearImage()
                          }}
                          className="text-purple-600 hover:text-purple-700 text-sm underline"
                        >
                          Remove image
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-gray-600 mb-1">Drop image here</p>
                          <p className="text-xs text-gray-500">PNG, JPG supported</p>
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
                </div>
              )}
            </div>

            {/* Mask Upload Section */}
            {originalFile && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors"
                  onClick={() => {
                    console.log('Mask section toggle clicked, current state:', showMaskSection)
                    setShowMaskSection(!showMaskSection)
                  }}
                  title="Click to toggle mask section"
                >
                  <h3 className="text-lg font-bold text-gray-900">
                    Mask Image (Optional)
                    {maskFile && <span className="ml-2 text-blue-600 text-sm">• Active</span>}
                  </h3>
                  {showMaskSection ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                
                {showMaskSection && (
                  <div className="mt-4 transition-all duration-300 ease-in-out overflow-hidden">
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer"
                      onClick={() => maskInputRef.current?.click()}
                      onDrop={(e) => {
                        e.preventDefault()
                        const file = e.dataTransfer.files[0]
                        if (file) handleMaskFile(file)
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnter={(e) => e.preventDefault()}
                    >
                      {maskFile ? (
                        <div className="space-y-3">
                          <img
                            src={maskPreview}
                            alt="Mask Preview"
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <p className="text-sm text-gray-600">{maskFile.name}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setMaskFile(null)
                              setMaskPreview('')
                              if (maskInputRef.current) {
                                maskInputRef.current.value = ''
                              }
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm underline"
                          >
                            Remove mask
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                          <div>
                            <p className="text-sm text-gray-600">Drop mask here</p>
                            <p className="text-xs text-gray-500">PNG with transparency</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <input
                      ref={maskInputRef}
                      type="file"
                      accept="image/png,.png"
                      onChange={handleMaskSelect}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Edit Controls */}
            {originalFile && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Apply Edit</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Edit Instruction
                    </label>
                    <textarea
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="e.g., Change the background to a sunset, add sunglasses, make it more colorful..."
                      className="w-full h-24 p-3 border-2 border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-gray-900 placeholder-gray-500 bg-white text-sm"
                      disabled={isEditing}
                    />
                  </div>

                  <button
                    onClick={applyEdit}
                    disabled={isEditing || !editPrompt.trim()}
                    className="w-full bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                  >
                    {isEditing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Applying Edit{maskFile ? ' with Mask' : ''}...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Apply Edit{maskFile ? ' with Mask' : ''}
                      </>
                    )}
                  </button>

                  {maskFile && (
                    <div className="text-center">
                      <p className="text-xs text-blue-600">
                        ✓ Mask will be applied to focus edits on specific areas
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* History Controls */}
            {originalFile && history.edits.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Navigation</h3>
                
                <div className="flex space-x-2">
                  <button
                    onClick={undoEdit}
                    disabled={history.currentIndex <= -1}
                    className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Undo
                  </button>
                  <button
                    onClick={redoEdit}
                    disabled={history.currentIndex >= history.edits.length - 1}
                    className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center"
                  >
                    Redo
                    <RotateCcw className="w-4 h-4 ml-1 transform scale-x-[-1]" />
                  </button>
                </div>

                <div className="mt-3 text-center">
                  <span className="text-sm text-gray-600">
                    Step {history.currentIndex + 1} of {history.edits.length + 1}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Main Canvas */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Current Image</h2>
                {currentImageUrl && (
                  <button
                    onClick={downloadCurrentImage}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                )}
              </div>

              {currentImageUrl ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative bg-gray-50 rounded-lg p-4 max-w-full">
                    <img
                      src={currentImageUrl}
                      alt="Current edited image"
                      className="max-w-full h-auto rounded-lg shadow-md max-h-96 object-contain"
                      onError={() => setError('Failed to load current image')}
                    />
                  </div>
                  
                  <div className="text-center max-w-2xl">
                    {history.currentIndex === -1 ? (
                      <p className="text-sm text-gray-600">Original Image</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-800">
                          Edit {history.currentIndex + 1}: {history.edits[history.currentIndex]?.editPrompt}
                          {history.edits[history.currentIndex]?.usedMask && 
                            <span className="ml-2 text-blue-600 text-xs">• Used Mask</span>
                          }
                        </p>
                        <p className="text-xs text-gray-600">
                          AI Result: {history.edits[history.currentIndex]?.revisedPrompt}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Edit3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Upload an image to start iterative editing</p>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* History Panel */}
          <div className="xl:col-span-1">
            {showHistory && originalFile && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Edit History</h3>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {/* Original Image */}
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      history.currentIndex === -1 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => goToHistoryStep(-1)}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={originalPreview}
                        alt="Original"
                        className="w-12 h-12 object-cover rounded border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Original</p>
                        <p className="text-xs text-gray-500 truncate">Starting point</p>
                      </div>
                    </div>
                  </div>

                  {/* Edit History */}
                  {history.edits.map((edit, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        history.currentIndex === index
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => goToHistoryStep(index)}
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={edit.url}
                          alt={`Edit ${index + 1}`}
                          className="w-12 h-12 object-cover rounded border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            Edit {index + 1} {edit.usedMask && <span className="text-blue-600 text-xs">• Mask</span>}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {edit.editPrompt}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(edit.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Powered by Azure OpenAI GPT Image Edit API • Iterative Editing Workflow</p>
        </div>
        </div>
      </main>
    </div>
  );
}
