"""
Simple sanity check script for geocoding endpoint.
Run from backend directory: python test_geocode.py
"""
import asyncio
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.geocoding_service import geocode_location

async def test_fairfax():
    """Test that Fairfax, Virginia, US returns results"""
    print("Testing geocoding for: Fairfax, Virginia, US")
    print("-" * 50)
    
    results = await geocode_location(
        city="Fairfax",
        state="Virginia",
        country="US",
        count=5
    )
    
    print(f"Found {len(results)} results:")
    print()
    
    for i, result in enumerate(results, 1):
        print(f"{i}. {result['name']}, {result['admin1']}, {result['country']} ({result['country_code']})")
        print(f"   Coordinates: {result['latitude']}, {result['longitude']}")
        print(f"   Timezone: {result['timezone']}")
        print()
    
    if len(results) == 0:
        print("ERROR: No results returned!")
        return False
    
    # Check if Fairfax, Virginia is in results
    fairfax_found = any(
        "fairfax" in result['name'].lower() and 
        ("virginia" in result['admin1'].lower() or "va" in result['admin1'].upper())
        for result in results
    )
    
    if fairfax_found:
        print("✓ SUCCESS: Fairfax, Virginia found in results")
    else:
        print("⚠ WARNING: Fairfax, Virginia not found in top results")
    
    return len(results) > 0

if __name__ == "__main__":
    success = asyncio.run(test_fairfax())
    sys.exit(0 if success else 1)


