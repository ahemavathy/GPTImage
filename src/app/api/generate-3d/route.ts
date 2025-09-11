import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

async function generateWith3DFrogleo(
  imageData: string, 
  modelsDir: string
): Promise<{ modelUrl: string | null; outputHtml: string | null }> {
  console.log('=== CALLING FROGLEO 3D GENERATION VIA GRADIO CLIENT ===')
  
  try {
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)
    
    console.log('Generating 3D model via Python gradio_client...')
    console.log('Has uploaded image data:', !!imageData)
    
    // Set HF token environment variable
    const hfToken = process.env.HUGGINGFACE_API_KEY
    console.log(`HF Token available: ${!!hfToken}`)
    if (!hfToken) {
      console.warn('⚠️ No HUGGINGFACE_API_KEY found in environment, may hit quota limits')
    } else {
      console.log('✅ Using HF token for authenticated access')
    }
    
    // Create environment with HF token and proper UTF-8 encoding
    const env = {
      ...process.env,
      HF_TOKEN: hfToken || '',
      HUGGINGFACE_HUB_TOKEN: hfToken || '',
      HUGGINGFACE_API_KEY: hfToken || '',
      // Fix Unicode encoding issues on Windows
      PYTHONIOENCODING: 'utf-8',
      PYTHONLEGACYWINDOWSSTDIO: '0'
    }
    
    console.log('🐍 Running Python gradio_client script...')
    
    // Save the uploaded image temporarily and pass its path to Python
    let imageArgument: string
    
    if (imageData && imageData.startsWith('data:image/')) {
      // Convert base64 image to temporary file
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '')
      const imageBuffer = Buffer.from(base64Data, 'base64')
      
      // Create a temporary file
      const tempDir = path.join(process.cwd(), 'temp')
      await mkdir(tempDir, { recursive: true })
      
      const tempImagePath = path.join(tempDir, `temp_image_${Date.now()}.png`)
      await writeFile(tempImagePath, imageBuffer)
      
      console.log(`💾 Saved uploaded image to: ${tempImagePath}`)
      imageArgument = tempImagePath
    } else {
      // Fallback to test URL if no valid image data
      console.log('⚠️ No valid image data provided, using test image URL')
      imageArgument = "https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png"
    }
    
    // Use the working Python script with gradio_client
    const pythonCommand = `python working_3d_gen.py "${imageArgument}"`
    console.log(`Command: ${pythonCommand}`)
    
    const { stdout, stderr } = await execAsync(pythonCommand, {
      cwd: process.cwd(),
      timeout: 300000, // 5 minute timeout
      env: env
    })
    
    console.log('Python stdout:', stdout)
    if (stderr) {
      console.log('Python stderr:', stderr)
    }
    
    // Clean up temporary file if we created one
    if (imageArgument.includes('temp_image_')) {
      try {
        const fs = require('fs')
        fs.unlinkSync(imageArgument)
        console.log(`🗑️ Cleaned up temporary image file: ${imageArgument}`)
      } catch (cleanupError) {
        console.log(`⚠️ Could not clean up temporary file: ${cleanupError}`)
      }
    }
    
    // Parse the Python script output to find the result
    const lines = stdout.split('\n')
    let modelUrl = null
    let outputHtml = null
    
    for (const line of lines) {
      // Look for the success message with URL
      if (line.includes('Success! 3D model available at:')) {
        const urlMatch = line.match(/Success! 3D model available at: (.+)/)
        if (urlMatch) {
          let rawUrl = urlMatch[1].trim()
          console.log(`🎯 Found raw model URL: ${rawUrl}`)
          
          // Convert relative HF Space URLs to absolute URLs
          if (rawUrl.startsWith('/static/') || rawUrl.startsWith('static/')) {
            const relativePath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`
            modelUrl = `https://frogleo-image-to-3d.hf.space${relativePath}`
            console.log(`🔗 Converted to absolute URL: ${modelUrl}`)
          } else {
            modelUrl = rawUrl
          }
        }
      }
      
      // Look for HTML output (if any)
      if (line.includes('HTML output:')) {
        const htmlMatch = line.match(/HTML output: (.+)/)
        if (htmlMatch) {
          outputHtml = htmlMatch[1].trim()
          console.log(`📄 Found HTML output: ${outputHtml.substring(0, 100)}...`)
        }
      }
    }
    
    if (!modelUrl) {
      throw new Error('No model URL found in Python script output')
    }
    
    console.log('✅ Python script completed successfully')
    
    // Always download and save the model locally
    console.log('📥 Downloading model file...')
    const savedModelUrl = await downloadAndSaveModel(modelUrl, modelsDir)
    
    if (!savedModelUrl) {
      throw new Error('Failed to download and save 3D model file')
    }
    
    return {
      modelUrl: savedModelUrl,
      outputHtml: outputHtml || null
    }

  } catch (error) {
    console.error('❌ Error in Python gradio_client execution:', error)
    throw error
  }
}async function downloadAndSaveModel(
  modelUrl: string, 
  modelsDir: string
): Promise<string | null> {
  try {
    console.log('Downloading 3D model from:', modelUrl)
    
    const response = await fetch(modelUrl)
    if (!response.ok) {
      throw new Error(`Failed to download model: ${response.status} ${response.statusText}`)
    }
    
    const contentLength = response.headers.get('content-length')
    console.log(`📦 Model file size: ${contentLength ? `${contentLength} bytes` : 'unknown'}`)
    
    const modelBuffer = Buffer.from(await response.arrayBuffer())
    console.log(`📦 Downloaded buffer size: ${modelBuffer.length} bytes`)
    
    // Validate that we got a reasonable file size (GLB files should be > 1KB)
    if (modelBuffer.length < 1024) {
      console.warn(`⚠️ Small file size detected: ${modelBuffer.length} bytes - this might be an error page`)
    }
    
    // Generate filename
    const timestamp = Date.now()
    const filename = `model-${timestamp}.glb`
    const outputPath = path.join(modelsDir, filename)
    
    // Save to file
    await writeFile(outputPath, modelBuffer)
    
    const savedModelUrl = `/generated-3d-models/${filename}`
    console.log('✅ 3D model saved successfully:', savedModelUrl)
    console.log(`📁 Local file path: ${outputPath}`)
    
    return savedModelUrl
    
  } catch (error) {
    console.error('Failed to download and save model:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'API route is working',
    timestamp: new Date().toISOString(),
    version: 'NEW_VERSION_2025'
  })
}

