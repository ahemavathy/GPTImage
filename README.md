# AI Content Generation Platform

A comprehensive web application that combines AI-powered logo generation, 3D model creation, video generation, image editing, enterprise-grade image quality scoring, and PowerPoint presentation creation using Azure OpenAI services, Azure AI Vision, and Hugging Face Spaces. Create professional logos, generate 3D models from images, edit images with AI, analyze multiple images, and generate compelling presentations with professional-grade quality assessment - all in one platform.

1. Copy the example environment file:
```bash
copy .env.example .env.local
```

2. Edit `.env.local` and add your Azure OpenAI credentials:ation, image editing, and PowerPoint presentation creation using Azure OpenAI services and Hugging Face Spaces. Create professional logos, generate 3D models from images, edit images with AI, analyze multiple images, and generate compelling presentations - all in one platform.

## 🚀 Features

### 🎨 **AI Logo & Image Generation**
- Uses Azure OpenAI's GPT Image API (gpt-image-1)
- Generate multiple images at once (configurable 1-10 images)
- Professional, business-ready results
- One-click individual downloads

### 🧊 **3D Model Generation**
- **NEW**: Generate 3D models from images using Hugging Face Spaces (frogleo/Image-to-3D)
- Upload any image to create 3D mesh files (GLB/OBJ formats)
- Interactive 3D preview in the browser
- Download generated 3D models for use in other applications
- Authenticated Hugging Face token support for enhanced performance
- Timing reports for generation duration tracking

### 🎬 **AI Video Generation with Sora**
- **NEW**: Generate videos using Azure OpenAI's Sora model
- Create short video clips (3-15 seconds) from text descriptions
- Multiple resolution options (480x480, 1280x720, 1920x1080)
- Realistic and imaginative video scenes
- Download generated videos in MP4 format
- Professional video quality with AI-powered content creation

### 🖼️ **Advanced Image Editing**
- **Batch Editing**: Edit multiple images simultaneously
- **Iterative Editing**: Sequential editing workflow with history tracking
- **Mask-Based Editing**: Precise editing with custom masks
- **Canvas Mask Editor**: Create masks with brush/eraser tools
- **✨ Prompt Enhancement System**: Structured prompt building with comprehensive categories
  - **Product Details**: Material, color, and finish specifications
  - **Background & Surface**: Environment and surface selection
  - **Lighting & Camera**: Professional photography settings
  - **Style Options**: Photorealistic, minimalistic, lifestyle, and artistic styles
  - **Smart Prompt Generation**: Structured format for better AI understanding
  - **Product Integrity Protection**: Maintains original product structure and proportions
- Undo/redo functionality with edit history

### 📊 **AI-Powered Presentation Generation**
- Multi-image upload and analysis using GPT-4o Vision
- Intelligent slide content generation
- Editable JSON content for customization
- PowerPoint file generation and download
- Copy-formatted content for API usage

### 📊 **Enterprise-Grade Image Quality Scoring**
- **Multi-Method Analysis**: Three complementary scoring approaches for comprehensive evaluation
- **Azure AI Vision Integration**: Professional image captioning with confidence scores
- **GPT-4o Vision Analysis**: Advanced AI-powered detailed image descriptions (25-word limit)
- **Azure Computer Vision Multimodal Embeddings**: Direct image-text comparison in shared vector space
- **Multi-Model Embedding Comparison**: Side-by-side analysis across Ada-002, 3-Small, and 3-Large models
- **Realistic Similarity Guidelines**: Updated thresholds - Extremely Similar (85-100%), Very Similar (70-85%), Moderate (50-70%), Somewhat Related (30-50%), Very Different (0-30%)
- **Advanced Discrimination**: 3072-dimensional embeddings for nuanced semantic understanding
- **Token Usage Tracking**: Cost monitoring across all AI model interactions
- **Professional Accuracy**: Production-ready scoring with comprehensive debugging and validation

### 🎯 **User Experience**
- **Responsive Design**: Perfect on desktop and mobile
- **Intuitive Navigation**: Shared navigation across all features
- **Accessibility**: WCAG 2.1 AA compliance features
- **Real-time Feedback**: Loading states and progress indicators
- **Error Handling**: User-friendly error messages

