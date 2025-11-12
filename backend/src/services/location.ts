import { LocationClient, SearchPlaceIndexForPositionCommand } from '@aws-sdk/client-location';

const locationClient = new LocationClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const PLACE_INDEX_NAME = process.env.AWS_LOCATION_PLACE_INDEX_NAME || '';

export interface LocationResult {
  address: string;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  location: string; // City, State format
  formattedAddress: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Reverse geocode coordinates to get address information
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<LocationResult | null> {
  try {
    if (!PLACE_INDEX_NAME) {
      throw new Error('AWS_LOCATION_PLACE_INDEX_NAME is not configured');
    }

    const command = new SearchPlaceIndexForPositionCommand({
      IndexName: PLACE_INDEX_NAME,
      Position: [longitude, latitude], // AWS Location uses [longitude, latitude] format
      MaxResults: 1,
    });

    const response = await locationClient.send(command);

    if (!response.Results || response.Results.length === 0) {
      return null;
    }

    const result = response.Results[0];
    const place = result.Place;

    if (!place) {
      return null;
    }

    // Extract address components
    const addressNumber = place.AddressNumber || '';
    const street = place.Street || '';
    const municipality = place.Municipality || '';
    const region = place.Region || '';
    const country = place.Country || '';
    const postalCode = place.PostalCode || '';

    // Build formatted address
    const addressParts: string[] = [];
    if (addressNumber && street) {
      addressParts.push(`${addressNumber} ${street}`);
    } else if (street) {
      addressParts.push(street);
    }

    const locationParts: string[] = [];
    if (municipality) locationParts.push(municipality);
    if (region) locationParts.push(region);
    if (postalCode) locationParts.push(postalCode);

    const formattedAddress = [
      ...addressParts,
      ...locationParts,
      country,
    ]
      .filter(Boolean)
      .join(', ');

    // Build location string (City, State)
    const locationPartsForDisplay: string[] = [];
    if (municipality) locationPartsForDisplay.push(municipality);
    if (region) locationPartsForDisplay.push(region);
    const location = locationPartsForDisplay.join(', ') || formattedAddress;

    return {
      address: addressParts.join(', ') || '',
      city: municipality || null,
      state: region || null,
      country: country || null,
      postalCode: postalCode || null,
      location: location, // City, State format (fallback to formattedAddress)
      formattedAddress,
      coordinates: {
        latitude,
        longitude,
      },
    };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    throw error;
  }
}

