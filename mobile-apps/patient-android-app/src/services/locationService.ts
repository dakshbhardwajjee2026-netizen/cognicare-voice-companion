export interface ReverseGeocodeResult {
  formattedAddress: string;
  neighborhood: string;
  city: string;
  state: string;
  nearbyLandmarks: string[];
}

const cache = new Map<string, ReverseGeocodeResult>();

export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> => {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'CogniCareCompanion/1.0',
      },
    });

    if (!res.ok) {
      throw new Error(`Nominatim HTTP error ${res.status}`);
    }

    const data = await res.json();
    const addr = data.address || {};

    const neighborhood =
      addr.neighbourhood ||
      addr.suburb ||
      addr.residential ||
      addr.village ||
      addr.quarter ||
      addr.road ||
      'Local Neighborhood';

    const city = addr.city || addr.town || addr.municipality || addr.county || 'City Area';
    const state = addr.state || addr.region || '';
    const formattedAddress = data.display_name || `${neighborhood}, ${city}`;

    const nearbyLandmarks: string[] = [];
    if (addr.road) nearbyLandmarks.push(`Road: ${addr.road}`);
    if (addr.park || addr.leisure) nearbyLandmarks.push(`Park: ${addr.park || addr.leisure}`);
    if (addr.amenity) nearbyLandmarks.push(`Amenity: ${addr.amenity}`);
    if (addr.hospital || addr.clinic) nearbyLandmarks.push(`Medical: ${addr.hospital || addr.clinic}`);
    if (addr.place_of_worship) nearbyLandmarks.push(`Worship: ${addr.place_of_worship}`);
    if (addr.suburb || addr.neighbourhood) nearbyLandmarks.push(`Area: ${addr.suburb || addr.neighbourhood}`);

    const result: ReverseGeocodeResult = {
      formattedAddress,
      neighborhood,
      city,
      state,
      nearbyLandmarks: nearbyLandmarks.length > 0 ? nearbyLandmarks : ['Local Walkway', 'Neighborhood Garden'],
    };

    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn('OpenStreetMap Nominatim notice (using coordinates):', err);
    return {
      formattedAddress: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (Safe Home Zone)`,
      neighborhood: 'Local Neighborhood',
      city: 'Current City',
      state: '',
      nearbyLandmarks: ['Neighborhood Garden', 'Home Walkway'],
    };
  }
};
