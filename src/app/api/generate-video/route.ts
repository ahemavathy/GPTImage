import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

interface AzureOpenAIVideoResponse {
  object: string
  id: string
  status: 'queued' | 'preprocessing' | 'running' | 'processing' | 'succeeded' | 'failed' | 'cancelled'
  created_at: number
  finished_at?: number
  expires_at?: number
  generations: Array<{
    id: string
  }>
  prompt: string
  model: string
  n_variants: number
  n_seconds: number
  height: number
  width: number
  failure_reason?: string
}

async function saveVideoFile(videoBuffer: Buffer): Promise<string> {
  const outputDir = path.join(process.cwd(), 'public', 'generated-videos')
  await mkdir(outputDir, { recursive: true })

  const timestamp = Date.now()
  const filename = `video-${timestamp}.mp4`
  const filepath = path.join(outputDir, filename)

  await writeFile(filepath, videoBuffer)

  return `/generated-videos/${filename}`
}

async function pollJobStatus(
  endpoint: string, 
  jobId: string, 
  headers: Record<string, string>,
  deploymentName: string,
  maxAttempts: number = 60, // 5 minutes with 5-second intervals
  intervalMs: number = 5000
): Promise<AzureOpenAIVideoResponse> {
  const statusUrl = `${endpoint}/openai/v1/video/generations/jobs/${jobId}?api-version=preview`
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(statusUrl, { headers })
    
    if (!response.ok) {
      throw new Error(`Failed to check job status: ${response.status} - ${await response.text()}`)
    }
    
    const statusData: AzureOpenAIVideoResponse = await response.json()
    console.log(`Job ${jobId} status (attempt ${attempt + 1}): ${statusData.status}`)
    
    if (statusData.status === 'succeeded') {
      return statusData
    } else if (statusData.status === 'failed' || statusData.status === 'cancelled') {
      throw new Error(`Video generation ${statusData.status}: ${statusData.failure_reason || 'Unknown error'}`)
    }
    
    // Wait before next poll
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, intervalMs))
    }
  }
  
  throw new Error('Video generation timed out')
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, width = 480, height = 480, duration = 5, image } = await request.json()

    console.log('=== VIDEO GENERATION API CALL ===')
    console.log('Request body:', { prompt, width, height, duration, hasImage: !!image })

    if (!prompt) {
      return NextResponse.json(
        { error: 'Video prompt is required' },
        { status: 400 }
      )
    }

    // Check for required environment variables
    const endpoint = process.env.AZURE_OPENAI_SORA_ENDPOINT
    const apiKey = process.env.AZURE_OPENAI_SORA_API_KEY
    const deploymentName= process.env.AZURE_OPENAI_SORA_DEPLOYMENT_NAME

    if (!endpoint || !apiKey || !deploymentName) {
      return NextResponse.json(
        { error: 'Azure OpenAI Sora configuration is missing. Please set AZURE_OPENAI_SORA_ENDPOINT, AZURE_OPENAI_SORA_API_KEY, and AZURE_OPENAI_SORA_DEPLOYMENT_NAME.' },
        { status: 500 }
      )
    }

    const headers = { 
      "api-key": apiKey, 
      "Content-Type": "application/json" 
    }

    // 1. Create a video generation job
    const createUrl = `${endpoint}/openai/v1/video/generations/jobs?api-version=preview`
    const requestBody: any = {
      prompt,
      width,
      height,
      n_seconds: duration,
      model: deploymentName
    }
    console.log('Request Body:', JSON.stringify(requestBody, null, 2))

    // Add image if provided (base64 format)
    if (image) {
      requestBody.image = image
      console.log('base64 image added to Request Body')
    }

    console.log('=== CREATING VIDEO GENERATION JOB ===')
    console.log('URL:', createUrl)


    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    })

    if (!createResponse.ok) {
      const errorData = await createResponse.text()
      console.error('Azure OpenAI Video API Error:', {
        status: createResponse.status,
        statusText: createResponse.statusText,
        error: errorData
      })
      return NextResponse.json(
        { error: `API Error: ${createResponse.status} - ${errorData}` },
        { status: createResponse.status }
      )
    }

    const jobData: AzureOpenAIVideoResponse = await createResponse.json()
    console.log('Job created:', jobData.id)

    // 2. Poll for job completion
    console.log('=== POLLING JOB STATUS ===')
    const completedJob = await pollJobStatus(endpoint, jobData.id, headers, deploymentName)

    // 3. Retrieve generated video
    if (completedJob.status === 'succeeded' && completedJob.generations.length > 0) {
      console.log('=== RETRIEVING GENERATED VIDEO ===')
      const generationId = completedJob.generations[0].id
      const videoUrl = `${endpoint}/openai/v1/video/generations/${generationId}/content/video?api-version=preview`
      
      const videoResponse = await fetch(videoUrl, { headers })
      
      if (!videoResponse.ok) {
        throw new Error(`Failed to retrieve video: ${videoResponse.status} - ${await videoResponse.text()}`)
      }
      
      const videoBuffer = Buffer.from(await videoResponse.arrayBuffer())
      const localVideoPath = await saveVideoFile(videoBuffer)
      
      console.log('Video saved locally:', localVideoPath)
      
      return NextResponse.json({
        url: localVideoPath,
        prompt: completedJob.prompt,
        duration: completedJob.n_seconds,
        width: completedJob.width,
        height: completedJob.height,
        jobId: completedJob.id
      })
    } else {
      throw new Error('No video generations found in completed job')
    }

  } catch (error) {
    console.error('Error generating video:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}