# AI Content Generation Platform - Architecture Design

## 🏗️ System Overview

The AI Content Generation Platform is a comprehensive Next.js application that provides multiple AI-powered capabilities including logo generation, 3D model creation, video generation, image editing, enterprise-grade image quality scoring, image analysis, and PowerPoint presentation creation. The application features a modern, responsive interface with advanced workflow capabilities and Azure AI services integration for professional-grade content analysis.

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  Next.js Frontend (React 18 + TypeScript + Tailwind CSS)      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │   Home      │ │   Analyze   │ │    Edit     │ │  Iterative  │ │
│  │(Generation) │ │    Page     │ │    Page     │ │    Edit     │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                 │
│  │    Mask     │ │   Scoring   │ │ Navigation  │                 │
│  │   Editor    │ │    Page     │ │ Component   │                 │
│  └─────────────┘ └─────────────┘ └─────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway Layer                        │
├─────────────────────────────────────────────────────────────────┤
│              Next.js API Routes (/api/*)                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │generate-logo│ │analyze-images│ │ edit-image  │ │generate-3d  │ │
│  │   /route.ts │ │  /route.ts   │ │  /route.ts  │ │  /route.ts  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│  ┌─────────────┐ ┌─────────────┐                                 │
│  │generate-video│ │score-image  │                                 │
│  │   /route.ts │ │  /route.ts   │                                 │
│  └─────────────┘ └─────────────┘                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐     │
│  │  Azure OpenAI   │ │  Azure OpenAI   │ │  Azure OpenAI   │     │
│  │   GPT Image     │ │     GPT-4o      │ │      Sora       │     │
│  │  (gpt-image-1)  │ │   (Vision)      │ │    (Video)      │     │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐     │
│  │ Hugging Face    │ │   PowerPoint    │ │   Python        │     │
│  │    Spaces       │ │   Generator     │ │    Scripts      │     │
│  │ (3D Generation) │ │      API        │ │ (Azure Vision)  │     │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Core Components

### 1. Frontend Layer (Next.js 15 + App Router)

#### **Main Pages:**
- **Home Page** (`/src/app/page.tsx`)
  - Multi-modal AI content generation interface
  - Toggle between Logo/Image, 3D Model, and Video generation
  - Business description input with default content
  - Multi-image generation support (configurable 1-10 images)
  - 3D model generation from uploaded images (GLB/OBJ formats)
  - Video generation using Azure OpenAI Sora model (3-15 seconds, multiple resolutions)
  - Individual downloads and batch download functionality
  - Interactive 3D model preview
  - Video preview and playback

- **Analyze Page** (`/src/app/analyze/page.tsx`)
  - Multi-image upload with drag & drop
  - GPT-4o vision analysis with configurable system prompt
  - Pre-filled guidelines with default content
  - Editable JSON content pane for slide customization
  - PowerPoint generation with image upload integration
  - Copy-formatted content for API usage
  - Accessibility features (ARIA attributes, keyboard navigation)

- **Edit Page** (`/src/app/edit/page.tsx`)
  - Single/batch image editing capabilities
  - Mask-based modifications support
  - Configurable number of output images
  - Multi-image rendering and download

- **Iterative Edit Page** (`/src/app/iterative/page.tsx`)
  - Sequential image editing workflow
  - Canvas-based image history and undo/redo
  - Mask upload and application
  - Collapsible UI sections for better UX
  - Edit history tracking

- **Mask Editor** (`/src/app/mask/page.tsx`)
  - Canvas-based mask creation with brush/eraser tools
  - PNG mask validation and export
  - Adjustable brush sizes and tools

- **Scoring Page** (`/src/app/scoring/page.tsx`)
  - Azure AI Vision-based image quality assessment
  - Upload image and corresponding text prompt
  - Enterprise-grade semantic similarity scoring using AI Vision models
  - Azure OpenAI embeddings for professional semantic analysis
  - Visual score indicators with color-coded results
  - Cosine similarity interpretation guide (Excellent 90-100%, Good 70-90%, Fair 50-70%, Poor 0-50%)
  - Processing metadata display (image dimensions, processing time, model confidence)

#### **Shared Components:**
- **Navigation Component** (`/src/components/Navigation.tsx`)
  - Consistent navigation across all pages
  - Active state indication
  - Responsive design with mobile support
  - Icon-based navigation with clear labels

#### **Key Features:**
- **Responsive Design**: Tailwind CSS for mobile-first approach
- **Real-time Feedback**: Loading states, progress indicators, upload status
- **File Handling**: Drag-and-drop, multi-file selection, file validation
- **Error Management**: User-friendly error messages with ARIA live regions
- **State Management**: React hooks for complex state and form handling
- **Accessibility**: WCAG 2.1 AA compliance features
- **Input Validation**: Client and server-side validation with sanitization
- **Performance**: Optimized image processing and lazy loading
- **User Experience**: Collapsible sections, history tracking, undo/redo
- **Utility Functions**: Reusable helper functions for common operations

### 2. API Layer (Next.js API Routes)

#### **Core Endpoints:**

**`/api/generate-logo`**
```typescript
// Handles logo/image generation requests
POST /api/generate-logo
Body: {
  businessDescription: string,
  numberOfImages: number (configurable 1-4)
}
Response: 
// Single image (numberOfImages = 1)
{
  url: string,
  revisedPrompt: string
}
// Multiple images (numberOfImages > 1)
{
  images: Array<{url: string, revisedPrompt: string}>
}
```

**`/api/analyze-images`**
```typescript
// Processes multi-image analysis with GPT-4o
POST /api/analyze-images
Body: FormData {
  prompt: string,
  image_0: File,
  image_1: File,
  ...
}
Response: {
  response: string (JSON formatted slide content),
  usage: {
    prompt_tokens: number,
    completion_tokens: number,
    total_tokens: number
  }
}
```

**`/api/edit-image`**
```typescript
// Handles single/batch image editing operations
POST /api/edit-image
Body: FormData {
  image: File,
  mask?: File,
  prompt: string,
  numberOfImages: number (configurable)
}
Response: {
  images: Array<{url: string, revisedPrompt: string}>,
  totalGenerated: number
}
```

**`/api/generate-3d`**
```typescript
// Handles 3D model generation from images
POST /api/generate-3d
Body: FormData {
  image: File
}
Response: {
  success: boolean,
  modelUrl?: string,
  fileName?: string,
  processingTime?: number
}
```

**`/api/generate-video`**
```typescript
// Handles video generation using Sora model
POST /api/generate-video
Body: {
  prompt: string,
  duration: number (3-15 seconds),
  resolution: string ("480x480" | "1280x720" | "1920x1080")
}
Response: {
  success: boolean,
  videoUrl?: string,
  fileName?: string,
  duration?: number,
  resolution?: string
}
```

**`/api/score-image`**
```typescript
// Handles Azure AI Vision-based image quality scoring
GET /api/score-image
Response: {
  status: string,
  version: string,
  supportedMetrics: string[],
  models: string[]
}

POST /api/score-image
Body: FormData {
  image: File,
  prompt: string
}
Response: {
  success: boolean,
  scores?: {
    azureVisionSimilarity: number (0-1),
    classificationAccuracy?: number
  },
  metadata?: {
    imageSize: { width: number, height: number },
    promptLength: number,
    processingTime: number
  },
  azureVisionDetails?: {
    generatedCaption: string,
    confidence: number,
    modelUsed: string
  },
  error?: string
}
```

### 3. External Service Integration

#### **Azure OpenAI Services:**

**GPT Image API (gpt-image-1)**
- **Purpose**: Logo and image generation
- **Configuration**: Separate endpoint, API key, deployment
- **Features**: Multiple image generation, various sizes

**GPT-4o Vision API**
- **Purpose**: Multi-image analysis and presentation content generation
- **Configuration**: Separate endpoint, API key, deployment, configurable system prompt
- **Features**: 
  - Multi-image processing with image name context
  - Structured JSON output for PowerPoint slides
  - Configurable system prompts via environment variables
  - Advanced image understanding and content generation
  - Token usage tracking and optimization

**Sora Video Generation API**
- **Purpose**: AI-powered video generation from text descriptions
- **Configuration**: Separate endpoint, API key, deployment for Sora model
- **Features**:
  - Text-to-video generation (3-15 second duration)
  - Multiple resolution support (480x480, 1280x720, 1920x1080)
  - MP4 video output format
  - Realistic and imaginative scene generation

#### **Hugging Face Spaces Integration:**

**3D Model Generation (frogleo/Image-to-3D)**
- **Purpose**: Generate 3D models from 2D images
- **Configuration**: Optional Hugging Face token for enhanced performance
- **Features**:
  - Image-to-3D conversion using gradio_client
  - GLB and OBJ format support
  - Configurable timeout handling (5+ minutes for processing)
  - Pixel art style support with command-line flags

#### **Azure AI Services Integration:**

**Azure AI Vision (Computer Vision)**
- **Purpose**: Professional-grade image captioning and analysis using Azure AI Vision models
- **Configuration**: Separate endpoint, API key for Computer Vision service
- **Features**:
  - Enterprise-grade image captioning with confidence scores
  - Gender-neutral caption options
  - Integration with Azure OpenAI embeddings for semantic similarity
  - High accuracy and reliability for production use

**Azure OpenAI Embeddings**
- **Purpose**: Semantic similarity calculation using state-of-the-art language models
- **Model**: text-embedding-ada-002 for high-quality vector representations
- **Features**:
  - Professional semantic understanding beyond simple word matching
  - Cosine similarity calculation between high-dimensional vectors
  - Handles context, synonyms, and nuanced meaning
  - Consistent similarity scoring across all image captioning methods

#### **PowerPoint Generator API**
- **Endpoint**: Configurable via `POWERPOINT_API_BASE_URL` environment variable
- **Features**: 
  - Image upload (`/upload-images`)
  - JSON-to-PowerPoint conversion (`/create-from-json`)
  - Template-based PowerPoint generation (`/create-from-template`)
  - File download (`/download/{fileName}`)

## 🔧 Technical Stack

### **Frontend Technologies:**
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useRef)
- **HTTP Client**: Fetch API

### **Backend Technologies:**
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **File Processing**: FormData, Buffer
- **Environment**: .env configuration

### **External Dependencies:**
- **AI Services**: Azure OpenAI (GPT Image, GPT-4o, Sora, Embeddings), Azure AI Vision (Computer Vision)
- **3D Generation**: Hugging Face Spaces (frogleo/Image-to-3D)
- **Document Generation**: External PowerPoint API
- **Image Processing**: Canvas API (client-side)
- **Machine Learning**: Azure AI Vision models, Azure OpenAI text-embedding-ada-002

## 📁 Project Structure

```
GPTImage/
├── .env                          # Environment configuration
├── .env.example                  # Environment template
├── package.json                  # Dependencies and scripts
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── ARCHITECTURE.md              # This document
├── .github/
│   └── copilot-instructions.md  # AI assistant guidelines
├── scripts/
│   ├── working_3d_gen.py        # 3D model generation script
│   └── test_api_route.py        # API testing utilities
├── public/
│   ├── generated-logos/         # Generated logo storage
│   ├── generated-videos/        # Generated video storage  
│   ├── generated-3d-models/     # Generated 3D model storage
│   ├── edited-images/           # Edited image storage
│   └── .gitkeep                 # Preserve directory structure
├── src/
│   ├── components/
│   │   ├── Navigation.tsx       # Shared navigation component
│   │   └── ImageScorer.tsx      # Azure AI Vision scoring component
│   ├── types/
│   │   └── scoring.ts           # TypeScript interfaces for Azure Vision scoring
│   ├── lib/
│   │   └── scoringUtils.ts      # Scoring utility functions
│   └── app/
│       ├── globals.css          # Global styles
│       ├── layout.tsx           # Root layout
│       ├── page.tsx             # Home page (multi-modal content generation)
│       ├── analyze/
│       │   └── page.tsx         # Multi-image analysis & PPT
│       ├── edit/
│       │   └── page.tsx         # Batch image editing
│       ├── iterative/
│       │   └── page.tsx         # Sequential editing workflow
│       ├── mask/
│       │   └── page.tsx         # Canvas-based mask editor
│       ├── scoring/
│       │   └── page.tsx         # Image quality scoring interface
│       └── api/
│           ├── generate-logo/
│           │   └── route.ts     # Logo generation API
│           ├── generate-3d/
│           │   └── route.ts     # 3D model generation API
│           ├── generate-video/
│           │   └── route.ts     # Video generation API
│           ├── analyze-images/
│           │   └── route.ts     # Image analysis API
│           ├── edit-image/
│           │   └── route.ts     # Image editing API
│           └── score-image/
│               └── route.ts     # Azure AI Vision-based image scoring API
```

## 🔐 Configuration Management

### **Environment Variables:**

**Azure OpenAI GPT Image (gpt-image-1):**
```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-image-1
```

**Azure OpenAI GPT-4o (Vision):**
```env
AZURE_OPENAI_GPT4O_ENDPOINT=https://your-gpt4o-resource.openai.azure.com/
AZURE_OPENAI_GPT4O_API_KEY=your-gpt4o-api-key
AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME=gpt-4o-vision
AZURE_OPENAI_GPT4O_SYSTEM_PROMPT=your-system-prompt
```

**Azure OpenAI Sora (Video Generation):**
```env
AZURE_OPENAI_SORA_ENDPOINT=https://your-sora-resource.openai.azure.com/
AZURE_OPENAI_SORA_API_KEY=your-sora-api-key
AZURE_OPENAI_SORA_DEPLOYMENT_NAME=sora-model
```

**Azure AI Vision (Computer Vision):**
```env
AZURE_AI_VISION_ENDPOINT=https://your-computer-vision-resource.cognitiveservices.azure.com/
AZURE_AI_VISION_API_KEY=your-computer-vision-api-key
```

**Hugging Face Integration:**
```env
HUGGINGFACE_HUB_TOKEN=your-hugging-face-token
```

**PowerPoint Generator Service:**
```env
POWERPOINT_API_BASE_URL=http://localhost:5000
```

## 🚀 Data Flow

### **Logo Generation Flow:**
```
User Input (Business Description + Number of Images) → Home Page → /api/generate-logo → Azure GPT Image → Multiple Images → Individual/Batch Downloads
```

### **3D Model Generation Flow:**
```
Image Upload → Home Page → /api/generate-3d → Python Script → Hugging Face Spaces → GLB/OBJ Files → Interactive Preview → Download
```

### **Video Generation Flow:**
```
Text Prompt + Parameters (Duration, Resolution) → Home Page → /api/generate-video → Azure Sora API → MP4 Video → Preview → Download
```

### **Image Analysis Flow:**
```
Multi-Image Upload → Analyze Page → PowerPoint API Upload → /api/analyze-images → Azure GPT-4o → JSON Slide Content → Editable Pane → PowerPoint Generation
```

### **Batch Editing Flow:**
```
Image Upload + Prompt + Number of Images → Edit Page → /api/edit-image → Azure GPT Image Edit → Multiple Edited Images → Downloads
```

### **Iterative Editing Flow:**
```
Image Upload → Iterative Page → Sequential Edits → Canvas History → Undo/Redo → Mask Application → Final Result
```

### **Image Quality Scoring Flow:**
```
Image Upload + Text Prompt → Scoring Page → /api/score-image → Azure AI Vision → Caption Generation → Azure OpenAI Embeddings → Semantic Similarity → Visual Score Display
```

### **PowerPoint Generation Flow:**
```
Standard Generation:
Images → PowerPoint API Upload → Edited Content → /create-from-json → Download PPT File

Template-based Generation:
Images → PowerPoint API Upload → Edited Content → /create-from-template → Download PPT File
```

## 🛡️ Security Considerations

### **API Security:**
- **Environment Variables**: Sensitive keys stored in .env
- **Server-Side Processing**: API keys never exposed to client
- **CORS**: Controlled by Next.js API routes
- **Input Validation**: File type checking, content sanitization

### **File Handling:**
- **Client-Side**: File size limits, type validation, dimension checks
- **Server-Side**: Buffer processing, temporary storage, sanitization
- **External APIs**: Secure multipart form data transmission
- **Image Storage**: Organized directory structure with .gitkeep files
- **Validation**: MIME type checking, file size limits, dimension validation

## 📈 Scalability & Performance

### **Frontend Optimizations:**
- **Next.js App Router**: Improved performance and SEO
- **Image Optimization**: Next.js built-in image optimization
- **Code Splitting**: Automatic route-based splitting
- **Caching**: Browser and Next.js caching strategies
- **Shared Components**: Navigation component reduces bundle duplication
- **Utility Functions**: Reusable functions for common operations
- **Accessibility**: Screen reader support and keyboard navigation

### **API Optimizations:**
- **Async Processing**: Non-blocking API calls with proper error handling
- **Error Handling**: Graceful degradation with user-friendly messages
- **Rate Limiting**: Azure OpenAI built-in limits respected
- **Response Optimization**: Minimal payload sizes and structured responses
- **Input Validation**: Server-side validation and sanitization
- **File Processing**: Efficient buffer handling and memory management

## 🔮 Future Enhancements

### **Planned Features:**
1. **User Authentication**: User accounts and session management
2. **Content Gallery**: Save and manage generated images, videos, 3D models
3. **Template System**: Pre-built presentation templates
4. **Batch Processing**: Multiple operations in queue
5. **Analytics Dashboard**: Usage statistics and insights
6. **Mobile App**: React Native companion app
7. **Advanced Editing**: Layer-based editing with multiple masks
8. **AI Improvements**: Fine-tuned models for specific use cases
9. **Scoring History**: Track and analyze scoring results over time
10. **Advanced 3D Features**: Texture mapping, animation support
11. **Video Enhancement**: Longer videos, custom styles, post-processing
12. **Multi-Model Scoring**: Combine multiple AI models for better accuracy

### **Technical Improvements:**
1. **Database Integration**: PostgreSQL/MongoDB for persistence
2. **CDN Integration**: Image storage and delivery optimization
3. **Microservices**: Split into specialized services
4. **Docker Containerization**: Simplified deployment
5. **CI/CD Pipeline**: Automated testing and deployment
6. **Monitoring**: Application performance monitoring
7. **Testing Suite**: Comprehensive unit, integration, and E2E tests
8. **Component Library**: Atomic design pattern implementation

## 🧪 Testing Strategy

### **Frontend Testing:**
- **Unit Tests**: React component testing
- **Integration Tests**: API route testing
- **E2E Tests**: Full user workflow testing

### **API Testing:**
- **Unit Tests**: Individual function testing
- **Integration Tests**: External service integration
- **Load Tests**: Performance under stress

## 📋 Deployment Architecture

### **Development Environment:**
- **Local Development**: Next.js dev server
- **Hot Reloading**: Real-time code changes
- **Environment**: .env.local configuration

### **Production Environment:**
- **Platform**: Vercel/Netlify recommended
- **Build Process**: Next.js static generation
- **Environment**: Production .env configuration
- **CDN**: Automatic edge deployment

---

## 🎯 Key Architectural Strengths

1. **Multi-Modal AI Integration**: Comprehensive support for images, videos, 3D models, and presentations
2. **Modular Design**: Clear separation of concerns with organized file structure including Python utilities
3. **Scalable Structure**: Easy to extend and maintain with shared components and utilities
4. **Type Safety**: Full TypeScript implementation with proper interfaces for all features
5. **Modern Stack**: Latest React and Next.js features with App Router and Python integration
6. **User Experience**: Responsive, intuitive interface with accessibility features across all modalities
7. **API Integration**: Clean external service integration with proper error handling for multiple AI services
8. **Configuration**: Flexible environment management with separate service configs for each AI provider
9. **Performance**: Optimized processing for images, videos, 3D models, and real-time scoring
10. **Workflow Support**: Sequential and batch operations for all content types
11. **Quality Assessment**: Integrated Azure AI Vision-based scoring system for content quality evaluation
12. **Cross-Platform Scripts**: Python utilities integrated with Node.js for specialized processing
13. **Developer Experience**: Well-documented code with comprehensive architecture and testing utilities

This architecture provides a robust foundation for the AI Content Generation Platform with comprehensive multi-modal feature support, quality assessment capabilities, accessibility compliance, and extensive room for future growth and enhancement across all AI-powered content creation domains.
