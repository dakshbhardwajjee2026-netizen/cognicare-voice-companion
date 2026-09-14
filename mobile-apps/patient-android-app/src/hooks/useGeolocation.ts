import { useState, useEffect, useRef } from 'react';
import { reverseGeocode, ReverseGeocodeResult } from '../services/locationService';

export interface LocationState {
  coords: { lat: number; lng: number } | null;
  locationDetails: ReverseGeocodeResult | null;
  isSafe: boolean;
  error: string | null;
}

export const useGeolocation = (onLocationUpdate?: (location: { lat: number; lng: number; address: string; details: ReverseGeocodeResult }) => void) => {
  const [locationState, setLocationState] = useState<LocationState>({
    coords: null,
    locationDetails: null,
    isSafe: true,
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationState((prev) => ({
        ...prev,
        error: 'Geolocation not supported by device.',
      }));
      return;
    }

    const handleSuccess = async (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      try {
        const details = await reverseGeocode(lat, lng);
        setLocationState({
          coords: { lat, lng },
          locationDetails: details,
          isSafe: true,
          error: null,
        });

        onLocationUpdate?.({
          lat,
          lng,
          address: details.formattedAddress,
          details,
        });
      } catch (e) {
        console.warn('Geocoding error:', e);
      }
    };

    const handleError = (err: GeolocationPositionError) => {
      console.warn('Device geolocation notice:', err.message);
      setLocationState((prev) => ({
        ...prev,
        error: err.message,
        isSafe: true,
      }));
    };

    // Immediate request
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 30000,
    });

    // Continuous watch
    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 60000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return locationState;
};
