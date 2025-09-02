#!/usr/bin/env python3
"""
Diagnostic script to check why some mattress_markers records weren't updated with efficiency
"""

import sys
import os

# Add the parent directory to the path to import the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import Flask app and models
from api import create_app
from api.models import db, MattressMarker, MarkerHeader

def check_missing_efficiency():
    """Check why some mattress_markers records weren't updated"""
    
    app = create_app()
    
    with app.app_context():
        try:
            print("🔍 Analyzing mattress_markers records without efficiency...")
            
            # Get all mattress_markers that still don't have efficiency set
            missing_efficiency = MattressMarker.query.filter(
                MattressMarker.efficiency.is_(None)
            ).all()
            
            print(f"📊 Found {len(missing_efficiency)} records still missing efficiency")
            
            if len(missing_efficiency) == 0:
                print("✅ All records have efficiency values!")
                return
            
            # Analyze the reasons
            null_marker_id = 0
            missing_marker_header = 0
            null_efficiency_in_header = 0
            other_issues = 0
            
            print("\n🔍 Analyzing first 10 records...")
            
            for i, mattress_marker in enumerate(missing_efficiency[:10]):
                print(f"\n📋 Record {i+1}: mattress_marker.id = {mattress_marker.id}")
                print(f"   marker_id: {mattress_marker.marker_id}")
                print(f"   marker_name: {mattress_marker.marker_name}")
                
                if mattress_marker.marker_id is None:
                    print("   ❌ Issue: marker_id is NULL")
                    null_marker_id += 1
                    continue
                
                # Check if marker_header exists
                marker_header = MarkerHeader.query.filter_by(id=mattress_marker.marker_id).first()
                
                if marker_header is None:
                    print(f"   ❌ Issue: No marker_header found with id {mattress_marker.marker_id}")
                    missing_marker_header += 1
                    continue
                
                if marker_header.efficiency is None:
                    print(f"   ❌ Issue: marker_header.efficiency is NULL")
                    print(f"   marker_header.marker_name: {marker_header.marker_name}")
                    print(f"   marker_header.status: {marker_header.status}")
                    null_efficiency_in_header += 1
                    continue
                
                print(f"   ✅ marker_header found with efficiency: {marker_header.efficiency}")
                print("   ❓ Unknown issue - should have been updated")
                other_issues += 1
            
            # Count all issues
            print(f"\n📊 Analyzing all {len(missing_efficiency)} records...")
            
            for mattress_marker in missing_efficiency:
                if mattress_marker.marker_id is None:
                    null_marker_id += 1
                    continue
                
                marker_header = MarkerHeader.query.filter_by(id=mattress_marker.marker_id).first()
                
                if marker_header is None:
                    missing_marker_header += 1
                    continue
                
                if marker_header.efficiency is None:
                    null_efficiency_in_header += 1
                    continue
                
                other_issues += 1
            
            print(f"\n📈 Summary of issues:")
            print(f"   🔴 NULL marker_id: {null_marker_id}")
            print(f"   🔴 Missing marker_header: {missing_marker_header}")
            print(f"   🔴 NULL efficiency in marker_header: {null_efficiency_in_header}")
            print(f"   🔴 Other issues: {other_issues}")
            print(f"   📊 Total: {null_marker_id + missing_marker_header + null_efficiency_in_header + other_issues}")
            
            # Check some statistics about marker_headers with NULL efficiency
            if null_efficiency_in_header > 0:
                print(f"\n🔍 Checking marker_headers with NULL efficiency...")
                null_efficiency_headers = MarkerHeader.query.filter(
                    MarkerHeader.efficiency.is_(None)
                ).limit(5).all()
                
                print(f"📊 Found {MarkerHeader.query.filter(MarkerHeader.efficiency.is_(None)).count()} marker_headers with NULL efficiency")
                print("📋 Sample records:")
                for header in null_efficiency_headers:
                    print(f"   - ID: {header.id}, Name: {header.marker_name}, Status: {header.status}")
            
        except Exception as e:
            print(f"❌ Analysis failed: {str(e)}")
            raise e

if __name__ == "__main__":
    check_missing_efficiency()
