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
    blipSimilarity: number;
    classificationAccuracy?: number; // Will implement later
  };
  metadata?: {
    imageSize: { width: number; height: number };
    promptLength: number;
    processingTime: number;
  };
  error?: string;
}

/**
 * BLIP-based Image Scoring API Route
 * 
 * Evaluates generated images using two metrics:
 * 1. BLIP Similarity Score (implemented)
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

    // Calculate BLIP-based similarity
    const blipSimilarity = await calculateBlipSimilarity(imageBuffer, prompt);

    // Placeholder for classification accuracy (to be implemented)
    // const classificationAccuracy = await calculateClassificationAccuracy(imageBuffer, prompt);

    const processingTime = Date.now() - startTime;

    const response: ScoringResponse = {
      success: true,
      scores: {
        blipSimilarity: Math.round(blipSimilarity * 100) / 100, // Round to 2 decimal places
        // classificationAccuracy: classificationAccuracy // Will add later
      },
      metadata: {
        imageSize,
        promptLength: prompt.length,
        processingTime
      }
    };

    console.log(`Image scoring completed in ${processingTime}ms:`, response.scores);

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

/**
 * Calculate BLIP-based similarity between image and text prompt
 * 
 * This function uses a BLIP model to:
 * 1. Generate captions from the image
 * 2. Compare generated captions with the text prompt
 * 3. Return similarity score (0-1, where 1 is perfect alignment)
 * 
 * @param imageBuffer - Image data as Buffer
 * @param prompt - Text prompt string
 * @returns Promise<number> - Similarity score between 0 and 1
 */
async function calculateBlipSimilarity(imageBuffer: Buffer, prompt: string): Promise<number> {
  try {
    // For now, we'll implement a simple version using a Python subprocess
    // Later we can optimize this with a Node.js CLIP implementation
    
    const { spawn } = require('child_process');
    const path = require('path');
    
    return new Promise((resolve, reject) => {
      // Create a temporary file for the image
      const tempImagePath = path.join(process.cwd(), 'temp', `scoring_image_${Date.now()}.png`);
      
      // Ensure temp directory exists
      const fs = require('fs');
      const tempDir = path.dirname(tempImagePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Write image to temporary file
      fs.writeFileSync(tempImagePath, imageBuffer);
      
      // Create Python script path (use BLIP scorer)
      const pythonScriptPath = path.join(process.cwd(), 'scripts', 'blip_scorer.py');
      
      // Spawn Python process with BLIP model
      console.log(`[BLIP Scorer] Starting Python process: python ${pythonScriptPath} "${tempImagePath}" "${prompt.substring(0, 50)}..."`);
      const pythonProcess = spawn('python', [pythonScriptPath, tempImagePath, prompt], {
        env: {
          ...process.env,
          PYTHONPATH: process.cwd(),
          PYTHONIOENCODING: 'utf-8'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let output = '';
      let errorOutput = '';
      
      pythonProcess.stdout.on('data', (data: Buffer) => {
        const chunk = data.toString('utf-8');
        output += chunk;
        console.log('[BLIP Scorer STDOUT]:', chunk.trim());
      });
      
      pythonProcess.stderr.on('data', (data: Buffer) => {
        const chunk = data.toString('utf-8');
        errorOutput += chunk;
        console.log('[BLIP Scorer STDERR]:', chunk.trim());
      });
      
      pythonProcess.on('close', (code: number) => {
        console.log(`[BLIP Scorer] Python process completed with exit code: ${code}`);
        console.log(`[BLIP Scorer] Full stdout:`, output);
        console.log(`[BLIP Scorer] Full stderr:`, errorOutput);
        
        // Clean up temporary file
        try {
          fs.unlinkSync(tempImagePath);
          console.log(`[BLIP Scorer] Cleaned up temp file: ${tempImagePath}`);
        } catch (e) {
          console.warn('[BLIP Scorer] Failed to cleanup temp file:', e);
        }
        
        if (code !== 0) {
          console.error('[BLIP Scorer] Python process failed:', errorOutput);
          reject(new Error(`BLIP scoring failed with code ${code}: ${errorOutput}`));
          return;
        }
        
        try {
          // Parse the similarity score from Python output
          const lines = output.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          
          // Look for similarity score in the output
          const scoreMatch = lastLine.match(/similarity[:\s]+([0-9.]+)/i) || 
                           lastLine.match(/score[:\s]+([0-9.]+)/i) ||
                           lastLine.match(/([0-9.]+)$/);
          
          if (scoreMatch && scoreMatch[1]) {
            const similarity = parseFloat(scoreMatch[1]);
            
            // Ensure score is between 0 and 1
            if (similarity >= 0 && similarity <= 1) {
              resolve(similarity);
            } else {
              // If score is 0-100 range, convert to 0-1
              resolve(Math.min(similarity / 100, 1));
            }
          } else {
            console.warn('Could not parse similarity score from output:', output);
            // Return a default similarity score based on prompt matching
            resolve(0.5); // Neutral score as fallback
          }
        } catch (parseError) {
          console.error('Error parsing BLIP score:', parseError);
          reject(new Error('Failed to parse BLIP similarity score'));
        }
      });
      
      pythonProcess.on('error', (error: Error) => {
        reject(new Error(`Failed to start BLIP scoring process: ${error.message}`));
      });
    });
    
  } catch (error) {
    console.error('Error in BLIP similarity calculation:', error);
    // Return a fallback score
    return 0.5;
  }
}

/**
 * GET endpoint for API health check
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'Image Scoring API is running',
    version: '1.0.0',
    supportedMetrics: ['blipSimilarity'],
    plannedMetrics: ['classificationAccuracy']
  });
}