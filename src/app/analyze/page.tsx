'use client';

import { useState, useRef } from 'react';
import { Upload, Send, ArrowLeft, Image as ImageIcon, Loader2, X, Copy, Check, FileText } from 'lucide-react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

// TypeScript interfaces following Next.js best practices
interface AnalysisResponse {
  response: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ImageUploadResponse {
  success: boolean;
  fileName?: string;
  filePath?: string;
  originalFileName?: string;
  fileSize?: number;
  uploadedAt?: string;
  id?: string;
}

// Utility functions following Next.js best practices
const cleanJsonContent = (content: string): string => {
  return content
    .replace(/```json\n?/g, '')   // Remove ```json at the beginning
    .replace(/\n?```$/g, '')      // Remove ``` at the end
    .replace(/```/g, '')          // Remove any remaining ``` markers
    .trim();                       // Remove leading/trailing whitespace
};

const formatForAPI = (content: string): string => {
  return content
    .replace(/\\/g, '\\\\')       // Escape backslashes first
    .replace(/"/g, '\\"')         // Escape quotes
    .replace(/\n/g, '\\n')        // Replace newlines with \\n
    .replace(/\r/g, '\\r');       // Replace carriage returns
};

const validateImageFiles = (files: File[]): { validFiles: File[]; hasInvalidFiles: boolean } => {
  const validFiles = files.filter(file => file.type.startsWith('image/'));
  const hasInvalidFiles = validFiles.length !== files.length;
  return { validFiles, hasInvalidFiles };
};

const truncateFilename = (filename: string, maxLength: number = 15): string => {
  return filename.length > maxLength 
    ? filename.substring(0, maxLength) + '...'
    : filename;
};

/**
 * Image Analysis Page Component
 * 
 * This page allows users to upload multiple images and generate PowerPoint presentations
 * using Azure OpenAI GPT-4o for image analysis and content generation.
 * 
 * Features:
 * - Multi-image upload with drag & drop support
 * - Real-time image preview with file management
 * - GPT-4o powered image analysis
 * - Editable slide content generation
 * - PowerPoint file generation and download
 * - Copy formatted content for API usage
 * 
 * Follows Next.js best practices:
 * - Proper TypeScript interfaces
 * - Accessibility features (ARIA attributes, semantic HTML)
 * - Error handling and validation
 * - Utility function organization
 * - Component documentation
 * 
 * @returns JSX.Element - The rendered analyze page component
 */
export default function ImageAnalysisPage() {
  // State management following React best practices
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [textInput, setTextInput] = useState("I want to create a compelling presentation that highlights the new air fryer's sophistication and strengthens our brand's positioning as a premium kitchen appliance.");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [generatingPPT, setGeneratingPPT] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Event handlers with improved error handling
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    addFiles(files);
  };

  const addFiles = async (files: File[]) => {
    try {
      const { validFiles, hasInvalidFiles } = validateImageFiles(files);
      
      if (hasInvalidFiles) {
        setError('Some files were skipped. Only image files are allowed.');
      } else {
        setError('');
      }

      const newFiles = [...selectedFiles, ...validFiles];
      const newUrls = [...previewUrls, ...validFiles.map(file => URL.createObjectURL(file))];
      
      setSelectedFiles(newFiles);
      setPreviewUrls(newUrls);
      
      // Upload the new images to PowerPoint API
      if (validFiles.length > 0) {
        await uploadImagesToPowerPointAPI(validFiles);
      }
    } catch (error) {
      console.error('Error in addFiles:', error);
      setError(error instanceof Error ? error.message : 'Failed to process files');
    }
  };

  const uploadImagesToPowerPointAPI = async (files: File[]) => {
    setUploadingImages(true);
    setError('');
    
    try {
      const formData = new FormData();
      
      // Add all images to FormData with 'files' field name (as per Swagger)
      files.forEach((file) => {
        formData.append('files', file);
      });
      
      const response = await fetch('http://localhost:5000/api/Presentation/upload-images', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Image upload failed: ${response.status} - ${errorData}`);
      }
      
      const result: ImageUploadResponse[] = await response.json();
      
      // API returns an array of ImageUploadResponse objects
      if (Array.isArray(result)) {
        // Extract the uploaded file references from the response array
        const uploadedFileRefs = result
          .filter(item => item.success) // Only include successful uploads
          .map(item => item.fileName || item.filePath || item.id || '')
          .filter(ref => ref !== ''); // Remove empty references
        
        setUploadedImages(prev => [...prev, ...uploadedFileRefs]);
      }
      
    } catch (error) {
      console.error('Error uploading images to PowerPoint API:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload images');
      throw error; // Re-throw to be handled by calling function
    } finally {
      setUploadingImages(false);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newUrls = previewUrls.filter((_, i) => i !== index)
    const newUploadedImages = uploadedImages.filter((_, i) => i !== index)
    
    // Clean up the URL
    URL.revokeObjectURL(previewUrls[index])
    
    setSelectedFiles(newFiles)
    setPreviewUrls(newUrls)
    setUploadedImages(newUploadedImages)
  }

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      setError('Please upload at least one image')
      return
    }

    if (!textInput.trim()) {
      setError('Please enter a text prompt')
      return
    }

    setIsLoading(true)
    setError('')
    setResponse(null)

    try {
      const formData = new FormData()
      
      // Add text input
      formData.append('prompt', textInput.trim())
      
      // Add all images
      selectedFiles.forEach((file, index) => {
        formData.append(`image_${index}`, file)
      })

      const response = await fetch('/api/analyze-images', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze images')
      }

      const data: AnalysisResponse = await response.json()
      setResponse(data)
      // Initialize editable content with cleaned JSON
      setEditableContent(cleanJsonContent(data.response))
    } catch (error) {
      console.error('Error analyzing images:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const clearAll = () => {
    // Clean up URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url))
    
    setSelectedFiles([])
    setPreviewUrls([])
    setTextInput('')
    setResponse(null)
    setError('')
    setUploadedImages([]) // Clear uploaded image references
    setEditableContent('') // Clear editable content
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const cleanJsonContent = (content: string) => {
    return content
      .replace(/```json\n?/g, '')   // Remove ```json at the beginning
      .replace(/\n?```$/g, '')      // Remove ``` at the end
      .replace(/```/g, '')          // Remove any remaining ``` markers
      .trim()                       // Remove leading/trailing whitespace
  }

  const copyForAPI = async () => {
    if (!editableContent && !response?.response) return;
    
    try {
      // Use editable content if available, otherwise use cleaned original content
      const contentToCopy = editableContent || (response?.response ? cleanJsonContent(response.response) : '');
      const formattedString = formatForAPI(contentToCopy);
      
      // Modern clipboard API with fallback
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(formattedString);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = formattedString;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setError('Failed to copy to clipboard');
    }
  };

  const generatePowerPoint = async () => {
    if (!response?.response) return
    
    setGeneratingPPT(true)
    setError('')
    
    try {
      // Use editable content if available, otherwise use cleaned original content
      const contentToUse = editableContent || cleanJsonContent(response.response)
      
      // Prepare the request body for the PowerPoint API
      const requestBody = {
        jsonContent: contentToUse,
        presentationName: `Presentation_${Date.now()}`,
        presentationTitle: "AI Generated Presentation",
        author: "GPT Image Generator",
        uploadedImages: uploadedImages // Include references to uploaded images
      }
      
      // Call the PowerPoint generator API
      const pptResponse = await fetch('http://localhost:5000/api/Presentation/create-from-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      
      if (!pptResponse.ok) {
        const errorData = await pptResponse.text()
        throw new Error(`PowerPoint generation failed: ${pptResponse.status} - ${errorData}`)
      }
      
      // Get the response with file information
      const result = await pptResponse.json()
      
      if (!result.success) {
        throw new Error('PowerPoint generation was not successful')
      }
      
      // Download the generated PowerPoint file using the download endpoint
      if (result.fileName) {
        const downloadResponse = await fetch(`http://localhost:5000/api/Presentation/download/${result.fileName}`)
        
        if (downloadResponse.ok) {
          const blob = await downloadResponse.blob()
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = result.fileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        } else {
          throw new Error('Failed to download the generated PowerPoint file')
        }
      }
      
    } catch (error) {
      console.error('Error generating PowerPoint:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate PowerPoint')
    } finally {
      setGeneratingPPT(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      {/* Navigation Bar */}
      <Navigation />

      <main className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <ImageIcon className="w-12 h-12 text-green-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">PPT Generation</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload images and ask GPT-4o to generate a pitch deck
            </p>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Images & Prompt</h2>
            
            {/* File Upload */}
            <div className="mb-6">
              <label 
                htmlFor="image-upload"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Upload Images
              </label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files);
                  addFiles(files);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => e.preventDefault()}
                role="button"
                tabIndex={0}
                aria-label="Upload images by clicking or dragging and dropping"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-1">
                  Drag and drop images here, or click to browse
                </p>
                <p className="text-sm text-gray-500">PNG, JPG, JPEG - Multiple files allowed</p>
              </div>
              <input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                aria-describedby="upload-help"
              />
              <div id="upload-help" className="sr-only">
                Select multiple image files to upload for analysis
              </div>
            </div>

            {/* Selected Images Preview */}
            {selectedFiles.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-700">
                    Selected Images ({selectedFiles.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    {uploadingImages && (
                      <div className="flex items-center text-blue-600 text-sm">
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Uploading...
                      </div>
                    )}
                    <button
                      onClick={clearAll}
                      className="text-red-600 hover:text-red-700 px-3 py-1 text-sm border border-red-300 rounded-md hover:bg-red-50 transition-colors flex items-center"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        {truncateFilename(selectedFiles[index].name)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Text Input */}
            <div className="mb-6">
              <label 
                htmlFor="guidelines-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Your guidelines
              </label>
              <textarea
                id="guidelines-input"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="I want to create a compelling presentation that highlights the new air fryer's sophistication and strengthens our brand's positioning as a premium kitchen appliance."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                aria-describedby="guidelines-help"
                required
              />
              <div id="guidelines-help" className="sr-only">
                Enter your guidelines for the presentation generation
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading || selectedFiles.length === 0 || !textInput.trim()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Generate ppt slide content
                </>
              )}
            </button>

            {error && (
              <div 
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
                role="alert"
                aria-live="polite"
              >
                <strong className="font-medium">Error:</strong> {error}
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Powerpoint Flow</h2>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p>Analyzing your images...</p>
              </div>
            ) : response ? (
              <div className="space-y-6">
                {/* Response */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">Slide Content</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={copyForAPI}
                        className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                          copied
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            Copy for API
                          </>
                        )}
                      </button>
                      <button
                        onClick={generatePowerPoint}
                        disabled={generatingPPT}
                        className="flex items-center px-3 py-2 text-sm rounded-md transition-colors bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        {generatingPPT ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-1" />
                            Generate PowerPoint
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-300 rounded-lg">
                    <textarea
                      value={editableContent}
                      onChange={(e) => setEditableContent(e.target.value)}
                      className="w-full h-80 p-4 border-0 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed"
                      placeholder="Generated slide content will appear here for editing..."
                    />
                  </div>
                </div>

                {/* Usage Stats */}
                {response.usage && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Token Usage</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-blue-600">Prompt:</span>
                        <span className="ml-1 font-medium">{response.usage.prompt_tokens}</span>
                      </div>
                      <div>
                        <span className="text-blue-600">Response:</span>
                        <span className="ml-1 font-medium">{response.usage.completion_tokens}</span>
                      </div>
                      <div>
                        <span className="text-blue-600">Total:</span>
                        <span className="ml-1 font-medium">{response.usage.total_tokens}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <ImageIcon className="w-16 h-16 mb-4 text-gray-300" />
                <p>Upload images and enter a prompt to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Powered by Azure OpenAI GPT-4o - Advanced image understanding and analysis</p>
        </div>
        </div>
      </main>
    </div>
  )
}
