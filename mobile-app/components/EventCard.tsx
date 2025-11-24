import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../lib/constants";
import { getEventThumbnailUrl } from "../lib/imageUtils";
import styles from "./EventsScreenStyles";

const { width } = Dimensions.get("window");

interface EventCardProps {
  event: any;
  onPress?: (event: any) => void;
  formatDate: (dateString: string) => string;
  formatTime: (dateString: string) => string;
  distanceMiles?: number;
}

export default function EventCard({
  event,
  onPress,
  formatDate,
  formatTime,
  distanceMiles,
}: EventCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const date = new Date(event.event_date);
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = date.getDate();

  // Reset image loading state when event changes
  useEffect(() => {
    setImageLoading(true);
    shimmerAnim.setValue(0);
  }, [event.id, event.image_url]);

  // Shimmer animation for skeleton loader
  useEffect(() => {
    if (imageLoading && event.image_url) {
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
  }, [imageLoading, event.image_url, shimmerAnim]);

  return (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => onPress?.(event)}
      activeOpacity={0.85}
    >
      <View style={styles.eventImageWrapper}>
        {imageLoading && event.image_url && (
          <View style={styles.eventImageSkeleton}>
            <Animated.View
              style={[
                styles.eventImageShimmer,
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
        {event.image_url ? (
          <Image
            key={`${event.id}-${event.image_url}`}
            source={{
              uri: getEventThumbnailUrl(event.image_url) || event.image_url,
            }}
            style={[styles.eventImage, imageLoading && styles.eventImageHidden]}
            resizeMode="cover"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
          />
        ) : (
          <View style={[styles.eventImage, styles.eventImagePlaceholder]}>
            <Ionicons
              name="calendar-outline"
              size={28}
              color={COLORS.midnightNavy}
            />
            <Text style={styles.eventImagePlaceholderText}>Event</Text>
          </View>
        )}

        <View style={styles.eventImageOverlay} />

        <View style={styles.eventTopRow}>
          <View style={styles.eventDateBadge}>
            <Text style={styles.eventDateMonth}>{month}</Text>
            <Text style={styles.eventDateDay}>{day}</Text>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            {event.ticket_price_cents > 0 && (
              <View style={styles.eventPriceBadge}>
                <Ionicons
                  name="ticket-outline"
                  size={14}
                  color={COLORS.white}
                />
                <Text style={styles.eventPriceBadgeText}>
                  ${(event.ticket_price_cents / 100).toFixed(0)}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => console.log("Bookmark", event.title)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name="bookmark-outline"
                size={18}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.eventTitleOverlay}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {event.title}
          </Text>
          {event.chapter_name && (
            <Text style={styles.eventChapterText} numberOfLines={1}>
              {event.chapter_name}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.eventContent}>
        <View style={styles.eventDetails}>
          <View style={styles.eventDetailRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={COLORS.midnightNavy}
            />
            <Text style={styles.eventDetailText}>
              {formatDate(event.event_date)} · {formatTime(event.event_date)}
            </Text>
          </View>

          <View style={styles.eventDetailRow}>
            <Ionicons
              name="location-outline"
              size={16}
              color={COLORS.midnightNavy}
            />
            <Text style={styles.eventDetailText} numberOfLines={1}>
              {event.location}
              {event.city && event.state && `, ${event.city}, ${event.state}`}
            </Text>
          </View>
        </View>

        {event.description && (
          <Text style={styles.eventDescription} numberOfLines={2}>
            {event.description}
          </Text>
        )}

        {distanceMiles != null && (
          <Text style={styles.eventDistanceLabel}>
            {distanceMiles.toFixed(1)} miles away
          </Text>
        )}

        {/* Divider */}
        <View style={styles.eventDivider} />

        <View style={styles.eventFooterRow}>
          <View style={styles.eventTagPill}>
            <Ionicons
              name="people-outline"
              size={14}
              color={COLORS.midnightNavy}
            />
            <Text style={styles.eventTagText}>
              {event.event_audience_type_description ||
                (event.chapter_name
                  ? "Hosted by chapter"
                  : "Open to all members")}
            </Text>
          </View>

          <Text style={styles.eventCtaText}>View details →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
