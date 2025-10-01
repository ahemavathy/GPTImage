'use client';

import React, { useState, useRef } from 'react';
import { Upload, Zap, TrendingUp, Clock, Image as ImageIcon } from 'lucide-react';
import { ScoringResponse } from '@/types/scoring';

// Inline utility functions for Azure AI Vision scoring
const formatScoreAsPercentage = (score: number, decimals: number = 0): string => {
  return `${(score * 100).toFixed(decimals)}%`;
};

const getScoreColor = (score: number): string => {
  if (score >= 0.95) return '#10b981'; // green-500 - Excellent
  if (score >= 0.9) return '#3b82f6'; // blue-500 - Good
  if (score >= 0.7) return '#f59e0b'; // amber-500 - Fair
  return '#ef4444'; // red-500 - Poor
};

const getScoreDescription = (score: number): string => {
  if (score >= 0.95) return 'Excellent semantic match - nearly identical concepts';
  if (score >= 0.9) return 'Good semantic alignment - very similar concepts';
  if (score >= 0.7) return 'Fair semantic alignment - moderately related concepts';
  return 'Poor semantic alignment - distantly related or unrelated concepts';
};

/**
 * ImageScorer Component
 * 
 * A React component that allows users to upload an image and text prompt
 * to get CLIP-based similarity scoring. This component provides immediate
 * feedback on how well generated images align with their prompts.
 */
