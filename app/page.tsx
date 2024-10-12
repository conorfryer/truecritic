'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import michelinData from "C:/Users/cfrye/truecritic/data/michelinData.json"; // Adjust this path as needed for ES module import
import MichelinStar from "C:/Users/cfrye/truecritic/assets/MichelinStar.png";

// Interface for Google Places API restaurant data
interface GoogleRestaurant {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  place_id: string;
  name: string;
  rating: number;
  user_ratings_total: number;
  price_level?: number;
  photos?: { 
    photo_reference: string; 
  }[]; // Array of photos, optional because some places may not have photos
}

// Interface for Michelin restaurant data
interface MichelinRestaurant {
  Name: string;
  Latitude: number;
  Longitude: number;
  Award: string;
  // Add other relevant fields as needed
}

// Type for combining Google and Michelin restaurant properties
type CombinedRestaurant = GoogleRestaurant & Partial<MichelinRestaurant> & {
  isMichelin?: boolean;
  michelinAward?: string | null;
};

// Haversine formula to calculate distance between two latitude/longitude points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Match Google restaurant with Michelin restaurant by coordinates
const matchWithMichelin = (googleRestaurant: GoogleRestaurant): MichelinRestaurant | undefined => {
  const { lat, lng } = googleRestaurant.geometry.location;
  const match = (michelinData as MichelinRestaurant[]).find((michelinRestaurant) => {
    const latMatch = Math.abs(michelinRestaurant.Latitude - lat) < 0.0005;
    const lngMatch = Math.abs(michelinRestaurant.Longitude - lng) < 0.0005;
    return latMatch && lngMatch;
  });

  // Debugging log to check match results
  if (match) {
    console.log(`Match found for ${googleRestaurant.name}: ${match.Name} with Award: ${match.Award}`);
  } else {
    console.log(`No Michelin match found for ${googleRestaurant.name}`);
  }

  return match;
};

const Home = () => {
  const [placeType, setPlaceType] = useState('restaurant');
  const [location, setLocation] = useState<string>('');
  const [restaurants, setRestaurants] = useState<CombinedRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState<number>(2); // Default radius in km
  const [minRating, setMinRating] = useState<number>(4.5);
  const [price, setPrice] = useState<string>('');

  const handleSearch = async () => {
    setIsLoading(true);
    try {
        setError(null);

        const response = await axios.get('/api/fetchRestaurants', {
            params: { 
                location: location.trim(),
                radius: radius * 1000,
                type: placeType // Make sure this is included
            }
        });

        console.log('Place Type:', placeType); // Debugging console log in page.tsx

        let googleResults: CombinedRestaurant[] = response.data;

        // Process and filter results as needed
        googleResults = googleResults
            .filter((restaurant) => 
                restaurant.rating >= minRating &&
                (price === '' || restaurant.price_level === price.length)
            )
            .map((restaurant) => {
                const michelinRestaurant = matchWithMichelin(restaurant);
                return {
                    ...restaurant,
                    isMichelin: Boolean(michelinRestaurant),
                    michelinAward: michelinRestaurant ? michelinRestaurant.Award : null,
                };
            })
            .sort((a, b) => b.user_ratings_total - a.user_ratings_total);

        setRestaurants(googleResults);
    } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data. Please try again.");
    } finally {
        setIsLoading(false);
    }

    console.log('Place Type:', placeType); // In handleSearch
};

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">TrueCritic</h1>
      <label htmlFor="placeType">Choose Place Type:</label>
      <select id="placeType" value={placeType} onChange={(e) => setPlaceType(e.target.value)}>
        <option value="restaurant">Restaurants</option>
        <option value="hotel">Hotels</option>
      </select>
      <label className="block text-gray-700">Location:</label>
      <input
        type="text"
        placeholder="Enter coordinates (e.g., 40.748817,-73.985428)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="border border-gray-300 rounded p-2 mb-2 w-full text-black bg-white"
      />
      <div className="mb-4">
        <label className="block text-gray-700">Search Radius (km):</label>
        <input
          type="number"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          min="1"
          max="50"
          className="border border-gray-300 rounded p-2 mb-2 w-full text-black bg-white"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Minimum Rating:</label>
        <input
          type="number"
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
          step="0.1"
          min="1"
          max="5"
          className="border border-gray-300 rounded p-2 mb-2 w-full text-black bg-white"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Price Level:</label>
        <select
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border border-gray-300 rounded p-2 mb-2 w-full text-black bg-white"
        >
          <option value="">All</option>
          <option value="$">$</option>
          <option value="$$">$$</option>
          <option value="$$$">$$$</option>
          <option value="$$$$">$$$$</option>
        </select>
      </div>
      <button
        onClick={handleSearch}
        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded w-full"
      >
        Search
      </button>

      {isLoading && <p>Loading...</p>}
      {error && <p>{error}</p>}

      <ul className="mt-6 space-y-4">
        {restaurants.map((restaurant) => (
          <li key={restaurant.place_id} className="border border-gray-300 p-4 rounded shadow flex items-center">
            {/* Flex container */}
            <div className="flex-1">
              <h2 className="text-xl font-semibold flex items-center">
                <a
                  href={`https://www.google.com/maps/place/?q=place_id:${restaurant.place_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {restaurant.name}
                </a>
                {restaurant.isMichelin && (
                  <span className="flex items-center ml-2 text-yellow-700">
                    <Image src={MichelinStar} alt="Michelin Star" width={16} height={16} className="mr-1" />
                    {restaurant.michelinAward}
                  </span>
                )}
              </h2>
              <p>Rating: {restaurant.rating}</p>
              <p>Reviews: {restaurant.user_ratings_total}</p>
              
              {/* Conditionally render Price Level for restaurants only */}
              {placeType === 'restaurant' && restaurant.price_level && (
                <p>Price Level: {'$'.repeat(restaurant.price_level)}</p>
              )}
            </div>
            {/* Image container, aligned right */}
            {restaurant.photos && restaurant.photos.length > 0 && (
              <div className="ml-4 flex-shrink-0 w-24 h-24 relative">
              <Image
                src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${restaurant.photos[0].photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                alt={`${restaurant.name}`}
                layout="fill" // Makes the image fill the parent div
                objectFit="cover" // Ensures the image fills while keeping aspect ratio
                className="rounded" // Apply rounded corners
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
