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

interface AddressComponents {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface ShippingAddressAutocompleteProps {
  address: AddressComponents;
  onAddressChange: (address: AddressComponents) => void;
  required?: boolean;
  disabled?: boolean;
}

export default function ShippingAddressAutocomplete({
  address,
  onAddressChange,
  required = false,
  disabled = false,
}: ShippingAddressAutocompleteProps) {
  const streetInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const callbacksRef = useRef({ onAddressChange });
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = { onAddressChange };
  }, [onAddressChange]);

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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Wait for Places library to be fully loaded (it may load asynchronously)
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      const checkPlaces = setInterval(() => {
        attempts++;
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsScriptLoaded(true);
          setIsLoading(false);
          clearInterval(checkPlaces);
        } else if (attempts >= maxAttempts) {
          // Only log error if we've waited long enough
          console.error('Google Maps script loaded but Places API not available after 5 seconds. Make sure both "Maps JavaScript API" and "Places API (New)" are enabled in Google Cloud Console.');
          setIsLoading(false);
          clearInterval(checkPlaces);
        }
      }, 100); // Check every 100ms
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps script.');
      setIsLoading(false);
    };
    
    window.gm_authFailure = () => {
      console.error('Google Maps API authentication failed.');
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup handled by component unmount
    };
  }, []);

  // Initialize autocomplete when script is loaded
  useEffect(() => {
    if (!isScriptLoaded || !streetInputRef.current || disabled) {
      return;
    }

    if (!window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    // Prevent re-initialization
    if (autocompleteRef.current || isInitializedRef.current) {
      return;
    }

    try {
      // Helper function to parse address components
      const parseAddressComponents = (place: any): AddressComponents => {
        const components: AddressComponents = {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: 'US',
        };

        const addressComponents = place.addressComponents || place.address_components;
        if (!addressComponents) return components;

        addressComponents.forEach((component: any) => {
          const types = component.types;

          if (types.includes('street_number')) {
            components.street = component.longName || component.long_name + ' ';
          }
          if (types.includes('route')) {
            components.street += component.longName || component.long_name;
          }
          if (types.includes('locality')) {
            components.city = component.longName || component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            components.state = component.shortName || component.short_name;
          }
          if (types.includes('postal_code')) {
            components.zip = component.longName || component.long_name;
          }
          if (types.includes('country')) {
            components.country = component.shortName || component.short_name;
          }
        });

        return components;
      };

      // Try the new PlaceAutocompleteElement API first
      if (window.google.maps.places && window.google.maps.places.PlaceAutocompleteElement) {
        const autocompleteElement = new window.google.maps.places.PlaceAutocompleteElement({
          requestedResultTypes: ['GEOCODE'],
          fields: ['address_components', 'formatted_address'],
        });

        autocompleteElement.input = streetInputRef.current;

        autocompleteElement.addEventListener('gmp-placeselect', (event: any) => {
          const place = event.detail.place;
          const components = parseAddressComponents(place);
          const callbacks = callbacksRef.current;
          callbacks.onAddressChange(components);
        });

        autocompleteRef.current = autocompleteElement;
        isInitializedRef.current = true;
        console.log('PlaceAutocompleteElement initialized for ShippingAddress');
      } else {
        // Fallback to legacy API
        const autocomplete = new window.google.maps.places.Autocomplete(
          streetInputRef.current,
          {
            types: ['address'],
            fields: ['address_components', 'formatted_address'],
          }
        );

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.address_components) {
            const components = parseAddressComponents(place);
            const callbacks = callbacksRef.current;
            callbacks.onAddressChange(components);
          }
        });

        autocompleteRef.current = autocomplete;
        isInitializedRef.current = true;
        console.log('Legacy Autocomplete initialized for ShippingAddress');
      }
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
      <div className="space-y-1">
        <Label className="block text-sm font-medium text-midnight-navy">
          Street Address *
        </Label>
        <Input
          ref={streetInputRef}
          type="text"
          value={address.street}
          onChange={(e) => {
            // Update street address when user types
            // Allow all characters including spaces
            onAddressChange({
              ...address,
              street: e.target.value,
            });
          }}
          onKeyDown={(e) => {
            // Ensure space key works properly
            // Don't prevent default for space or any other normal typing keys
            if (e.key === ' ' || e.key === 'Spacebar') {
              // Allow space to work normally
              return;
            }
          }}
          required={required}
          disabled={disabled || isLoading}
          className="w-full border border-frost-gray rounded-lg focus-visible:ring-2 focus-visible:ring-crimson focus-visible:border-transparent text-midnight-navy bg-white"
          placeholder="Start typing your address..."
          autoComplete="off"
        />
        {isLoading && (
          <p className="text-xs text-midnight-navy/60 mt-1">
            Loading address autocomplete...
          </p>
        )}
        {isScriptLoaded && !isLoading && isInitializedRef.current && (
          <p className="text-xs text-midnight-navy/60 mt-1">
            Start typing to see address suggestions
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="block text-sm font-medium text-midnight-navy">
            City *
          </Label>
          <Input
            type="text"
            value={address.city}
            onChange={(e) =>
              onAddressChange({
                ...address,
                city: e.target.value,
              })
            }
            required={required}
            className="w-full border border-frost-gray rounded-lg focus-visible:ring-2 focus-visible:ring-crimson focus-visible:border-transparent text-midnight-navy bg-white"
            placeholder="City"
          />
        </div>

        <div className="space-y-1">
          <Label className="block text-sm font-medium text-midnight-navy">
            State *
          </Label>
          <Input
            type="text"
            value={address.state}
            onChange={(e) =>
              onAddressChange({
                ...address,
                state: e.target.value.toUpperCase(),
              })
            }
            required={required}
            maxLength={2}
            className="w-full border border-frost-gray rounded-lg focus-visible:ring-2 focus-visible:ring-crimson focus-visible:border-transparent text-midnight-navy bg-white uppercase"
            placeholder="CA"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="block text-sm font-medium text-midnight-navy">
            ZIP Code *
          </Label>
          <Input
            type="text"
            value={address.zip}
            onChange={(e) =>
              onAddressChange({
                ...address,
                zip: e.target.value,
              })
            }
            required={required}
            pattern="[0-9]{5}(-[0-9]{4})?"
            className="w-full border border-frost-gray rounded-lg focus-visible:ring-2 focus-visible:ring-crimson focus-visible:border-transparent text-midnight-navy bg-white"
            placeholder="12345"
          />
        </div>

        <div className="space-y-1">
          <Label className="block text-sm font-medium text-midnight-navy">
            Country *
          </Label>
          <Input
            type="text"
            value={address.country}
            onChange={(e) =>
              onAddressChange({
                ...address,
                country: e.target.value,
              })
            }
            required={required}
            className="w-full border border-frost-gray rounded-lg focus-visible:ring-2 focus-visible:ring-crimson focus-visible:border-transparent text-midnight-navy bg-white"
            placeholder="US"
          />
        </div>
      </div>
    </div>
  );
}

