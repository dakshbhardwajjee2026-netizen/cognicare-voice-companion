import { useState, useEffect, useRef } from 'react';
import { PatientSettings } from '../types';
import { reverseGeocode, ReverseGeocodeResult } from '../services/locationService';

export interface LocationState {
  coords: { lat: number; lng: number } | null;
  distanceFromHome: number | null; // meters
  isSafe: boolean;
  error: string | null;
  locationDetails?: ReverseGeocodeResult | null;
}

// Calculate distance between two coordinates in meters (Haversine)
export const calculateDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

export const useGeolocation = (settings: PatientSettings | undefined) => {
  const [locationState, setLocationState] = useState<LocationState>({
    coords: null,
    distanceFromHome: 0,
    isSafe: true,
    error: null,
    locationDetails: null,
  });

  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by this browser.',
      }));
      return;
    }

    const handleSuccess = async (position: GeolocationPosition) => {
      const currentLat = position.coords.latitude;
      const currentLng = position.coords.longitude;

      let dist: number | null = null;
      let safe = true;

      if (settings?.homeCoordinates) {
        dist = calculateDistanceMeters(
          currentLat,
          currentLng,
          settings.homeCoordinates.lat,
          settings.homeCoordinates.lng
        );
        safe = dist <= (settings.safeZoneRadius || 300);
      }

      const locationDetails = await reverseGeocode(currentLat, currentLng);

      setLocationState({
        coords: { lat: currentLat, lng: currentLng },
        distanceFromHome: dist,
        isSafe: safe,
        error: null,
        locationDetails,
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      // Graceful fallback for iframe permissions or denied location
      console.warn('Geolocation notice:', error.message);
      setLocationState((prev) => ({
        ...prev,
        error: error.message,
        isSafe: true, // Default to safe so patient is not alarmed unnecessarily
      }));
    };

    // Get immediate position then watch
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60000,
    });

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
  }, [settings?.homeCoordinates?.lat, settings?.homeCoordinates?.lng, settings?.safeZoneRadius]);

  return locationState;
};
