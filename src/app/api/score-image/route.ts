import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// TypeScript interfaces for scoring
interface ScoringRequest {
  image: File;
  prompt: string;
}

interface ScoringResponse {
  success: boolean;
  scores?: {
    azureVisionSimilarity: number;
    azureMultimodalSimilarity?: number; // New multimodal embedding similarity
    classificationAccuracy?: number; // Will implement later
  };
  metadata?: {
    imageSize: { width: number; height: number };
    promptLength: number;
    processingTime: number;
    tokenUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
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
  error?: string;
}

/**
 * Azure AI Vision Image Scoring API Route
 * 
 * Evaluates generated images using Azure AI Vision models:
 * 1. Azure Vision Similarity Score (implemented)
 * 2. Classification Accuracy (placeholder for future implementation)
 * 
 * @param request - NextRequest containing image file and text prompt
 * @returns ScoringResponse with similarity scores and metadata
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Parse multipart form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const prompt = formData.get('prompt') as string;

    // Validate inputs
    if (!imageFile || !prompt) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: image and prompt'
      } as ScoringResponse, { status: 400 });
    }

    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Please upload an image file.'
      } as ScoringResponse, { status: 400 });
    }

    // Convert image file to buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    
    // Get image metadata
    const imageMetadata = await sharp(imageBuffer).metadata();
    const imageSize = {
      width: imageMetadata.width || 0,
      height: imageMetadata.height || 0
    };

    console.log(`Processing image scoring: ${imageFile.name} (${imageSize.width}x${imageSize.height}) with prompt: "${prompt}"`);

    // Calculate Azure AI Vision similarity (caption-based)
    const azureVisionResult = await calculateAzureVisionSimilarity(imageBuffer, prompt);

    // Calculate Azure Computer Vision multimodal similarity (direct image + text embeddings)
    const multimodalResult = await calculateMultimodalSimilarity(imageBuffer, prompt);

    // Placeholder for classification accuracy (to be implemented)
    // const classificationAccuracy = await calculateClassificationAccuracy(imageBuffer, prompt);

    const processingTime = Date.now() - startTime;

    const response: ScoringResponse = {
      success: true,
      scores: {
        azureVisionSimilarity: Math.round(azureVisionResult.similarity * 100) / 100,
        azureMultimodalSimilarity: multimodalResult ? Math.round(multimodalResult.similarity * 100) / 100 : undefined,
        // classificationAccuracy: classificationAccuracy // Will add later
      },
      metadata: {
        imageSize,
        promptLength: prompt.length,
        processingTime,
        // Estimate token usage (more accurate tracking would require API modifications)
        tokenUsage: {
          promptTokens: Math.ceil(prompt.length / 4), // Rough estimate: ~4 chars per token
          completionTokens: 0, // No completion tokens for embedding/scoring
          totalTokens: Math.ceil(prompt.length / 4)
        }
      },
      // Add Azure Vision metadata
      azureVisionDetails: {
        generatedCaption: azureVisionResult.generatedCaption,
        confidence: Math.round(azureVisionResult.confidence * 100) / 100,
        modelUsed: azureVisionResult.modelUsed
      },
      // Add multimodal metadata
      multimodalDetails: multimodalResult ? {
        imageEmbeddingDimensions: multimodalResult.imageEmbeddingDimensions,
        textEmbeddingDimensions: multimodalResult.textEmbeddingDimensions,
        modelUsed: multimodalResult.modelUsed
      } : undefined
    };

    console.log(`Image scoring completed in ${processingTime}ms:`);
    console.log(`  - Caption-based similarity: ${response.scores?.azureVisionSimilarity}`);
    console.log(`  - Multimodal similarity: ${response.scores?.azureMultimodalSimilarity || 'N/A'}`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in image scoring:', error);
    
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to score image',
      metadata: {
        imageSize: { width: 0, height: 0 },
        promptLength: 0,
        processingTime
      }
    } as ScoringResponse, { status: 500 });
  }
}

interface AzureVisionResult {
  similarity: number;
  generatedCaption: string;
  confidence: number;
  modelUsed: string;
}

interface MultimodalResult {
  similarity: number;
  imageEmbeddingDimensions: number;
  textEmbeddingDimensions: number;
  modelUsed: string;
}

/**
 * Calculate Azure AI Vision similarity between image and text prompt
 * 
 * This function uses Azure AI Vision to:
 * 1. Generate captions from the image using Azure AI Vision models
 * 2. Compare generated captions with the text prompt
 * 3. Return similarity score and caption metadata
 * 
 * @param imageBuffer - Image data as Buffer
 * @param prompt - Text prompt string
 * @returns Promise<AzureVisionResult> - Similarity score and metadata
 */
async function calculateAzureVisionSimilarity(imageBuffer: Buffer, prompt: string): Promise<AzureVisionResult> {
  try {
    const endpoint = process.env.AZURE_AI_VISION_ENDPOINT;
    const apiKey = process.env.AZURE_AI_VISION_API_KEY;

    if (!endpoint || !apiKey) {
      throw new Error('Azure AI Vision endpoint and API key are required. Please set AZURE_AI_VISION_ENDPOINT and AZURE_AI_VISION_API_KEY');
    }

    // Prepare the API call to Azure AI Vision
    const visionUrl = `${endpoint.replace(/\/$/, '')}/computervision/imageanalysis:analyze?api-version=2024-02-01&features=caption&gender-neutral-caption=true`;
    
    console.log(`[Azure Vision] Calling API: ${visionUrl}`);

    const response = await fetch(visionUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/octet-stream',
      },
      body: new Uint8Array(imageBuffer),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Azure Vision] API error:', response.status, errorText);
      throw new Error(`Azure AI Vision API error: ${response.status} - ${errorText}`);
    }

