import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

interface AzureOpenAIResponse {
  created: number
  data: Array<{
    b64_json: string
    revised_prompt: string
  }>
}

async function saveBase64Image(b64Data: string, index?: number): Promise<string> {
  if (!b64Data || typeof b64Data !== 'string') {
    throw new Error('Invalid base64 image data provided')
  }

  const outputDir = path.join(process.cwd(), 'public', 'generated-logos')
  await mkdir(outputDir, { recursive: true })

  const timestamp = Date.now()
  const suffix = index !== undefined ? `-${index + 1}` : ''
  const filename = `logo-${timestamp}${suffix}.png`
  const filepath = path.join(outputDir, filename)

  // Convert base64 to buffer
  const buffer = Buffer.from(b64Data, 'base64')
  await writeFile(filepath, buffer)

  return `/generated-logos/${filename}`
}

export async function POST(request: NextRequest) {
  try {
    const { businessDescription, numberOfImages = 1 } = await request.json()

    console.log('=== LOGO GENERATION API CALL ===')
    console.log('Request body:', { businessDescription, numberOfImages })

    if (!businessDescription) {
      return NextResponse.json(
        { error: 'Business description is required' },
        { status: 400 }
      )
    }

    // Validate numberOfImages
    const numImages = Math.min(Math.max(parseInt(numberOfImages), 1), 4) // Limit between 1-4
    console.log('Number of images to generate:', numImages)

    // Check for required environment variables
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT
    const apiKey = process.env.AZURE_OPENAI_API_KEY
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME

    if (!endpoint || !apiKey || !deploymentName) {
      return NextResponse.json(
        { error: 'Azure OpenAI configuration is missing' },
        { status: 500 }
      )
    }

    // Construct the logo generation prompt
    const logoPrompt = `Image description: ${businessDescription}.`

    console.log('Generated prompt:', logoPrompt)

    const requestBody = {
      prompt: logoPrompt,
      model: 'gpt-image-1',
      size: '1024x1024',
      n: numImages,
      quality: 'high',
      output_format: 'png',
    }

    const azureUrl = `${endpoint}/openai/deployments/${deploymentName}/images/generations?api-version=2025-04-01-preview`

    console.log('=== AZURE OPENAI REQUEST ===')
    console.log('URL:', azureUrl)
    console.log('Method: POST')
    console.log('Headers:', {
      'Content-Type': 'application/json',
      'api-key': '***HIDDEN***' // Don't log the actual API key
    })
    console.log('Request Body:', JSON.stringify(requestBody, null, 2))

    // Call Azure OpenAI Image Generation API
    const response = await fetch(azureUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
      }
    )

    console.log('=== AZURE OPENAI RESPONSE ===')
    console.log('Status:', response.status, response.statusText)

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Azure OpenAI API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      return NextResponse.json(
        { error: `API Error: ${response.status} - ${errorData}` },
        { status: response.status }
      )
    }

    const data: AzureOpenAIResponse = await response.json()
    console.log('Response Data (truncated):', {
      created: data.created,
      dataLength: data.data?.length,
      hasB64Json: data.data?.[0]?.b64_json ? 'YES' : 'NO',
      revisedPrompt: data.data?.[0]?.revised_prompt
    })

    if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
      return NextResponse.json(
        { error: 'No images generated' },
        { status: 500 }
      )
    }

    console.log(`Processing ${data.data.length} generated images`)

    // Process all generated images
    const processedImages: Array<{ url: string; revisedPrompt: string }> = []
    
    for (let i = 0; i < data.data.length; i++) {
      const logoData = data.data[i]
      
      if (!logoData || !logoData.b64_json) {
        console.warn(`Skipping invalid logo data at index ${i}`)
        continue
      }

      // Save the base64 image data locally
      const base64ImageData = logoData.b64_json
      let localImagePath: string
      
      try {
        localImagePath = await saveBase64Image(base64ImageData, data.data.length > 1 ? i : undefined)
      } catch (saveError) {
        console.error(`Failed to save image ${i}:`, saveError)
        // If saving fails, create a data URL as fallback
        localImagePath = `data:image/png;base64,${base64ImageData}`
      }

      processedImages.push({
        url: localImagePath,
        revisedPrompt: logoData.revised_prompt || 'No prompt revision available'
      })
    }

    if (processedImages.length === 0) {
      return NextResponse.json(
        { error: 'Failed to process any generated images' },
        { status: 500 }
      )
    }

    // Return format based on number of images
    const result = processedImages.length === 1 
      ? processedImages[0]  // Single image - backward compatibility
      : { images: processedImages }  // Multiple images
    
    console.log('Returning result:', {
      type: processedImages.length === 1 ? 'single' : 'multiple',
      count: processedImages.length
    })
    
    return NextResponse.json(result)

  } catch (error) {
    console.error('Error generating logo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
