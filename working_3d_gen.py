#!/usr/bin/env python3

import sys
import time
import os
from gradio_client import Client, handle_file

def generate_3d_with_frogleo(image_url="https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png"):
    """Generate 3D model using frogleo/Image-to-3D space"""
    
    print(f"Using frogleo/Image-to-3D space...")
    
    try:
        # Set up HF token if available
        hf_token = os.getenv('HF_TOKEN') or os.getenv('HUGGINGFACE_HUB_TOKEN')
        print(f"Debug: HF_TOKEN exists: {bool(os.getenv('HF_TOKEN'))}")
        print(f"Debug: HUGGINGFACE_HUB_TOKEN exists: {bool(os.getenv('HUGGINGFACE_HUB_TOKEN'))}")
        print(f"Debug: Using token: {bool(hf_token)}")
        
        if hf_token:
            print("Using HF token for authenticated access")
            # Connect to the space with authentication
            client = Client("frogleo/Image-to-3D", hf_token=hf_token)
        else:
            print("No HF token found, using anonymous access")
            # Connect to the space without authentication
            client = Client("frogleo/Image-to-3D")
            
        print("Connected to frogleo/Image-to-3D")
        
        print(f"Generating 3D model from: {image_url}")
        print("This may take 1-3 minutes...")
        
        # Call the correct API endpoint with proper parameters
        result = client.predict(
            image=handle_file(image_url),     # Image input
            steps=5,                         # Generation steps (1-100)
            guidance_scale=5.5,              # Guidance scale (1.0-20.0) 
            seed=1234,                       # Random seed (0-10000000)
            octree_resolution=256,           # Octree resolution (16-512)
            num_chunks=8000,                 # Number of chunks (1000-5000000)
            target_face_num=10000,           # Target face count (100-1000000)
            randomize_seed=True,             # Randomize seed
            api_name="/gen_shape"            # Correct API endpoint
        )
        
        print("3D model generated successfully!")
        print(f"Result structure: {type(result)} with {len(result) if hasattr(result, '__len__') else 'unknown'} elements")
        
        # Result format: (output, download, glb_path, obj_path)
        if result and len(result) >= 4:
            output_html = result[0]      # HTML output
            download_file = result[1]    # Download file
            glb_path = result[2]         # GLB file path
            obj_path = result[3]         # OBJ file path
            
            print(f"HTML output: {str(output_html)[:100]}...")
            print(f"Download file: {download_file}")
            print(f"GLB path: {glb_path}")
            print(f"OBJ path: {obj_path}")
            
            # Return the GLB path as primary result
            return glb_path if glb_path else download_file
        else:
            print("Unexpected result format")
            print(f"Full result: {result}")
            return None
            
    except Exception as e:
        print(f"Error: {e}")
        return None

def generate_pixel_3d(image_url="https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png"):
    """Generate pixel-style 3D model using asaasaasaa/image-to-3d-pixel"""
    
    print(f"🚀 Using asaasaasaa/image-to-3d-pixel space...")
    
    try:
        # Connect to the pixel art space
        client = Client("asaasaasaa/image-to-3d-pixel")
        print("✅ Connected to image-to-3d-pixel")
        
        print(f"📡 Generating pixel 3D model from: {image_url}")
        print("⏳ This may take 1-2 minutes...")
        
        # Call the pixel STL generation endpoint
        result = client.predict(
            upload_image=handle_file(image_url),  # Image input
            url_input="",                         # URL input (empty since we use upload)
            n_colors=4,                           # Number of colors (creates separate STL files)
            api_name="/generate_pixel_stl"        # Correct API endpoint
        )
        
        print("✅ Pixel 3D model generated successfully!")
        print(f"📝 Result structure: {type(result)} with {len(result) if hasattr(result, '__len__') else 'unknown'} elements")
        
        # Result format: (color1_stl, color2_stl, ..., color8_stl, status)
        if result and len(result) >= 9:
            stl_files = result[:8]     # First 8 are STL files for different colors
            status = result[8]         # Processing status
            
            print(f"📄 Processing status: {status}")
            
            # Find the first non-empty STL file
            for i, stl_file in enumerate(stl_files):
                if stl_file:
                    print(f"🎯 Color {i+1} STL file: {stl_file}")
                    return stl_file
            
            print("❌ No STL files generated")
            return None
        else:
            print("❌ Unexpected result format")
            print(f"📦 Full result: {result}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    # Get image URL from command line argument or use default
    image_url = sys.argv[1] if len(sys.argv) > 1 else "https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png"
    
    # Check for method preference
    use_pixel = "--pixel" in sys.argv
    
    print(f"Generating 3D model from: {image_url}")
    
    if use_pixel:
        print("Using pixel art style generation...")
        result = generate_pixel_3d(image_url)
        file_ext = "stl"
    else:
        print("Using standard 3D generation...")
        result = generate_3d_with_frogleo(image_url)
        file_ext = "glb"
    
    if result:
        print(f"\nSuccess! 3D model available at: {result}")
        
        # Optionally download the file locally
        if result and result.startswith('http'):
            import urllib.request
            
            output_filename = f"output.{file_ext}"
            print(f"Downloading {file_ext.upper()} file to {output_filename}...")
            
            try:
                urllib.request.urlretrieve(result, output_filename)
                print(f"{file_ext.upper()} file downloaded as {output_filename}")
                print(f"File size: {os.path.getsize(output_filename)} bytes")
            except Exception as e:
                print(f"Failed to download file: {e}")
        
    else:
        print("\nFailed to generate 3D model.")
        print("Try with --pixel flag for pixel art style:")
        print(f"   python working_3d_gen.py {image_url} --pixel")
        sys.exit(1)