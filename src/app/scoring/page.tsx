'use client';

import Navigation from '@/components/Navigation';
import ImageScorer from '@/components/ImageScorer';

/**
 * Image Scoring Test Page
 * 
 * A dedicated page for testing the BLIP-based image scoring system.
 * This page allows users to upload images and prompts to evaluate
 * the semantic alignment between generated images and their text descriptions.
 */
export default function ScoringPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation Bar */}
      <Navigation />

      <main className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Image Quality Scoring
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Evaluate how well your AI-generated images align with their text prompts using 
              advanced BLIP-based semantic similarity scoring. BLIP generates captions from your images 
              and compares them with your prompts for more intuitive and accurate scoring.
            </p>
          </div>

          {/* Main Scorer Component */}
          <ImageScorer />
        </div>
      </main>
    </div>
  );
}