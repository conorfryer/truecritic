import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const location = searchParams.get('location');
  const radius = searchParams.get('radius') || '1500'; // Default radius if not specified
  const type = searchParams.get('type') || 'restaurant'; // Default to 'restaurant' if type not provided
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  try {
    let coordinates = location;

    // Check if the location is already in lat/lng format (simple regex)
    const latLngRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
    if (!latLngRegex.test(location as string)) {
      // Fetch coordinates from Google Geocoding API
      const geocodeResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: location,
          key: apiKey,
        },
      });

      const geocodeData = geocodeResponse.data;
      if (geocodeData.results.length === 0) {
        return NextResponse.json({ error: "Location not found." }, { status: 400 });
      }

      const { lat, lng } = geocodeData.results[0].geometry.location;
      coordinates = `${lat},${lng}`;
    }

    // Use reduced radius for neighborhood-level searches on specific place types
    const adjustedRadius = type === 'hotel' ? '1000' : radius;

    // Fetch data from Google Places API with specific type and optional keyword filter
    const placesResponse = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location: coordinates,
        radius: adjustedRadius,
        type,
        keyword: type === 'hotel' ? 'accommodation' : '',
        key: apiKey,
      },
    });

    return NextResponse.json(placesResponse.data.results);

  } catch (error) {
    console.error("Error in fetchRestaurants:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
