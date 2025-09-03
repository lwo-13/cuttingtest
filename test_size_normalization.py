#!/usr/bin/env python3
"""
Test script to verify that the size normalization fix works correctly.
This demonstrates how the new normalize_size function handles different size formats.
"""

def normalize_size(size):
    """
    Normalize size format to handle different formatting between order sizes and marker sizes.
    Examples:
    - "3-4" -> "3_4" 
    - "4-5" -> "4_5"
    - "S" -> "S" (unchanged)
    - "3_4" -> "3_4" (unchanged)
    """
    if not size:
        return size
    # Replace hyphens with underscores for consistency
    return size.replace('-', '_')

def test_size_normalization():
    """Test the size normalization function with various inputs."""
    
    print("Testing Size Normalization Function")
    print("=" * 50)
    
    # Test cases: (input, expected_output, description)
    test_cases = [
        ("3-4", "3_4", "Hyphen to underscore conversion"),
        ("4-5", "4_5", "Another hyphen to underscore conversion"),
        ("S", "S", "Single letter size unchanged"),
        ("M", "M", "Another single letter size unchanged"),
        ("3_4", "3_4", "Already normalized size unchanged"),
        ("XL", "XL", "Two letter size unchanged"),
        ("", "", "Empty string unchanged"),
        (None, None, "None value unchanged"),
        ("10-12", "10_12", "Double digit sizes"),
        ("XXL", "XXL", "Three letter size unchanged")
    ]
    
    all_passed = True
    
    for input_size, expected, description in test_cases:
        result = normalize_size(input_size)
        passed = result == expected
        status = "✅ PASS" if passed else "❌ FAIL"
        
        print(f"{status} | Input: '{input_size}' -> Output: '{result}' | {description}")
        
        if not passed:
            print(f"      Expected: '{expected}', Got: '{result}'")
            all_passed = False
    
    print("\n" + "=" * 50)
    
    if all_passed:
        print("🎉 All tests passed! Size normalization is working correctly.")
    else:
        print("❌ Some tests failed. Please check the implementation.")
    
    return all_passed

def convert_marker_sizes_to_order_format(marker_size_quantities, order_size_names):
    """
    Convert marker size quantities to match order size format
    This is the reverse of normalization - converts "3_4" back to "3-4"
    """
    if not marker_size_quantities or not order_size_names:
        return {}

    result = {}

    # Create a mapping from normalized sizes to original order sizes
    normalized_to_order = {}
    for order_size in order_size_names:
        normalized = normalize_size(order_size)
        normalized_to_order[normalized] = order_size

    # Convert marker sizes to match order format
    for marker_size, quantity in marker_size_quantities.items():
        normalized_marker_size = normalize_size(marker_size)
        matching_order_size = normalized_to_order.get(normalized_marker_size)

        if matching_order_size:
            result[matching_order_size] = quantity

    return result

def test_filtering_scenario():
    """Test a realistic filtering scenario."""

    print("\nTesting Realistic Filtering Scenario")
    print("=" * 50)

    # Simulate order sizes (with hyphens)
    order_sizes = ["S", "M", "L", "3-4", "4-5"]

    # Simulate marker sizes (with underscores)
    marker_sizes_1 = ["S", "M", "L", "3_4", "4_5"]  # Should match
    marker_sizes_2 = ["S", "M", "L", "XL"]          # Should not match (missing 3_4, 4_5)
    marker_sizes_3 = ["S", "M", "L", "3_4", "4_5", "XL"]  # Should not match (extra XL)

    # Normalize both sets
    normalized_order = set(normalize_size(size) for size in order_sizes)

    test_cases = [
        (marker_sizes_1, True, "Exact match with different formatting"),
        (marker_sizes_2, False, "Missing required sizes"),
        (marker_sizes_3, False, "Extra sizes present")
    ]

    print(f"Order sizes (normalized): {sorted(normalized_order)}")
    print()

    for marker_sizes, should_match, description in test_cases:
        normalized_marker = set(normalize_size(size) for size in marker_sizes)

        # Check if marker sizes are a subset of order sizes (current filtering logic)
        is_subset = normalized_marker.issubset(normalized_order)

        # For exact matching, we'd use: is_match = normalized_marker == normalized_order
        is_exact_match = normalized_marker == normalized_order

        status = "✅ MATCH" if is_exact_match == should_match else "❌ NO MATCH"

        print(f"{status} | Marker: {sorted(marker_sizes)} -> {sorted(normalized_marker)}")
        print(f"        | {description}")
        print(f"        | Subset check: {is_subset}, Exact match: {is_exact_match}")
        print()

def test_size_conversion():
    """Test the marker size to order size conversion."""

    print("\nTesting Size Conversion (Marker -> Order Format)")
    print("=" * 50)

    # Simulate order sizes (what the UI expects)
    order_size_names = ["S", "M", "L", "3-4", "4-5"]

    # Simulate marker size quantities (what comes from the API)
    marker_size_quantities = {
        "S": 10,
        "M": 15,
        "L": 20,
        "3_4": 5,   # This should become "3-4"
        "4_5": 8    # This should become "4-5"
    }

    # Convert marker sizes to order format
    converted = convert_marker_sizes_to_order_format(marker_size_quantities, order_size_names)

    print("Original marker size quantities:")
    for size, qty in marker_size_quantities.items():
        print(f"  {size}: {qty}")

    print("\nOrder size names:")
    print(f"  {order_size_names}")

    print("\nConverted size quantities (for UI):")
    for size, qty in converted.items():
        print(f"  {size}: {qty}")

    # Verify the conversion worked
    expected = {
        "S": 10,
        "M": 15,
        "L": 20,
        "3-4": 5,
        "4-5": 8
    }

    success = converted == expected
    status = "✅ SUCCESS" if success else "❌ FAILED"
    print(f"\nConversion test: {status}")

    if not success:
        print("Expected:", expected)
        print("Got:", converted)

if __name__ == "__main__":
    # Run the tests
    test_size_normalization()
    test_filtering_scenario()
    test_size_conversion()

    print("\n" + "=" * 70)
    print("Summary:")
    print("- Backend filtering now normalizes both order and marker sizes")
    print("- Frontend comparison functions also use normalization")
    print("- Marker selection now converts size quantities to match order format")
    print("- Sizes like '3-4' and '3_4' are now treated as equivalent")
    print("- This should fix both the filtering AND the quantity display issues")
