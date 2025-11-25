"use client";

<style jsx global>{`
  @keyframes slideIn {
    0% {
      transform: scaleX(0);
      opacity: 0;
    }
    100% {
      transform: scaleX(1);
      opacity: 1;
    }
  }
`}</style>;

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "../contexts/CartContext";
import {
  createCheckoutSession,
  calculateShippingRates,
  type ShippingRate,
  fetchUserAddresses,
  createUserAddress,
  type UserAddress,
} from "@/lib/api";
import type { Product } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ShippingAddressAutocomplete from "../components/ShippingAddressAutocomplete";

export default function CartCheckoutPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { items, getTotalPrice, clearCart } = useCart();
  const [processing, setProcessing] = useState(false);
  const [processingIndex, setProcessingIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
  });
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null
  );
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState("");
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShippingRate, setSelectedShippingRate] =
    useState<ShippingRate | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  useEffect(() => {
    // Redirect to shop if cart is empty
    if (items.length === 0 && sessionStatus !== "loading") {
      router.push("/shop");
    }
  }, [items.length, sessionStatus, router]);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Calculate shipping when address is complete
  useEffect(() => {
    const fetchShippingRates = async () => {
      // Only fetch if we have a complete address and at least one item
      if (
        items.length === 0 ||
        !shippingAddress.street ||
        !shippingAddress.city ||
        !shippingAddress.state ||
        !shippingAddress.zip
      ) {
        setShippingRates([]);
        setSelectedShippingRate(null);
        return;
      }

      setLoadingShipping(true);
      try {
        // Get rates for the first item (each item may have different sellers)
        const firstItem = items[0];
        console.log("📦 Fetching shipping rates for:", {
          productId: firstItem.product.id,
          toAddress: shippingAddress,
        });

        const rates = await calculateShippingRates(firstItem.product.id, {
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zip: shippingAddress.zip,
          country: shippingAddress.country || "US",
        });

        console.log("✅ Shipping rates received:", rates);
        setShippingRates(rates);
        // Auto-select the cheapest rate
        if (rates.length > 0) {
          setSelectedShippingRate(rates[0]);
          console.log("✅ Selected shipping rate:", rates[0]);
        }
      } catch (error) {
        console.error("Error fetching shipping rates:", error);
        // Check if it's because address isn't complete or API error
        if (
          !shippingAddress.street ||
          !shippingAddress.city ||
          !shippingAddress.state ||
          !shippingAddress.zip
        ) {
          // Address not complete - don't set fallback yet
          setShippingRates([]);
          setSelectedShippingRate(null);
        } else {
          // API error - fall back to flat rate
          const fallbackRate: ShippingRate = {
            service: "Standard",
            carrier: "Flat Rate",
            rate: 599,
            estimatedDays: 5,
          };
          setShippingRates([fallbackRate]);
          setSelectedShippingRate(fallbackRate);
        }
      } finally {
        setLoadingShipping(false);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(fetchShippingRates, 500);
    return () => clearTimeout(timeoutId);
  }, [shippingAddress, items]);

  const shippingCents = selectedShippingRate?.rate || 599; // Fallback to $5.99
  const totalPrice = getTotalPrice(); // Returns dollars
  const totalPriceCents = totalPrice * 100; // Convert to cents
  const totalWithShippingCents = totalPriceCents + shippingCents;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      setError("Your cart is empty");
      return;
    }

    // Check if any product is Kappa branded - if so, require authentication
    const hasKappaBranded = items.some((item) => item.product.is_kappa_branded);
    if (hasKappaBranded) {
      if (sessionStatus !== "authenticated" || !session?.user?.email) {
        setError(
          "Kappa Alpha Psi branded merchandise can only be purchased by verified members. Please sign in to continue."
        );
        return;
      }
    }

    setProcessing(true);
    setError("");

    try {
      const buyerEmail = session?.user?.email || guestEmail;

      if (!buyerEmail) {
        setError("Please provide your email address");
        setProcessing(false);
        return;
      }

      // Validate shipping address
      if (
        !shippingAddress.street ||
        !shippingAddress.city ||
        !shippingAddress.state ||
        !shippingAddress.zip
      ) {
        setError("Please provide a complete shipping address");
        setProcessing(false);
        return;
      }

      // For guest checkout, include email and password in the request
      const guestData =
        !session?.user?.email && guestEmail && guestPassword
          ? { email: guestEmail, password: guestPassword }
          : undefined;

      // Process items one at a time (since each may have different sellers/Stripe accounts)
      // Start with the first item
      if (items.length > 0) {
        setProcessingIndex(0);
        const firstItem = items[0];
        const { url } = await createCheckoutSession(
          firstItem.product.id,
          buyerEmail,
          guestData,
          shippingCents,
          {
            street: shippingAddress.street,
            city: shippingAddress.city,
            state: shippingAddress.state,
            zip: shippingAddress.zip,
            country: shippingAddress.country || "US",
          }
        );

        // Save address if user requested to save it
        if (
          sessionStatus === "authenticated" &&
          saveNewAddress &&
          shippingAddress.street
        ) {
          try {
            await createUserAddress({
              label: newAddressLabel || null,
              street: shippingAddress.street,
              city: shippingAddress.city,
              state: shippingAddress.state,
              zip: shippingAddress.zip,
              country: shippingAddress.country || "US",
              is_default: savedAddresses.length === 0, // Set as default if it's the first address
            });
          } catch (error) {
            console.error("Error saving address:", error);
            // Don't block checkout if address save fails
          }
        }

        // Redirect to Stripe checkout for first item
        // After successful payment, user can return and checkout remaining items
        window.location.href = url;
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      const errorData = err.errorData || {};

      if (
        errorData.error === "STRIPE_NOT_CONNECTED" ||
        err.message?.includes("STRIPE_NOT_CONNECTED")
      ) {
        setError(
          errorData.message ||
            "The seller is finalizing their payout setup. This item will be available soon."
        );
      } else if (
        errorData.error === "AUTH_REQUIRED_FOR_KAPPA_BRANDED" ||
        errorData.code === "AUTH_REQUIRED_FOR_KAPPA_BRANDED"
      ) {
        setError(
          "Kappa Alpha Psi branded merchandise can only be purchased by verified members. Please sign in to continue."
        );
      } else if (
        errorData.error === "AUTH_REQUIRED" ||
        errorData.code === "AUTH_REQUIRED"
      ) {
        setError("Please sign in to make a purchase.");
      } else {
        setError(err.message || "Failed to start checkout. Please try again.");
      }
      setProcessing(false);
      setProcessingIndex(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-midnight-navy/70 mb-4">Your cart is empty</p>
            <Link
              href="/shop"
              className="inline-block bg-crimson text-white px-6 py-2 rounded-full font-semibold hover:bg-crimson/90 transition"
            >
              Continue Shopping
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const buyerEmail = session?.user?.email || "";
  const showGuestForm =
    !buyerEmail && !items.some((item) => item.product.is_kappa_branded);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-cream/70 text-midnight-navy">
      <Header />

      {/* Step Indicator */}
      <div className="sticky top-0 z-30 bg-cream/80 backdrop-blur-sm border-b border-frost-gray/40 transition-all duration-500 ease-out">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-center gap-8 text-sm font-medium">
          {/* Cart (inactive) */}
          <span className="relative text-midnight-navy/40 transition-all duration-300">
            Cart
          </span>

          {/* Separator */}
          <span className="text-midnight-navy/40">→</span>

          {/* Checkout (ACTIVE) */}
          <span className="relative text-crimson font-semibold transition-all duration-300">
            Checkout
            <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-crimson rounded-full animate-[slideIn_0.35s_ease-out]" />
          </span>

          {/* Separator */}
          <span className="text-midnight-navy/40">→</span>

          {/* Complete (inactive) */}
          <span className="relative text-midnight-navy/40 transition-all duration-300">
            Complete
          </span>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-10 md:py-16">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-crimson/10 text-crimson">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 3L20 12L12 21L4 12L12 3Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 7.5V16.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-midnight-navy">
              Checkout
            </h1>
          </div>
          <p className="text-midnight-navy/70 text-sm md:text-base">
            Review your order and complete your purchase.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items */}
            <div className="bg-white rounded-3xl shadow-lg shadow-black/5 border border-frost-gray/30 p-5 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-7 rounded-full bg-crimson/90" />
                <h2 className="text-[22px] md:text-[24px] font-display font-semibold text-midnight-navy">
                  Order Summary
                </h2>
              </div>
              <div className="flex justify-between items-center mb-1 text-[11px] uppercase tracking-wide text-midnight-navy/50">
                <span>Item</span>
                <span className="hidden sm:inline">Price</span>
              </div>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={item.product.id}
                    className="flex gap-4 pb-4 border-b border-frost-gray/70 last:border-0 last:pb-0"
                  >
                    {/* Product Image */}
                    <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-frost-gray/40 flex-shrink-0">
                      {item.product.images && item.product.images.length > 0 ? (
                        <Image
                          src={item.product.images[0].image_url}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/product/${item.product.id}`}
                        className="text-base md:text-lg font-semibold text-midnight-navy hover:text-crimson transition mb-1 block truncate"
                      >
                        {item.product.name}
                      </Link>
                      {item.product.seller_name && (
                        <p className="text-sm text-midnight-navy/70 mb-1">
                          Sold by{" "}
                          {item.product.seller_fraternity_member_id
                            ? "Brother "
                            : ""}
                          {item.product.seller_name}
                        </p>
                      )}
                      {item.product.is_kappa_branded && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-crimson/5 text-[11px] font-medium text-crimson border border-crimson/30 mb-1">
                          Kappa Branded
                        </span>
                      )}
                      <p className="text-sm text-midnight-navy/60">
                        Quantity: {item.quantity}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="text-right flex flex-col items-end justify-between">
                      <p className="text-lg font-bold text-midnight-navy">
                        {formatPrice(item.product.price_cents * item.quantity)}
                      </p>
                      <p className="text-xs md:text-sm text-midnight-navy/60 mt-1">
                        {formatPrice(item.product.price_cents)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guest Checkout Form */}
            {showGuestForm && (
              <div className="bg-white rounded-3xl shadow-lg shadow-black/5 border border-frost-gray/30 p-5 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-7 rounded-full bg-crimson/90" />
                  <h2 className="text-[22px] md:text-[24px] font-display font-semibold text-midnight-navy">
                    Guest Checkout
                  </h2>
                </div>
                <p className="text-sm text-midnight-navy/70 mb-4">
                  Create an account to complete your purchase. You'll be able to
                  track your order and view order history.
                </p>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="block text-sm font-medium text-midnight-navy">
                      Email Address *
                    </Label>
                    <Input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      required
                      className="w-full border border-frost-gray rounded-lg focus-visible:ring-2 focus-visible:ring-crimson focus-visible:border-transparent text-midnight-navy bg-white"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="block text-sm font-medium text-midnight-navy">
                      Password *
                    </Label>
                    <Input
                      type="password"
                      value={guestPassword}
                      onChange={(e) => setGuestPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full border border-frost-gray rounded-lg focus-visible:ring-2 focus-visible:ring-crimson focus-visible:border-transparent text-midnight-navy bg-white"
                      placeholder="At least 8 characters"
                    />
                    <p className="text-xs text-midnight-navy/60 mt-1">
                      We'll create an account for you with this email and
                      password
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Signed In User Info */}
            {buyerEmail && (
              <div className="bg-white rounded-3xl shadow-lg shadow-black/5 border border-frost-gray/30 p-5 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-7 rounded-full bg-crimson/90" />
                  <h2 className="text-[22px] md:text-[24px] font-display font-semibold text-midnight-navy">
                    Contact Information
                  </h2>
                </div>
                <div className="space-y-2">
                  <p className="text-midnight-navy/70">
                    <span className="font-medium">Email:</span> {buyerEmail}
                  </p>
                  <p className="text-sm text-midnight-navy/60">
                    Your order confirmation will be sent to this email address
                  </p>
                </div>
              </div>
            )}

            {/* Shipping Address */}
            <div className="bg-white rounded-3xl shadow-lg shadow-black/5 border border-frost-gray/30 p-5 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-7 rounded-full bg-crimson/90" />
                <h2 className="text-[22px] md:text-[24px] font-display font-semibold text-midnight-navy">
                  Shipping Address
                </h2>
              </div>

              {/* Saved Addresses (for authenticated users) */}
              {sessionStatus === "authenticated" &&
                savedAddresses.length > 0 && (
                  <div className="mb-4">
                    <Label className="block text-sm font-medium text-midnight-navy mb-2">
                      Use Saved Address
                    </Label>
                    <select
                      value={selectedAddressId || ""}
                      onChange={(e) => {
                        const addressId = e.target.value
                          ? parseInt(e.target.value)
                          : null;
                        setSelectedAddressId(addressId);

                        if (addressId) {
                          const address = savedAddresses.find(
                            (a) => a.id === addressId
                          );
                          if (address) {
                            setShippingAddress({
                              street: address.street,
                              city: address.city,
                              state: address.state,
                              zip: address.zip,
                              country: address.country,
                            });
                          }
                        } else {
                          // Clear form if "Enter new address" is selected
                          setShippingAddress({
                            street: "",
                            city: "",
                            state: "",
                            zip: "",
                            country: "US",
                          });
                        }
                      }}
                      className="w-full border border-frost-gray rounded-lg px-3 py-2 text-midnight-navy bg-white focus:outline-none focus:ring-2 focus:ring-crimson"
                    >
                      <option value="">Enter new address</option>
                      {savedAddresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.label ||
                            `${address.street}, ${address.city}, ${address.state}`}
                          {address.is_default && " (Default)"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

              <ShippingAddressAutocomplete
                address={shippingAddress}
                onAddressChange={(newAddress) => {
                  setShippingAddress(newAddress);
                  // Clear selected address ID when user manually edits
                  setSelectedAddressId(null);
                }}
                required
              />

              {/* Save Address Option (for authenticated users) */}
              {sessionStatus === "authenticated" && (
                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="save-address"
                    checked={saveNewAddress}
                    onChange={(e) => setSaveNewAddress(e.target.checked)}
                    className="w-4 h-4 text-crimson border-frost-gray rounded focus:ring-crimson"
                  />
                  <Label
                    htmlFor="save-address"
                    className="text-sm text-midnight-navy/70 cursor-pointer"
                  >
                    Save this address for future orders
                  </Label>
                </div>
              )}

              {/* Address Label Input (if saving) */}
              {sessionStatus === "authenticated" && saveNewAddress && (
                <div className="mt-3">
                  <Label className="block text-sm font-medium text-midnight-navy mb-1">
                    Address Label (optional)
                  </Label>
                  <Input
                    type="text"
                    value={newAddressLabel}
                    onChange={(e) => setNewAddressLabel(e.target.value)}
                    placeholder="e.g., Home, Work, Mom's House"
                    className="w-full border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson"
                  />
                </div>
              )}
            </div>

            {/* Note about multiple sellers */}
            {items.length > 1 && (
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex gap-3">
                <div className="mt-0.5 text-blue-500">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 3L3 21h18L12 3z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 9v4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <circle cx="12" cy="16" r="0.8" fill="currentColor" />
                  </svg>
                </div>
                <p className="text-sm text-blue-900">
                  <strong>Heads up:</strong> Your cart contains items from{" "}
                  {new Set(items.map((item) => item.product.seller_id)).size}{" "}
                  different seller
                  {new Set(items.map((item) => item.product.seller_id)).size > 1
                    ? "s"
                    : ""}
                  . You'll complete checkout for each item separately.
                </p>
              </div>
            )}
          </div>

          {/* Order Total & Checkout Button */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-lg shadow-black/5 border border-frost-gray/30 p-5 md:p-6 sticky top-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-7 rounded-full bg-crimson/90" />
                <h2 className="text-[22px] md:text-[24px] font-display font-semibold text-midnight-navy">
                  Order Total
                </h2>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm md:text-base text-midnight-navy/70">
                  <span>
                    Subtotal (
                    {items.reduce((sum, item) => sum + item.quantity, 0)} items)
                  </span>
                  <span>{formatPrice(totalPriceCents)}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base text-midnight-navy/70">
                  <span className="whitespace-nowrap">Shipping</span>
                  <span className="whitespace-nowrap">
                    {loadingShipping ? (
                      <span className="text-midnight-navy/50">
                        Calculating...
                      </span>
                    ) : selectedShippingRate ? (
                      <span>
                        {formatPrice(shippingCents)}
                        {selectedShippingRate.estimatedDays && (
                          <span className="text-xs text-midnight-navy/50 ml-1">
                            ({selectedShippingRate.estimatedDays} days)
                          </span>
                        )}
                      </span>
                    ) : (
                      formatPrice(shippingCents)
                    )}
                  </span>
                </div>
                {shippingRates.length > 1 && (
                  <div className="text-xs text-midnight-navy/60 mt-2">
                    <select
                      value={selectedShippingRate?.service || ""}
                      onChange={(e) => {
                        const rate = shippingRates.find(
                          (r) => r.service === e.target.value
                        );
                        setSelectedShippingRate(rate || null);
                      }}
                      className="w-full border border-frost-gray rounded-lg px-2 py-1 text-midnight-navy bg-white"
                    >
                      {shippingRates.map((rate) => (
                        <option key={rate.service} value={rate.service}>
                          {rate.carrier} {rate.service} -{" "}
                          {formatPrice(rate.rate)}
                          {rate.estimatedDays &&
                            ` (${rate.estimatedDays} days)`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="border-t border-frost-gray/60 pt-4 flex justify-between items-center text-[20px] md:text-[22px] font-extrabold text-midnight-navy">
                  <span>Total</span>
                  <span>{formatPrice(totalWithShippingCents)}</span>
                </div>
              </div>

              <form onSubmit={handleCheckout}>
                <button
                  type="submit"
                  disabled={
                    processing ||
                    (showGuestForm && (!guestEmail || !guestPassword))
                  }
                  className="w-full bg-crimson text-white px-6 py-3 rounded-full font-semibold shadow-md shadow-crimson/30 hover:shadow-lg hover:shadow-crimson/40 hover:bg-crimson/90 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                  {processing ? "Processing..." : "Complete Purchase"}
                </button>
              </form>

              <p className="text-xs text-midnight-navy/70 text-center mb-1 flex items-center justify-center gap-1">
                <svg
                  className="w-3 h-3 text-midnight-navy/70"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7 11V8a5 5 0 0110 0v3"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="5"
                    y="11"
                    width="14"
                    height="9"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
                <span>Secure payment powered by Stripe</span>
              </p>
              <p className="text-[11px] text-midnight-navy/60 text-center mb-4">
                You'll be redirected to Stripe to securely complete your
                payment.
              </p>

              {!buyerEmail &&
                !items.some((item) => item.product.is_kappa_branded) && (
                  <div className="pt-4 border-t border-frost-gray">
                    <p className="text-sm text-midnight-navy/70 text-center mb-2">
                      Already have an account?
                    </p>
                    <Link
                      href={`/login?redirect=${encodeURIComponent(
                        "/checkout"
                      )}`}
                      className="block text-center text-crimson hover:underline font-medium"
                    >
                      Sign In
                    </Link>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Back to Shop Link */}
        <div className="mt-8 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 text-crimson hover:text-crimson/80 hover:underline text-sm md:text-base"
          >
            ← Continue Shopping
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
