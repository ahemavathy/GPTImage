/**
 * TypeScript interfaces for the Image Scoring System
 * 
 * This file defines the data structures used throughout the scoring system
 * for type safety and consistency across the application.
 */

/**
 * Request payload for image scoring API
 */
export interface ScoringRequest {
  /** Image file to be scored */
  image: File;
  /** Text prompt used to generate the image */
  prompt: string;
  /** Optional metadata about the image generation */
  metadata?: {
    /** Model used for generation */
    model?: string;
    /** Generation parameters */
    parameters?: Record<string, any>;
    /** Timestamp of generation */
    generatedAt?: string;
  };
}

/**
 * Response from image scoring API
 */
export interface ScoringResponse {
  /** Whether the scoring was successful */
  success: boolean;
  /** Calculated scores (only present if successful) */
  scores?: ImageScores;
  /** Processing metadata */
  metadata?: ScoringMetadata;
  /** Azure AI Vision details including generated caption */
  azureVisionDetails?: {
    generatedCaption: string;
    confidence: number;
    modelUsed: string;
  };
  /** Azure Computer Vision multimodal embedding details */
  multimodalDetails?: {
    imageEmbeddingDimensions: number;
    textEmbeddingDimensions: number;
    modelUsed: string;
  };
  /** Error message (only present if failed) */
  error?: string;
}

/**
 * Image quality scores
 */
export interface ImageScores {
  /** Azure AI Vision similarity score (0-1) */
  azureVisionSimilarity: number;
  /** Azure Computer Vision multimodal embedding similarity score (0-1) */
  azureMultimodalSimilarity?: number;
  /** Classification accuracy score (0-1) - future implementation */
  classificationAccuracy?: number;
  /** Overall quality score derived from individual metrics */
  overallScore?: number;
  /** Confidence intervals for scores */
  confidence?: {
    azureVisionSimilarity?: number;
    azureMultimodalSimilarity?: number;
    classificationAccuracy?: number;
  };
}

/**
 * Metadata about the scoring process
 */
export interface ScoringMetadata {
  /** Original image dimensions */
  imageSize: {
    width: number;
    height: number;
  };
  /** Length of the text prompt */
  promptLength: number;
  /** Processing time in milliseconds */
  processingTime: number;
  /** Token usage information */
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Model information used for scoring */
  model?: {
    azureVisionModel?: string;
    classifierModel?: string;
  };
  /** Timestamp when scoring was performed */
  scoredAt?: string;
}

/**
 * Historical scoring record for analytics
 */
export interface ScoringRecord {
  /** Unique identifier for this scoring session */
  id: string;
  /** The text prompt used */
  prompt: string;
  /** Image filename or identifier */
  imageId: string;
  /** Calculated scores */
  scores: ImageScores;
  /** Processing metadata */
  metadata: ScoringMetadata;
  /** Timestamp of scoring */
  timestamp: Date;
  /** Tags for categorization */
  tags?: string[];
  /** User notes or comments */
  notes?: string;
}

/**
 * Batch scoring request for multiple images
 */
export interface BatchScoringRequest {
  /** Array of images with their prompts */
  items: Array<{
    image: File;
    prompt: string;
    id?: string;
  }>;
  /** Options for batch processing */
  options?: {
    /** Maximum parallel processing */
    maxConcurrency?: number;
    /** Whether to continue on individual failures */
    continueOnError?: boolean;
  };
}

/**
 * Batch scoring response
 */
export interface BatchScoringResponse {
  /** Overall success status */
  success: boolean;
  /** Individual results for each image */
  results: Array<{
    id?: string;
    success: boolean;
    scores?: ImageScores;
    error?: string;
  }>;
  /** Summary statistics */
  summary: {
    total: number;
    successful: number;
    failed: number;
    averageScores?: {
      azureVisionSimilarity: number;
      classificationAccuracy?: number;
    };
  };
  /** Total processing time */
  totalProcessingTime: number;
}

/**
 * Configuration for scoring parameters
 */
export interface ScoringConfig {
  /** Azure AI Vision configuration */
  azureVision: {
    /** API endpoint */
    endpoint: string;
    /** API key */
    apiKey: string;
    /** API version */
    apiVersion?: string;
    /** Similarity threshold for quality assessment */
    similarityThreshold?: number;
  };
  /** Azure OpenAI embeddings configuration */
  embeddings: {
    /** API endpoint */
    endpoint: string;
    /** API key */
    apiKey: string;
    /** Model deployment name */
    deployment?: string;
  };
  /** Classifier configuration (future) */
  classifier?: {
    /** Model path */
    modelPath: string;
    /** Confidence threshold */
    confidenceThreshold?: number;
  };
  /** Processing options */
  processing: {
    /** Maximum image size for processing */
    maxImageSize?: number;
    /** Timeout for scoring in milliseconds */
    timeout?: number;
  };
}

/**
 * Analytics data for score tracking
 */
export interface ScoringAnalytics {
  /** Time period for analytics */
  period: {
    start: Date;
    end: Date;
  };
  /** Total number of images scored */
  totalImages: number;
  /** Average scores across all images */
  averageScores: {
    azureVisionSimilarity: number;
    classificationAccuracy?: number;
    overallScore?: number;
  };
  /** Score distribution */
  distribution: {
    azureVisionSimilarity: {
      excellent: number; // 0.8-1.0
      good: number;      // 0.6-0.8
      fair: number;      // 0.4-0.6
      poor: number;      // 0.0-0.4
    };
  };
  /** Top performing prompts */
  topPrompts: Array<{
    prompt: string;
    averageScore: number;
    count: number;
  }>;
  /** Trends over time */
  trends?: Array<{
    date: Date;
    averageScore: number;
    count: number;
  }>;
}

/**
 * Utility type for score quality categories
 */
export type ScoreQuality = 'excellent' | 'good' | 'fair' | 'poor';