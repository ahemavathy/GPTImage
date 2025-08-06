# AI Image Generation App - Architecture Design

## 🏗️ System Overview

The AI Image Generation App is a comprehensive Next.js application that provides multiple AI-powered image capabilities including logo generation, image analysis, iterative image editing, mask-based editing, and PowerPoint presentation creation. The application features a modern, responsive interface with advanced workflow capabilities.

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  Next.js Frontend (React 18 + TypeScript + Tailwind CSS)      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │   Home      │ │   Analyze   │ │    Edit     │ │  Iterative  │ │
│  │   Page      │ │    Page     │ │    Page     │ │    Edit     │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│  ┌─────────────┐ ┌─────────────┐                                 │
│  │    Mask     │ │ Navigation  │                                 │
│  │   Editor    │ │ Component   │                                 │
│  └─────────────┘ └─────────────┘                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway Layer                        │
├─────────────────────────────────────────────────────────────────┤
│              Next.js API Routes (/api/*)                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│  │generate-logo│ │analyze-images│ │ edit-image  │                │
│  │   /route.ts │ │  /route.ts   │ │  /route.ts  │                │
│  └─────────────┘ └─────────────┘ └─────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │  Azure OpenAI   │    │  Azure OpenAI   │    │   PowerPoint    │ │
│  │   GPT Image     │    │     GPT-4o      │    │   Generator     │ │
│  │  (gpt-image-1)  │    │   (Vision)      │    │      API        │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Core Components

### 1. Frontend Layer (Next.js 15 + App Router)

#### **Main Pages:**
- **Home Page** (`/src/app/page.tsx`)
  - Logo/Image generation interface
  - Business description input with default content
  - Multi-image generation support (configurable n images)
  - Individual image download functionality
  - Shared navigation component

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
Body: FormData {
  businessDescription: string,
  numberOfImages: number (configurable 1-10)
}
Response: {
  images: Array<{url: string, fileName: string}>,
  totalGenerated: number,
  savedImages: string[]
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
- **AI Services**: Azure OpenAI
- **Document Generation**: External PowerPoint API
- **Image Processing**: Canvas API (client-side)

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
├── public/
│   ├── generated-images/        # Generated logo storage
│   ├── edited-images/          # Edited image storage
│   └── .gitkeep                # Preserve directory structure
├── src/
│   ├── components/
│   │   └── Navigation.tsx       # Shared navigation component
│   └── app/
│       ├── globals.css          # Global styles
│       ├── layout.tsx           # Root layout
│       ├── page.tsx             # Home page (logo generation)
│       ├── analyze/
│       │   └── page.tsx         # Multi-image analysis & PPT
│       ├── edit/
│       │   └── page.tsx         # Batch image editing
│       ├── iterative/
│       │   └── page.tsx         # Sequential editing workflow
│       ├── mask/
│       │   └── page.tsx         # Canvas-based mask editor
│       └── api/
│           ├── generate-logo/
│           │   └── route.ts     # Logo generation API
│           ├── analyze-images/
│           │   └── route.ts     # Image analysis API
│           └── edit-image/
│               └── route.ts     # Image editing API
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

## 🚀 Data Flow

### **Logo Generation Flow:**
```
User Input (Business Description + Number of Images) → Home Page → /api/generate-logo → Azure GPT Image → Multiple Images → Individual Downloads
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
2. **Image Gallery**: Save and manage generated/edited images
3. **Template System**: Pre-built presentation templates
4. **Batch Processing**: Multiple operations in queue
5. **Analytics Dashboard**: Usage statistics and insights
6. **Mobile App**: React Native companion app
7. **Advanced Editing**: Layer-based editing with multiple masks
8. **AI Improvements**: Fine-tuned models for specific use cases

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

1. **Modular Design**: Clear separation of concerns with organized file structure
2. **Scalable Structure**: Easy to extend and maintain with shared components
3. **Type Safety**: Full TypeScript implementation with proper interfaces
4. **Modern Stack**: Latest React and Next.js features with App Router
5. **User Experience**: Responsive, intuitive interface with accessibility features
6. **API Integration**: Clean external service integration with proper error handling
7. **Configuration**: Flexible environment management with separate service configs
8. **Performance**: Optimized image processing and efficient state management
9. **Workflow Support**: Sequential and batch editing capabilities
10. **Developer Experience**: Well-documented code with comprehensive architecture

This architecture provides a robust foundation for the AI Image Generation app with comprehensive feature support, accessibility compliance, and room for future growth and enhancement.
