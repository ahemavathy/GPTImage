'use client'

import { useState } from 'react'
import { Sparkles, Download, Loader2, Edit3, Image, Brush, BarChart3, Video, Play, Box } from 'lucide-react'
import Link from 'next/link'
import Navigation from '../components/Navigation'

interface GeneratedLogo {
  url: string
  revisedPrompt: string
}

interface GeneratedVideo {
  url: string
  prompt: string
  duration: number
  width: number
  height: number
  jobId: string
}

interface Generated3DModel {
  success: boolean
  message: string
  filename: string
  modelUrl: string
  provider: string
  timestamp: number
  outputHtml?: string
  steps: {
    generation: string
    download: string
  }
}

export default function HomePage() {
  const [businessDescription, setBusinessDescription] = useState('')
  const [numberOfImages, setNumberOfImages] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLogos, setGeneratedLogos] = useState<GeneratedLogo[]>([])
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null)
  const [generated3DModel, setGenerated3DModel] = useState<Generated3DModel | null>(null)
  const [error, setError] = useState('')
  const [generationType, setGenerationType] = useState<'image' | 'video' | '3d'>('image')
  const [videoDuration, setVideoDuration] = useState(5)
  const [videoResolution, setVideoResolution] = useState({ width: 480, height: 480 })
  const [videoInputImage, setVideoInputImage] = useState<File | null>(null)
  const [videoInputImagePreview, setVideoInputImagePreview] = useState<string | null>(null)
  const [threeDInputImage, setThreeDInputImage] = useState<File | null>(null)
  const [threeDInputImagePreview, setThreeDInputImagePreview] = useState<string | null>(null)

  const handleVideoImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setVideoInputImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setVideoInputImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handle3DImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setThreeDInputImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setThreeDInputImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeVideoImage = () => {
    setVideoInputImage(null)
    setVideoInputImagePreview(null)
  }

  const remove3DImage = () => {
    setThreeDInputImage(null)
    setThreeDInputImagePreview(null)
  }

  const generateLogo = async () => {
    if (!businessDescription.trim() && generationType !== '3d') {
      setError('Please enter a description')
      return
    }

    if (generationType === '3d' && !threeDInputImage) {
      setError('Please upload an image for 3D model generation')
      return
    }

    setIsGenerating(true)
    setError('')
    setGeneratedLogos([])
    setGeneratedVideo(null)
    setGenerated3DModel(null)

    try {
      if (generationType === '3d') {
        // Convert image to base64
        const imageBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(threeDInputImage!)
        })

        const response = await fetch('/api/generate-3d', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            image: imageBase64,
            prompt: businessDescription || 'Generate a 3D model from this image'
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to generate 3D model')
        }

        const data = await response.json()
        console.log('3D API Response:', data)
        
        // Extract output HTML if available in the API response
        if (data.outputHtml) {
          data.outputHtml = data.outputHtml
        }
        
        setGenerated3DModel(data)
      } else if (generationType === 'video') {
        // Convert image to base64 if provided
        let imageBase64 = null
        if (videoInputImage) {
          const reader = new FileReader()
          imageBase64 = await new Promise<string>((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.readAsDataURL(videoInputImage)
          })
        }

        const response = await fetch('/api/generate-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            prompt: businessDescription,
            width: videoResolution.width,
            height: videoResolution.height,
            duration: videoDuration,
            image: imageBase64
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to generate video')
        }

        const data = await response.json()
        console.log('Video API Response:', data)
        setGeneratedVideo(data)
      } else {
        const response = await fetch('/api/generate-logo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            businessDescription,
            numberOfImages 
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to generate logo')
        }

        const data = await response.json()
        console.log('API Response:', data) // Debug log
        
        // Handle both single and multiple image responses
        if (data.images && Array.isArray(data.images)) {
          // Multiple images response format
          setGeneratedLogos(data.images)
        } else if (data.url) {
          // Single image response format
          setGeneratedLogos([data])
        } else {
          throw new Error('No image URLs received from API')
        }
      }
      
    } catch (err) {
      console.error('Error generating content:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate content')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadLogo = async (logoData: GeneratedLogo, index: number) => {
    if (!logoData?.url) return

    try {
      // Since the image is now stored locally, we can download it directly
      const response = await fetch(logoData.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Extract filename from the URL path, add index for multiple images
      const originalFilename = logoData.url.split('/').pop() || `logo-${Date.now()}.png`
      const filename = generatedLogos.length > 1 
        ? `${index + 1}-${originalFilename}` 
        : originalFilename
      a.download = filename
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download error:', err)
      setError('Failed to download logo')
    }
  }

  const downloadVideo = async (videoData: GeneratedVideo) => {
    if (!videoData?.url) return

    try {
      const response = await fetch(videoData.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const filename = videoData.url.split('/').pop() || `video-${Date.now()}.mp4`
      a.download = filename
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download error:', err)
      setError('Failed to download video')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <Navigation />

      <main className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="w-12 h-12 text-indigo-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">AI Content Generator</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Generate professional images and videos with AI in seconds
            </p>
          </div>

        {/* Main Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          {/* Content Type Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">What would you like to create?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                onClick={() => setGenerationType('image')}
                className={`cursor-pointer p-6 rounded-lg border-2 transition-all duration-200 ${
                  generationType === 'image'
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center mb-3">
                  <Image className={`w-6 h-6 mr-3 ${generationType === 'image' ? 'text-indigo-600' : 'text-gray-600'}`} />
                  <h3 className={`text-lg font-semibold ${generationType === 'image' ? 'text-indigo-900' : 'text-gray-800'}`}>
                    Generate Images
                  </h3>
                </div>
                <p className={`text-sm ${generationType === 'image' ? 'text-indigo-700' : 'text-gray-600'}`}>
                  Create professional images, logos, and graphics using GPT-4 Vision
                </p>
              </div>
              
              <div 
                onClick={() => setGenerationType('video')}
                className={`cursor-pointer p-6 rounded-lg border-2 transition-all duration-200 ${
                  generationType === 'video'
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center mb-3">
                  <Video className={`w-6 h-6 mr-3 ${generationType === 'video' ? 'text-purple-600' : 'text-gray-600'}`} />
                  <h3 className={`text-lg font-semibold ${generationType === 'video' ? 'text-purple-900' : 'text-gray-800'}`}>
                    Generate Videos
                  </h3>
                  <span className="ml-2 px-2 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                    Sora
                  </span>
                </div>
                <p className={`text-sm ${generationType === 'video' ? 'text-purple-700' : 'text-gray-600'}`}>
                  Create realistic video clips from text using Azure OpenAI's Sora model
                </p>
              </div>

              <div 
                onClick={() => setGenerationType('3d')}
                className={`cursor-pointer p-6 rounded-lg border-2 transition-all duration-200 ${
                  generationType === '3d'
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center mb-3">
                  <Box className={`w-6 h-6 mr-3 ${generationType === '3d' ? 'text-emerald-600' : 'text-gray-600'}`} />
                  <h3 className={`text-lg font-semibold ${generationType === '3d' ? 'text-emerald-900' : 'text-gray-800'}`}>
                    Generate 3D Models
                  </h3>
                  <span className="ml-2 px-2 py-1 text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full">
                    Frogleo
                  </span>
                </div>
                <p className={`text-sm ${generationType === '3d' ? 'text-emerald-700' : 'text-gray-600'}`}>
                  Convert 2D images into 3D models using Frogleo AI
                </p>
              </div>
            </div>
          </div>
          {/* Input Form */}
          <div className="space-y-6">
            <div>
              <label htmlFor="business-description" className="block text-lg font-semibold text-gray-800 mb-3">
                {generationType === 'image' ? 'Describe Your Image' : 
                 generationType === 'video' ? 'Describe Your Video Scene' : 
                 'Additional Description (Optional)'}
              </label>
              <textarea
                id="business-description"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder={
                  generationType === 'image' 
                    ? "e.g., A modern tech startup logo with clean lines and blue colors"
                    : generationType === 'video'
                    ? "e.g., A cat playing piano in a cozy jazz bar with warm lighting"
                    : "e.g., Additional details about the 3D model you want to create"
                }
                className="w-full h-32 p-4 border-2 border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder-gray-500 bg-white"
                disabled={isGenerating}
              />
            </div>
            
            {/* Generation Options */}
            {generationType === 'image' ? (
              <div>
                <label htmlFor="number-of-images" className="block text-lg font-semibold text-gray-800 mb-3">
                  Number of Images
                </label>
                <select
                  id="number-of-images"
                  value={numberOfImages}
                  onChange={(e) => setNumberOfImages(parseInt(e.target.value))}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 bg-white"
                  disabled={isGenerating}
                >
                  <option value={1} className="text-gray-900">1 Image</option>
                  <option value={2} className="text-gray-900">2 Images</option>
                  <option value={3} className="text-gray-900">3 Images</option>
                  <option value={4} className="text-gray-900">4 Images</option>
                </select>
              </div>
            ) : generationType === '3d' ? (
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Upload Image for 3D Generation <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Upload an image that will be converted into a 3D model. Works best with objects that have clear shapes and defined boundaries.
                  <br />
                  <span className="text-emerald-600 font-medium">Your uploaded image will be processed by Frogleo AI to create the 3D model.</span>
                </p>
                
                {!threeDInputImagePreview ? (
                  <div className="border-2 border-dashed border-emerald-300 rounded-xl p-6 text-center hover:border-emerald-400 transition-colors">
                    <input
                      type="file"
                      id="3d-image-upload"
                      accept="image/*"
                      onChange={handle3DImageUpload}
                      className="hidden"
                      disabled={isGenerating}
                    />
                    <label
                      htmlFor="3d-image-upload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-emerald-600 font-medium">Click to upload image for 3D conversion</span>
                      <span className="text-gray-500 text-sm">PNG, JPG, JPEG up to 10MB</span>
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="border-2 border-emerald-300 rounded-xl p-4 bg-emerald-50">
                      <img
                        src={threeDInputImagePreview}
                        alt="3D Reference"
                        className="max-w-full h-48 object-contain mx-auto rounded-lg"
                      />
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-sm text-gray-700">
                          {threeDInputImage?.name}
                        </span>
                        <button
                          onClick={remove3DImage}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          disabled={isGenerating}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="video-duration" className="block text-lg font-semibold text-gray-800 mb-3">
                      Duration
                    </label>
                    <select
                      id="video-duration"
                      value={videoDuration}
                      onChange={(e) => setVideoDuration(parseInt(e.target.value))}
                      className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-gray-900 bg-white"
                      disabled={isGenerating}
                    >
                      <option value={3} className="text-gray-900">3 seconds</option>
                      <option value={5} className="text-gray-900">5 seconds</option>
                      <option value={10} className="text-gray-900">10 seconds</option>
                      <option value={15} className="text-gray-900">15 seconds</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="video-resolution" className="block text-lg font-semibold text-gray-800 mb-3">
                      Resolution
                    </label>
                    <select
                      id="video-resolution"
                      value={`${videoResolution.width}x${videoResolution.height}`}
                      onChange={(e) => {
                        const [width, height] = e.target.value.split('x').map(Number)
                        setVideoResolution({ width, height })
                      }}
                      className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-gray-900 bg-white"
                      disabled={isGenerating}
                    >
                      <option value="480x480" className="text-gray-900">480x480 (Square)</option>
                      <option value="1280x720" className="text-gray-900">1280x720 (HD)</option>
                      <option value="1920x1080" className="text-gray-900">1920x1080 (Full HD)</option>
                    </select>
                  </div>
                </div>

                {/* Optional Image Input */}
                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">
                    Reference Image <span className="text-sm text-purple-600 font-normal">(Optional)</span>
                  </label>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload an image to guide the video generation. Sora will use this as a starting frame or reference for the video style.
                  </p>
                  
                  {!videoInputImagePreview ? (
                    <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors">
                      <input
                        type="file"
                        id="video-image-upload"
                        accept="image/*"
                        onChange={handleVideoImageUpload}
                        className="hidden"
                        disabled={isGenerating}
                      />
                      <label
                        htmlFor="video-image-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-purple-600 font-medium">Click to upload image</span>
                        <span className="text-gray-500 text-sm">PNG, JPG, JPEG up to 10MB</span>
                      </label>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="border-2 border-purple-300 rounded-xl p-4 bg-purple-50">
                        <img
                          src={videoInputImagePreview}
                          alt="Reference"
                          className="max-w-full h-48 object-contain mx-auto rounded-lg"
                        />
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-sm text-gray-700">
                            {videoInputImage?.name}
                          </span>
                          <button
                            onClick={removeVideoImage}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            disabled={isGenerating}
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-800">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <button
              onClick={generateLogo}
              disabled={isGenerating || (generationType !== '3d' && !businessDescription.trim()) || (generationType === '3d' && !threeDInputImage)}
              className={`w-full font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center text-white ${
                generationType === 'image'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500'
                  : generationType === 'video'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500'
              } disabled:cursor-not-allowed shadow-lg hover:shadow-xl`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  {generationType === 'image' 
                    ? `Generating ${numberOfImages > 1 ? 'Images' : 'Image'}...`
                    : generationType === 'video'
                    ? 'Generating Video... (This may take several minutes)'
                    : 'Generating 3D Model... (This may take several minutes)'
                  }
                </>
              ) : (
                <>
                  {generationType === 'image' ? (
                    <Sparkles className="w-5 h-5 mr-3" />
                  ) : generationType === 'video' ? (
                    <Play className="w-5 h-5 mr-3" />
                  ) : (
                    <Box className="w-5 h-5 mr-3" />
                  )}
                  {generationType === 'image' 
                    ? `Generate ${numberOfImages > 1 ? `${numberOfImages} Images` : 'Image'}`
                    : generationType === 'video'
                    ? 'Generate Video with Sora'
                    : 'Generate 3D Model with Frogleo'
                  }
                </>
              )}
            </button>
          </div>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              Debug: {generationType === 'image' ? `Images count: ${generatedLogos.length}` : 
                     generationType === 'video' ? `Video: ${generatedVideo ? 'Generated' : 'None'}` :
                     `3D Model: ${generated3DModel ? 'Generated' : 'None'}`}
              {generationType === 'image' && generatedLogos.length > 0 && (
                <>
                  <br />First URL: {generatedLogos[0]?.url}
                  <br />First Prompt: {generatedLogos[0]?.revisedPrompt}
                </>
              )}
              {generationType === 'video' && generatedVideo && (
                <>
                  <br />Video URL: {generatedVideo.url}
                  <br />Video Prompt: {generatedVideo.prompt}
                </>
              )}
              {generationType === '3d' && generated3DModel && (
                <>
                  <br />3D Model Status: {generated3DModel.success ? 'Success' : 'Failed'}
                  <br />3D Model Message: {generated3DModel.message}
                  <br />Provider: {generated3DModel.provider}
                  {generated3DModel.filename && <><br />Filename: {generated3DModel.filename}</>}
                  {generated3DModel.modelUrl && <><br />Model URL: {generated3DModel.modelUrl}</>}
                </>
              )}
            </p>
          </div>
        )}

        {/* Generated Content Section */}
        {((generationType === 'image' && generatedLogos.length > 0) || 
          (generationType === 'video' && generatedVideo) ||
          (generationType === '3d' && generated3DModel)) && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {generationType === 'image' 
                ? `Your Generated ${generatedLogos.length > 1 ? 'Images' : 'Image'}`
                : generationType === 'video'
                ? 'Your Generated Video'
                : 'Your Generated 3D Model'
              }
            </h2>
            
            {generationType === 'image' ? (
              <div className={`grid gap-6 ${
                generatedLogos.length === 1 ? 'grid-cols-1 justify-items-center' :
                generatedLogos.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              }`}>
                {generatedLogos.map((logo, index) => (
                  <div key={index} className="flex flex-col items-center space-y-4">
                    <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 max-w-sm shadow-md">
                      <img
                        src={logo.url}
                        alt={`Generated Image ${index + 1}`}
                        className="max-w-full h-auto rounded-lg shadow-sm"
                        onLoad={() => console.log(`Image ${index + 1} loaded successfully`)}
                        onError={(e) => {
                          console.error(`Image ${index + 1} failed to load:`, e)
                          setError(`Failed to load generated image ${index + 1}`)
                        }}
                        crossOrigin="anonymous"
                      />
                    </div>

                    <div className="text-center max-w-sm">
                      <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                        <strong className="text-gray-900">AI Interpretation:</strong> {logo.revisedPrompt}
                      </p>
                    </div>

                    <button
                      onClick={() => downloadLogo(logo, index)}
                      className="bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Image {generatedLogos.length > 1 ? (index + 1) : ''}
                    </button>
                  </div>
                ))}
              </div>
            ) : generatedVideo && (
              <div className="flex flex-col items-center space-y-6">
                <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 max-w-3xl shadow-lg">
                  <video
                    controls
                    className="max-w-full h-auto rounded-lg shadow-md"
                    preload="metadata"
                    onError={(e) => {
                      console.error('Video failed to load:', e)
                      setError('Failed to load generated video')
                    }}
                  >
                    <source src={generatedVideo.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>

                <div className="text-center max-w-2xl">
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                    <strong className="text-gray-900">Prompt:</strong> {generatedVideo.prompt}
                  </p>
                  <div className="flex justify-center space-x-6 text-sm text-gray-600">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {generatedVideo.duration}s
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                      </svg>
                      {generatedVideo.width}×{generatedVideo.height}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => downloadVideo(generatedVideo)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Video
                </button>
              </div>
            )}
            
            {generationType === '3d' && generated3DModel && (
              <div className="flex flex-col items-center space-y-6">
                <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 max-w-4xl shadow-lg">
                  <div className="text-center">
                    <div className="mb-4">
                      <Box className="w-16 h-16 text-emerald-600 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-emerald-900">3D Model Generated Successfully!</h3>
                    </div>
                    
                    {generated3DModel.success ? (
                      <div className="space-y-4">
                        {/* Output HTML Preview */}
                        {generated3DModel.outputHtml && (
                          <div className="bg-white rounded-lg p-4 border border-emerald-200">
                            <h4 className="text-emerald-800 font-medium mb-3">3D Model Preview</h4>
                            <div 
                              className="w-full min-h-[400px] bg-gray-50 rounded-lg overflow-hidden"
                              dangerouslySetInnerHTML={{ __html: generated3DModel.outputHtml }}
                            />
                          </div>
                        )}
                        
                        {/* Model Information */}
                        <div className="bg-white rounded-lg p-4 border border-emerald-200">
                          <p className="text-emerald-800 font-medium mb-2">{generated3DModel.message}</p>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex justify-between">
                              <span>Status:</span>
                              <span className="text-emerald-600 font-medium">✓ Complete</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Provider:</span>
                              <span className="text-gray-800">{generated3DModel.provider}</span>
                            </div>
                            {generated3DModel.filename && (
                              <div className="flex justify-between">
                                <span>Filename:</span>
                                <span className="text-gray-800 font-mono text-xs">{generated3DModel.filename}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Generated:</span>
                              <span className="text-gray-800">{new Date(generated3DModel.timestamp).toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                            <div className="text-center p-2 bg-emerald-50 rounded">
                              <div className="text-emerald-600 font-medium">Generation</div>
                              <div className="text-emerald-700">✓ {generated3DModel.steps.generation}</div>
                            </div>
                            <div className="text-center p-2 bg-emerald-50 rounded">
                              <div className="text-emerald-600 font-medium">Download</div>
                              <div className="text-emerald-700">✓ {generated3DModel.steps.download}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800">3D model generation failed. Please try again.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center max-w-lg">
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                    <strong className="text-gray-900">Note:</strong> The 3D model has been processed using Frogleo AI. 
                    You can interact with the preview above or download the GLB file below.
                  </p>
                </div>

                {generated3DModel.success && generated3DModel.modelUrl && (
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(generated3DModel.modelUrl)
                        const blob = await response.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = generated3DModel.filename || `model-${Date.now()}.glb`
                        document.body.appendChild(a)
                        a.click()
                        window.URL.revokeObjectURL(url)
                        document.body.removeChild(a)
                      } catch (err) {
                        console.error('Download error:', err)
                        setError('Failed to download 3D model')
                      }
                    }}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download 3D Model (.glb)
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Powered by Azure OpenAI | Images: GPT-4 Vision | Videos: Sora Model | 3D Models: Frogleo AI</p>
        </div>
        </div>
      </main>
    </div>
  )
}
