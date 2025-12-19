'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

declare global {
  interface Window {
    google: any;
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
  const autocompleteElementRef = useRef<any>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);

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

    // Load the script with the new Places API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Wait for Places library to be fully loaded
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      const checkPlaces = setInterval(() => {
        attempts++;
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsScriptLoaded(true);
          setIsLoading(false);
          clearInterval(checkPlaces);
        } else if (attempts >= maxAttempts) {
          console.error('Google Maps script loaded but Places API not available after 5 seconds. Make sure both "Maps JavaScript API" and "Places API (New)" are enabled in Google Cloud Console.');
          setIsLoading(false);
          clearInterval(checkPlaces);
        }
      }, 100);
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps script. Check your API key and network connection.');
      setIsLoading(false);
    };
    
    window.gm_authFailure = () => {
      console.error('Google Maps API authentication failed. Please check your API key and ensure both "Maps JavaScript API" and "Places API (New)" are enabled in Google Cloud Console.');
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup handled by component unmount
    };
  }, []);

  // Initialize PlaceAutocompleteElement when script is loaded
  useEffect(() => {
    if (!isScriptLoaded || !locationInputRef.current || disabled) {
      return;
    }

    if (!window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    // Prevent re-initialization
    if (autocompleteElementRef.current || isInitializedRef.current) {
      return;
    }

    try {
      // Try the new PlaceAutocompleteElement API first (recommended for new customers)
      // Check if the new API is available
      if (window.google.maps.places && window.google.maps.places.PlaceAutocompleteElement) {
        const autocompleteElement = new window.google.maps.places.PlaceAutocompleteElement({
          requestedResultTypes: ['GEOCODE'],
          fields: ['address_components', 'formatted_address', 'geometry', 'name'],
        });

        // Connect the input to the autocomplete element (this is the key difference)
        autocompleteElement.input = locationInputRef.current;

        // Listen for place selection
        autocompleteElement.addEventListener('gmp-placeselect', (event: any) => {
          const place = event.detail.place;

          if (!place.geometry) {
            console.warn('No details available for the selected place');
            return;
          }

          // Use formatted address - backend will parse city and state from it
          const formattedAddress = place.formattedAddress || place.formatted_address;
          if (formattedAddress) {
            onLocationChange(formattedAddress);
          }
        });

        autocompleteElementRef.current = autocompleteElement;
        isInitializedRef.current = true;
        console.log('Google Places PlaceAutocompleteElement initialized');
      } else {
        // Fallback to legacy Autocomplete API if new one is not available
        console.warn('PlaceAutocompleteElement not available, using legacy Autocomplete API');
        const autocomplete = new window.google.maps.places.Autocomplete(
          locationInputRef.current,
          {
            fields: ['address_components', 'formatted_address', 'geometry', 'name'],
          }
        );

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            onLocationChange(place.formatted_address);
          }
        });

        autocompleteElementRef.current = autocomplete;
        isInitializedRef.current = true;
        console.log('Legacy Autocomplete API initialized');
      }
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
      // Try legacy API as last resort
      try {
        const autocomplete = new window.google.maps.places.Autocomplete(
          locationInputRef.current,
          {
            fields: ['address_components', 'formatted_address', 'geometry', 'name'],
          }
        );

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            onLocationChange(place.formatted_address);
          }
        });

        autocompleteElementRef.current = autocomplete;
        isInitializedRef.current = true;
        console.log('Legacy Autocomplete API initialized as fallback');
      } catch (fallbackError) {
        console.error('Error initializing both new and legacy Autocomplete:', fallbackError);
      }
    }

    return () => {
      if (autocompleteElementRef.current) {
        // Cleanup for PlaceAutocompleteElement
        if (autocompleteElementRef.current.remove) {
          autocompleteElementRef.current.remove();
        }
        autocompleteElementRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [isScriptLoaded, disabled, onLocationChange]);

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
      </div>

    </div>
  );
}

