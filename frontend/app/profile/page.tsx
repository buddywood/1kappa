"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  fetchMemberProfile,
  updateMemberProfile,
  fetchChapters,
  fetchIndustries,
  fetchProfessions,
  getStewardProfile,
  getSellerProfile,
  type MemberProfile,
  type Chapter,
  type Industry,
  type Profession,
} from "@/lib/api";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SearchableSelect from "../components/SearchableSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonLoader } from "../components/SkeletonLoader";
import VerificationStatusBadge from "../components/VerificationStatusBadge";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    data: session,
    status: sessionStatus,
    update: updateSession,
  } = useSession();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [warning, setWarning] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(null);
  const [isSteward, setIsSteward] = useState(false);
  const [stewardStatus, setStewardStatus] = useState<string | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [sellerStatus, setSellerStatus] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasVerifiedSession, setHasVerifiedSession] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    initiated_chapter_id: "",
    initiated_season: "",
    initiated_year: "",
    ship_name: "",
    line_name: "",
    location: "",
    address: "",
    address_is_private: false,
    phone_number: "",
    phone_is_private: false,
    industry: "",
    profession_id: "",
    job_title: "",
    bio: "",
    social_links: {
      instagram: "",
      twitter: "",
      linkedin: "",
      website: "",
    },
  });

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (isRedirecting) {
      console.log("Profile page: Already redirecting, skipping...");
      return; // Prevent multiple redirects
    }
    if (hasVerifiedSession) {
      console.log("Profile page: Already verified session, skipping...");
      return; // Prevent re-verification
    }

    console.log(
      "Profile page: Session status:",
      sessionStatus,
      "User:",
      session?.user?.email,
      "MemberId:",
      (session?.user as any)?.memberId
    );

    if (sessionStatus !== "authenticated" || !session?.user) {
      console.log("Profile page: Not authenticated, redirecting to login");
      setIsRedirecting(true);
      router.push("/login");
      return;
    }

    // Check user role - ADMIN users don't have member profiles
    const userRole = (session.user as any)?.role;
    if (userRole === "ADMIN") {
      console.log(
        "Profile page: User is ADMIN, redirecting to admin dashboard"
      );
      setIsRedirecting(true);
      router.push("/admin");
      return;
    }

    // Check if user has memberId in session
    let memberId = (session.user as any)?.memberId;

    // If no memberId in session, check backend first before deciding what to show
    const verifyAndLoad = async () => {
      try {
        const sessionData = await fetch("/api/auth/session").then((res) =>
          res.json()
        );
        const idToken = (sessionData as any)?.idToken;

        if (idToken) {
          const verifyResponse = await fetch(`${API_URL}/api/users/me`, {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });

          if (verifyResponse.ok) {
            const userData = await verifyResponse.json();

            // Update memberId from backend if it exists there but not in session
            if (!memberId && userData.fraternity_member_id) {
              console.log(
                "Profile page: Found fraternity_member_id in backend, updating session"
              );
              memberId = userData.fraternity_member_id;
              // Update session to include memberId
              await updateSession();
              // Mark as verified to prevent loop
              setHasVerifiedSession(true);
            }

            // If user has fraternity_member_id, show member profile (even if role is GUEST)
            if (userData.fraternity_member_id) {
              console.log(
                "Profile page: User has fraternity_member_id, loading member profile..."
              );
              setHasVerifiedSession(true);
              loadProfile();
              return;
            }

            // If no fraternity_member_id, handle based on role
            if (!userData.fraternity_member_id) {
              if (userRole === "GUEST") {
                console.log(
                  "Profile page: GUEST user with no fraternity_member_id, showing guest view"
                );
                setHasVerifiedSession(true);
                setLoading(false);
                return;
              } else if (userRole === "SELLER" || userRole === "PROMOTER") {
                console.log(
                  `Profile page: User is ${userRole}, no member profile needed`
                );
                setError("Member profile not available for sellers/promoters");
                setLoading(false);
                return;
              } else {
                console.log(
                  "Profile page: No fraternity_member_id found, redirecting to register"
                );
                setIsRedirecting(true);
                router.push("/register");
                return;
              }
            }
          }
        }

        // Fallback: If we have memberId (from session), proceed
        if (memberId || (sessionData as any)?.user?.memberId) {
          console.log("Profile page: MemberId verified, loading profile...");
          setHasVerifiedSession(true);
          loadProfile();
        } else if (userRole === "GUEST") {
          console.log(
            "Profile page: GUEST user with no memberId, showing guest view"
          );
          setHasVerifiedSession(true);
          setLoading(false);
        } else {
          console.log(
            "Profile page: No memberId found, redirecting to register"
          );
          setIsRedirecting(true);
          router.push("/register");
        }
      } catch (verifyError) {
        console.error("Profile page: Error verifying member_id:", verifyError);
        // If error and user is GUEST, show guest view
        if (userRole === "GUEST") {
          setHasVerifiedSession(true);
          setLoading(false);
        } else {
          // Continue anyway - will fail in loadProfile if there's an issue
          setHasVerifiedSession(true);
          loadProfile();
        }
      }
    };

    verifyAndLoad();
  }, [sessionStatus, router, isRedirecting, hasVerifiedSession]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const [profileData, chaptersData, industriesData, professionsData] =
        await Promise.all([
          fetchMemberProfile(),
          fetchChapters().catch(() => []),
          fetchIndustries().catch(() => []),
          fetchProfessions().catch(() => []),
        ]);

      setProfile(profileData);
      setChapters(chaptersData);
      setIndustries(industriesData);
      setProfessions(professionsData);

      // Check if user is a steward
      try {
        const stewardProfile = await getStewardProfile();
        setIsSteward(true);
        setStewardStatus(stewardProfile.status);
      } catch (err) {
        // Not a steward or error fetching
        setIsSteward(false);
        setStewardStatus(null);
      }

      // Check if user is a seller
      try {
        const sellerProfile = await getSellerProfile();
        setIsSeller(true);
        setSellerStatus(sellerProfile.status);
      } catch (err) {
        // Not a seller or error fetching
        setIsSeller(false);
        setSellerStatus(null);
      }

      // Populate form data
      setFormData({
        name: profileData.name || "",
        initiated_chapter_id:
          profileData.initiated_chapter_id?.toString() || "",
        initiated_season: profileData.initiated_season || "",
        initiated_year: profileData.initiated_year?.toString() || "",
        ship_name: profileData.ship_name || "",
        line_name: profileData.line_name || "",
        location: profileData.location || "",
        address: profileData.address || "",
        address_is_private: profileData.address_is_private,
        phone_number: profileData.phone_number || "",
        phone_is_private: profileData.phone_is_private,
        industry: profileData.industry || "",
        profession_id: profileData.profession_id?.toString() || "",
        job_title: profileData.job_title || "",
        bio: profileData.bio || "",
        social_links: {
          instagram: profileData.social_links?.instagram || "",
          twitter: profileData.social_links?.twitter || "",
          linkedin: profileData.social_links?.linkedin || "",
          website: profileData.social_links?.website || "",
        },
      });

      if (profileData.headshot_url) {
        setHeadshotPreview(profileData.headshot_url);
      }

      // Check for warning in URL params (from steward/seller application)
      const warningParam = searchParams.get("warning");
      if (warningParam) {
        setWarning(decodeURIComponent(warningParam));
        // Clear the warning from URL after displaying
        router.replace("/profile", { scroll: false });
      }

      // Check for success message
      if (searchParams.get("steward_applied") === "true") {
        setSuccess("Steward application submitted successfully!");
        // Clear the success param from URL
        router.replace("/profile", { scroll: false });
      }
    } catch (err: any) {
      console.error("Profile page: Error loading profile:", err.message);

      // If member profile not found, backend may have cleared orphaned member_id
      // Check backend directly and refresh session
      if (
        err.message === "Member profile not found" ||
        err.message?.includes("Member profile not found")
      ) {
        console.log(
          "Profile page: Member profile not found, checking backend state..."
        );
        setIsRedirecting(true); // Set redirect flag immediately to prevent loops
        try {
          // Check backend directly to see current state
          const session = await fetch("/api/auth/session").then((res) =>
            res.json()
          );
          const idToken = (session as any)?.idToken;

          if (idToken) {
            const userResponse = await fetch(`${API_URL}/api/users/me`, {
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
            });

            if (userResponse.ok) {
              const userData = await userResponse.json();
              console.log("Profile page: Backend user data:", {
                member_id: userData.member_id,
                email: userData.email,
              });

              // If backend cleared member_id, refresh session and redirect
              if (!userData.member_id) {
                console.log(
                  "Profile page: Backend has no member_id, refreshing session and redirecting to register"
                );
                await updateSession();
                // Use window.location for a hard redirect to prevent loops
                window.location.href = "/register";
                return;
              } else {
                console.log(
                  "Profile page: Backend still has member_id, but profile fetch failed. Showing error."
                );
              }
            }
          }
        } catch (checkError) {
          console.error("Profile page: Error checking user state:", checkError);
          // If check fails, still redirect
          await updateSession();
          window.location.href = "/register";
          return;
        }
      }

      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleHeadshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError(
          "Invalid file type. Please upload a JPEG, PNG, or WebP image."
        );
        e.target.value = ""; // Clear the input
        return;
      }

      // Validate file size (2MB = 2 * 1024 * 1024 bytes)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        setError("File is too large. Maximum file size is 2MB.");
        e.target.value = ""; // Clear the input
        return;
      }

      // Validate image dimensions
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.onload = () => {
          const MIN_DIMENSION = 200;
          const MAX_DIMENSION = 2000;

          if (img.width < MIN_DIMENSION || img.height < MIN_DIMENSION) {
            setError(
              `Image is too small. Minimum dimensions are ${MIN_DIMENSION}x${MIN_DIMENSION} pixels.`
            );
            e.target.value = ""; // Clear the input
            setHeadshotFile(null);
            setHeadshotPreview(null);
            return;
          }

          if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
            setError(
              `Image is too large. Maximum dimensions are ${MAX_DIMENSION}x${MAX_DIMENSION} pixels.`
            );
            e.target.value = ""; // Clear the input
            setHeadshotFile(null);
            setHeadshotPreview(null);
            return;
          }

          // All validations passed
          setHeadshotFile(file);
          setHeadshotPreview(reader.result as string);
          setError(""); // Clear any previous errors
        };
        img.onerror = () => {
          setError("Invalid image file. Please upload a valid image.");
          e.target.value = "";
          setHeadshotFile(null);
          setHeadshotPreview(null);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    setError('');

    try {
      // Request browser geolocation
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by your browser'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });

      const { latitude, longitude } = position.coords;

      // Call backend to reverse geocode
      const response = await fetch(`${API_URL}/api/location/reverse-geocode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get location information');
      }

      const locationData = await response.json();

      // Auto-fill location and address fields
      setFormData(prev => ({
        ...prev,
        location: locationData.location || '',
        address: locationData.address || '',
      }));

      setError('');
    } catch (err: any) {
      console.error('Error detecting location:', err);
      
      let errorMessage = 'Failed to detect your location.';
      if (err.message?.includes('denied') || err.message?.includes('permission')) {
        errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Location detection timed out. Please try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updateData: any = {
        name: formData.name,
        initiated_chapter_id: formData.initiated_chapter_id
          ? parseInt(formData.initiated_chapter_id)
          : undefined,
        initiated_season: formData.initiated_season || null,
        initiated_year: formData.initiated_year
          ? parseInt(formData.initiated_year)
          : null,
        ship_name: formData.ship_name || null,
        line_name: formData.line_name || null,
        location: formData.location || null,
        address: formData.address || null,
        address_is_private: formData.address_is_private,
        phone_number: formData.phone_number || null,
        phone_is_private: formData.phone_is_private,
        industry: formData.industry || null,
        profession_id: formData.profession_id
          ? parseInt(formData.profession_id)
          : null,
        job_title: formData.job_title || null,
        bio: formData.bio || null,
        social_links: formData.social_links,
      };

      if (headshotFile) {
        updateData.headshot = headshotFile;
      }

      const updatedProfile = await updateMemberProfile(updateData);
      setProfile(updatedProfile);
      setIsEditing(false);
      setHeadshotFile(null);
      setSuccess("Profile updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error updating profile:", err);

      // Handle specific error codes from backend
      let errorMessage = err.message || "Failed to update profile";

      if (
        err.message?.includes("Invalid file type") ||
        err.message?.includes("INVALID_FILE_TYPE")
      ) {
        errorMessage =
          "Invalid file type. Please upload a JPEG, PNG, or WebP image.";
      } else if (
        err.message?.includes("too large") ||
        err.message?.includes("FILE_TOO_LARGE")
      ) {
        errorMessage = "File is too large. Maximum file size is 2MB.";
      } else if (
        err.message?.includes("too small") ||
        err.message?.includes("dimensions")
      ) {
        errorMessage = err.message;
      } else if (err.message?.includes("Invalid image file")) {
        errorMessage = "Invalid image file. Please upload a valid image.";
      }

      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        initiated_chapter_id: profile.initiated_chapter_id?.toString() || "",
        initiated_season: profile.initiated_season || "",
        initiated_year: profile.initiated_year?.toString() || "",
        ship_name: profile.ship_name || "",
        line_name: profile.line_name || "",
        location: profile.location || "",
        address: profile.address || "",
        address_is_private: profile.address_is_private,
        phone_number: profile.phone_number || "",
        phone_is_private: profile.phone_is_private,
        industry: profile.industry || "",
        profession_id: profile.profession_id?.toString() || "",
        job_title: profile.job_title || "",
        bio: profile.bio || "",
        social_links: {
          instagram: profile.social_links?.instagram || "",
          twitter: profile.social_links?.twitter || "",
          linkedin: profile.social_links?.linkedin || "",
          website: profile.social_links?.website || "",
        },
      });
      setHeadshotPreview(profile.headshot_url);
      setHeadshotFile(null);
    }
    setIsEditing(false);
    setError("");
  };

  // Get user role for conditional rendering
  const userRole = (session?.user as any)?.role;

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <Skeleton className="h-10 w-64 mb-8" />
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-6 w-full mb-4" />
          <Skeleton className="h-6 w-3/4" />
        </main>
        <Footer />
      </div>
    );
  }

  // Show simple profile view for GUEST users
  if (userRole === "GUEST") {
    return (
      <div className="min-h-screen bg-cream text-midnight-navy">
        <Header />

        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-midnight-navy mb-2">
              My Profile
            </h1>
            <p className="text-midnight-navy/70">
              Manage your account information
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-midnight-navy">
                Email
              </label>
              <p className="px-4 py-2 text-midnight-navy/70">
                {session?.user?.email || "Not available"}
              </p>
            </div>

            <div className="pt-6 border-t border-frost-gray">
              <h2 className="text-xl font-display font-semibold text-midnight-navy mb-4">
                Account Actions
              </h2>
              <div className="space-y-3">
                <Link
                  href="/orders"
                  className="flex items-center gap-3 px-4 py-3 text-midnight-navy hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <span>View Order History</span>
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-3 text-midnight-navy hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>Account Settings</span>
                </Link>
              </div>
            </div>

            <div className="pt-6 border-t border-frost-gray">
              <h2 className="text-xl font-display font-semibold text-midnight-navy mb-4">
                Become a Member
              </h2>
              <p className="text-midnight-navy/70 mb-4">
                Join the fraternity network to access member-only features,
                connect with brothers, and more.
              </p>
              <Link
                href="/register"
                className="inline-block bg-crimson text-white px-6 py-2 rounded-full font-semibold hover:bg-crimson/90 transition"
              >
                Register as Member
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || "Profile not found"}</p>
            <button
              onClick={() => router.push("/register")}
              className="bg-crimson text-white px-6 py-2 rounded-full font-semibold hover:bg-crimson/90 transition"
            >
              Complete Registration
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-midnight-navy">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-midnight-navy mb-2">
              My Profile
            </h1>
            <p className="text-midnight-navy/70">
              Manage your member information
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-crimson text-white px-6 py-2 rounded-full font-semibold hover:bg-crimson/90 transition"
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Success/Error/Warning Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {success}
          </div>
        )}
        {warning && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
            <p className="font-medium mb-1">⚠️ Important Notice</p>
            <p className="text-sm">{warning}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Steward Status/CTA */}
        {isSteward ? (
          <div className="mb-6 p-4 bg-crimson/10 border border-crimson/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-midnight-navy mb-1">
                  Steward Status
                </h3>
                <p className="text-sm text-midnight-navy/70">
                  {stewardStatus === "APPROVED" ? (
                    <>
                      You are an approved Steward.{" "}
                      <Link
                        href="/steward-dashboard"
                        className="text-crimson hover:underline"
                      >
                        Manage your listings
                      </Link>
                    </>
                  ) : stewardStatus === "PENDING" ? (
                    "Your steward application is pending approval."
                  ) : (
                    "Your steward application was rejected."
                  )}
                </p>
              </div>
              {stewardStatus === "APPROVED" && (
                <Link
                  href="/steward-dashboard"
                  className="bg-crimson text-white px-4 py-2 rounded-full font-semibold hover:bg-crimson/90 transition text-sm"
                >
                  Steward Dashboard
                </Link>
              )}
            </div>
          </div>
        ) : null}

        {/* Seller Status/CTA */}
        {isSeller ? (
          <div className="mb-6 p-4 bg-crimson/10 border border-crimson/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-midnight-navy mb-1">
                  Seller Status
                </h3>
                <p className="text-sm text-midnight-navy/70">
                  {sellerStatus === "APPROVED" ? (
                    <>
                      You are an approved Seller.{" "}
                      <Link
                        href="/seller-dashboard"
                        className="text-crimson hover:underline"
                      >
                        Manage your products
                      </Link>
                    </>
                  ) : sellerStatus === "PENDING" ? (
                    "Your seller application is pending approval."
                  ) : (
                    "Your seller application was rejected."
                  )}
                </p>
              </div>
              {sellerStatus === "APPROVED" && (
                <Link
                  href="/seller-dashboard"
                  className="bg-crimson text-white px-4 py-2 rounded-full font-semibold hover:bg-crimson/90 transition text-sm"
                >
                  Seller Dashboard
                </Link>
              )}
            </div>
          </div>
        ) : (
          profile.verification_status === "VERIFIED" && (
            <div className="mb-6 p-4 bg-cream border border-frost-gray rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-midnight-navy mb-1">
                    Become a Steward
                  </h3>
                  <p className="text-sm text-midnight-navy/70">
                    List legacy fraternity paraphernalia for other verified
                    members. Items are free - recipients only pay shipping,
                    platform fees, and a chapter donation.
                  </p>
                </div>
                <Link
                  href="/steward-setup"
                  className="bg-crimson text-white px-4 py-2 rounded-full font-semibold hover:bg-crimson/90 transition text-sm whitespace-nowrap ml-4"
                >
                  Apply Now
                </Link>
              </div>
            </div>
          )
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-8 space-y-8"
        >
          {/* Headshot */}
          <div>
            <label className="block text-sm font-medium mb-2 text-midnight-navy">
              Profile Photo
            </label>
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-crimson/20 to-aurora-gold/20">
                {headshotPreview ? (
                  <Image
                    src={headshotPreview}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-crimson/40"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              {isEditing && (
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleHeadshotChange}
                    className="hidden"
                    id="headshot-upload"
                  />
                  <label
                    htmlFor="headshot-upload"
                    className="cursor-pointer bg-frost-gray text-midnight-navy px-4 py-2 rounded-lg hover:bg-frost-gray/80 transition inline-block mb-2"
                  >
                    {headshotFile ? "Change Photo" : "Upload Photo"}
                  </label>
                  <p className="text-xs text-midnight-navy/60 mt-1">
                    Accepted formats: JPEG, PNG, WebP
                    <br />
                    Maximum file size: 2MB
                    <br />
                    Recommended dimensions: 200x200 to 2000x2000 pixels
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-display font-semibold text-midnight-navy border-b border-frost-gray pb-2">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">
                  Name *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                  />
                ) : (
                  <p className="px-4 py-2 text-midnight-navy">
                    {profile.name || "Not set"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">
                  Email
                </label>
                <p className="px-4 py-2 text-midnight-navy/70">
                  {profile.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">
                  Membership Number
                </label>
                <div className="px-4 py-2 flex items-center gap-3">
                  <p className="text-midnight-navy/70">
                    {profile.membership_number || "Not set"}
                  </p>
                  {profile.verification_status && (
                    <VerificationStatusBadge
                      status={profile.verification_status}
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">
                  Initiated Chapter *
                </label>
                {isEditing ? (
                  <SearchableSelect
                    options={chapters.map((ch) => ({
                      id: ch.id,
                      label: ch.name,
                      value: ch.id.toString(),
                    }))}
                    value={formData.initiated_chapter_id}
                    onChange={(value) =>
                      setFormData({ ...formData, initiated_chapter_id: value })
                    }
                    placeholder="Select chapter"
                  />
                ) : (
                  <p className="px-4 py-2 text-midnight-navy">
                    {profile.chapter_name || "Not set"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Initiation Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-display font-semibold text-midnight-navy border-b border-frost-gray pb-2">
              Initiation Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">
                  Initiation Season
                </label>
                {isEditing ? (
                  <select
                    value={formData.initiated_season}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        initiated_season: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                  >
                    <option value="">Select season</option>
                    <option value="Fall">Fall</option>
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Winter">Winter</option>
                  </select>
                ) : (
                  <p className="px-4 py-2 text-midnight-navy">
                    {profile.initiated_season || "Not set"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">
                  Initiation Year
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.initiated_year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        initiated_year: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                    placeholder="YYYY"
                  />
                ) : (
                  <p className="px-4 py-2 text-midnight-navy">
                    {profile.initiated_year || "Not set"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">
                  Ship Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.ship_name}
                    onChange={(e) =>
                      setFormData({ ...formData, ship_name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                  />
                ) : (
                  <p className="px-4 py-2 text-midnight-navy">
                    {profile.ship_name || "Not set"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">
                  Line Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.line_name}
                    onChange={(e) =>
                      setFormData({ ...formData, line_name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                  />
                ) : (
                  <p className="px-4 py-2 text-midnight-navy">
                    {profile.line_name || "Not set"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Location & Contact */}
          <div className="space-y-4">
            <h2 className="text-xl font-display font-semibold text-midnight-navy border-b border-frost-gray pb-2">
              Location & Contact
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">
                  Current Location
                </label>
                {isEditing ? (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        className="flex-1 px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                        placeholder="City, State or general location"
                      />
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={detectingLocation}
                        className="px-4 py-2 bg-midnight-navy text-white rounded-lg hover:bg-midnight-navy/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                        title="Detect your current location"
                      >
                        {detectingLocation ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="hidden sm:inline">Detecting...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="hidden sm:inline">Detect</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-midnight-navy/60 mt-1">
                      Click &quot;Detect&quot; to automatically fill your location using your device&apos;s GPS
                    </p>
                  </div>
                ) : (
                  <p className="px-4 py-2 text-midnight-navy">
                    {profile.location || "Not set"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">
                  Address
                </label>
                {isEditing ? (
                  <>
                    <textarea
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy resize-none"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="address_private"
                        checked={formData.address_is_private}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address_is_private: e.target.checked,
                          })
                        }
                        className="rounded border-frost-gray text-crimson focus:ring-crimson"
                      />
                      <label
                        htmlFor="address_private"
                        className="text-sm text-midnight-navy/70"
                      >
                        Keep address private
                      </label>
                    </div>
                  </>
                ) : (
                  <p className="px-4 py-2 text-midnight-navy">
                    {profile.address || "Not set"}
                    {profile.address_is_private && profile.address && (
                      <span className="ml-2 text-xs text-midnight-navy/50">
                        (Private)
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">
                  Phone Number
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone_number: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                      placeholder="(555) 123-4567"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="phone_private"
                        checked={formData.phone_is_private}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phone_is_private: e.target.checked,
                          })
                        }
                        className="rounded border-frost-gray text-crimson focus:ring-crimson"
                      />
                      <label
                        htmlFor="phone_private"
                        className="text-sm text-midnight-navy/70"
                      >
                        Keep phone number private
                      </label>
                    </div>
                  </>
                ) : (
                  <p className="px-4 py-2 text-midnight-navy">
                    {profile.phone_number || "Not set"}
                    {profile.phone_is_private && profile.phone_number && (
                      <span className="ml-2 text-xs text-midnight-navy/50">
                        (Private)
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-display font-semibold text-midnight-navy border-b border-frost-gray pb-2">
              Professional Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">
                  Industry
                </label>
                {isEditing ? (
                  <SearchableSelect
                    options={industries.map((ind) => ({
                      id: ind.id,
                      label: ind.name,
                      value: ind.name,
                    }))}
                    value={formData.industry}
                    onChange={(value) =>
                      setFormData({ ...formData, industry: value })
                    }
                    placeholder="Select your industry"
                  />
                ) : (
                  <p className="px-4 py-2 text-midnight-navy">
                    {profile.industry || "Not set"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">
                  Profession
                </label>
                {isEditing ? (
                  <SearchableSelect
                    options={professions.map((prof) => ({
                      id: prof.id,
                      label: prof.name,
                      value: prof.id.toString(),
                    }))}
                    value={formData.profession_id}
                    onChange={(value) =>
                      setFormData({ ...formData, profession_id: value })
                    }
                    placeholder="Select your profession"
                  />
                ) : (
                  <p className="px-4 py-2 text-midnight-navy">
                    {profile.profession_name || "Not set"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">
                  Job Title
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.job_title}
                    onChange={(e) =>
                      setFormData({ ...formData, job_title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                  />
                ) : (
                  <p className="px-4 py-2 text-midnight-navy">
                    {profile.job_title || "Not set"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy resize-none"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="px-4 py-2 text-midnight-navy whitespace-pre-wrap">
                    {profile.bio || "Not set"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h2 className="text-xl font-display font-semibold text-midnight-navy border-b border-frost-gray pb-2">
              Social Links
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(["instagram", "twitter", "linkedin", "website"] as const).map(
                (platform) => (
                  <div key={platform}>
                    <label className="block text-sm font-medium mb-2 text-midnight-navy capitalize">
                      {platform === "website" ? "Website" : platform}
                    </label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={formData.social_links[platform]}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            social_links: {
                              ...formData.social_links,
                              [platform]: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                        placeholder={`https://${
                          platform === "website"
                            ? "yourwebsite.com"
                            : platform + ".com/username"
                        }`}
                      />
                    ) : (
                      <p className="px-4 py-2 text-midnight-navy">
                        {profile.social_links?.[platform] ? (
                          <a
                            href={profile.social_links[platform]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-crimson hover:underline"
                          >
                            {profile.social_links[platform]}
                          </a>
                        ) : (
                          "Not set"
                        )}
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-4 pt-4 border-t border-frost-gray">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 bg-frost-gray text-midnight-navy px-6 py-3 rounded-full font-semibold hover:bg-frost-gray/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </main>

      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<SkeletonLoader />}>
      <ProfilePageContent />
    </Suspense>
  );
}
