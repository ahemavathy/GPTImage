import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const config = {
      baseUrl: process.env.POWERPOINT_API_BASE_URL || 'http://localhost:5000',
      endpoints: {
        upload: '/api/Presentation/upload-images',
        create: '/api/Presentation/create-from-json',
        createFromTemplate: '/api/Presentation/create-from-template',
        download: '/api/Presentation/download'
      }
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error loading PowerPoint configuration:', error);
    return NextResponse.json(
      { error: 'Failed to load PowerPoint configuration' },
      { status: 500 }
    );
  }
}
