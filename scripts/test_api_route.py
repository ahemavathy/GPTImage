#!/usr/bin/env python3
"""
Test script for the updated Node.js 3D generation API using frogleo
"""

import requests
import json
import base64
import time

def test_api_endpoint():
    """Test the updated API endpoint"""
    
    # API endpoint
    url = "http://localhost:3000/api/generate-3d"
    
    print("🧪 Testing updated 3D generation API...")
    
    # Test GET request first
    try:
        print("📡 Testing GET endpoint...")
        response = requests.get(url, timeout=10)
        print(f"✅ GET response: {response.status_code}")
        print(f"📦 Response: {response.json()}")
    except Exception as e:
        print(f"❌ GET test failed: {e}")
        return
    
    # Create a simple test image (small red square)
    print("🎨 Creating test image...")
    
    # Create a small 64x64 red image in base64
    from PIL import Image
    import io
    
    # Create red square
    img = Image.new('RGB', (64, 64), color='red')
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    img_data_url = f"data:image/jpeg;base64,{img_base64}"
    
    # Test POST request
    print("📡 Testing POST endpoint with image...")
    
    payload = {
        "image": img_data_url,
        "prompt": "Generate a 3D model from this red square"
    }
    
    try:
        response = requests.post(
            url, 
            json=payload, 
            timeout=120  # 2 minutes timeout for 3D generation
        )
        
        print(f"✅ POST response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("🎉 3D Generation Success!")
            print(f"📁 Model URL: {result.get('modelUrl')}")
            print(f"📝 Filename: {result.get('filename')}")
            print(f"🏭 Provider: {result.get('provider')}")
            print(f"📊 Steps: {result.get('steps')}")
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"📦 Response: {response.text}")
    
    except requests.exceptions.Timeout:
        print("⏰ Request timed out (this might be normal for 3D generation)")
    except Exception as e:
        print(f"❌ POST test failed: {e}")

if __name__ == "__main__":
    # Install required packages
    try:
        import requests
        from PIL import Image
    except ImportError:
        print("📦 Installing required packages...")
        import subprocess
        import sys
        subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "pillow"])
        import requests
        from PIL import Image
    
    test_api_endpoint()