    const visionResult = await response.json();
    console.log('[Azure Vision] API response:', JSON.stringify(visionResult, null, 2));

    // Extract caption from response
    const captionResult = visionResult.captionResult;
    if (!captionResult || !captionResult.text) {
      throw new Error('No caption generated by Azure AI Vision');
    }

    const generatedCaption = captionResult.text;
    const confidence = captionResult.confidence;

    console.log(`[Azure Vision] Generated caption: "${generatedCaption}" (confidence: ${confidence})`);

    // Calculate semantic similarity between generated caption and prompt
    const similarity = await calculateSemanticSimilarity(generatedCaption, prompt);

    return {
      similarity,
      generatedCaption,
      confidence,
      modelUsed: 'Azure-AI-Vision'
    };

  } catch (error) {
    console.error('Error in Azure AI Vision similarity calculation:', error);
    // Return a fallback result
    return {
      similarity: 0.0,
      generatedCaption: '',
      confidence: 0.0,
      modelUsed: 'Azure-AI-Vision'
    };
  }
}

/**
 * Calculate multimodal similarity using Azure Computer Vision's image and text embeddings
 * This uses the same embedding space for both image and text, enabling direct comparison
 * 
 * @param imageBuffer - Image data as Buffer
 * @param prompt - Text prompt string
 * @returns Promise<MultimodalResult | null> - Similarity score and metadata, or null if failed
 */
async function calculateMultimodalSimilarity(imageBuffer: Buffer, prompt: string): Promise<MultimodalResult | null> {
  try {
    const endpoint = process.env.AZURE_AI_VISION_ENDPOINT;
    const apiKey = process.env.AZURE_AI_VISION_API_KEY;

    if (!endpoint || !apiKey) {
      console.warn('Azure AI Vision endpoint and API key required for multimodal embeddings');
      return null;
    }

    console.log(`[Multimodal] Getting embeddings for image and text: "${prompt}"`);

    // Get embeddings for both image and text in parallel
    const [imageEmbedding, textEmbedding] = await Promise.all([
      getImageEmbedding(imageBuffer, endpoint, apiKey),
      getTextEmbeddingFromVision(prompt, endpoint, apiKey)
    ]);

    if (!imageEmbedding || !textEmbedding) {
      console.warn('[Multimodal] Failed to get embeddings');
      return null;
    }

    // Calculate cosine similarity between image and text embeddings
    const similarity = calculateCosineSimilarity(imageEmbedding, textEmbedding);
    
    console.log(`[Multimodal] Direct image-text similarity: ${similarity.toFixed(4)}`);

    return {
      similarity,
      imageEmbeddingDimensions: imageEmbedding.length,
      textEmbeddingDimensions: textEmbedding.length,
      modelUsed: 'Azure-Computer-Vision-Multimodal'
    };

  } catch (error) {
    console.error('Error in multimodal similarity calculation:', error);
    return null;
  }
}

/**
 * Get image embedding using Azure Computer Vision
 * Uses the vectorizeImage API endpoint for multimodal embeddings
 */
async function getImageEmbedding(imageBuffer: Buffer, endpoint: string, apiKey: string): Promise<number[] | null> {
  try {
    const vectorizeUrl = `${endpoint.replace(/\/$/, '')}/computervision/retrieval:vectorizeImage?api-version=2024-02-01&model-version=2023-04-15`;

    console.log(`[Multimodal] Getting image embedding from: ${vectorizeUrl}`);

    const response = await fetch(vectorizeUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/octet-stream',
      },
      body: new Uint8Array(imageBuffer),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Multimodal] Image embedding API error:', response.status, errorText);
      return null;
    }

    const result = await response.json();
    
    if (!result.vector) {
      console.error('[Multimodal] No vector in image embedding response:', result);
      return null;
    }

    console.log(`[Multimodal] Image embedding: ${result.vector.length} dimensions`);
    return result.vector;

  } catch (error) {
    console.error('Error getting image embedding:', error);
    return null;
  }
}

