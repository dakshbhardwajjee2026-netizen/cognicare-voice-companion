import { useState, useEffect, useRef } from 'react';
import { PatientSettings } from '../types';
import { reverseGeocode, ReverseGeocodeResult, getApproximateLocationFromIP } from '../services/locationService';

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
    // 1. Initial IP-based approximate bootstrap for immediate responsiveness
    getApproximateLocationFromIP().then(async (ipLoc) => {
      if (ipLoc) {
        setLocationState((prev) => {
          if (prev.coords) return prev; // If already resolved GPS, don't overwrite
          return {
            ...prev,
            coords: { lat: ipLoc.lat, lng: ipLoc.lng },
          };
        });
        const details = await reverseGeocode(ipLoc.lat, ipLoc.lng);
        if (details) {
          setLocationState((prev) => ({
            ...prev,
            locationDetails: prev.locationDetails || details,
          }));
        }
      }
    });

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
      console.warn('Geolocation notice:', error.message);
      setLocationState((prev) => ({
        ...prev,
        error: error.message,
        isSafe: true,
      }));
    };

    // Get immediate high-accuracy position then watch
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 10000,
    });

    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [settings?.homeCoordinates?.lat, settings?.homeCoordinates?.lng, settings?.safeZoneRadius]);

  return locationState;
};
