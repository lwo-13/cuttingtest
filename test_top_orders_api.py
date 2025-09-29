#!/usr/bin/env python3
"""
Test script for the top orders API endpoint
"""
import requests
import json

def test_debug_endpoint():
    """Test the debug endpoint to see what data is available"""
    try:
        url = "http://localhost:5000/dashboard/top-orders-debug"
        response = requests.get(url, params={'period': 'today'})
        
        print("=== DEBUG ENDPOINT TEST ===")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Flask server. Make sure it's running on localhost:5000")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_top_orders_endpoint():
    """Test the main top orders endpoint"""
    try:
        url = "http://localhost:5000/dashboard/top-orders"
        response = requests.get(url, params={'period': 'today', 'limit': 5})
        
        print("\n=== TOP ORDERS ENDPOINT TEST ===")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Flask server. Make sure it's running on localhost:5000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_debug_endpoint()
    test_top_orders_endpoint()
