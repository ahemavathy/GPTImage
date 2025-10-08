'use client';

import React, { useState, useRef } from 'react';
import { Upload, Zap, TrendingUp, Clock, Image as ImageIcon } from 'lucide-react';

// TypeScript interfaces for scoring
interface EmbeddingModelResult {
  azureVisionSimilarity: number;
  gpt4oSimilarity: number;
  modelName: string;
  dimensions: number;
  tokenUsage?: {
    promptTokens: number;
    totalTokens: number;
  };
  processingTime: number;
}

interface ImageScores {
  azureVisionSimilarity: number;
  azureMultimodalSimilarity?: number;
  gpt4oDescriptionSimilarity?: number;
  classificationAccuracy?: number;
}

interface ScoringMetadata {
  imageSize: {
    width: number;
    height: number;
  };
  promptLength: number;
  processingTime: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface ScoringResponse {
  success: boolean;
  scores?: ImageScores;
  metadata?: ScoringMetadata;
  azureVisionDetails?: {
    generatedCaption: string;
    confidence: number;
    modelUsed: string;
  };
  multimodalDetails?: {
    imageEmbeddingDimensions: number;
    textEmbeddingDimensions: number;
    modelUsed: string;
  };
  gpt4oDetails?: {
    generatedDescription: string;
    modelUsed: string;
    tokenUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
  embeddingComparison?: {
    ada002: EmbeddingModelResult;
    embedding3Small: EmbeddingModelResult;
    embedding3Large: EmbeddingModelResult;
  };
  error?: string;
}

// Inline utility functions for Azure AI Vision scoring
const formatScoreAsPercentage = (score: number, decimals: number = 0): string => {
  return `${(score * 100).toFixed(decimals)}%`;
};

const getScoreColor = (score: number): string => {
  if (score >= 0.85) return '#10b981'; // green-500 - Extremely similar
  if (score >= 0.7) return '#3b82f6'; // blue-500 - Very similar  
  if (score >= 0.5) return '#f59e0b'; // amber-500 - Moderately similar
  if (score >= 0.3) return '#f97316'; // orange-500 - Somewhat related
  return '#ef4444'; // red-500 - Very different
};

const getScoreDescription = (score: number): string => {
  if (score >= 0.85) return 'Extremely similar - nearly identical semantic concepts';
  if (score >= 0.7) return 'Very similar - strong semantic alignment';
  if (score >= 0.5) return 'Moderately similar - related concepts with clear connections';
  if (score >= 0.3) return 'Somewhat related - weak but detectable semantic relationship';
  return 'Very different - minimal or no semantic relationship';
};

const getModelDisplayName = (modelName: string): string => {
  switch (modelName) {
    case 'text-embedding-ada-002': return 'Ada-002 (Legacy)';
    case 'text-embedding-3-small': return '3-Small (Efficient)';
    case 'text-embedding-3-large': return '3-Large (Performance)';
    default: return modelName;
  }
};

const getModelColor = (modelName: string): string => {
  switch (modelName) {
    case 'text-embedding-ada-002': return '#6b7280'; // gray-500
    case 'text-embedding-3-small': return '#3b82f6'; // blue-500  
    case 'text-embedding-3-large': return '#8b5cf6'; // violet-500
    default: return '#6b7280';
  }
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
          Upload an image and prompt to get comprehensive similarity analysis including three scoring methods 
          and comparison across multiple embedding models (Ada-002, 3-Small, 3-Large).
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
                  <h4 className="text-lg font-semibold text-gray-900">Azure Vision Caption Similarity Score</h4>
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: getScoreColor(scoringResult.embeddingComparison?.embedding3Large?.azureVisionSimilarity || scoringResult.scores.azureVisionSimilarity) }}
                    ></div>
                    <span className="text-2xl font-bold" style={{ color: getScoreColor(scoringResult.embeddingComparison?.embedding3Large?.azureVisionSimilarity || scoringResult.scores.azureVisionSimilarity) }}>
                      {formatScoreAsPercentage(scoringResult.embeddingComparison?.embedding3Large?.azureVisionSimilarity || scoringResult.scores.azureVisionSimilarity)}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  {getScoreDescription(scoringResult.embeddingComparison?.embedding3Large?.azureVisionSimilarity || scoringResult.scores.azureVisionSimilarity)}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(scoringResult.embeddingComparison?.embedding3Large?.azureVisionSimilarity || scoringResult.scores.azureVisionSimilarity) * 100}%`,
                      backgroundColor: getScoreColor(scoringResult.embeddingComparison?.embedding3Large?.azureVisionSimilarity || scoringResult.scores.azureVisionSimilarity)
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
                      {scoringResult.embeddingComparison?.embedding3Large && (
                        <span className="text-violet-600">
                          3-Large ({scoringResult.embeddingComparison.embedding3Large.dimensions}D)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* GPT-4o Description Similarity Score */}
              {scoringResult.scores.gpt4oDescriptionSimilarity !== undefined && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">GPT-4o Similarity Score</h4>
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: getScoreColor(scoringResult.embeddingComparison?.embedding3Large?.gpt4oSimilarity || scoringResult.scores.gpt4oDescriptionSimilarity) }}
                      ></div>
                      <span className="text-2xl font-bold" style={{ color: getScoreColor(scoringResult.embeddingComparison?.embedding3Large?.gpt4oSimilarity || scoringResult.scores.gpt4oDescriptionSimilarity) }}>
                        {formatScoreAsPercentage(scoringResult.embeddingComparison?.embedding3Large?.gpt4oSimilarity || scoringResult.scores.gpt4oDescriptionSimilarity)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    {getScoreDescription(scoringResult.embeddingComparison?.embedding3Large?.gpt4oSimilarity || scoringResult.scores.gpt4oDescriptionSimilarity)}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(scoringResult.embeddingComparison?.embedding3Large?.gpt4oSimilarity || scoringResult.scores.gpt4oDescriptionSimilarity) * 100}%`,
                        backgroundColor: getScoreColor(scoringResult.embeddingComparison?.embedding3Large?.gpt4oSimilarity || scoringResult.scores.gpt4oDescriptionSimilarity)
                      }}
                    ></div>
                  </div>
                  
                  {/* GPT-4o Generated Description Display */}
                  {scoringResult.gpt4oDetails?.generatedDescription && (
                    <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-green-100">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">What GPT-4o sees:</h5>
                      <p className="text-gray-900 text-sm italic mb-2">"{scoringResult.gpt4oDetails.generatedDescription}"</p>
                      
                      {/* Model details */}
                      <div className="mt-2 text-xs text-gray-600 flex items-center justify-between">
                        <span className="inline-flex items-center">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                          {scoringResult.gpt4oDetails.modelUsed} - Vision + Language Analysis
                        </span>
                        <div className="flex items-center space-x-2">
                          {scoringResult.embeddingComparison?.embedding3Large && (
                            <span className="text-violet-600">
                              3-Large ({scoringResult.embeddingComparison.embedding3Large.dimensions}D)
                            </span>
                          )}
                          {scoringResult.gpt4oDetails.tokenUsage && (
                            <span className="text-gray-500">
                              {scoringResult.gpt4oDetails.tokenUsage.totalTokens} tokens
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Azure Computer Vision Multimodal Score */}
              {scoringResult.scores.azureMultimodalSimilarity !== undefined && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">MM Embedding Similarity Score</h4>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2 bg-purple-500"></div>
                      <span className="text-2xl font-bold text-purple-700">
                        {formatScoreAsPercentage(scoringResult.scores.azureMultimodalSimilarity)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    Direct multimodal embedding comparison in shared vector space
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="h-2 rounded-full transition-all duration-500 bg-purple-500"
                      style={{ width: `${scoringResult.scores.azureMultimodalSimilarity * 100}%` }}
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

              {/* Embedding Model Comparison */}
              {scoringResult.embeddingComparison && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
                  <h5 className="text-lg font-semibold text-gray-900 mb-4">Embedding Model Comparison</h5>
                  <p className="text-gray-600 text-sm mb-4">
                    Compare how different OpenAI embedding models perform on the same text comparisons.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(scoringResult.embeddingComparison).map(([key, result]) => (
                      <div key={key} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center mb-3">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: getModelColor(result.modelName) }}
                          ></div>
                          <h6 className="font-medium text-gray-900">{getModelDisplayName(result.modelName)}</h6>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Vision Caption:</span>
                            <span className="font-medium" style={{ color: getScoreColor(result.azureVisionSimilarity) }}>
                              {formatScoreAsPercentage(result.azureVisionSimilarity)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">GPT-4o Desc:</span>
                            <span className="font-medium" style={{ color: getScoreColor(result.gpt4oSimilarity) }}>
                              {formatScoreAsPercentage(result.gpt4oSimilarity)}
                            </span>
                          </div>
                          
                          <div className="pt-2 border-t border-gray-100">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{result.dimensions}D</span>
                              <span>{result.processingTime}ms</span>
                            </div>
                            {result.tokenUsage && (
                              <div className="text-xs text-gray-500 mt-1">
                                {result.tokenUsage.totalTokens} tokens
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Model Performance Analysis */}
                  <div className="mt-4 bg-white bg-opacity-60 rounded-lg p-3 border border-indigo-100">
                    <h6 className="text-sm font-medium text-gray-700 mb-2">Model Performance Insights:</h6>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="font-medium text-gray-700">Ada-002:</span>
                        <p className="text-gray-600">Legacy model, balanced performance</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">3-Small:</span>
                        <p className="text-gray-600">Faster, cost-effective, good discrimination</p>
                      </div>
                      <div>
                        <span className="font-medium text-violet-700">3-Large:</span>
                        <p className="text-gray-600">Highest accuracy, better nuanced understanding</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Score Interpretation */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Cosine Similarity Interpretation</h5>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  <div className="text-center">
                    <div className="w-full bg-red-500 h-2 rounded mb-1"></div>
                    <span className="text-gray-600">Very Different<br/>0-30%<br/>Unrelated</span>
                  </div>
                  <div className="text-center">
                    <div className="w-full bg-orange-500 h-2 rounded mb-1"></div>
                    <span className="text-gray-600">Somewhat<br/>30-50%<br/>Weak relation</span>
                  </div>
                  <div className="text-center">
                    <div className="w-full bg-amber-500 h-2 rounded mb-1"></div>
                    <span className="text-gray-600">Moderate<br/>50-70%<br/>Related</span>
                  </div>
                  <div className="text-center">
                    <div className="w-full bg-blue-500 h-2 rounded mb-1"></div>
                    <span className="text-gray-600">Very Similar<br/>70-85%<br/>Strong alignment</span>
                  </div>
                  <div className="text-center">
                    <div className="w-full bg-green-500 h-2 rounded mb-1"></div>
                    <span className="text-gray-600">Extremely<br/>85-100%<br/>Nearly identical</span>
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