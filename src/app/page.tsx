'use client'

import { useState } from 'react'
import { Sparkles, Download, Loader2, Edit3, Image, Brush, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import Navigation from '../components/Navigation'

interface GeneratedLogo {
  url: string
  revisedPrompt: string
}

export default function HomePage() {
  const [businessDescription, setBusinessDescription] = useState('')
  const [numberOfImages, setNumberOfImages] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLogos, setGeneratedLogos] = useState<GeneratedLogo[]>([])
  const [error, setError] = useState('')

  const generateLogo = async () => {
    if (!businessDescription.trim()) {
      setError('Please enter a business description')
      return
    }

    setIsGenerating(true)
    setError('')
    setGeneratedLogos([])

    try {
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
      
    } catch (err) {
      console.error('Error generating logo:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate logo')
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
              <h1 className="text-4xl font-bold text-gray-900">AI Image Generator</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Let AI create professional images for you to prototype in seconds
            </p>
          </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <label htmlFor="business-description" className="block text-lg font-semibold text-gray-700 mb-4">
            Describe Your Needs
          </label>
          <textarea
            id="business-description"
            value={businessDescription}
            onChange={(e) => setBusinessDescription(e.target.value)}
            placeholder="e.g., An air fryer on a kitchen countertop"
            className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            disabled={isGenerating}
          />
          
          {/* Number of Images Input */}
          <div className="mt-6">
            <label htmlFor="number-of-images" className="block text-lg font-semibold text-gray-700 mb-2">
              Number of Images
            </label>
            <select
              id="number-of-images"
              value={numberOfImages}
              onChange={(e) => setNumberOfImages(parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              disabled={isGenerating}
            >
              <option value={1}>1 Image</option>
              <option value={2}>2 Images</option>
              <option value={3}>3 Images</option>
              <option value={4}>4 Images</option>
            </select>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={generateLogo}
            disabled={isGenerating || !businessDescription.trim()}
            className="mt-6 w-full bg-indigo-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Your {numberOfImages > 1 ? 'Images' : 'Image'}...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate {numberOfImages > 1 ? `${numberOfImages} Images` : 'Image'}
              </>
            )}
          </button>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              Debug: generatedLogos count: {generatedLogos.length}
              {generatedLogos.length > 0 && (
                <>
                  <br />First URL: {generatedLogos[0]?.url}
                  <br />First Prompt: {generatedLogos[0]?.revisedPrompt}
                </>
              )}
            </p>
          </div>
        )}

        {/* Generated Images Section */}
        {generatedLogos.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Your Generated {generatedLogos.length > 1 ? 'Images' : 'Image'}
            </h2>
            
            <div className={`grid gap-6 ${
              generatedLogos.length === 1 ? 'grid-cols-1 justify-items-center' :
              generatedLogos.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {generatedLogos.map((logo, index) => (
                <div key={index} className="flex flex-col items-center space-y-4">
                  <div className="relative bg-gray-50 rounded-lg p-4 max-w-sm">
                    <img
                      src={logo.url}
                      alt={`Generated Image ${index + 1}`}
                      className="max-w-full h-auto rounded-lg shadow-md"
                      onLoad={() => console.log(`Image ${index + 1} loaded successfully`)}
                      onError={(e) => {
                        console.error(`Image ${index + 1} failed to load:`, e)
                        setError(`Failed to load generated image ${index + 1}`)
                      }}
                      crossOrigin="anonymous"
                    />
                  </div>

                  <div className="text-center max-w-sm">
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>AI Interpretation:</strong> {logo.revisedPrompt}
                    </p>
                  </div>

                  <button
                    onClick={() => downloadLogo(logo, index)}
                    className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Image {generatedLogos.length > 1 ? (index + 1) : ''}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Powered by Azure OpenAI GPT Image API</p>
        </div>
        </div>
      </main>
    </div>
  )
}
