#!/usr/bin/env python3
"""
Check what date range is being used for 'today'
"""
from datetime import datetime, timedelta

def get_date_range(period):
    """Get start and end dates for the specified period"""
    now = datetime.now()
    
    if period == 'today':
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif period == 'week':
        # Start of current week (Monday)
        start_date = now - timedelta(days=now.weekday())
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=6, hours=23, minutes=59, seconds=59, microseconds=999999)
    elif period == 'month':
        # Start of current month
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # End of current month
        if now.month == 12:
            end_date = now.replace(year=now.year + 1, month=1, day=1) - timedelta(microseconds=1)
        else:
            end_date = now.replace(month=now.month + 1, day=1) - timedelta(microseconds=1)
    elif period == 'year':
        # Start of current year
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        # End of current year
        end_date = now.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
    else:
        # Default to today
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    return start_date, end_date

if __name__ == "__main__":
    periods = ['today', 'week', 'month', 'year']
    
    print("=== DATE RANGE CHECK ===")
    print(f"Current time: {datetime.now()}")
    print()
    
    for period in periods:
        start, end = get_date_range(period)
        print(f"{period.upper()}:")
        print(f"  Start: {start}")
        print(f"  End: {end}")
        print()
    
    # Check against your data dates
    print("=== YOUR DATA DATES ===")
    your_dates = [
        "9/16/2025 14:50",
        "9/26/2025 20:22", 
        "9/18/2025 11:00",
        "9/26/2025 15:50"
    ]
    
    for date_str in your_dates:
        try:
            # Parse the date (assuming it's in MM/DD/YYYY HH:MM format)
            date_obj = datetime.strptime(date_str, "%m/%d/%Y %H:%M")
            print(f"  {date_str} -> {date_obj}")
        except:
            print(f"  Could not parse: {date_str}")
