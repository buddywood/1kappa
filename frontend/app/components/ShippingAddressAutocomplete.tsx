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
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsScriptLoaded(true);
        setIsLoading(false);
      } else {
        console.error('Google Maps script loaded but Places API not available.');
        setIsLoading(false);
      }
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
      // Initialize autocomplete with address type restriction
      const autocomplete = new window.google.maps.places.Autocomplete(
        streetInputRef.current,
        {
          types: ['address'], // Restrict to addresses only
          fields: ['address_components', 'formatted_address'],
        }
      );

      autocompleteRef.current = autocomplete;
      isInitializedRef.current = true;

      // Handle place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (!place.address_components) {
          return;
        }

        // Parse address components
        const components: AddressComponents = {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: 'US',
        };

        place.address_components.forEach((component: any) => {
          const types = component.types;

          if (types.includes('street_number')) {
            components.street = component.long_name + ' ';
          }
          if (types.includes('route')) {
            components.street += component.long_name;
          }
          if (types.includes('locality')) {
            components.city = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            components.state = component.short_name; // Use short name for state (e.g., "CA")
          }
          if (types.includes('postal_code')) {
            components.zip = component.long_name;
          }
          if (types.includes('country')) {
            components.country = component.short_name; // Use short name (e.g., "US")
          }
        });

        // Update the address state
        const callbacks = callbacksRef.current;
        callbacks.onAddressChange(components);
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

