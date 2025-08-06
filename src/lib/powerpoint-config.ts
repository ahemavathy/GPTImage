// PowerPoint API configuration utility
// Centralizes PowerPoint API base URL configuration

export const powerpointConfig = {
  baseUrl: process.env.POWERPOINT_API_BASE_URL || 'http://localhost:5000',
  
  // Fixed endpoints (not configurable)
  endpoints: {
    upload: '/api/Presentation/upload-images',
    create: '/api/Presentation/create-from-json', 
    createFromTemplate: '/api/Presentation/create-from-template',
    download: '/api/Presentation/download'
  },
  
  // Helper functions to build full URLs
  getUploadUrl: () => `${powerpointConfig.baseUrl}${powerpointConfig.endpoints.upload}`,
  getCreateUrl: () => `${powerpointConfig.baseUrl}${powerpointConfig.endpoints.create}`,
  getCreateFromTemplateUrl: () => `${powerpointConfig.baseUrl}${powerpointConfig.endpoints.createFromTemplate}`,
  getDownloadUrl: (fileName: string) => `${powerpointConfig.baseUrl}${powerpointConfig.endpoints.download}/${fileName}`
};

// Client-side configuration (for use in React components)
// Note: In Next.js, environment variables are only available on the server side by default
// For client-side access, we need to expose them via an API route
export const getClientPowerpointConfig = async () => {
  try {
    const response = await fetch('/api/powerpoint-config');
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to load PowerPoint configuration');
  } catch (error) {
    console.error('Error loading PowerPoint config:', error);
    // Fallback to default values
    return {
      baseUrl: 'http://localhost:5000',
      endpoints: {
        upload: '/api/Presentation/upload-images',
        create: '/api/Presentation/create-from-json',
        createFromTemplate: '/api/Presentation/create-from-template',
        download: '/api/Presentation/download'
      }
    };
  }
};
