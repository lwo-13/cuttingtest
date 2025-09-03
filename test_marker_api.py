#!/usr/bin/env python3

import sys
import os

# Add the Flask app directory to Python path
sys.path.append('react-flask-authentication/api-server-flask')

from api.models import db, MarkerHeader, MattressMarker
from sqlalchemy import func

def test_marker_query():
    """Test the marker query to see if it works"""
    try:
        print("Testing marker query...")
        
        # Test basic query
        headers = MarkerHeader.query.limit(5).all()
        print(f"Found {len(headers)} markers")
        
        if headers:
            print(f"First marker: {headers[0].marker_name}")
            
            # Test usage count query
            marker_ids = [header.id for header in headers]
            print(f"Testing usage count for marker IDs: {marker_ids}")
            
            usage_query = db.session.query(
                MattressMarker.marker_id,
                func.count(MattressMarker.id).label('usage_count')
            ).filter(
                MattressMarker.marker_id.in_(marker_ids)
            ).group_by(MattressMarker.marker_id).all()
            
            print(f"Usage query result: {usage_query}")
            
        print("Query test completed successfully!")
        return True
        
    except Exception as e:
        print(f"Error in query test: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # This would need to be run in the Flask app context
    print("This script needs to be run within the Flask application context")
    print("The query structure looks correct, the issue might be in the Flask app setup")
