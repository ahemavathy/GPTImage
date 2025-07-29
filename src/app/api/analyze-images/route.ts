import { NextRequest, NextResponse } from 'next/server'

interface AzureOpenAIMessage {
  role: 'user' | 'assistant' | 'system'
  content: Array<{
    type: 'text' | 'image_url'
    text?: string
    image_url?: {
      url: string
    }
  }>
}

interface AzureOpenAIRequest {
  messages: AzureOpenAIMessage[]
  model: string
  max_tokens: number
  temperature: number
}

interface AzureOpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

async function convertFileToBase64(file: File): Promise<string> {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    
    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(arrayBuffer)
    
    // Convert Buffer to base64 string
    const base64 = buffer.toString('base64')
    
    return base64
  } catch (error) {
    console.error('Error in convertFileToBase64:', error)
    throw new Error(`Failed to convert file to base64: ${error}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const prompt = formData.get('prompt') as string

    console.log('=== IMAGE ANALYSIS API CALL (GPT-4o) ===')
    // System prompt for GPT-4o - configurable
    const systemPrompt = process.env.AZURE_OPENAI_GPT4O_SYSTEM_PROMPT

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Check for required environment variables for GPT-4o
    const endpoint = process.env.AZURE_OPENAI_GPT4O_ENDPOINT
    const apiKey = process.env.AZURE_OPENAI_GPT4O_API_KEY
    const deploymentName = process.env.AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME

    if (!endpoint || !apiKey || !deploymentName) {
      console.error('Missing GPT-4o environment variables:', {
        endpoint: !!endpoint,
        apiKey: !!apiKey,
        deploymentName: !!deploymentName
      })
      return NextResponse.json(
        { error: 'Azure OpenAI GPT-4o configuration is missing. Please check your environment variables.' },
        { status: 500 }
      )
    }

    // Extract and process images
    const imageFiles: File[] = []
    const formDataEntries = Array.from(formData.entries())
    
    for (const [key, value] of formDataEntries) {
      if (key.startsWith('image_') && value instanceof File) {
        imageFiles.push(value)
      }
    }

    console.log('Number of images received:', imageFiles.length)

    if (imageFiles.length === 0) {
      return NextResponse.json(
        { error: 'At least one image is required' },
        { status: 400 }
      )
    }

    // Convert images to base64
    const imageBase64Array: string[] = []
    for (const file of imageFiles) {
      try {
        const base64 = await convertFileToBase64(file)
        imageBase64Array.push(base64)
        console.log('Converted image:', file.name, 'Size:', file.size, 'Type:', file.type, 'Index:', imageBase64Array.length)
      } catch (error) {
        console.error('Error converting file to base64:', file.name, error)
        return NextResponse.json(
          { error: `Failed to process image: ${file.name}` },
          { status: 400 }
        )
      }
    }

    // Prepare the message content
    const messageContent: Array<{
      type: 'text' | 'image_url'
      text?: string
      image_url?: { url: string }
    }> = [
      {
        type: 'text',
        text: prompt
      }
    ]

    // Add all images to the message with their names
    imageBase64Array.forEach((base64, index) => {
      const fileName = imageFiles[index].name
      
      // Add image name as text before the image
      messageContent.push({
        type: 'text',
        text: `Image ${index + 1}: "${fileName}"`
      })
      
      // Add the actual image
      messageContent.push({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${base64}`
        }
      })
    })

    const requestBody: AzureOpenAIRequest = {
      messages: [
        {
          role: 'system',
          content: [
            {
              type: 'text',
              text: systemPrompt
            }
          ]
        },
        {
          role: 'user',
          content: messageContent
        }
      ],
      model: 'gpt-4o',
      max_tokens: 2000,
      temperature: 0.7
    }

    const azureUrl = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`

    console.log('=== AZURE OPENAI GPT-4o REQUEST ===')
    console.log('URL:', azureUrl)
    console.log('Method: POST')
    console.log('Headers:', {
      'Content-Type': 'application/json',
      'api-key': '***HIDDEN***'
    })
    console.log('Request Body (partial):', {
      model: requestBody.model,
      max_tokens: requestBody.max_tokens,
      temperature: requestBody.temperature,
      messagesCount: requestBody.messages.length,
      systemMessage: 'YES',
      userContentItemsCount: requestBody.messages[1].content.length,
      imagesCount: imageBase64Array.length
    })

    // Call Azure OpenAI Chat Completions API
    const response = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    })

    console.log('=== AZURE OPENAI GPT-4o RESPONSE ===')
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
    console.log('Response Data:', {
      choicesCount: data.choices?.length,
      hasContent: data.choices?.[0]?.message?.content ? 'YES' : 'NO',
      usage: data.usage
    })

    if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      return NextResponse.json(
        { error: 'No response generated' },
        { status: 500 }
      )
    }

    const analysisResult = data.choices[0]
    if (!analysisResult || !analysisResult.message || !analysisResult.message.content) {
      return NextResponse.json(
        { error: 'Invalid response data received' },
        { status: 500 }
      )
    }

    const result = {
      response: analysisResult.message.content,
      usage: data.usage
    }

    console.log('Returning result:', {
      responseLength: result.response.length,
      usage: result.usage
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error analyzing images:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
