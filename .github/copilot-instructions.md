<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# AI Logo Generator Project Instructions

This is a Next.js application that generates professional logos using Azure's GPT Image API. The project focuses on:

## Key Technologies
- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Azure OpenAI GPT Image API for logo generation
- Lucide React for icons

## Architecture Guidelines
- Use the /src/app directory structure
- API routes in /src/app/api/
- Client components with 'use client' directive
- Server-side environment variable handling
- Responsive design with Tailwind CSS

## Code Style Preferences
- Use TypeScript interfaces for data structures
- Implement proper error handling for API calls
- Use async/await for asynchronous operations
- Follow Next.js best practices for performance
- Implement loading states for better UX

## Azure Integration
- Use Azure OpenAI Image Generation API
- Handle API rate limits and content filtering
- Implement proper authentication with API keys
- Support various image sizes and quality settings

## UI/UX Guidelines
- Modern, clean interface design
- Responsive layout for all screen sizes
- Clear loading indicators
- User-friendly error messages
- Intuitive business description input flow
