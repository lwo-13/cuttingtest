#!/usr/bin/env python3
"""
Test script to check if the operators API endpoint is working correctly.
"""

import requests
import json

def test_operators_api():
    """Test the operators API endpoint."""
    base_url = "http://localhost:5000"  # Adjust if your Flask app runs on a different port
    
    # Test endpoints
    endpoints = [
        "/api/operators/active?type=spreader",
        "/api/operators/active",
        "/api/operators/",
        "/api/operators/types"
    ]
    
    print("🔍 Testing operators API endpoints...")
    print("=" * 50)
    
    for endpoint in endpoints:
        url = base_url + endpoint
        print(f"\n📡 Testing: {url}")
        
        try:
            response = requests.get(url, timeout=10)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Success: {json.dumps(data, indent=2)}")
            else:
                print(f"   ❌ Error: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print(f"   ❌ Connection Error: Flask server not running on {base_url}")
        except requests.exceptions.Timeout:
            print(f"   ❌ Timeout: Request took too long")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")

if __name__ == "__main__":
    test_operators_api()
