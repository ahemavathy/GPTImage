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

async function saveBase64Image(b64Data: string, prefix: string = 'edited', index?: number): Promise<string> {
  if (!b64Data || typeof b64Data !== 'string') {
    throw new Error('Invalid base64 image data provided')
  }

  const outputDir = path.join(process.cwd(), 'public', 'edited-images')
  await mkdir(outputDir, { recursive: true })

  const timestamp = Date.now()
  const suffix = index !== undefined ? `-${index + 1}` : ''
  const filename = `${prefix}-${timestamp}${suffix}.png`
  const filepath = path.join(outputDir, filename)

  // Convert base64 to buffer
  const buffer = Buffer.from(b64Data, 'base64')
  await writeFile(filepath, buffer)

  return `/edited-images/${filename}`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const prompt = formData.get('prompt') as string
    const maskFile = formData.get('mask') as File | null
    const numberOfImages = formData.get('numberOfImages') as string || '1'
    
    console.log('=== IMAGE EDIT API CALL ===')
    console.log('Prompt:', prompt)
    console.log('Number of images to generate:', numberOfImages)
    console.log('Mask file provided:', maskFile ? 'YES' : 'NO')
    if (maskFile) {
      console.log('Mask file details:', {
        name: maskFile.name,
        type: maskFile.type,
        size: maskFile.size
      })
    }
    
    // Get all image files
    const imageFiles: File[] = []
    let index = 0
    while (true) {
      const imageFile = formData.get(`image-${index}`) as File | null
      if (!imageFile) break
      imageFiles.push(imageFile)
      index++
    }

    console.log('Image files count:', imageFiles.length)
    console.log('Image files details:', imageFiles.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size
    })))

    if (!prompt) {
      return NextResponse.json(
        { error: 'Edit prompt is required' },
        { status: 400 }
      )
    }

    if (imageFiles.length === 0) {
      return NextResponse.json(
        { error: 'At least one image file is required' },
        { status: 400 }
      )
    }

    // Validate numberOfImages
    const numImages = Math.min(Math.max(parseInt(numberOfImages), 1), 4) // Limit between 1-4
    console.log('Validated number of images to generate:', numImages)

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

    // Prepare form data for Azure API
    // Using the exact array syntax as specified by the API error message:
    // "use the array syntax instead e.g. 'image[]=<value>'"
    const azureFormData = new FormData()
    azureFormData.append('prompt', prompt)
    azureFormData.append('n', numImages.toString())
    azureFormData.append('size', '1024x1024')
    azureFormData.append('quality', 'medium')

    // Add all images using the array syntax image[]=<value>
    for (let i = 0; i < imageFiles.length; i++) {
      azureFormData.append('image[]', imageFiles[i])
    }
    
    // Add mask if provided (will be applied to the first image if multiple images are sent)
    if (maskFile) {
      // Validate mask file format
      const maskFileType = maskFile.type.toLowerCase()
      if (!maskFileType.includes('png')) {
        return NextResponse.json(
          { error: 'Mask image must be in PNG format with alpha channel (transparency)' },
          { status: 400 }
        )
      }
      
      // Additional validation: check file extension as backup
      const maskFileName = maskFile.name.toLowerCase()
      if (!maskFileName.endsWith('.png')) {
        return NextResponse.json(
          { error: 'Mask image must be a PNG file with alpha channel. Please save your mask as PNG with transparency.' },
          { status: 400 }
        )
      }
      
      azureFormData.append('mask', maskFile)
    }

    const azureUrl = `${endpoint}/openai/deployments/${deploymentName}/images/edits?api-version=2025-04-01-preview`

    console.log('=== AZURE OPENAI EDIT REQUEST ===')
    console.log('URL:', azureUrl)
    console.log('Method: POST')
    console.log('Headers:', {
      'api-key': '***HIDDEN***'
    })
    console.log('FormData contents:')
    console.log('- prompt:', prompt)
    console.log('- n:', numImages.toString())
    console.log('- size:', '1024x1024')
    console.log('- quality:', 'medium')
    console.log('- image[] count:', imageFiles.length)
    console.log('- mask:', maskFile ? 'included' : 'not included')

    // Call Azure OpenAI Image Edit API
    const response = await fetch(azureUrl, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
        },
        body: azureFormData,
      }
    )

    console.log('=== AZURE OPENAI EDIT RESPONSE ===')
    console.log('Status:', response.status, response.statusText)

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Azure OpenAI API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      return NextResponse.json(
        { error: `Failed to edit images: ${response.status} ${response.statusText}` },
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
        { error: 'No edited images generated' },
        { status: 500 }
      )
    }

    // Process all generated images
    const editedImages: Array<{url: string, revisedPrompt: string}> = []
    
    for (let i = 0; i < data.data.length; i++) {
      const editedData = data.data[i]
      if (!editedData || !editedData.b64_json) {
        console.warn(`Skipping invalid image data at index ${i}`)
        continue
      }

      // Save the base64 image data locally
      const base64ImageData = editedData.b64_json
      let localImagePath: string
      
      try {
        localImagePath = await saveBase64Image(base64ImageData, 'edited', i)
      } catch (saveError) {
        console.error(`Error saving image ${i}:`, saveError)
        // If saving fails, create a data URL as fallback
        localImagePath = `data:image/png;base64,${base64ImageData}`
      }

      editedImages.push({
        url: localImagePath,
        revisedPrompt: editedData.revised_prompt || 'No prompt revision available'
      })
    }

    if (editedImages.length === 0) {
      return NextResponse.json(
        { error: 'No valid edited images were generated' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      images: editedImages,
      totalGenerated: editedImages.length,
      inputImages: imageFiles.map(file => file.name),
      totalInputImages: imageFiles.length,
      note: maskFile && imageFiles.length > 1 ? `Note: Mask was applied to the first image when multiple images are provided.` : undefined
    })

  } catch (error) {
    console.error('Error editing images:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