## Prerequisites

Before running this application, you need:

1. **Azure Services**: 
   - **Azure OpenAI Resource**: For GPT Image, GPT-4o, Sora, and text embeddings
   - **Azure AI Vision Resource**: For enterprise-grade image captioning
   - **Sora Model Access**: For video generation (requires preview access)
2. **Model Deployments**:
   - Deploy the `gpt-image-1` model for image generation/editing
   - Deploy the `gpt-4o` model for vision and analysis
   - Deploy the `sora` model for video generation
   - Deploy the `text-embedding-ada-002` model for semantic similarity
3. **API Access**: 
   - GPT Image API access (limited - apply [here](https://aka.ms/oai/gptimage1access))
   - GPT-4o Vision API access
   - Sora Model API access (requires preview access from Azure OpenAI)
   - Azure AI Vision API access for Computer Vision services
   - Hugging Face account and token (recommended for 3D generation)
4. **PowerPoint Generator Service** (Required for PowerPoint features):
   - The PowerPoint generation functionality requires a separate service
   - Download and run the PowerPoint service from: [https://github.com/ahemavathy/Powerpoint](https://github.com/ahemavathy/Powerpoint)
   - By default, the service should run on `http://localhost:5000`
   - Configure the base URL in your `.env.local` file if running on a different port

## 🏗️ Application Structure

The platform consists of six main sections:

### 🏠 **Home - Content Generation** (`/`)
Generate professional logos, images, 3D models, and videos from descriptions or uploaded images

### 📊 **Analyze - PPT Generation** (`/analyze`)
Upload images, analyze with GPT-4o, and create PowerPoint presentations

### ✏️ **Edit - Batch Editing** (`/edit`)
Upload and edit multiple images simultaneously with AI, featuring comprehensive prompt enhancement system with structured categories for product details, environment, lighting, and style options

### 🔄 **Iterative - Sequential Editing** (`/iterative`)
Advanced editing workflow with history tracking and mask support

### 🎨 **Mask Editor** (`/mask`)
Create precise editing masks with canvas-based tools

### 📊 **Scoring - Image Quality Assessment** (`/scoring`)
Comprehensive image-prompt alignment evaluation using three scoring methods: Azure AI Vision captioning, GPT-4o detailed analysis, and direct multimodal embeddings with comparative analysis across multiple embedding models (Ada-002, 3-Small, 3-Large)

## Setup Instructions

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd GPTImage

# Install dependencies
npm install
```

### 2. Configure Environment Variables

1. Copy the example environment file:
```bash
copy .env.example .env.local
```

2. Edit `.env.local` and add your Azure OpenAI credentials:

```env
# Azure OpenAI GPT Image API (for logo generation and editing)
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com
AZURE_OPENAI_API_KEY=your_gpt_image_api_key_here
AZURE_OPENAI_DEPLOYMENT_NAME=your_gpt_image_deployment_name

# Azure OpenAI GPT-4o API (for image analysis and presentation generation)
AZURE_OPENAI_GPT4O_ENDPOINT=https://your-gpt4o-resource.openai.azure.com
AZURE_OPENAI_GPT4O_API_KEY=your_gpt4o_api_key_here
AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME=your_gpt4o_deployment_name

# Azure AI Vision (Computer Vision) for image quality scoring
AZURE_AI_VISION_ENDPOINT=https://your-computer-vision-resource.cognitiveservices.azure.com/
AZURE_AI_VISION_API_KEY=your_computer_vision_api_key_here

# Azure OpenAI Embeddings (for comprehensive similarity analysis)
# Note: Uses same AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY as above
# Requires deployments: text-embedding-ada-002, text-embedding-3-small, text-embedding-3-large

# GPT-4o System Prompt (configurable)
AZURE_OPENAI_GPT4O_SYSTEM_PROMPT="Your system prompt for presentation generation..."

# PowerPoint Generator Service (if running on different port)
POWERPOINT_API_BASE_URL=http://localhost:5000

# Azure OpenAI Sora API (for video generation - separate resource)
AZURE_OPENAI_SORA_ENDPOINT=https://your-sora-resource.openai.azure.com
AZURE_OPENAI_SORA_API_KEY=your_sora_api_key_here
AZURE_OPENAI_SORA_DEPLOYMENT_NAME=your_sora_deployment_name

# Hugging Face Token (for 3D model generation)
HUGGINGFACE_HUB_TOKEN=your_hugging_face_token_here
```

### 3. Set Up PowerPoint Service (Required for PowerPoint Features)

**Important**: The PowerPoint generation features require a separate service to be running.

1. **Download the PowerPoint Service**:
```bash
git clone https://github.com/ahemavathy/Powerpoint.git
cd Powerpoint
```

2. **Follow the setup instructions** in the PowerPoint repository to install dependencies and run the service

3. **Start the PowerPoint Service** (typically runs on `http://localhost:5000`)

4. **Verify the service is running** by visiting `http://localhost:5000` in your browser

**Note**: If you run the PowerPoint service on a different port, update the `POWERPOINT_API_BASE_URL` in your `.env.local` file accordingly.

### 5. Run the GPTImage Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The application will be available at `http://localhost:3000`

**Note**: The image scoring feature requires Python dependencies. If you encounter scoring errors, ensure you've installed the requirements: `pip install -r requirements.txt`

## 📖 How to Use

### 🏠 Logo & Content Generation

1. **Navigate to Home**: The main page (`/`) for content generation
2. **Choose Content Type**: Toggle between "Generate Images", "Generate 3D Model", and "Generate Video (Sora)"

#### For Logo/Image Generation:
2. **Enter Business Description**: Describe your business with details about:
   - Type of business and industry
   - Preferred colors and style
   - Target audience
3. **Set Image Count**: Choose how many logo variations to generate (1-10)
4. **Generate**: Click "Generate Logo" and wait for AI processing
5. **Download**: Download individual logos or all at once

#### For 3D Model Generation:
2. **Upload Image**: Select an image file to convert into a 3D model
3. **Generate**: Click "Generate 3D Model" and wait for processing (1-3 minutes)
4. **Preview**: View the interactive 3D model in your browser
5. **Download**: Download the generated 3D model files (GLB/OBJ formats)

#### For Video Generation:
2. **Enter Video Concept**: Describe your video scene in detail:
   - Action or scene you want to see
   - Setting and environment
   - Style and mood
3. **Set Parameters**: 
   - **Duration**: Choose video length (3-15 seconds)
   - **Resolution**: Select from 480x480, 1280x720, or 1920x1080
4. **Generate**: Click "Generate Video with Sora" and wait for processing (can take several minutes)
5. **Preview & Download**: Watch the generated video and download the MP4 file

### 📊 PPT Generation (Analyze Page)

1. **Navigate to Analyze**: Go to `/analyze` page
2. **Upload Images**: Drag and drop multiple images (supports various formats)
3. **Edit Guidelines**: Modify or use the pre-filled presentation guidelines
4. **Generate Content**: Click "Generate ppt slide content" for AI analysis
5. **Edit JSON**: Customize the generated slide content in the editable pane
6. **Create PowerPoint**: Click "Generate PowerPoint" to create and download PPT file
7. **Copy for API**: Use the formatted content for external API calls

### ✏️ Batch Image Editing

1. **Navigate to Edit**: Go to `/edit` page
2. **Upload Images**: Select one or multiple images to edit
3. **Add Mask (Optional)**: Upload a mask image for precise editing areas (collapsible section)
4. **Describe Changes**: Enter detailed editing instructions
5. **✨ Enhance Prompt** (Optional): Use the comprehensive prompt enhancement system:
   - **Product Details**: Select material (ceramic, glass, metal), color, and finish options
   - **Background & Surface**: Choose surfaces (wooden table, marble countertop) and backgrounds
   - **Lighting**: Pick from soft ambient, studio lighting, natural sunlight options
   - **Camera Angle**: Select viewpoint (top-down, front view, 45° angle, macro shot)
   - **Style**: Choose photorealistic, minimalistic, lifestyle, or artistic styles
   - **Preview & Apply**: See enhanced prompt preview before applying
6. **Set Output Count**: Choose how many edited versions to generate
7. **Process**: Click "Edit Image" and wait for AI processing
8. **Download**: Save individual or all edited images

### 🔄 Iterative Editing Workflow

1. **Navigate to Iterative**: Go to `/iterative` page
2. **Upload Base Image**: Start with your initial image
3. **Sequential Edits**: Make progressive changes with each edit building on the previous
4. **Use History**: View edit history and undo/redo changes
5. **Apply Masks**: Upload and apply masks for precise control
6. **Track Progress**: See your editing journey on the canvas

### 🎨 Mask Creation

1. **Navigate to Mask Editor**: Go to `/mask` page  
2. **Upload Image**: Start with your base image
3. **Select Tools**: Use brush (paint) or eraser tools
4. **Adjust Size**: Modify brush size for precision
5. **Create Mask**: Paint areas to be edited (black) or kept (white)
6. **Download Mask**: Save your custom mask for use in editing

### 📊 Image Quality Scoring

1. **Navigate to Scoring**: Go to `/scoring` page
2. **Upload Image**: Select an AI-generated image to evaluate
3. **Enter Prompt**: Input the original text prompt used to generate the image
4. **Score Image**: Click "Score Image Quality" to analyze alignment across three methods
5. **View Comprehensive Results**:
   - **Azure Vision Caption Score**: Uses 3-Large model (3072D) for improved discrimination
   - **GPT-4o Similarity Score**: Advanced AI analysis with detailed image descriptions
   - **MM Embedding Score**: Direct multimodal comparison in shared vector space
   - **Embedding Model Comparison**: Side-by-side analysis of Ada-002, 3-Small, and 3-Large performance
6. **Advanced Analytics**: 
   - **Token Usage Tracking**: Monitor costs across all AI models
   - **Processing Time**: Performance metrics for each scoring method
   - **Model Insights**: Understand which embedding models provide better discrimination
7. **Realistic Interpretation**: Updated similarity guidelines based on actual cosine similarity performance
8. **Multiple Tests**: Clear and test different image-prompt combinations with comprehensive feedback

## 💡 Example Prompts

### Logo Generation
- "Modern tech startup focused on sustainable energy solutions, minimalist design, green and blue colors"
- "Luxury restaurant specializing in Italian cuisine, elegant and sophisticated style, gold and black colors"
- "Fitness gym targeting young professionals, bold and energetic design, red and black colors"
- "Eco-friendly cleaning products company, nature-inspired, green and white palette"

### PPT Generation Guidelines
- "Create a compelling presentation that highlights our new air fryer's sophistication and strengthens our brand's positioning as a premium kitchen appliance"
- "Develop a professional pitch deck for our sustainable fashion startup targeting eco-conscious millennials"
- "Generate slides for a quarterly business review focusing on growth metrics and future opportunities"

### Video Generation (Sora)
- "A cat playing piano in a jazz bar with warm, moody lighting"
- "A drone flyover of a modern city skyline at sunset"
- "Close-up of coffee being poured into a cup in slow motion"
- "A person walking through a field of sunflowers on a sunny day"
- "Ocean waves crashing against rocks on a cliff during golden hour"
- "A chef preparing a gourmet dish in a professional kitchen"

### 3D Model Generation
- Product photos: sneakers, furniture, electronics, toys
- Character images: people, animals, cartoon characters
- Objects: vehicles, buildings, sculptures, logos
- Artwork: paintings, sketches, digital art
- Natural objects: fruits, plants, rocks, shells

### Image Editing
**Basic Prompts:**
- "Change the background to a sunset with mountains"
- "Add sunglasses to the person in the photo"
- "Make the logo more colorful and vibrant"
- "Remove the background and make it transparent"
- "Add a professional business suit to the person"
- "Replace the sky with a starry night" (with mask covering sky area)
- "Change only the shirt color to red" (with mask covering shirt area)
- "Add modern architectural elements to the building facade"

**Enhanced Prompts (using prompt enhancement feature):**
- "glossy white ceramic blender on a marble countertop, soft ambient light, front view, minimalistic style"
- "matte black stainless steel coffee maker with plain white background, studio lighting, 45° angle, product photography style"
- "textured wood cutting board on a wooden table, natural sunlight, top-down view, lifestyle shot style"
- "brushed metal kitchen appliance with blurred kitchen background, golden hour light, three-quarter view, photorealistic style"

### Image Quality Scoring
**Testing Prompts with Generated Images:**
- "professional business logo" → Test with corporate logo images
- "modern tech startup logo" → Evaluate with minimalist tech designs  
- "luxury restaurant branding" → Score against elegant dining imagery
- "eco-friendly product design" → Assess green/sustainable themed images
- "fitness gym promotional image" → Rate energetic workout visuals
- "coffee shop atmosphere" → Score cozy cafe environment photos

## Azure Configuration

### Setting up Azure OpenAI

1. Create an Azure OpenAI resource in the [Azure portal](https://portal.azure.com)
2. Deploy the `gpt-image-1` model:
   - Go to Azure OpenAI Studio
   - Navigate to Deployments
   - Create a new deployment with `gpt-image-1` model
3. Get your endpoint and API key from the Azure portal

### API Details

The application uses the Azure OpenAI Image Generation API with these parameters:
- **Model**: `gpt-image-1`
- **Size**: `1024x1024`
- **Quality**: `high`
- **Output Format**: `PNG`

## ⚙️ Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **APIs**: 
  - Azure OpenAI GPT Image API (gpt-image-1)
  - Azure OpenAI GPT-4o Vision API
  - Azure OpenAI Sora API (video generation)
  - Azure OpenAI Embeddings (Ada-002, 3-Small, 3-Large)
  - Azure AI Vision (Computer Vision)
  - Azure Computer Vision Multimodal Embeddings
  - Hugging Face Spaces API (frogleo/Image-to-3D)
  - External PowerPoint Generator API
- **State Management**: React Hooks
- **File Handling**: FormData, Buffer processing
- **Accessibility**: ARIA attributes, semantic HTML

## 📁 Project Structure

```
GPTImage/
├── .env.example                   # Environment template
├── ARCHITECTURE.md               # Detailed architecture documentation
├── README.md                     # This file
├── requirements.txt              # Python dependencies for image scoring
├── package.json                  # Dependencies and scripts
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── scripts/

│   ├── working_3d_gen.py        # 3D model generation script
│   └── test_api_route.py        # API testing utilities
├── .github/
│   └── copilot-instructions.md  # AI assistant guidelines
├── public/
│   ├── generated-images/        # Generated logo storage
│   ├── generated-videos/       # Generated video storage
│   ├── generated-3d-models/    # Generated 3D model storage
│   ├── edited-images/          # Edited image storage
│   └── .gitkeep                # Preserve directory structure
└── src/
    ├── components/
    │   ├── Navigation.tsx       # Shared navigation component
    │   └── ImageScorer.tsx      # Advanced scoring component with multi-model analysis
    └── app/
        ├── globals.css          # Global styles
        ├── layout.tsx           # Root layout
        ├── page.tsx             # Home - Logo generation
        ├── analyze/
        │   └── page.tsx         # PPT generation & analysis
        ├── edit/
        │   └── page.tsx         # Batch image editing
        ├── iterative/
        │   └── page.tsx         # Sequential editing workflow
        ├── mask/
        │   └── page.tsx         # Canvas-based mask editor
        ├── scoring/
        │   └── page.tsx         # Image quality scoring interface
        └── api/
            ├── generate-logo/
            │   └── route.ts     # Logo generation API
            ├── generate-video/
            │   └── route.ts     # Video generation API
            ├── generate-3d/
            │   └── route.ts     # 3D model generation API
            ├── analyze-images/
            │   └── route.ts     # Image analysis API
            ├── edit-image/
            │   └── route.ts     # Image editing API
            └── score-image/
                └── route.ts     # Multi-method scoring API: Azure Vision, GPT-4o, Multimodal Embeddings
```

## 🔧 Troubleshooting

### Common Issues

1. **"Azure OpenAI configuration is missing"**
   - Ensure all environment variables are set in `.env.local`
   - Check that both GPT Image and GPT-4o resources are active
   - Verify deployment names match your Azure deployments

2. **"Failed to generate/edit images"**
   - Verify your API keys and deployment names
   - Check if you have access to both APIs
   - Ensure your Azure subscription has sufficient credits

3. **"PowerPoint generation failed"**
   - **Service Not Running**: Ensure the PowerPoint service is running on the configured port
     - Check if `http://localhost:5000` (or your configured URL) is accessible
     - Download and set up the service from: https://github.com/ahemavathy/Powerpoint
   - **Port Configuration**: Verify `POWERPOINT_API_BASE_URL` in your `.env.local` matches the running service
   - **Image Upload Issues**: Check if image upload to PowerPoint API succeeded
   - **JSON Format**: Ensure slide content JSON is properly formatted
   - **Service Dependencies**: Make sure the PowerPoint service has all required dependencies installed

4. **"The default export is not a React Component"**
   - Clear Next.js cache: `rm -rf .next`
   - Restart the development server
   - Check for syntax errors in page components

5. **Content Filter Errors**
   - Ensure descriptions don't contain inappropriate content
   - Try rephrasing prompts with more professional language
   - Use the prompt enhancement feature for structured, professional prompts
   - Check Azure OpenAI content policy guidelines

6. **Prompt Enhancement Issues**
   - **Dropdown Visibility**: All dropdown options now have improved text contrast for better readability
   - **Option Selection**: Choose complementary options (e.g., ceramic + glossy finish + studio lighting)
   - **Preview Not Updating**: Check that enhancement options are selected before clicking "Apply Enhanced Prompt"
   - **Reset Feature**: Use "Reset All" to clear all enhancement selections and start over

### Performance Issues

- **Slow image generation**: Azure OpenAI processing time varies
- **Large file uploads**: Check file size limits and network speed
- **Memory issues**: Reduce number of images processed simultaneously

### API Rate Limits

Azure OpenAI services have rate limits:
- Wait between requests if hitting rate limits
- Consider upgrading your Azure OpenAI pricing tier
- Monitor usage in Azure portal

## 🚀 Getting Started Quick Guide

1. **Clone & Install**: `git clone <repo> && cd GPTImage && npm install`
2. **Configure**: Copy `.env.example` to `.env.local` and add your Azure credentials
3. **PowerPoint Service**: Clone and run https://github.com/ahemavathy/Powerpoint (required for presentation features)
4. **Run**: `npm run dev` and open `http://localhost:3000`
5. **Explore**: 
   - Generate logos on the home page
   - Analyze images and create presentations on `/analyze`
   - Edit images on `/edit` or `/iterative`
   - Create masks on `/mask`
   - Score image quality on `/scoring`

## 🎯 Key Features Summary

| Feature | Description | Page |
|---------|-------------|------|
| **Logo Generation** | AI-powered logo creation from business descriptions | `/` |
| **Video Generation** | AI-powered video creation using Sora model | `/` |
| **3D Model Generation** | Generate 3D models (GLB/OBJ) from images | `/` |
| **Multi-Image Analysis** | GPT-4o vision analysis for presentation content | `/analyze` |
| **Batch Editing** | Edit multiple images simultaneously | `/edit` |
| **Iterative Editing** | Sequential editing with history tracking | `/iterative` |
| **Mask Editor** | Create precise editing masks | `/mask` |
| **Image Quality Scoring** | Azure AI Vision + Azure OpenAI embeddings scoring | `/scoring` |
| **PowerPoint Generation** | Convert analysis to downloadable presentations | `/analyze` |

## 📚 Additional Resources

- 📖 **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Detailed technical architecture
- 🔗 **[Azure OpenAI Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/)**
- 🎯 **[GPT Image API Access](https://aka.ms/oai/gptimage1access)**
- 🏗️ **[Next.js Documentation](https://nextjs.org/docs)**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues related to:
- **Application bugs**: Create an issue in this repository
- **Azure OpenAI**: Check the [Azure OpenAI documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- **GPT Image API access**: Apply [here](https://aka.ms/oai/gptimage1access)
- **GPT-4o Vision API**: Check Azure OpenAI service availability

---

## ⭐ Star This Repository

If you find this project useful, please consider giving it a star! It helps others discover the project and motivates continued development.

**Built with ❤️ using Azure OpenAI, Next.js, and TypeScript**
