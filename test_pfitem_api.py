#!/usr/bin/env python3
"""
Test script for the new Item Descriptions API endpoint
"""

import requests
import json

def test_item_descriptions_endpoint():
    """Test the new Item Descriptions endpoint"""

    # Test URL - adjust based on your environment
    base_url = "http://localhost:5000"  # Change this to your actual server URL
    endpoint = f"{base_url}/api/zalli/item-descriptions"
    
    try:
        print(f"Testing endpoint: {endpoint}")
        response = requests.get(endpoint)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Success!")
            print(f"Response: {json.dumps(data, indent=2)}")
            
            if data.get('success') and data.get('data'):
                print(f"Found {len(data['data'])} Item Descriptions")

                # Show first few items as example
                for i, item in enumerate(data['data'][:5]):
                    print(f"  {i+1}. Code: {item.get('Code')}, Description: {item.get('Description')}")

                if len(data['data']) > 5:
                    print(f"  ... and {len(data['data']) - 5} more items")
            else:
                print("⚠️ No data returned or success=False")
                
        else:
            print(f"❌ Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Error text: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Could not connect to the server")
        print("Make sure the Flask server is running")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")

if __name__ == "__main__":
    test_item_descriptions_endpoint()
