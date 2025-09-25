#!/usr/bin/env python3
"""
BLIP-based Image-Text Similarity Scorer (Updated)

BLIP (Bootstrapped Language-Image Pre-training) provides semantic understanding
between images and text. This version uses BLIP for conditional text generation
and compares the generated caption with the input prompt.

Usage:
    python blip_scorer.py <image_path> <text_prompt>

Requirements:
    pip install -r requirements.txt
"""

import sys
import os
import torch
from PIL import Image
import warnings
from typing import Dict, List
import numpy as np
from difflib import SequenceMatcher

# Suppress warnings
warnings.filterwarnings("ignore")



def text_similarity(text1: str, text2: str) -> float:
    """Calculate semantic similarity between two texts."""
    # Normalize texts
    text1 = text1.lower().strip()
    text2 = text2.lower().strip()
    
    # Basic string similarity
    basic_similarity = SequenceMatcher(None, text1, text2).ratio()
    
    # Word overlap similarity
    words1 = set(text1.split())
    words2 = set(text2.split())
    
    if len(words1) == 0 or len(words2) == 0:
        word_similarity = 0.0
    else:
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        word_similarity = intersection / union if union > 0 else 0.0
    
    # Combined similarity (weighted average)
    combined_similarity = 0.4 * basic_similarity + 0.6 * word_similarity
    
    return combined_similarity

def calculate_blip_similarity(image_path: str, text_prompt: str) -> Dict[str, float]:
    """
    Calculate image-text similarity using BLIP model for caption generation.
    
    Args:
        image_path: Path to the image file
        text_prompt: Text prompt to compare against
        
    Returns:
        Dictionary with similarity scores and metrics
    """
    try:
        # Import BLIP (requirements should be installed beforehand)
        from transformers import BlipProcessor, BlipForConditionalGeneration
        
        print("Loading BLIP model for caption generation...", file=sys.stderr)
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # Load BLIP model for conditional generation (caption generation)
        processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
        model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base").to(device)
        model.eval()
        
        print(f"Processing image: {image_path}", file=sys.stderr)
        image = Image.open(image_path).convert('RGB')
        
        # Generate captions with different approaches
        captions = []
        
        with torch.no_grad():
            # 1. Unconditional caption generation
            inputs = processor(image, return_tensors="pt").to(device)
            out = model.generate(**inputs, max_length=50, num_beams=3)
            unconditional_caption = processor.decode(out[0], skip_special_tokens=True)
            captions.append(("Unconditional", unconditional_caption))
            
            # 2. Conditional caption generation with prompt as prefix
            prompt_prefixes = [
                text_prompt,
                f"a {text_prompt.lower()}",
                f"image of {text_prompt.lower()}",
            ]
            
            for prefix in prompt_prefixes:
                try:
                    inputs = processor(image, prefix, return_tensors="pt").to(device)
                    out = model.generate(**inputs, max_length=50, num_beams=3)
                    conditional_caption = processor.decode(out[0], skip_special_tokens=True)
                    captions.append((f"Conditional: '{prefix}'", conditional_caption))
                except Exception as e:
                    print(f"Warning: Failed to generate conditional caption for '{prefix}': {e}", file=sys.stderr)
        
        # Calculate similarities between generated captions and the input prompt
        similarities = []
        best_score = 0.0
        best_caption = ""
        
        for caption_type, caption in captions:
            similarity = text_similarity(caption, text_prompt)
            similarities.append(similarity)
            
            print(f"{caption_type}: '{caption}' -> Similarity: {similarity:.4f}", file=sys.stderr)
            
            if similarity > best_score:
                best_score = similarity
                best_caption = caption
        
        avg_score = np.mean(similarities) if similarities else 0.0
        
        # Apply some adjustment based on caption quality
        # If the best caption contains key words from the prompt, boost the score
        prompt_words = set(text_prompt.lower().split())
        caption_words = set(best_caption.lower().split())
        word_overlap = len(prompt_words.intersection(caption_words)) / len(prompt_words) if prompt_words else 0
        
        # Adjusted score with word overlap bonus
        adjusted_score = min(1.0, best_score + 0.1 * word_overlap)
        
        return {
            'similarity_score': adjusted_score,
            'average_score': avg_score,
            'best_caption': best_caption,
            'word_overlap_bonus': word_overlap,
            'model_used': 'BLIP-Image-Captioning-Base',
            'num_captions': len(captions)
        }
        
    except Exception as e:
        print(f"Error in BLIP similarity calculation: {e}", file=sys.stderr)
        return {
            'similarity_score': 0.0,
            'error': str(e),
            'model_used': 'BLIP-Image-Captioning-Base'
        }

def main():
    if len(sys.argv) != 3:
        print("Usage: python blip_scorer.py <image_path> <text_prompt>", file=sys.stderr)
        sys.exit(1)
    
    image_path = sys.argv[1]
    text_prompt = sys.argv[2]
    
    # Validate inputs
    if not os.path.exists(image_path):
        print(f"Error: Image file does not exist: {image_path}", file=sys.stderr)
        sys.exit(1)
        
    if not text_prompt.strip():
        print("Error: Text prompt cannot be empty", file=sys.stderr)
        sys.exit(1)
    
    print(f"BLIP Image-Text Similarity Analysis", file=sys.stderr)
    print(f"Image: {image_path}", file=sys.stderr)
    print(f"Prompt: '{text_prompt}'", file=sys.stderr)
    print("-" * 50, file=sys.stderr)
    
    try:
        # Calculate similarity
        results = calculate_blip_similarity(image_path, text_prompt)
        
        similarity_score = results.get('similarity_score', 0.0)
        print(f"BLIP Similarity Score: {similarity_score:.6f}", file=sys.stderr)
        print(f"Average Score: {results.get('average_score', 0.0):.6f}", file=sys.stderr)
        
        # Output the score for parsing by the API
        print(f"{similarity_score:.6f}")
        
    except Exception as e:
        print(f"Fatal error: {e}", file=sys.stderr)
        print("0.0")
        sys.exit(1)

if __name__ == "__main__":
    main()