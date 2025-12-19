"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

declare global {
  interface Window {
    google: any;
    gm_authFailure?: () => void;
  }
}

interface AddressFieldAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  label?: string;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
  disabled?: boolean;
}

export default function AddressFieldAutocomplete({
  value,
  onChange,
  label,
  placeholder = "Start typing an address...",
  multiline = false,
  required = false,
  disabled = false,
}: AddressFieldAutocompleteProps) {
  const addressInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const autocompleteRef = useRef<any>(null);
  const callbacksRef = useRef({ onChange });
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = { onChange };
  }, [onChange]);

  // Load Google Maps script with Places library
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn(
        "Google Maps API key not found. Address autocomplete will not work."
      );
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
    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com"]`
    );
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
        if (
          !window.google ||
          !window.google.maps ||
          !window.google.maps.places
        ) {
          console.error("Google Maps script failed to load within timeout");
          setIsLoading(false);
        }
      }, 10000);

      return () => clearInterval(checkGoogle);
    }

    // Load the script
    const script = document.createElement("script");
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
      console.error("Failed to load Google Maps script.");
      setIsLoading(false);
    };

    window.gm_authFailure = () => {
      console.error("Google Maps API authentication failed.");
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup handled by component unmount
    };
  }, []);

  // Initialize autocomplete when script is loaded
  useEffect(() => {
    if (!isScriptLoaded || !addressInputRef.current || disabled) {
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
      // Try the new PlaceAutocompleteElement API first
      if (window.google.maps.places && window.google.maps.places.PlaceAutocompleteElement) {
        const autocompleteElement = new window.google.maps.places.PlaceAutocompleteElement({
          requestedResultTypes: ['GEOCODE'],
          fields: ['formatted_address', 'address_components'],
        });

        autocompleteElement.input = addressInputRef.current;

        autocompleteElement.addEventListener('gmp-placeselect', (event: any) => {
          const place = event.detail.place;
          const formattedAddress = place.formattedAddress || place.formatted_address;
          
          if (formattedAddress) {
            const callbacks = callbacksRef.current;
            callbacks.onChange(formattedAddress);
          }
        });

        autocompleteRef.current = autocompleteElement;
        isInitializedRef.current = true;
        console.log('PlaceAutocompleteElement initialized for AddressField');
      } else {
        // Fallback to legacy API
        const autocomplete = new window.google.maps.places.Autocomplete(
          addressInputRef.current,
          {
            types: ["address"],
            fields: ["formatted_address", "address_components"],
          }
        );

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            const callbacks = callbacksRef.current;
            callbacks.onChange(place.formatted_address);
          }
        });

        autocompleteRef.current = autocomplete;
        isInitializedRef.current = true;
        console.log('Legacy Autocomplete initialized for AddressField');
      }
    } catch (error) {
      console.error("Error initializing Google Places Autocomplete:", error);
    }

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(
          autocompleteRef.current
        );
        autocompleteRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [isScriptLoaded, disabled]);

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor="address-field">
          {label} {required && "*"}
        </Label>
      )}
      {multiline ? (
        <Textarea
          ref={addressInputRef as React.RefObject<HTMLTextAreaElement>}
          id="address-field"
          value={value}
          onChange={(e) => {
            // Allow manual typing
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled || isLoading}
          rows={3}
          className="resize-none"
          autoComplete="off"
        />
      ) : (
        <Input
          ref={addressInputRef as React.RefObject<HTMLInputElement>}
          id="address-field"
          type="text"
          value={value}
          onChange={(e) => {
            // Allow manual typing
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled || isLoading}
          autoComplete="off"
        />
      )}
      {isLoading && (
        <p className="text-xs text-muted-foreground">
          Loading address autocomplete...
        </p>
      )}
    </div>
  );
}
