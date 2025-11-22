import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../lib/auth';
import { API_URL, COLORS } from '../lib/constants';

interface MemberProfile {
  id: number;
  name: string;
  email: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW';
  chapter_name?: string;
  initiated_year?: number;
  membership_number?: string;
}

interface MemberMetrics {
  totalClaims: number;
  totalDonationsCents: number;
  paidDonationsCents: number;
  totalPurchases: number;
  totalSpentCents: number;
  paidSpentCents: number;
}

interface MemberDashboardScreenProps {
  onBack: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToSellerSetup?: () => void;
  onNavigateToPromoterSetup?: () => void;
  onNavigateToStewardSetup?: () => void;
}

export default function MemberDashboardScreen({
  onBack,
  onNavigateToProfile,
  onNavigateToSellerSetup,
  onNavigateToPromoterSetup,
  onNavigateToStewardSetup,
}: MemberDashboardScreenProps) {
  const { user, token, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [metrics, setMetrics] = useState<MemberMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && token && user?.memberId) {
      loadDashboard();
    } else {
      setError('Please sign in to view your member dashboard');
      setLoading(false);
    }
  }, [isAuthenticated, token, user]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const [profileRes, metricsRes] = await Promise.all([
        fetch(`${API_URL}/api/members/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/api/members/me/metrics`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
      ]);

      if (!profileRes.ok) {
        throw new Error('Failed to load member profile');
      }

      const profileData = await profileRes.json();
      setProfile(profileData);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return '#10b981'; // green
      case 'PENDING':
        return '#f59e0b'; // yellow
      case 'MANUAL_REVIEW':
        return '#3b82f6'; // blue
      case 'FAILED':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getVerificationStatusText = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'Verified';
      case 'PENDING':
        return 'Pending Verification';
      case 'MANUAL_REVIEW':
        return 'Under Review';
      case 'FAILED':
        return 'Verification Failed';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Member Dashboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC143C" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Member Dashboard</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Member Dashboard</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        {profile && (
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>
              Welcome back, {profile.name || 'Brother'}!
            </Text>
            <View style={styles.verificationBadge}>
              <View
                style={[
                  styles.verificationDot,
                  { backgroundColor: getVerificationStatusColor(profile.verification_status) },
                ]}
              />
              <Text style={styles.verificationText}>
                {getVerificationStatusText(profile.verification_status)}
              </Text>
            </View>
          </View>
        )}

        {/* Stats Section */}
        {metrics && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Your Activity</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {formatPrice(metrics.paidDonationsCents)}
                </Text>
                <Text style={styles.statLabel}>Total Donations</Text>
                <Text style={styles.statSubtext}>
                  {metrics.totalClaims} item{metrics.totalClaims !== 1 ? 's' : ''} claimed
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {formatPrice(metrics.paidSpentCents)}
                </Text>
                <Text style={styles.statLabel}>Total Purchases</Text>
                <Text style={styles.statSubtext}>
                  {metrics.totalPurchases} purchase{metrics.totalPurchases !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Chapter Info */}
        {profile && profile.chapter_name && (
          <View style={styles.chapterSection}>
            <Text style={styles.sectionTitle}>Chapter</Text>
            <View style={styles.chapterCard}>
              <Text style={styles.chapterName}>{profile.chapter_name}</Text>
              {profile.initiated_year && (
                <Text style={styles.chapterYear}>
                  Initiated {profile.initiated_year}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Role Transition Section */}
        <View style={styles.rolesSection}>
          <Text style={styles.sectionTitle}>Become a...</Text>
          {!user?.is_seller && (
            <TouchableOpacity
              style={styles.roleCard}
              onPress={onNavigateToSellerSetup}
            >
              <Text style={styles.roleCardTitle}>Seller</Text>
              <Text style={styles.roleCardDescription}>
                Start selling Kappa merchandise
              </Text>
            </TouchableOpacity>
          )}
          {!user?.is_promoter && (
            <TouchableOpacity
              style={styles.roleCard}
              onPress={onNavigateToPromoterSetup}
            >
              <Text style={styles.roleCardTitle}>Promoter</Text>
              <Text style={styles.roleCardDescription}>
                Create and promote events
              </Text>
            </TouchableOpacity>
          )}
          {!user?.is_steward && (
            <TouchableOpacity
              style={styles.roleCard}
              onPress={onNavigateToStewardSetup}
            >
              <Text style={styles.roleCardTitle}>Steward</Text>
              <Text style={styles.roleCardDescription}>
                List legacy items and support chapters
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Link */}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={onNavigateToProfile}
        >
          <Text style={styles.profileButtonText}>View Full Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#DC143C',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  welcomeSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 8,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.midnightNavy,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  verificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  verificationText: {
    fontSize: 14,
    color: '#1a1a2e',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.midnightNavy,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  statsSection: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.crimson,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    fontWeight: '600',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.7,
  },
  chapterSection: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  chapterCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  chapterName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.midnightNavy,
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  chapterYear: {
    fontSize: 15,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    lineHeight: 22,
  },
  rolesSection: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  roleCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  roleCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.crimson,
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  roleCardDescription: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    lineHeight: 20,
  },
  profileButton: {
    backgroundColor: COLORS.crimson,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  profileButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});

