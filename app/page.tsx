'use client';
import { useState, FormEvent } from 'react';
import axios from 'axios';
import Image from 'next/image';
import michelinData from "../data/michelinData.json"; // Adjust this path as needed for ES module import
import MichelinStar from "../assets/MichelinStar.png";
import Logo from "../assets/logo.png";

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
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission behavior

    setIsLoading(true);
    try {
        setError(null);

        const response = await axios.get('/api/fetchResults', {
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

    console.log('Place Type:', placeType);
};


  return (
    <div className="bg-gradient-to-b from-gray-100 to-gray-200 min-h-screen py-8">
      <div className="p-8 bg-white shadow-md rounded-lg max-w-lg mx-auto mb-8">

        <div className="flex justify-end items-center mb-2">
          <h1 className="text-3xl font-bold">TrueCritic</h1>
          <Image src={Logo} alt="TrueCritic Logo" width={40} height={40} className="ml-2" />
        </div>
        <p className="text-gray-600 text-sm text-end italic mb-6">Curated Quality, Simplified.</p>

        {/* Wrap with a form */}
        <form onSubmit={(event) => handleSearch(event)}>
          <div className="space-y-4">
            <label htmlFor="placeType" className="block text-gray-700">Choose Place Type:</label>
            <select
              id="placeType"
              value={placeType}
              onChange={(e) => setPlaceType(e.target.value)}
              className="border border-gray-300 rounded p-2 w-full text-black bg-white focus:shadow-md transition ease-in-out duration-200"
            >
              <option value="restaurant">Restaurants</option>
              <option value="hotel">Hotels</option>
            </select>

            <label className="block text-gray-700">Location:</label>
            <input
              type="text"
              placeholder="Enter a city, neighborhood, or specific location."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="border border-gray-300 rounded p-2 w-full text-black bg-white focus:shadow-md transition ease-in-out duration-200"
            />

            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="text-[#6E8898] text-sm focus:outline-none"
            >
              {showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
            </button>

            {showAdvancedOptions && (
              <div className="space-y-4">
                <label className="block text-gray-700">Search Radius (km):</label>
                <input
                  type="number"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  min="0.5"
                  max="4.5"
                  className="border border-gray-300 rounded p-2 w-full text-black bg-white focus:shadow-md transition ease-in-out duration-200"
                />

                <label className="block text-gray-700">Minimum Rating:</label>
                <input
                  type="number"
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  step="0.1"
                  min="1"
                  max="5"
                  className="border border-gray-300 rounded p-2 w-full text-black bg-white focus:shadow-md transition ease-in-out duration-200"
                />

                <label className="block text-gray-700">Price Level:</label>
                <select
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="border border-gray-300 rounded p-2 w-full text-black bg-white focus:shadow-md transition ease-in-out duration-200"
                >
                  <option value="">All</option>
                  <option value="$">$</option>
                  <option value="$$">$$</option>
                  <option value="$$$">$$$</option>
                  <option value="$$$$">$$$$</option>
                </select>
              </div>
            )}
          </div>

          {/* Change button type to submit */}
          <button
            type="submit"
            className="bg-[#6E8898] hover:bg-[#9FB1BC] text-white py-2 px-4 rounded w-full shadow-md mt-4 transition ease-in-out duration-200"
            disabled={isLoading}
          >
            Search 🔍
          </button>
        </form>


        {/* Loading Indicator */}
        {isLoading && <div className="text-center mt-4">Loading...</div>}

        {/* Error Message */}
        {error && <div className="text-red-500 mt-4">{error}</div>}
      </div>

      {/* Results */}
      {restaurants.length > 0 && (
        <p className="text-center text-gray-600 mb-4">
          Found {restaurants.length} {placeType === 'restaurant' ? 'restaurants' : 'hotels'} in this area.
        </p>
      )}
      <ul className="space-y-4 mx-auto max-w-lg">
        {restaurants.map((restaurant) => (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=place_id:${restaurant.place_id}`}
            target="_blank"
            rel="noopener noreferrer"
            key={restaurant.place_id}
            className="block"
          >
            <li
              className="bg-white border border-gray-200 p-4 rounded shadow-lg flex items-center transition transform hover:scale-105 hover:bg-gray-50"
            >
              {/* Name and Michelin Award */}
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  {restaurant.name}
                </h2>
                {placeType === "restaurant" && restaurant.isMichelin && (
                  <div className="flex items-center mt-1 text-yellow-700">
                    <Image src={MichelinStar} alt="Michelin Star" width={16} height={16} className="mr-1" />
                    <span className="text-base font-bold">{restaurant.michelinAward}</span>
                  </div>
                )}
                <p>Rating: {restaurant.rating}</p>
                <p>Reviews: {restaurant.user_ratings_total}</p>
                {placeType === 'restaurant' && restaurant.price_level && (
                  <p>Price Level: {'$'.repeat(restaurant.price_level)}</p>
                )}
              </div>

              {/* Restaurant Image */}
              {restaurant.photos && restaurant.photos.length > 0 && (
                <div className="ml-4 flex-shrink-0 w-24 h-24 relative">
                  <Image
                    src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${restaurant.photos[0].photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                    alt={`${restaurant.name}`}
                    layout="fill"
                    objectFit="cover"
                    className="rounded"
                  />
                </div>
              )}
            </li>
          </a>
        ))}
      </ul>
    </div>
  );
};

export default Home;
