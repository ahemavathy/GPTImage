/**
 * Utility functions for the Image Scoring System
 * 
 * This module provides helper functions for image processing, score calculations,
 * and data management for the scoring system.
 */

import { ImageScores, ScoringRecord, ScoringAnalytics, ScoreQuality } from '@/types/scoring';

/**
 * Calculate overall score from individual metrics
 * 
 * @param scores - Individual metric scores
 * @returns Overall quality score (0-1)
 */
export function calculateOverallScore(scores: ImageScores): number {
  const weights = {
    blipSimilarity: 0.7,        // BLIP similarity is primary metric
    classificationAccuracy: 0.3  // Classification is secondary (when available)
  };

  let totalScore = 0;
  let totalWeight = 0;

  // Add BLIP similarity score
  if (scores.blipSimilarity !== undefined) {
    totalScore += scores.blipSimilarity * weights.blipSimilarity;
    totalWeight += weights.blipSimilarity;
  }

  // Add classification accuracy score (when available)
  if (scores.classificationAccuracy !== undefined) {
    totalScore += scores.classificationAccuracy * weights.classificationAccuracy;
    totalWeight += weights.classificationAccuracy;
  }

  // Return weighted average, or 0 if no scores available
  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

/**
 * Categorize a score into quality levels
 * 
 * @param score - Score value (0-1)
 * @returns Quality category
 */
export function categorizeScore(score: number): ScoreQuality {
  if (score >= 0.8) return 'excellent';
  if (score >= 0.6) return 'good';
  if (score >= 0.4) return 'fair';
  return 'poor';
}

/**
 * Get color for score visualization
 * 
 * @param score - Score value (0-1)
 * @returns Hex color string
 */
export function getScoreColor(score: number): string {
  const quality = categorizeScore(score);
  const colors = {
    excellent: '#10b981', // green-500
    good: '#3b82f6',      // blue-500
    fair: '#f59e0b',      // amber-500
    poor: '#ef4444'       // red-500
  };
  return colors[quality];
}

/**
 * Format score as percentage string
 * 
 * @param score - Score value (0-1)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatScoreAsPercentage(score: number, decimals: number = 0): string {
  return `${(score * 100).toFixed(decimals)}%`;
}

/**
 * Get quality description for a score
 * 
 * @param score - Score value (0-1)
 * @returns Human-readable quality description
 */
export function getScoreDescription(score: number): string {
  const quality = categorizeScore(score);
  const descriptions = {
    excellent: 'Excellent alignment with prompt',
    good: 'Good alignment with prompt',
    fair: 'Fair alignment with prompt',
    poor: 'Poor alignment with prompt'
  };
  return descriptions[quality];
}

/**
 * Validate image file for scoring
 * 
 * @param file - File to validate
 * @returns Validation result
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'Image file too large (max 10MB)' };
  }

  // Check supported formats
  const supportedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!supportedFormats.includes(file.type)) {
    return { valid: false, error: 'Unsupported image format' };
  }

  return { valid: true };
}

/**
 * Generate unique ID for scoring records
 * 
 * @returns Unique identifier string
 */
export function generateScoringId(): string {
  return `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse prompt to extract key themes/categories
 * 
 * @param prompt - Text prompt
 * @returns Array of themes/categories
 */
export function extractPromptThemes(prompt: string): string[] {
  const themes: string[] = [];
  const lowerPrompt = prompt.toLowerCase();

  // Kitchen appliance themes
  if (lowerPrompt.includes('kitchen') || lowerPrompt.includes('appliance')) {
    themes.push('kitchen-appliance');
  }
  if (lowerPrompt.includes('countertop') || lowerPrompt.includes('counter')) {
    themes.push('countertop');
  }
  if (lowerPrompt.includes('modern') || lowerPrompt.includes('contemporary')) {
    themes.push('modern-design');
  }
  if (lowerPrompt.includes('stainless') || lowerPrompt.includes('steel')) {
    themes.push('stainless-steel');
  }

  // Color themes
  const colors = ['black', 'white', 'red', 'blue', 'green', 'gray', 'silver'];
  colors.forEach(color => {
    if (lowerPrompt.includes(color)) {
      themes.push(`color-${color}`);
    }
  });

  // Style themes
  if (lowerPrompt.includes('minimalist') || lowerPrompt.includes('clean')) {
    themes.push('minimalist');
  }
  if (lowerPrompt.includes('luxury') || lowerPrompt.includes('premium')) {
    themes.push('luxury');
  }

  return themes;
}

/**
 * Calculate analytics from scoring records
 * 
 * @param records - Array of scoring records
 * @param startDate - Start date for analytics period
 * @param endDate - End date for analytics period
 * @returns Analytics data
 */
export function calculateAnalytics(
  records: ScoringRecord[], 
  startDate: Date, 
  endDate: Date
): ScoringAnalytics {
  // Filter records by date range
  const filteredRecords = records.filter(record => 
    record.timestamp >= startDate && record.timestamp <= endDate
  );

  if (filteredRecords.length === 0) {
    return {
      period: { start: startDate, end: endDate },
      totalImages: 0,
      averageScores: { blipSimilarity: 0 },
      distribution: {
        blipSimilarity: { excellent: 0, good: 0, fair: 0, poor: 0 }
      },
      topPrompts: []
    };
  }

  // Calculate average scores
  const totalBlipSimilarity = filteredRecords.reduce((sum, record) => 
    sum + record.scores.blipSimilarity, 0
  );
  const averageBlipSimilarity = totalBlipSimilarity / filteredRecords.length;

  // Calculate distribution
  const distribution = {
    blipSimilarity: { excellent: 0, good: 0, fair: 0, poor: 0 }
  };

  filteredRecords.forEach(record => {
    const quality = categorizeScore(record.scores.blipSimilarity);
    distribution.blipSimilarity[quality]++;
  });

  // Calculate top prompts
  const promptScores = new Map<string, { total: number; count: number }>();
  
  filteredRecords.forEach(record => {
    const existing = promptScores.get(record.prompt) || { total: 0, count: 0 };
    promptScores.set(record.prompt, {
      total: existing.total + record.scores.blipSimilarity,
      count: existing.count + 1
    });
  });

  const topPrompts = Array.from(promptScores.entries())
    .map(([prompt, stats]) => ({
      prompt,
      averageScore: stats.total / stats.count,
      count: stats.count
    }))
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 10); // Top 10 prompts

  return {
    period: { start: startDate, end: endDate },
    totalImages: filteredRecords.length,
    averageScores: {
      blipSimilarity: averageBlipSimilarity
    },
    distribution,
    topPrompts
  };
}

/**
 * Export scoring records to CSV format
 * 
 * @param records - Array of scoring records
 * @returns CSV string
 */
export function exportRecordsToCSV(records: ScoringRecord[]): string {
  const headers = [
    'ID',
    'Timestamp',
    'Prompt',
    'BLIP Similarity',
    'Classification Accuracy',
    'Overall Score',
    'Image Width',
    'Image Height',
    'Processing Time (ms)',
    'Tags',
    'Notes'
  ];

  const rows = records.map(record => [
    record.id,
    record.timestamp.toISOString(),
    `"${record.prompt.replace(/"/g, '""')}"`, // Escape quotes
    record.scores.blipSimilarity.toFixed(4),
    record.scores.classificationAccuracy?.toFixed(4) || '',
    (record.scores.overallScore || calculateOverallScore(record.scores)).toFixed(4),
    record.metadata.imageSize.width,
    record.metadata.imageSize.height,
    record.metadata.processingTime,
    (record.tags || []).join(';'),
    `"${(record.notes || '').replace(/"/g, '""')}"`
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Import scoring records from CSV format
 * 
 * @param csvContent - CSV string content
 * @returns Array of scoring records
 */
export function importRecordsFromCSV(csvContent: string): ScoringRecord[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const records: ScoringRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = lines[i].split(',');
      
      const record: ScoringRecord = {
        id: values[0],
        timestamp: new Date(values[1]),
        prompt: values[2].replace(/^"|"$/g, '').replace(/""/g, '"'),
        scores: {
          blipSimilarity: parseFloat(values[3]),
          classificationAccuracy: values[4] ? parseFloat(values[4]) : undefined
        },
        metadata: {
          imageSize: {
            width: parseInt(values[6]),
            height: parseInt(values[7])
          },
          promptLength: values[2].length,
          processingTime: parseInt(values[8])
        },
        imageId: `imported_${i}`,
        tags: values[9] ? values[9].split(';') : undefined,
        notes: values[10] ? values[10].replace(/^"|"$/g, '').replace(/""/g, '"') : undefined
      };

      records.push(record);
    } catch (error) {
      console.warn(`Failed to parse CSV line ${i + 1}:`, error);
    }
  }

  return records;
}