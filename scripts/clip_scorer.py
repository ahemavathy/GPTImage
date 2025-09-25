#!/usr/bin/env python3
"""
CLIP-based Image Scoring Script

This script calculates the cosine similarity between an image and text prompt
using OpenAI's CLIP model. It's designed to be called from the Node.js API
to provide semantic alignment scoring for generated images.

Usage:
    python clip_scorer.py <image_path> <text_prompt>

Requirements:
    pip install torch torchvision pillow numpy
    pip install git+https://github.com/openai/CLIP.git

Output:
    Prints similarity score (0-1) to stdout
"""

import sys
import os
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore")

def install_requirements():
    """Install CLIP and required packages if not available."""
    try:
        import torch
        import clip
        from PIL import Image
        import numpy as np
        return True
    except ImportError:
        print("Installing CLIP requirements...", file=sys.stderr)
        import subprocess
        
        # Install essential packages
        packages = [
            'torch',
            'torchvision', 
            'pillow',
            'numpy',
            'git+https://github.com/openai/CLIP.git'
        ]
        
        for package in packages:
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", package])
                print(f"✅ Installed {package}", file=sys.stderr)
            except subprocess.CalledProcessError as e:
                print(f"❌ Failed to install {package}: {e}", file=sys.stderr)
        
        return True

def load_clip_model():
    """
    Load the CLIP model and preprocessing function.
    
    Returns:
        Tuple of (model, preprocess_function, device)
    """
    try:
        # Import after ensuring packages are installed
        import torch
        import clip
        
        # Use CUDA if available, otherwise CPU
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Loading CLIP model on device: {device}", file=sys.stderr)
        
        # Load the CLIP model (ViT-B/32 is a good balance of speed and accuracy)
        model, preprocess = clip.load("ViT-B/32", device=device)
        model.eval()  # Set to evaluation mode
        
        return model, preprocess, device
        
    except Exception as e:
        print(f"Error loading CLIP model: {e}", file=sys.stderr)
        raise

def calculate_clip_similarity(image_path: str, text_prompt: str) -> float:
    """
    Calculate cosine similarity between image and text using CLIP.
    
    Args:
        image_path: Path to the image file
        text_prompt: Text prompt to compare against
        
    Returns:
        Similarity score between 0 and 1 (higher = more similar)
    """
    try:
        # Install requirements if needed
        install_requirements()
        
        # Import after ensuring packages are installed
        import torch
        import clip
        from PIL import Image
        import numpy as np
        
        # Load CLIP model
        model, preprocess, device = load_clip_model()
        
        # Load and preprocess image
        print(f"Processing image: {image_path}", file=sys.stderr)
        image = Image.open(image_path).convert('RGB')
        image_input = preprocess(image).unsqueeze(0).to(device)
        
        # Tokenize text
        print(f"Processing text: '{text_prompt}'", file=sys.stderr)
        text_input = clip.tokenize([text_prompt]).to(device)
        
        # Generate embeddings
        with torch.no_grad():
            # Get image and text features
            image_features = model.encode_image(image_input)
            text_features = model.encode_text(text_input)
            
            # Normalize features (CLIP already does this, but being explicit)
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)
            
            # Calculate cosine similarity
            similarity = torch.cosine_similarity(image_features, text_features, dim=-1)
            similarity_score = similarity.item()
            
        print(f"CLIP similarity calculated: {similarity_score:.4f}", file=sys.stderr)
        return similarity_score
        
    except FileNotFoundError:
        print(f"Error: Image file not found: {image_path}", file=sys.stderr)
        return 0.0
    except Exception as e:
        print(f"Error calculating CLIP similarity: {e}", file=sys.stderr)
        return 0.0

def main():
    """Main function to handle command line arguments and output results."""
    if len(sys.argv) != 3:
        print("Usage: python clip_scorer.py <image_path> <text_prompt>", file=sys.stderr)
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
    
    try:
        # Calculate similarity
        similarity_score = calculate_clip_similarity(image_path, text_prompt)
        
        # Output the score (this will be parsed by the Node.js API)
        print(f"CLIP Similarity Score: {similarity_score:.6f}")
        
        # Also output in a format that's easy to parse
        print(f"{similarity_score:.6f}")
        
    except Exception as e:
        print(f"Fatal error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()