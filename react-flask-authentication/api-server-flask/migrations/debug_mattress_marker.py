#!/usr/bin/env python3
"""
Debug script to check mattress_markers data for a specific mattress
"""

import sys
import os

# Add the parent directory to the path to import the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import Flask app and models
from api import create_app
from api.models import db, MattressMarker, MarkerHeader, Mattresses

def debug_mattress_marker():
    """Debug mattress_markers data"""
    
    app = create_app()
    
    with app.app_context():
        try:
            print("🔍 Debugging mattress_markers data...")
            
            # Get a few sample mattresses with markers
            mattresses_with_markers = db.session.query(
                Mattresses.id,
                Mattresses.mattress,
                MattressMarker.marker_name,
                MattressMarker.marker_width,
                MattressMarker.marker_length,
                MattressMarker.efficiency,
                MattressMarker.marker_id
            ).outerjoin(
                MattressMarker, Mattresses.id == MattressMarker.mattress_id
            ).limit(10).all()
            
            print(f"📊 Found {len(mattresses_with_markers)} mattresses to check:")
            
            for mattress in mattresses_with_markers:
                print(f"\n📋 Mattress: {mattress.mattress} (ID: {mattress.id})")
                print(f"   marker_name: '{mattress.marker_name}'")
                print(f"   marker_width: {mattress.marker_width}")
                print(f"   marker_length: {mattress.marker_length}")
                print(f"   efficiency: {mattress.efficiency}")
                print(f"   marker_id: {mattress.marker_id}")
                
                if mattress.marker_id:
                    # Check the corresponding marker_header
                    marker_header = MarkerHeader.query.filter_by(id=mattress.marker_id).first()
                    if marker_header:
                        print(f"   📌 MarkerHeader found:")
                        print(f"      header.marker_name: '{marker_header.marker_name}'")
                        print(f"      header.status: {marker_header.status}")
                        print(f"      header.efficiency: {marker_header.efficiency}")
                    else:
                        print(f"   ❌ No MarkerHeader found for marker_id {mattress.marker_id}")
            
            # Check for mattresses with NOT ACTIVE markers
            print(f"\n🔍 Looking for mattresses with NOT ACTIVE markers...")
            
            not_active_markers = db.session.query(
                Mattresses.mattress,
                MattressMarker.marker_name,
                MattressMarker.efficiency,
                MarkerHeader.status
            ).join(
                MattressMarker, Mattresses.id == MattressMarker.mattress_id
            ).join(
                MarkerHeader, MattressMarker.marker_id == MarkerHeader.id
            ).filter(
                MarkerHeader.status == 'NOT ACTIVE'
            ).limit(5).all()
            
            print(f"📊 Found {len(not_active_markers)} mattresses with NOT ACTIVE markers:")
            
            for record in not_active_markers:
                print(f"   📋 Mattress: {record.mattress}")
                print(f"      marker_name: '{record.marker_name}'")
                print(f"      efficiency: {record.efficiency}")
                print(f"      status: {record.status}")
            
        except Exception as e:
            print(f"❌ Debug failed: {str(e)}")
            raise e

if __name__ == "__main__":
    debug_mattress_marker()
