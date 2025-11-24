'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
    gm_authFailure?: () => void;
  }
}

interface AddressAutocompleteProps {
  location: string;
  onLocationChange: (location: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export default function AddressAutocomplete({
  location,
  onLocationChange,
  required = false,
  disabled = false,
}: AddressAutocompleteProps) {
  const locationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const callbacksRef = useRef({ onLocationChange });
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = { onLocationChange };
  }, [onLocationChange]);

  // Load Google Maps script with Places library
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not found. Address autocomplete will not work.');
      setIsLoading(false);
      return;
    }

    // Check if script is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsScriptLoaded(true);
      setIsLoading(false);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      // Wait for script to load
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsScriptLoaded(true);
          setIsLoading(false);
          clearInterval(checkGoogle);
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkGoogle);
        if (!window.google || !window.google.maps || !window.google.maps.places) {
          console.error('Google Maps script failed to load within timeout');
          setIsLoading(false);
        }
      }, 10000);
      
      return () => clearInterval(checkGoogle);
    }

    // Load the script
    const script = document.createElement('script');
    // Note: Maps JavaScript API must be enabled in Google Cloud Console
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Double check that the API is actually available
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsScriptLoaded(true);
        setIsLoading(false);
      } else {
        console.error('Google Maps script loaded but Places API not available. Make sure both "Maps JavaScript API" and "Places API (New)" are enabled in Google Cloud Console.');
        setIsLoading(false);
      }
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps script. Check your API key and network connection.');
      setIsLoading(false);
    };
    
    // Handle API errors after script loads
    window.gm_authFailure = () => {
      console.error('Google Maps API authentication failed. Please check your API key and ensure both "Maps JavaScript API" and "Places API (New)" are enabled in Google Cloud Console.');
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts (optional)
      // Note: We might want to keep it for other components
    };
  }, []);

  // Initialize autocomplete when script is loaded (only once)
  useEffect(() => {
    if (!isScriptLoaded || !locationInputRef.current || disabled) {
      return;
    }

    if (!window.google || !window.google.maps || !window.google.maps.places) {
      // Don't log warning if we're still loading - this is expected
      if (isScriptLoaded) {
        console.warn('Google Places API not available. Make sure Places API is enabled in Google Cloud Console.');
      }
      return;
    }

    // Prevent re-initialization
    if (autocompleteRef.current || isInitializedRef.current) {
      return;
    }

    try {
      // Initialize autocomplete
      const autocomplete = new window.google.maps.places.Autocomplete(
        locationInputRef.current,
        {
          // Don't restrict types too much - let users search for any place
          fields: ['address_components', 'formatted_address', 'geometry', 'name'],
        }
      );

      autocompleteRef.current = autocomplete;
      isInitializedRef.current = true;
      
      console.log('Google Places Autocomplete initialized', {
        input: locationInputRef.current,
        autocomplete: autocomplete,
      });

      // Handle place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (!place.geometry) {
          console.warn('No details available for the selected place');
          return;
        }

        // Update location field - backend will parse city and state
        const callbacks = callbacksRef.current;
        
        // Use formatted address - backend will parse city and state from it
        if (place.formatted_address) {
          callbacks.onLocationChange(place.formatted_address);
        }
      });
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
    }

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [isScriptLoaded, disabled]);

  return (
    <div className="space-y-4">
      {/* Location with Autocomplete */}
      <div>
        <Label htmlFor="location">
          Location {required && '*'}
        </Label>
        <Input
          ref={locationInputRef}
          id="location"
          type="text"
          value={location}
          onChange={(e) => {
            // Only update if user is typing (not when autocomplete sets it)
            // This preserves manual typing
            onLocationChange(e.target.value);
          }}
          placeholder="Start typing an address..."
          required={required}
          disabled={disabled || isLoading}
          className="mt-2"
          autoComplete="off"
        />
        {isLoading && (
          <p className="text-xs text-muted-foreground mt-1">
            Loading address autocomplete...
          </p>
        )}
        {isScriptLoaded && !isLoading && isInitializedRef.current && (
          <p className="text-xs text-muted-foreground mt-1">
            Start typing to see address suggestions
          </p>
        )}
        {isScriptLoaded && !isLoading && !isInitializedRef.current && (
          <p className="text-xs text-yellow-600 mt-1">
            Autocomplete not initialized. Check console for errors.
          </p>
        )}
      </div>

    </div>
  );
}