export async function POST(request: NextRequest) {
  try {
    const { image, prompt = 'Generate a 3D model from this image' } = await request.json()

    console.log('=== 3D MODEL GENERATION API CALL ===')
    console.log('Has image:', !!image)

    if (!image) {
      return NextResponse.json(
        { error: 'Input image is required for 3D model generation' },
        { status: 400 }
      )
    }

    // Set up models directory
    const modelsDir = path.join(process.cwd(), 'public', 'generated-3d-models')
    await mkdir(modelsDir, { recursive: true })

    console.log('=== CALLING FROGLEO 3D GENERATION API ===')

    try {
      // Use frogleo 3D generation via Python gradio_client
      const result = await generateWith3DFrogleo(image, modelsDir)

      if (!result || !result.modelUrl) {
        throw new Error('Failed to generate 3D model - no file returned')
      }

      console.log('3D model generation completed successfully')

      return NextResponse.json({
        success: true,
        message: '3D model generated successfully using frogleo/Image-to-3D',
        filename: path.basename(result.modelUrl),
        modelUrl: result.modelUrl,
        outputHtml: result.outputHtml,
        provider: 'frogleo/Image-to-3D',
        timestamp: Date.now(),
        steps: {
          generation: 'completed',
          download: 'completed'
        }
      })

    } catch (apiError) {
      console.error('Error calling Frogleo 3D API:', apiError)
      return NextResponse.json(
        { 
          error: apiError instanceof Error ? apiError.message : 'Failed to generate 3D model',
          details: 'Check if frogleo/Image-to-3D Hugging Face Space is accessible. Try visiting: https://hf.co/spaces/frogleo/Image-to-3D'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in 3D generation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}