/**
 * Get text embedding using Azure Computer Vision (same embedding space as images)
 * Uses the vectorizeText API endpoint for multimodal embeddings
 */
async function getTextEmbeddingFromVision(text: string, endpoint: string, apiKey: string): Promise<number[] | null> {
  try {
    const vectorizeUrl = `${endpoint.replace(/\/$/, '')}/computervision/retrieval:vectorizeText?api-version=2024-02-01&model-version=2023-04-15`;

    console.log(`[Multimodal] Getting text embedding for: "${text}"`);

    const response = await fetch(vectorizeUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim()
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Multimodal] Text embedding API error:', response.status, errorText);
      return null;
    }

    const result = await response.json();
    
    if (!result.vector) {
      console.error('[Multimodal] No vector in text embedding response:', result);
      return null;
    }

    console.log(`[Multimodal] Text embedding: ${result.vector.length} dimensions`);
    return result.vector;

  } catch (error) {
    console.error('Error getting text embedding from Vision API:', error);
    return null;
  }
}

/**
 * Calculate semantic similarity between two texts using Azure OpenAI embeddings
 * Uses text-embedding-ada-002 model for high-quality vector representations
 */
async function calculateSemanticSimilarity(text1: string, text2: string): Promise<number> {
  try {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;

    if (!endpoint || !apiKey) {
      throw new Error('Azure OpenAI endpoint and API key are required for embeddings');
    }

    // Get embeddings for both texts
    const [result1, result2] = await Promise.all([
      getTextEmbedding(text1, endpoint, apiKey),
      getTextEmbedding(text2, endpoint, apiKey)
    ]);

    // Calculate cosine similarity
    const similarity = calculateCosineSimilarity(result1.embedding, result2.embedding);
    
    console.log(`[Embeddings] Semantic similarity between "${text1.substring(0, 50)}..." and "${text2.substring(0, 50)}...": ${similarity.toFixed(4)}`);
    
    // Store token usage for later use (could be expanded to track across multiple calls)
    if (result1.usage) {
      console.log(`[Embeddings] Token usage: ${result1.usage.prompt_tokens + result2.usage?.prompt_tokens || 0} prompt, ${result1.usage.total_tokens + result2.usage?.total_tokens || 0} total`);
    }
    
    return similarity;

  } catch (error) {
    console.error('Error calculating semantic similarity:', error);
    // Fallback to basic text matching if embeddings fail
    return calculateBasicTextSimilarity(text1, text2);
  }
}

/**
 * Get text embedding using Azure OpenAI text-embedding-ada-002
 */
async function getTextEmbedding(text: string, endpoint: string, apiKey: string): Promise<{embedding: number[], usage?: any}> {
  const embeddingUrl = `${endpoint.replace(/\/$/, '')}/openai/deployments/text-embedding-ada-002/embeddings?api-version=2023-05-15`;

  const response = await fetch(embeddingUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      input: text.trim(),
      user: 'image-scoring-system'
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Azure OpenAI Embeddings API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  
  if (!result.data || !result.data[0] || !result.data[0].embedding) {
    throw new Error('Invalid embedding response format');
  }

  return {
    embedding: result.data[0].embedding,
    usage: result.usage
  };
}

/**
 * Calculate cosine similarity between two vectors
 */
function calculateCosineSimilarity(vector1: number[], vector2: number[]): number {
  if (vector1.length !== vector2.length) {
    throw new Error('Vectors must have the same dimension');
  }

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < vector1.length; i++) {
    dotProduct += vector1[i] * vector2[i];
    magnitude1 += vector1[i] * vector1[i];
    magnitude2 += vector2[i] * vector2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  // Calculate cosine similarity (0-1 for normalized embeddings)
  const cosineSim = dotProduct / (magnitude1 * magnitude2);
  
  // Ensure result is between 0 and 1 (clamp negative values to 0)
  return Math.max(0, cosineSim);
}

/**
 * Fallback basic text similarity for when embeddings are unavailable
 */
function calculateBasicTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().trim().split(/\s+/);
  const words2 = text2.toLowerCase().trim().split(/\s+/);
  
  const words1Set = new Set(words1);
  const words2Set = new Set(words2);
  
  const intersectionCount = words1.filter(word => words2Set.has(word)).length;
  const allWords = [...words1, ...words2];
  const unionSize = new Set(allWords).size;
  
  return unionSize > 0 ? intersectionCount / unionSize : 0;
}

/**
 * GET endpoint for API health check
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'Azure AI Vision Image Scoring API is running',
    version: '3.0.0',
    supportedMetrics: ['azureVisionSimilarity'],
    plannedMetrics: ['classificationAccuracy'],
    models: ['Azure-AI-Vision', 'text-embedding-ada-002']
  });
}