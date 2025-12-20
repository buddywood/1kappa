"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  updateEvent,
  fetchEvent,
  getPromoterProfile,
  fetchChapters,
  fetchEventTypes,
  fetchEventAudienceTypes,
  type Promoter,
  type Chapter,
  type EventType,
  type EventAudienceType,
  type Event,
} from "@/lib/api";
import MultiSearchableSelect from "../../../../components/MultiSearchableSelect";
import { SkeletonLoader } from "../../../../components/SkeletonLoader";
import AddressAutocomplete from "../../../../components/AddressAutocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getEventFullSizeUrl } from "@/lib/imageUtils";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id ? parseInt(params.id as string) : null;
  const [event, setEvent] = useState<Event | null>(null);
  const [promoter, setPromoter] = useState<Promoter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [audienceTypes, setAudienceTypes] = useState<EventAudienceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [affiliatedChapterIds, setAffiliatedChapterIds] = useState<number[]>([]);
  const [selectedEventTypeId, setSelectedEventTypeId] = useState<number | null>(
    null
  );
  const [selectedAudienceTypeId, setSelectedAudienceTypeId] = useState<
    number | null
  >(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
    city: "",
    state: "",
    event_link: "",
    all_day: false,
    duration_hours: "",
    duration_minutes: "",
    is_featured: false,
    ticket_price: "",
    dress_codes: ["business_casual"],
    dress_code_notes: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!eventId) {
        setError("Invalid event ID");
        setLoading(false);
        return;
      }

      try {
        const [
          eventData,
          promoterData,
          chaptersData,
          eventTypesData,
          audienceTypesData,
        ] = await Promise.all([
          fetchEvent(eventId),
          getPromoterProfile().catch(() => null),
          fetchChapters().catch(() => []),
          fetchEventTypes().catch(() => []),
          fetchEventAudienceTypes().catch(() => []),
        ]);

        // Verify event is active
        if (eventData.status !== "ACTIVE") {
          setError("Only active events can be edited");
          setLoading(false);
          return;
        }

        // Verify user owns the event
        if (promoterData && eventData.promoter_id !== promoterData.id) {
          setError("You can only edit your own events");
          setLoading(false);
          return;
        }

        if (promoterData && promoterData.status !== "APPROVED") {
          setError("You must be an approved promoter to edit events");
          setLoading(false);
          return;
        }

        setEvent(eventData);
        setPromoter(promoterData);
        setChapters(chaptersData);
        setEventTypes(eventTypesData);
        setAudienceTypes(audienceTypesData);

        // Pre-populate form with event data
        const eventDate = new Date(eventData.event_date);
        const dateStr = eventDate.toISOString().split("T")[0];
        const timeStr = eventDate.toTimeString().slice(0, 5);

        if (eventData.affiliated_chapters && eventData.affiliated_chapters.length > 0) {
          setAffiliatedChapterIds(eventData.affiliated_chapters.map(c => c.id));
        } else if (eventData.sponsored_chapter_id) {
          setAffiliatedChapterIds([eventData.sponsored_chapter_id]);
        }

        setSelectedEventTypeId(eventData.event_type_id);
        setSelectedAudienceTypeId(eventData.event_audience_type_id);

        const durationMinutes = eventData.duration_minutes || 0;
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;

        setFormData({
          title: eventData.title || "",
          description: eventData.description || "",
          event_date: dateStr,
          event_time: timeStr,
          location: eventData.location || "",
          city: eventData.city || "",
          state: eventData.state || "",
          event_link: eventData.event_link || "",
          all_day: eventData.all_day || false,
          duration_hours: hours.toString(),
          duration_minutes: minutes.toString(),
          is_featured: eventData.is_featured || false,
          ticket_price: eventData.ticket_price_cents
            ? (eventData.ticket_price_cents / 100).toFixed(2)
            : "",
          dress_codes: eventData.dress_codes || ["business_casual"],
          dress_code_notes: eventData.dress_code_notes || "",
        });

        if (eventData.image_url) {
          setExistingImageUrl(getEventFullSizeUrl(eventData.image_url));
        }
      } catch (err: any) {
        console.error("Error loading data:", err);
        if (
          err.message === "Not authenticated" ||
          err.message === "Promoter access required"
        ) {
          router.push("/login");
          return;
        }
        setError(err.message || "Failed to load event");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [eventId, router]);

  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("File must be an image");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) {
      setError("Invalid event ID");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Combine date and time
      let eventDateTime: string;
      if (formData.all_day) {
        // For all-day events, use noon as default time
        eventDateTime = formData.event_date
          ? `${formData.event_date}T12:00:00`
          : "";
      } else {
        // For timed events, require both date and time
        eventDateTime =
          formData.event_date && formData.event_time
            ? `${formData.event_date}T${formData.event_time}:00`
            : formData.event_date
            ? `${formData.event_date}T12:00:00`
            : "";
      }

      if (!eventDateTime) {
        throw new Error("Event date is required");
      }

      if (!formData.all_day && !formData.event_time) {
        throw new Error("Event time is required for non-all-day events");
      }

      if (!selectedEventTypeId) {
        throw new Error("Event type is required");
      }

      if (!selectedAudienceTypeId) {
        throw new Error("Event audience type is required");
      }

      if (affiliatedChapterIds.length === 0) {
        throw new Error("At least one affiliated chapter is required");
      }

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("event_date", eventDateTime);
      formDataToSend.append("location", formData.location);

      if (formData.city) {
        formDataToSend.append("city", formData.city);
      }
      if (formData.state) {
        formDataToSend.append("state", formData.state);
      }

      if (formData.event_link) {
        formDataToSend.append("event_link", formData.event_link);
      }

      if (formData.is_featured) {
        formDataToSend.append("is_featured", "true");
      }

      // Use the first affiliated chapter as the primary sponsored chapter for backward compatibility
      formDataToSend.append(
        "sponsoring_chapter_id",
        affiliatedChapterIds[0].toString()
      );

      // Append all affiliated chapters
      affiliatedChapterIds.forEach((id) => {
        formDataToSend.append("affiliated_chapter_ids[]", id.toString());
      });

      formDataToSend.append("event_type_id", selectedEventTypeId!.toString());

      formDataToSend.append(
        "event_audience_type_id",
        selectedAudienceTypeId!.toString()
      );

      // Append dress codes as array
      formData.dress_codes.forEach((code) => {
        formDataToSend.append("dress_codes[]", code);
      });
      if (formData.dress_code_notes) {
        formDataToSend.append("dress_code_notes", formData.dress_code_notes);
      }

      // Handle all day and duration
      formDataToSend.append("all_day", formData.all_day.toString());
      if (!formData.all_day) {
        // Calculate duration in minutes from hours and minutes
        const hours = parseInt(formData.duration_hours) || 0;
        const minutes = parseInt(formData.duration_minutes) || 0;
        const totalMinutes = hours * 60 + minutes;
        if (totalMinutes > 0) {
          formDataToSend.append("duration_minutes", totalMinutes.toString());
        }
      }

      if (formData.ticket_price) {
        const priceCents = Math.round(parseFloat(formData.ticket_price) * 100);
        if (isNaN(priceCents) || priceCents < 0) {
          throw new Error("Please enter a valid ticket price");
        }
        formDataToSend.append("ticket_price_cents", priceCents.toString());
      } else {
        formDataToSend.append("ticket_price_cents", "0");
      }

      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      const result = await updateEvent(eventId, formDataToSend);

      // If featured event requires payment, redirect to Stripe checkout
      if (result.checkout_url && result.requires_payment) {
        window.location.href = result.checkout_url;
        return;
      }

      router.push(`/event/${eventId}`);
    } catch (err: any) {
      console.error("Error updating event:", err);
      setError(err.message || "Failed to update event");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error && !event) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-4">
            {error}
          </h1>
          <Button onClick={() => router.push("/promoter-dashboard/events")}>
            Back to Events
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-2">
          Edit Event
        </h1>
        <p className="text-lg text-midnight-navy/70 dark:text-gray-400 mb-8">
          Update your event details
        </p>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Image */}
          <div>
            <Label htmlFor="image">Event Image or Flyer (Optional)</Label>
            <div className="mt-2">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ) : existingImageUrl ? (
                <div className="relative">
                  <img
                    src={existingImageUrl}
                    alt="Current event image"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setExistingImageUrl(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                  <p className="text-sm text-midnight-navy/60 dark:text-gray-400 mt-2">
                    Click below to replace this image
                  </p>
                </div>
              ) : null}
              {!imagePreview && (
                <label
                  className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition ${
                    isDragging
                      ? "border-crimson bg-crimson/5 dark:bg-crimson/10"
                      : "border-frost-gray dark:border-gray-700 hover:bg-cream/50 dark:hover:bg-gray-800/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className={`w-10 h-10 mb-3 ${
                        isDragging
                          ? "text-crimson"
                          : "text-midnight-navy/40 dark:text-gray-500"
                      }`}
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
                    <p className="mb-2 text-sm text-midnight-navy/60 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-midnight-navy/50 dark:text-gray-500">
                      PNG, JPG or GIF (MAX. 5MB)
                    </p>
                  </div>
                  <input
                    id="image"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Annual Kappa Gala"
              required
              className="mt-2"
            />
          </div>

          {/* Event Type */}
          <div>
            <Label htmlFor="event_type">Event Type *</Label>
            <select
              id="event_type"
              value={selectedEventTypeId || ""}
              onChange={(e) =>
                setSelectedEventTypeId(
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              required
              className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select an event type</option>
              {eventTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.description}
                </option>
              ))}
            </select>
          </div>

          {/* Event Audience Type */}
          <div>
            <Label htmlFor="event_audience_type">Event Audience *</Label>
            <select
              id="event_audience_type"
              value={selectedAudienceTypeId || ""}
              onChange={(e) =>
                setSelectedAudienceTypeId(
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              required
              className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select an audience type</option>
              {audienceTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.description}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Tell attendees what to expect..."
              rows={4}
              className="mt-2"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event_date">Event Date *</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) =>
                  setFormData({ ...formData, event_date: e.target.value })
                }
                required
                className="mt-2"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <Label htmlFor="event_time">
                Event Time {formData.all_day ? "" : "*"}
              </Label>
              <Input
                id="event_time"
                type="time"
                value={formData.event_time}
                onChange={(e) =>
                  setFormData({ ...formData, event_time: e.target.value })
                }
                required={!formData.all_day}
                disabled={formData.all_day}
                className="mt-2"
              />
            </div>
          </div>

          {/* All Day Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="all_day"
              checked={formData.all_day}
              onChange={(e) =>
                setFormData({ ...formData, all_day: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-crimson focus:ring-crimson"
            />
            <Label htmlFor="all_day" className="cursor-pointer">
              All Day Event
            </Label>
          </div>

          {/* Duration (only show if not all day) */}
          {!formData.all_day && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration_hours">Duration (Hours)</Label>
                <Input
                  id="duration_hours"
                  type="number"
                  min="0"
                  max="23"
                  value={formData.duration_hours}
                  onChange={(e) =>
                    setFormData({ ...formData, duration_hours: e.target.value })
                  }
                  placeholder="0"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="duration_minutes">Duration (Minutes)</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={formData.duration_minutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration_minutes: e.target.value,
                    })
                  }
                  placeholder="0"
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {/* Location with Google Places Autocomplete */}
          <AddressAutocomplete
            location={formData.location}
            onLocationChange={(value) =>
              setFormData({ ...formData, location: value })
            }
            required
          />

          {/* Event URL */}
          <div>
            <Label htmlFor="event_link">Event URL (Optional)</Label>
            <Input
              id="event_link"
              type="url"
              value={formData.event_link}
              onChange={(e) =>
                setFormData({ ...formData, event_link: e.target.value })
              }
              placeholder="https://example.com/event"
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Link to event registration, tickets, or more information
            </p>
          </div>

          {/* Sponsored Chapter */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="chapter">Affiliated Chapters *</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-midnight-navy/40 hover:text-midnight-navy dark:text-gray-500 dark:hover:text-gray-300"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold mb-1">Affiliated Chapters</p>
                    <p className="text-sm">
                      Select one or more chapters affiliated with this event. 
                      The first selected chapter will be marked as the primary sponsor.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <MultiSearchableSelect
              options={chapters.map((chapter) => ({
                id: chapter.id,
                label: chapter.name,
                value: chapter.id,
              }))}
              value={affiliatedChapterIds}
              onChange={(value) =>
                setAffiliatedChapterIds(value.map(v => typeof v === 'string' ? parseInt(v) : v))
              }
              placeholder="Select chapters"
              className="mt-2"
            />
          </div>

          {/* Ticket Price */}
          <div>
            <Label htmlFor="ticket_price">Ticket Price (Optional)</Label>
            <Input
              id="ticket_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.ticket_price}
              onChange={(e) =>
                setFormData({ ...formData, ticket_price: e.target.value })
              }
              placeholder="0.00"
              className="mt-2"
            />
            <p className="text-sm text-midnight-navy/60 dark:text-gray-400 mt-1">
              Leave empty for free events
            </p>
          </div>

          {/* Dress Code */}
          <div>
            <Label>Dress Code *</Label>
            <TooltipProvider>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  {
                    value: "business",
                    label: "Business",
                    description:
                      "Professional business attire: suits, blazers, dress pants, and formal business dresses.",
                  },
                  {
                    value: "business_casual",
                    label: "Business Casual",
                    description:
                      "Smart casual attire: collared shirts, khakis, dress pants, blouses, and casual blazers. No jeans or sneakers.",
                  },
                  {
                    value: "formal",
                    label: "Formal",
                    description:
                      "Black tie or formal evening wear: tuxedos, formal gowns, cocktail dresses.",
                  },
                  {
                    value: "semi_formal",
                    label: "Semi-Formal",
                    description:
                      "Dressy casual to formal: suits, dress pants with blazers, cocktail dresses, or elegant separates.",
                  },
                  {
                    value: "kappa_casual",
                    label: "Kappa Casual",
                    description:
                      "Kappa Alpha Psi branded or themed casual wear. Show your fraternity pride with Kappa apparel.",
                  },
                  {
                    value: "greek_encouraged",
                    label: "Greek Encouraged",
                    description:
                      "Greek letter organization attire is welcome but not required. Wear your letters with pride!",
                  },
                  {
                    value: "greek_required",
                    label: "Greek Required",
                    description:
                      "Greek letter organization attire is required. Only members of Greek organizations should attend.",
                  },
                  {
                    value: "outdoor",
                    label: "Outdoor",
                    description:
                      "Weather-appropriate outdoor attire: comfortable shoes, layers, and clothing suitable for outdoor activities.",
                  },
                  {
                    value: "athletic",
                    label: "Athletic",
                    description:
                      "Activewear and athletic clothing: sneakers, athletic pants, sports jerseys, and comfortable workout attire.",
                  },
                  {
                    value: "comfortable",
                    label: "Comfortable",
                    description:
                      "Casual and comfortable clothing: jeans, t-shirts, sneakers, and relaxed everyday wear.",
                  },
                  {
                    value: "all_white",
                    label: "All White",
                    description:
                      "All-white attire required. A classic tradition for many fraternity and social events.",
                  },
                ].map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2 group"
                  >
                    <input
                      type="checkbox"
                      id={`dress_code_${option.value}`}
                      checked={formData.dress_codes.includes(
                        option.value as any
                      )}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            dress_codes: [
                              ...formData.dress_codes,
                              option.value as any,
                            ],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            dress_codes: formData.dress_codes.filter(
                              (code) => code !== option.value
                            ),
                          });
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-crimson focus:ring-crimson"
                    />
                    <Label
                      htmlFor={`dress_code_${option.value}`}
                      className="cursor-pointer text-sm flex-1"
                    >
                      {option.label}
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-midnight-navy/40 hover:text-midnight-navy dark:text-gray-500 dark:hover:text-gray-300"
                          onClick={(e) => e.preventDefault()}
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold mb-1">{option.label}</p>
                        <p className="text-sm">{option.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </div>
            </TooltipProvider>
            {formData.dress_codes.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                Please select at least one dress code
              </p>
            )}
          </div>

          {/* Dress Code Notes */}
          <div>
            <Label htmlFor="dress_code_notes">
              Dress Code Notes (Optional)
            </Label>
            <Textarea
              id="dress_code_notes"
              value={formData.dress_code_notes}
              onChange={(e) =>
                setFormData({ ...formData, dress_code_notes: e.target.value })
              }
              placeholder="Additional dress code details..."
              rows={3}
              className="mt-2"
            />
          </div>

          {/* Feature Event */}
          <div className="flex items-start space-x-3 p-4 border border-frost-gray dark:border-gray-800 rounded-lg bg-cream/50 dark:bg-gray-900/50">
            <input
              type="checkbox"
              id="is_featured"
              checked={formData.is_featured}
              onChange={(e) =>
                setFormData({ ...formData, is_featured: e.target.checked })
              }
              className="h-5 w-5 rounded border-gray-300 text-crimson focus:ring-crimson mt-0.5"
            />
            <div className="flex-1">
              <Label htmlFor="is_featured" className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Feature this event</span>
                  <span className="text-sm text-crimson font-semibold">
                    $10
                  </span>
                </div>
                <p className="text-sm text-midnight-navy/60 dark:text-gray-400 mt-1">
                  {event?.featured_payment_status === "PAID"
                    ? "This event is already featured and paid. Unchecking will remove the featured status."
                    : "Feature your event in the featured events section to get more visibility. Payment will be collected after saving changes."}
                </p>
              </Label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Event...
                </>
              ) : (
                "Update Event"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/event/${eventId}`)}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