export default function ImageScorer() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [isScoring, setIsScoring] = useState<boolean>(false);
  const [scoringResult, setScoringResult] = useState<ScoringResponse | null>(null);
  const [error, setError] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScore = async () => {
    if (!selectedImage || !prompt.trim()) {
      setError('Please select an image and enter a prompt');
      return;
    }

    setIsScoring(true);
    setError('');
    setScoringResult(null);

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('prompt', prompt.trim());

      console.log('Sending scoring request...', {
        imageSize: selectedImage.size,
        promptLength: prompt.length
      });

      // Call scoring API
      const response = await fetch('/api/score-image', {
        method: 'POST',
        body: formData,
      });

      const result: ScoringResponse = await response.json();

      if (result.success) {
        setScoringResult(result);
        console.log('Scoring completed:', result);
      } else {
        setError(result.error || 'Failed to score image');
      }

    } catch (error) {
      console.error('Error scoring image:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while scoring');
    } finally {
      setIsScoring(false);
    }
  };

  const clearAll = () => {
    setSelectedImage(null);
    setImagePreview('');
    setPrompt('');
    setScoringResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Zap className="w-8 h-8 text-blue-600 mr-3" />
          <h2 className="text-3xl font-bold text-gray-900">Image Quality Scorer</h2>
        </div>
        <p className="text-gray-600 max-w-2xl">
          Upload an image and prompt to get two different similarity scores: one based on 
          AI-generated captions, and another using direct image-text comparison.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="space-y-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                  <p className="text-sm text-gray-600">{selectedImage?.name}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-gray-600">Click to upload an image</p>
                    <p className="text-sm text-gray-500">PNG, JPG, WEBP up to 10MB</p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Prompt Input */}
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Text Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter the text prompt used to generate this image..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-gray-900 placeholder-gray-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              {prompt.length} characters
            </p>
          </div>

          {/* Score Button */}
          <button
            onClick={handleScore}
            disabled={!selectedImage || !prompt.trim() || isScoring}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center"
          >
            {isScoring ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Scoring Image...
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5 mr-2" />
                Score Image Quality
              </>
            )}
          </button>

          {/* Clear Button */}
          {(selectedImage || prompt || scoringResult) && (
            <button
              onClick={clearAll}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900">Scoring Results</h3>
          
          {isScoring && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-blue-700">Analyzing image-prompt alignment...</p>
              <p className="text-sm text-blue-600 mt-1">This may take a few seconds</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {scoringResult?.success && scoringResult.scores && (
            <div className="space-y-4">
              {/* Azure AI Vision Similarity Score */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">Text Embedding Similarity Score</h4>
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: getScoreColor(scoringResult.scores.azureVisionSimilarity) }}
                    ></div>
                    <span className="text-2xl font-bold" style={{ color: getScoreColor(scoringResult.scores.azureVisionSimilarity) }}>
                      {formatScoreAsPercentage(scoringResult.scores.azureVisionSimilarity)}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  {getScoreDescription(scoringResult.scores.azureVisionSimilarity)}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${scoringResult.scores.azureVisionSimilarity * 100}%`,
                      backgroundColor: getScoreColor(scoringResult.scores.azureVisionSimilarity)
                    }}
                  ></div>
                </div>
                
                {/* Generated Caption Display */}
                {scoringResult.azureVisionDetails?.generatedCaption && (
                  <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-blue-100">
                    <h5 className="text-sm font-medium text-gray-700 mb-1">What Azure AI Vision sees:</h5>
                    <p className="text-gray-900 text-sm italic">"{scoringResult.azureVisionDetails.generatedCaption}"</p>
                    
                    {/* Model details */}
                    <div className="mt-2 text-xs text-gray-600 flex items-center justify-between">
                      <span className="inline-flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                        AI Vision model - Caption confidence: {Math.round(scoringResult.azureVisionDetails.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Azure Computer Vision Multimodal Score */}
              {scoringResult.scores.azureMultimodalSimilarity !== undefined && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">MM Embedding Similarity Score</h4>
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: getScoreColor(scoringResult.scores.azureMultimodalSimilarity) }}
                      ></div>
                      <span className="text-2xl font-bold" style={{ color: getScoreColor(scoringResult.scores.azureMultimodalSimilarity) }}>
                        {formatScoreAsPercentage(scoringResult.scores.azureMultimodalSimilarity)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    {getScoreDescription(scoringResult.scores.azureMultimodalSimilarity)}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${scoringResult.scores.azureMultimodalSimilarity * 100}%`,
                        backgroundColor: getScoreColor(scoringResult.scores.azureMultimodalSimilarity)
                      }}
                    ></div>
                  </div>
                  
                  {/* Multimodal Method Details */}
                  {scoringResult.multimodalDetails && (
                    <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-purple-100">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Direct Image-Text Comparison:</h5>
                      <p className="text-gray-900 text-sm mb-2">
                        Uses Azure Computer Vision's multimodal embeddings to directly compare image content with text prompt in the same vector space.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata */}
              {scoringResult.metadata && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Processing Details</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">
                        {scoringResult.metadata.processingTime}ms
                      </span>
                    </div>
                    {scoringResult.metadata.tokenUsage && (
                      <div className="flex items-center">
                        <span className="w-4 h-4 text-gray-400 mr-2 text-xs font-mono">T</span>
                        <span className="text-gray-600">
                          {scoringResult.metadata.tokenUsage.totalTokens} tokens
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Score Interpretation */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Cosine Similarity Interpretation</h5>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="text-center">
                    <div className="w-full bg-red-500 h-2 rounded mb-1"></div>
                    <span className="text-gray-600">Poor<br/>0-70%<br/>Unrelated</span>
                  </div>
                  <div className="text-center">
                    <div className="w-full bg-amber-500 h-2 rounded mb-1"></div>
                    <span className="text-gray-600">Fair<br/>70-90%<br/>Moderately related</span>
                  </div>
                  <div className="text-center">
                    <div className="w-full bg-blue-500 h-2 rounded mb-1"></div>
                    <span className="text-gray-600">Good<br/>90-95%<br/>Very similar</span>
                  </div>
                  <div className="text-center">
                    <div className="w-full bg-green-500 h-2 rounded mb-1"></div>
                    <span className="text-gray-600">Excellent<br/>95-100%<br/>Nearly identical</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Scores reflect semantic similarity between concepts, not visual similarity
                </p>
              </div>
            </div>
          )}

          {!isScoring && !scoringResult && !error && (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Upload an image and enter a prompt to see quality scores</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}