import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  Linking,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Event,
  fetchEvent,
  fetchChapters,
  Chapter,
  fetchEventTypes,
  EventType,
} from "../lib/api";
import { SEED_EVENTS } from "../lib/seedData";
import { COLORS, WEB_URL } from "../lib/constants";
import { getEventFullSizeUrl } from "../lib/imageUtils";
import { useAuth } from "../lib/auth";
import ScreenHeader from "./ScreenHeader";
import VerificationBadge from "./VerificationBadge";
import UserRoleBadges from "./UserRoleBadges";
import EventCountdown from "./EventCountdown";
import PrimaryButton from "./ui/PrimaryButton";
import {
  shareEvent,
  addToCalendar,
  shareToSocial,
  generateSocialShareUrls,
} from "../lib/eventUtils";
import QRCode from "react-native-qrcode-svg";
import { styles } from "./EventDetailStyles";

interface EventDetailProps {
  eventId: number;
  onClose: () => void;
  onRSVP?: (event: Event) => void;
  onEditPress?: (eventId: number) => void;
}

const { width } = Dimensions.get("window");

export default function EventDetail({
  eventId,
  onClose,
  onRSVP,
  onEditPress,
}: EventDetailProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        setError(null);
        setImageLoading(true);

        // Check for seed data first
        const seedEvent = SEED_EVENTS.find(e => e.id === eventId);
        if (seedEvent) {
          console.log("EventDetail: Loaded seed event", seedEvent.title);
          setEvent(seedEvent);
          setChapters([]); 
          setEventTypes([]);
          setLoading(false);
          return;
        }

        const [eventData, chaptersData, eventTypesData] = await Promise.all([
          fetchEvent(eventId),
          fetchChapters().catch(() => []),
          fetchEventTypes().catch(() => []),
        ]);
        setEvent(eventData);
        setChapters(chaptersData);
        setEventTypes(eventTypesData);
      } catch (err) {
        console.error("Error loading event:", err);
        setError("Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  // Reset image loading when event changes
  useEffect(() => {
    if (event?.id) {
      setImageLoading(true);
      shimmerAnim.setValue(0);
    }
  }, [event?.id, event?.image_url]);

  // Shimmer animation for skeleton loader
  useEffect(() => {
    if (imageLoading && event?.image_url) {
      const shimmer = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      shimmer.start();
      return () => shimmer.stop();
    } else {
      shimmerAnim.setValue(0);
    }
  }, [imageLoading, event?.image_url, shimmerAnim]);

  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find((c) => c.id === chapterId);
    return chapter?.name || null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDressCode = (code: string) => {
    const dressCodeMap: Record<string, string> = {
      business: "Business",
      business_casual: "Business Casual",
      formal: "Formal",
      semi_formal: "Semi-Formal",
      kappa_casual: "Kappa Casual",
      greek_encouraged: "Greek Encouraged",
      greek_required: "Greek Required",
      outdoor: "Outdoor",
      athletic: "Athletic",
      comfortable: "Comfortable",
      all_white: "All White",
    };
    return dressCodeMap[code] || code;
  };

  const formatRecurrence = (ruleStr: string | null | undefined) => {
    if (!ruleStr) return null;
    if (ruleStr.includes("FREQ=DAILY")) return "Daily";
    if (ruleStr.includes("FREQ=WEEKLY")) return "Weekly";
    if (ruleStr.includes("FREQ=MONTHLY")) return "Monthly";
    return "Recurring";
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Event Details" onBack={onClose} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.crimson} />
        </View>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Event Details" onBack={onClose} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || "Event not found"}</Text>
        </View>
      </View>
    );
  }

  const sponsoringChapterName = getChapterName(
    event.sponsored_chapter_id || null
  );
  const initiatedChapterName = getChapterName(
    event.promoter_initiated_chapter_id || null
  );

  // Check if user is event owner
  const isEventOwner =
    user?.promoterId === event.promoter_id && event.status === "ACTIVE";
  const isNotPromoter = !isEventOwner;

  // Check if event is virtual
  const virtualEventType = eventTypes.find((et) => et.enum === "VIRTUAL");
  const isVirtualEvent = event.event_type_id === virtualEventType?.id;

  // Show map only if not promoter and not virtual
  const showMap = isNotPromoter && !isVirtualEvent;

  // Generate Google Maps URL
  const getGoogleMapsUrl = () => {
    const location = `${event.location}${
      event.city && event.state ? `, ${event.city}, ${event.state}` : ""
    }`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      location
    )}`;
  };

  const handleOpenMap = async () => {
    const url = getGoogleMapsUrl();
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("Error opening map:", error);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Event Details" onBack={onClose} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Image */}
        <View style={styles.imageContainer}>
          {imageLoading && event?.image_url && (
            <View style={styles.imageSkeleton}>
              <Animated.View
                style={[
                  styles.shimmer,
                  {
                    transform: [
                      {
                        translateX: shimmerAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-width, width],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
          )}
          {event?.image_url ? (
            <Image
              key={`img-${event.id}`}
              source={{
                uri: getEventFullSizeUrl(event.image_url) || event.image_url,
              }}
              style={[styles.image, imageLoading && styles.imageHidden]}
              resizeMode="cover"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name="calendar-outline"
                size={48}
                color={COLORS.midnightNavy}
                style={{ opacity: 0.3 }}
              />
            </View>
          )}
          <View style={styles.fullImageGradient} />

          {/* Event Type Badge Overlay */}
          {event.event_type_id &&
            (() => {
              const eventType = eventTypes.find(
                (et) => et.id === event.event_type_id
              );
              return eventType ? (
                <View style={styles.eventTypePillContainer}>
                  <View style={styles.eventTypePill}>
                    <Text style={styles.eventTypePillText}>
                      {eventType.description}
                    </Text>
                  </View>
                </View>
              ) : null;
            })()}
        </View>
        {/* Event Info */}
        <View style={styles.contentCard}>
          <View style={styles.infoContainer}>
            <Text style={styles.eventTitle}>{event.title}</Text>

            {/* Badges: Sponsoring Chapter */}
            <View style={styles.badgesContainer}>
              {/* Affiliated or Sponsoring Chapters: Brought to you by */}
              {((event.affiliated_chapters && event.affiliated_chapters.length > 0) || 
                sponsoringChapterName) && (
                <VerificationBadge
                  type="affiliated-chapter"
                  chapterName={
                    event.affiliated_chapters && event.affiliated_chapters.length > 0
                      ? event.affiliated_chapters.map((c) => c.name)
                      : (sponsoringChapterName || "")
                  }
                />
              )}
            </View>

            {/* Event Details */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={COLORS.midnightNavy}
                  style={{ opacity: 0.7 }}
                />
                <Text style={styles.detailText}>
                  {formatDate(event.event_date)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={COLORS.midnightNavy}
                  style={{ opacity: 0.7 }}
                />
                <Text style={styles.detailText}>
                  {formatTime(event.event_date)}
                </Text>
              </View>
              {event.is_recurring && (
                <View style={styles.detailRow}>
                  <Ionicons
                    name="repeat-outline"
                    size={20}
                    color={COLORS.crimson}
                  />
                  <Text style={[styles.detailText, { color: COLORS.crimson, fontWeight: '600' }]}>
                    {formatRecurrence(event.recurrence_rule)}
                    {event.recurrence_end_date && ` until ${formatDate(event.recurrence_end_date)}`}
                  </Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={COLORS.midnightNavy}
                  style={{ opacity: 0.7 }}
                />
                <Text style={styles.detailText}>
                  {event.location}
                  {event.city &&
                    event.state &&
                    `, ${event.city}, ${event.state}`}
                </Text>
              </View>
              {event.ticket_price_cents > 0 && (
                <View style={styles.detailRow}>
                  <Ionicons
                    name="ticket-outline"
                    size={20}
                    color={COLORS.crimson}
                  />
                  <Text style={[styles.detailText, styles.priceText]}>
                    ${(event.ticket_price_cents / 100).toFixed(2)}
                  </Text>
                </View>
              )}
              {event.dress_codes && event.dress_codes.length > 0 && (
                <View style={styles.detailRow}>
                  <Ionicons
                    name="shirt-outline"
                    size={20}
                    color={COLORS.midnightNavy}
                    style={{ opacity: 0.7 }}
                  />
                  <View style={styles.dressCodeContainer}>
                    <View style={styles.dressCodeChipWrapper}>
                      {event.dress_codes.map((code) => (
                        <View key={code} style={styles.dressCodeChip}>
                          <Text style={styles.dressCodeChipText}>
                            {formatDressCode(code)}
                          </Text>
                        </View>
                      ))}
                    </View>
                    {event.dress_code_notes && (
                      <Text style={styles.dressCodeNotes}>
                        {event.dress_code_notes}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Description */}
            {event.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.description}>{event.description}</Text>
              </View>
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Promoter info */}
            {event.promoter_name && (
              <View style={styles.promoterContainer}>
                <View style={styles.promoterCard}>
                  <Text style={styles.promoterSectionLabel}>Promoter</Text>
                  <View style={styles.promoterContent}>
                    <View style={styles.promoterAvatar}>
                      <Text style={styles.promoterAvatarText}>
                        {event.promoter_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.promoterInfo}>
                      <View style={styles.promoterNameRow}>
                        <Text style={styles.promoterLabel}>
                          Promoted by{" "}
                          {event.promoter_fraternity_member_id
                            ? "Brother "
                            : ""}
                          {event.promoter_name}
                        </Text>
                        {/* Role badges - show all applicable roles */}
                        {(event.is_fraternity_member !== undefined ||
                          event.is_promoter !== undefined) && (
                          <UserRoleBadges
                            is_member={event.is_fraternity_member}
                            is_seller={event.is_seller}
                            is_promoter={event.is_promoter}
                            is_steward={event.is_steward}
                            size="md"
                          />
                        )}
                      </View>

                      {/* Verification badges under name */}
                      {event.promoter_fraternity_member_id && (
                        <View style={styles.promoterBadgesContainer}>
                          <VerificationBadge type="brother" />
                          {event.promoter_initiated_chapter_id && (
                            <VerificationBadge
                              type="initiated-chapter"
                              chapterName={
                                initiatedChapterName ||
                                `Chapter ${event.promoter_initiated_chapter_id}`
                              }
                              season={event.promoter_initiated_season || null}
                              year={event.promoter_initiated_year || null}
                            />
                          )}
                        </View>
                      )}

                      <Text style={styles.promoterDisclaimer}>
                        This event is organized by the host and is not managed,
                        endorsed, or certified by 1Kappa or any national
                        organization.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Event Countdown */}
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownLabel}>Time Remaining</Text>
              <EventCountdown eventDate={event.event_date} />
            </View>

            {/* Google Map - Show for non-promoters viewing non-virtual events */}
            {showMap && (
              <View style={styles.mapContainer}>
                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={handleOpenMap}
                  activeOpacity={0.8}
                >
                  <View style={styles.mapPlaceholder}>
                    <Ionicons
                      name="map-outline"
                      size={32}
                      color={COLORS.crimson}
                    />
                    <Text style={styles.mapText}>View on Google Maps</Text>
                    <Text style={styles.mapLocationText}>
                      {event.location}
                      {event.city &&
                        event.state &&
                        `, ${event.city}, ${event.state}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              {isEventOwner ? (
                // Promoter owns active event: Edit and Share buttons
                <>
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      styles.actionButton,
                      styles.buttonWithSpacing,
                    ]}
                    onPress={() => {
                      if (onEditPress) {
                        onEditPress(event.id);
                      } else {
                        console.log("Edit event:", event.id);
                      }
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="create-outline"
                      size={20}
                      color={COLORS.white}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.primaryButtonText}>Edit Event</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.secondaryButton,
                      styles.actionButton,
                      styles.buttonWithSpacing,
                    ]}
                    onPress={() => setShowFlyerModal(true)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="eye-outline"
                      size={20}
                      color={COLORS.crimson}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.secondaryButtonText}>View Flyer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      styles.actionButton,
                      styles.shareButton,
                    ]}
                    onPress={() => setShowShareModal(true)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="share-outline"
                      size={20}
                      color={COLORS.white}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.primaryButtonText}>Share</Text>
                  </TouchableOpacity>
                </>
              ) : (
                // Non-promoter: Share, Add to Calendar, Message Promoter (disabled)
                <>
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      styles.actionButton,
                      styles.buttonWithSpacing,
                    ]}
                    onPress={() => setShowShareModal(true)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="share-outline"
                      size={20}
                      color={COLORS.white}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.primaryButtonText}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.secondaryButton,
                      styles.actionButton,
                      styles.buttonWithSpacing,
                    ]}
                    onPress={() => setShowFlyerModal(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="eye-outline"
                      size={20}
                      color={COLORS.crimson}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.secondaryButtonText}>View Flyer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.secondaryButton,
                      styles.actionButton,
                      styles.buttonWithSpacing,
                    ]}
                    onPress={() => setShowCalendarModal(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={COLORS.crimson}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.secondaryButtonText}>
                      Add to Calendar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.disabledButton, styles.actionButton]}
                    disabled={true}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={COLORS.midnightNavy}
                      style={{ marginRight: 8, opacity: 0.5 }}
                    />
                    <Text style={styles.disabledButtonText}>
                      Message Promoter
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
        {/* end of contentCard */}
      </ScrollView>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowShareModal(false);
          setShowQRCode(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Event</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowShareModal(false);
                  setShowQRCode(false);
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.midnightNavy} />
              </TouchableOpacity>
            </View>

            {!showQRCode ? (
              <ScrollView style={styles.shareOptionsContainer}>
                {/* Native Share */}
                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={async () => {
                    await shareEvent(event);
                    setShowShareModal(false);
                  }}
                >
                  <Ionicons
                    name="share-outline"
                    size={24}
                    color={COLORS.crimson}
                  />
                  <Text style={styles.shareOptionText}>Share via...</Text>
                </TouchableOpacity>

                {/* Social Media Options */}
                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={async () => {
                    await shareToSocial(event, "facebook");
                    setShowShareModal(false);
                  }}
                >
                  <Ionicons
                    name="logo-facebook"
                    size={24}
                    color={COLORS.crimson}
                  />
                  <Text style={styles.shareOptionText}>Facebook</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={async () => {
                    await shareToSocial(event, "twitter");
                    setShowShareModal(false);
                  }}
                >
                  <Ionicons
                    name="logo-twitter"
                    size={24}
                    color={COLORS.crimson}
                  />
                  <Text style={styles.shareOptionText}>Twitter/X</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={async () => {
                    await shareToSocial(event, "linkedin");
                    setShowShareModal(false);
                  }}
                >
                  <Ionicons
                    name="logo-linkedin"
                    size={24}
                    color={COLORS.crimson}
                  />
                  <Text style={styles.shareOptionText}>LinkedIn</Text>
                </TouchableOpacity>

                {/* QR Code */}
                <View style={styles.shareSectionDivider} />
                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={() => setShowQRCode(true)}
                >
                  <Ionicons
                    name="qr-code-outline"
                    size={24}
                    color={COLORS.crimson}
                  />
                  <Text style={styles.shareOptionText}>Show QR Code</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={styles.qrCodeContainer}>
                <Text style={styles.qrCodeTitle}>Scan to view event</Text>
                <View style={styles.qrCodeWrapper}>
                  <QRCode
                    value={`${WEB_URL}/event/${event.id}`}
                    size={250}
                    color={COLORS.midnightNavy}
                    backgroundColor={COLORS.white}
                  />
                </View>
                <Text style={styles.qrCodeUrl}>
                  {WEB_URL}/event/{event.id}
                </Text>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setShowQRCode(false)}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendarModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add to Calendar</Text>
              <TouchableOpacity
                onPress={() => setShowCalendarModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.midnightNavy} />
              </TouchableOpacity>
            </View>

            <View style={styles.shareOptionsContainer}>
              <TouchableOpacity
                style={styles.shareOption}
                onPress={async () => {
                  await addToCalendar(event, "google");
                  setShowCalendarModal(false);
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={24}
                  color={COLORS.crimson}
                />
                <Text style={styles.shareOptionText}>Google Calendar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOption}
                onPress={async () => {
                  await addToCalendar(event, "apple");
                  setShowCalendarModal(false);
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={24}
                  color={COLORS.crimson}
                />
                <Text style={styles.shareOptionText}>Apple Calendar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOption}
                onPress={async () => {
                  await addToCalendar(event, "outlook");
                  setShowCalendarModal(false);
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={24}
                  color={COLORS.crimson}
                />
                <Text style={styles.shareOptionText}>Outlook Calendar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Flyer Modal */}
      <Modal
        visible={showFlyerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFlyerModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0, 0, 0, 0.9)" }]}>
          <TouchableOpacity
            style={{
              position: "absolute",
              top: insets.top + 10,
              right: 20,
              zIndex: 10,
              padding: 10,
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: 25,
            }}
            onPress={() => setShowFlyerModal(false)}
          >
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            {event.image_url ? (
              <Image
                source={{ uri: getEventFullSizeUrl(event.image_url) || event.image_url }}
                style={{ width: width, height: "80%" }}
                resizeMode="contain"
              />
            ) : (
              <Text style={{ color: COLORS.white }}>No flyer available</Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
