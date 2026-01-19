import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS, API_URL, WEB_URL } from "../lib/constants";
import { useAuth } from "../lib/auth";
import ScreenHeader from "./ScreenHeader";
import { forgotPassword } from "../lib/cognito";
import PrimaryButton from "./ui/PrimaryButton";
import TextField from "./ui/TextField";
import PasswordField from "./ui/PasswordField";
import FormCard from "./ui/FormCard";
import SectionHeader from "./ui/SectionHeader";
import Checkbox from "./ui/Checkbox";
import MenuItem from "./ui/MenuItem";
import { getOrderCount, getSavedItemsCount } from "../lib/api";
import { authenticatedFetch } from "../lib/api-utils";
import { Ionicons } from "@expo/vector-icons";

const REMEMBERED_EMAIL_KEY = "@1kappa:remembered_email";
const REMEMBER_ME_KEY = "@1kappa:remember_me";

interface ProfileScreenProps {
  onBack: () => void;
  initialMode?: "login" | "register";
  initialErrorMessage?: string | null;
  onMyEventsPress?: () => void;
  onEditProfilePress?: () => void;
  onSettingsPress?: () => void;
  onMemberDashboardPress?: () => void;
  onSellerDashboardPress?: () => void;
}

interface UserInfo {
  id: number;
  email: string;
  is_fraternity_member: boolean;
  is_seller: boolean;
  is_promoter: boolean;
  is_steward: boolean;
}

interface SellerProfile {
  id: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

interface PromoterProfile {
  id: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

interface StewardProfile {
  id: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export default function ProfileScreen({
  onBack,
  initialMode = "login",
  initialErrorMessage = null,
  onMyEventsPress,
  onEditProfilePress,
  onSettingsPress,
  onMemberDashboardPress,
  onSellerDashboardPress,
}: ProfileScreenProps) {
  const { isGuest, user, login, logout, token } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLogin, setIsLogin] = React.useState(initialMode === "login");
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(
    initialErrorMessage || null
  );
  const [verificationCode, setVerificationCode] = React.useState("");
  const [needsVerification, setNeedsVerification] = React.useState(false);
  const [cognitoSub, setCognitoSub] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] =
    React.useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = React.useState<
    string | null
  >(null);
  const [orderCount, setOrderCount] = React.useState(0);
  const [savedItemsCount, setSavedItemsCount] = React.useState(0);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(
    null
  );
  const [promoterProfile, setPromoterProfile] =
    useState<PromoterProfile | null>(null);
  const [stewardProfile, setStewardProfile] = useState<StewardProfile | null>(
    null
  );
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Load remembered email on mount
  React.useEffect(() => {
    const loadRememberedEmail = async () => {
      try {
        const rememberedEmail = await AsyncStorage.getItem(
          REMEMBERED_EMAIL_KEY
        );
        const rememberMePreference = await AsyncStorage.getItem(
          REMEMBER_ME_KEY
        );

        if (rememberedEmail && rememberMePreference === "true") {
          setEmail(rememberedEmail);
          setRememberMe(true);
        }
      } catch (error) {
        console.error("Error loading remembered email:", error);
      }
    };

    loadRememberedEmail();
  }, []);

  // Load user info and role profiles
  useEffect(() => {
    const loadUserInfo = async () => {
      if (!isGuest && user && token) {
        try {
          setLoadingRoles(true);
          const userRes = await authenticatedFetch(`${API_URL}/api/users/me`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!userRes.ok) {
            throw new Error("Failed to fetch user info");
          }

          const userData = await userRes.json();
          setUserInfo(userData);

          // Fetch role-specific profiles in parallel
          const promises: Promise<any>[] = [];

          if (userData.is_seller) {
            promises.push(
              authenticatedFetch(`${API_URL}/api/sellers/me`, {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
                .then((res) => res.json())
                .then(setSellerProfile)
                .catch(() => null)
            );
          }

          if (userData.is_promoter) {
            promises.push(
              authenticatedFetch(`${API_URL}/api/promoters/me`, {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
                .then((res) => res.json())
                .then(setPromoterProfile)
                .catch(() => null)
            );
          }

          if (userData.is_steward) {
            promises.push(
              authenticatedFetch(`${API_URL}/api/stewards/profile`, {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
                .then((res) => res.json())
                .then(setStewardProfile)
                .catch(() => null)
            );
          }

          await Promise.all(promises);
        } catch (error: any) {
          // Check if it's a session expired error
          if (error.code === "SESSION_EXPIRED") {
            // Logout and show login with error message
            await logout();
            setError(
              error.message || "Your session has expired. Please log in again."
            );
            setIsLogin(true);
            return;
          }
          console.error("Error loading user info:", error);
        } finally {
          setLoadingRoles(false);
        }
      }
    };

    loadUserInfo();
  }, [isGuest, user, token, logout]);

  // Load order and saved items counts
  React.useEffect(() => {
    const loadCounts = async () => {
      if (!isGuest && user && token && user.email) {
        try {
          const [orders, savedItems] = await Promise.all([
            getOrderCount(token),
            getSavedItemsCount(token, user.email),
          ]);
          setOrderCount(orders);
          setSavedItemsCount(savedItems);
        } catch (error: any) {
          // Check if it's a session expired error
          if (error.code === "SESSION_EXPIRED") {
            // Logout and show login with error message
            await logout();
            setError(
              error.message || "Your session has expired. Please log in again."
            );
            setIsLogin(true);
            return;
          }
          console.error("Error loading counts:", error);
          // Silently fail - counts will remain 0
        }
      }
    };

    loadCounts();
  }, [isGuest, user, token, logout]);

  const getRoleStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    const variants: Record<string, { text: string; color: string }> = {
      APPROVED: { text: "Approved", color: "#10B981" },
      PENDING: { text: "Pending", color: "#F59E0B" },
      REJECTED: { text: "Rejected", color: "#EF4444" },
    };
    const config = variants[status] || variants.PENDING;
    return (
      <View
        style={[
          styles.badge,
          { backgroundColor: config.color + "20", borderColor: config.color },
        ]}
      >
        <Text style={[styles.badgeText, { color: config.color }]}>
          {config.text}
        </Text>
      </View>
    );
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      // Clear any session expiration error on successful login
      setError(null);

      // Save or clear remembered email and enable auto-login based on rememberMe preference
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, email);
        await AsyncStorage.setItem(REMEMBER_ME_KEY, "true");
        // Store remember me flag in auth context storage too
        await AsyncStorage.setItem("@1kappa:remember_me", "true");
      } else {
        await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
        await AsyncStorage.removeItem(REMEMBER_ME_KEY);
        await AsyncStorage.removeItem("@1kappa:remember_me");
      }

      // Login successful - auth context will update, component will re-render showing profile
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err.message || "Failed to sign in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { signUp } = await import("../lib/cognito");
      const result = await signUp(email, password);
      setCognitoSub(result.userSub);
      setNeedsVerification(true);
      setError(null);
    } catch (err: any) {
      console.error("Registration error:", err);
      if (err.code === "UsernameExistsException") {
        setError(
          "An account with this email already exists. Please sign in instead."
        );
        setIsLogin(true);
      } else {
        setError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { confirmSignUp } = await import("../lib/cognito");
      await confirmSignUp(email, verificationCode, cognitoSub || undefined);
      setNeedsVerification(false);
      setError(null);
      // After verification, user can now log in
      setIsLogin(true);
      alert("Email verified! Please sign in with your credentials.");
    } catch (err: any) {
      console.error("Verification error:", err);
      if (err.code === "CodeMismatchException") {
        setError(
          "Invalid verification code. Please check your email and try again."
        );
      } else if (err.code === "ExpiredCodeException") {
        setError("Verification code has expired. Please request a new one.");
      } else {
        setError(err.message || "Failed to verify email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isGuest && user) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Profile" onBack={onBack} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                {user.headshot_url ? (
                  <Image
                    source={{ uri: user.headshot_url }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {user.name
                      ? user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : user.email?.[0].toUpperCase() || "U"}
                  </Text>
                )}
              </View>
            </View>
            <Text style={styles.userName}>{user.name || user.email}</Text>
            {user.email && <Text style={styles.userEmail}>{user.email}</Text>}
          </View>

          {/* Roles & Access Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Roles & Access</Text>
            <Text style={styles.sectionDescription}>
              Your current roles and access levels
            </Text>

            {loadingRoles ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.crimson} />
              </View>
            ) : (
              <>
                {userInfo?.is_fraternity_member && (
                  <View style={styles.roleCard}>
                    <View style={styles.roleHeader}>
                      <Text style={styles.roleTitle}>Member</Text>
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: COLORS.crimson + "20",
                            borderColor: COLORS.crimson,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.badgeText, { color: COLORS.crimson }]}
                        >
                          Active
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.roleDescription}>
                      Verified fraternity member
                    </Text>
                    {onMemberDashboardPress && (
                      <TouchableOpacity
                        style={styles.dashboardButton}
                        onPress={onMemberDashboardPress}
                      >
                        <Text style={styles.dashboardButtonText}>
                          View Dashboard
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={16}
                          color={COLORS.crimson}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {userInfo?.is_seller && (
                  <View style={styles.roleCard}>
                    <View style={styles.roleHeader}>
                      <Text style={styles.roleTitle}>Seller</Text>
                      {getRoleStatusBadge(sellerProfile?.status)}
                    </View>
                    <Text style={styles.roleDescription}>
                      {sellerProfile?.status === "APPROVED"
                        ? "You can list and sell products"
                        : sellerProfile?.status === "PENDING"
                        ? "Your seller application is pending approval"
                        : "Your seller application was rejected"}
                    </Text>
                    {sellerProfile?.status === "APPROVED" && (
                      <TouchableOpacity
                        style={styles.dashboardButton}
                        testID="seller-dashboard-button"
                        onPress={() => {
                          if (onSellerDashboardPress) {
                            onSellerDashboardPress();
                          }
                        }}
                      >
                        <Text style={styles.dashboardButtonText}>
                          Dashboard
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={16}
                          color={COLORS.crimson}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {userInfo?.is_promoter && (
                  <View style={styles.roleCard}>
                    <View style={styles.roleHeader}>
                      <Text style={styles.roleTitle}>Promoter</Text>
                      {getRoleStatusBadge(promoterProfile?.status)}
                    </View>
                    <Text style={styles.roleDescription}>
                      {promoterProfile?.status === "APPROVED"
                        ? "You can create and manage events"
                        : promoterProfile?.status === "PENDING"
                        ? "Your promoter application is pending approval"
                        : "Your promoter application was rejected"}
                    </Text>
                    {promoterProfile?.status === "APPROVED" && (
                      <TouchableOpacity
                        style={styles.dashboardButton}
                        onPress={() => {
                          Linking.openURL(
                            `${WEB_URL}/promoter-dashboard`
                          ).catch((err) => {
                            console.error("Failed to open dashboard:", err);
                          });
                        }}
                      >
                        <Text style={styles.dashboardButtonText}>
                          Dashboard
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={16}
                          color={COLORS.crimson}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {userInfo?.is_steward && (
                  <View style={styles.roleCard}>
                    <View style={styles.roleHeader}>
                      <Text style={styles.roleTitle}>Steward</Text>
                      {getRoleStatusBadge(stewardProfile?.status)}
                    </View>
                    <Text style={styles.roleDescription}>
                      {stewardProfile?.status === "APPROVED"
                        ? "You can list legacy fraternity paraphernalia"
                        : stewardProfile?.status === "PENDING"
                        ? "Your steward application is pending approval"
                        : "Your steward application was rejected"}
                    </Text>
                    {stewardProfile?.status === "APPROVED" && (
                      <TouchableOpacity
                        style={styles.dashboardButton}
                        onPress={() => {
                          Linking.openURL(`${WEB_URL}/steward-dashboard`).catch(
                            (err) => {
                              console.error("Failed to open dashboard:", err);
                            }
                          );
                        }}
                      >
                        <Text style={styles.dashboardButtonText}>
                          Dashboard
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={16}
                          color={COLORS.crimson}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {!userInfo?.is_fraternity_member &&
                  !userInfo?.is_seller &&
                  !userInfo?.is_promoter &&
                  !userInfo?.is_steward && (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>
                        You don't have any active roles. Complete your member
                        profile or apply for a role to get started.
                      </Text>
                    </View>
                  )}
              </>
            )}
          </View>

          {/* General Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General</Text>
            <View style={styles.menuSection}>
              {onEditProfilePress && (
                <MenuItem label="Edit Profile" onPress={onEditProfilePress} />
              )}
              {user?.is_promoter && onMyEventsPress && (
                <MenuItem label="My Events" onPress={onMyEventsPress} />
              )}
              {orderCount > 1 && (
                <MenuItem label="My Orders" onPress={() => {}} />
              )}
              {savedItemsCount > 1 && (
                <MenuItem label="Saved Items" onPress={() => {}} />
              )}
              {onSettingsPress && (
                <MenuItem label="Settings" onPress={onSettingsPress} testID="settings-button" />
              )}
            </View>
          </View>

          {/* Log Out */}
          <View style={styles.section}>
            <View style={styles.menuSection}>
              <MenuItem label="Log Out" onPress={logout} variant="logout" testID="logout-button" />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="profile-screen">
      <ScreenHeader title={isLogin ? "Login" : "Sign Up"} onBack={onBack} />
      <SectionHeader
        title={isLogin ? "Welcome Back" : "Create Account"}
        subtitle={
          isLogin
            ? "Sign in to access your account"
            : "Join the brotherhood marketplace"
        }
        logoSource={require("../assets/icon.png")}
      />
      <View style={styles.headerDivider} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <FormCard style={styles.formCard}>
          <View style={styles.formContainer}>
            {!isLogin && (
              <TextField
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                autoCapitalize="words"
              />
            )}

            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID="login-email-input"
            />

            <PasswordField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              showPassword={showPassword}
              onToggleVisibility={() => setShowPassword(!showPassword)}
              autoCapitalize="none"
              testID="login-password-input"
            />

            {isLogin && (
              <View style={styles.rememberMeRow}>
                <Checkbox
                  checked={rememberMe}
                  onPress={() => setRememberMe(!rememberMe)}
                  label="Remember me"
                />
                <TouchableOpacity
                  onPress={async () => {
                    if (!email) {
                      setForgotPasswordMessage(
                        "Please enter your email address first"
                      );
                      return;
                    }
                    setForgotPasswordLoading(true);
                    setForgotPasswordMessage(null);
                    try {
                      await forgotPassword(email);
                      setForgotPasswordMessage(
                        "Password reset code sent! Check your email."
                      );
                    } catch (err: any) {
                      setForgotPasswordMessage(
                        err.message ||
                          "Failed to send reset code. Please try again."
                      );
                    } finally {
                      setForgotPasswordLoading(false);
                    }
                  }}
                  disabled={forgotPasswordLoading || !email}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {isLogin && forgotPasswordMessage && (
              <View style={styles.forgotPasswordMessageContainer}>
                <Text style={styles.forgotPasswordMessageText}>
                  {forgotPasswordMessage}
                </Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                {error.includes("session has expired") && (
                  <Text style={styles.errorHint}>
                    Please sign in again to continue.
                  </Text>
                )}
              </View>
            )}

            {needsVerification ? (
              <>
                <TextField
                  label="Verification Code"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="Enter code from email"
                  keyboardType="number-pad"
                  autoCapitalize="none"
                />
                <PrimaryButton
                  title="Verify Email"
                  onPress={handleVerifyEmail}
                  loading={loading}
                  loadingText="Verifying..."
                  style={styles.buttonSpacing}
                />
              </>
            ) : (
              <PrimaryButton
                title={isLogin ? "Sign In" : "Create Account"}
                onPress={isLogin ? handleLogin : handleRegister}
                loading={loading}
                loadingText={isLogin ? "Signing In..." : "Creating Account..."}
                style={styles.buttonSpacing}
                testID="login-button"
              />
            )}

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsLogin(!isLogin)}
              activeOpacity={0.6}
            >
              <Text style={styles.switchButtonText}>
                {isLogin
                  ? "Don't have an account? Sign Up"
                  : "Already have an account? Sign In"}
              </Text>
            </TouchableOpacity>
          </View>
        </FormCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 80,
  },
  formCard: {
    width: "92%",
    alignSelf: "center",
    marginTop: 12,
  },
  formContainer: {
    width: "100%",
    paddingTop: 20,
    paddingHorizontal: 8,
  },
  headerDivider: {
    height: 1,
    width: "100%",
    backgroundColor: COLORS.frostGray + "60",
    marginBottom: 16,
  },
  rememberMeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 14,
    width: "100%",
  },
  buttonSpacing: {
    marginTop: 20,
    marginBottom: 28,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#0D0D0F",
    fontWeight: "500",
    opacity: 0.85,
  },
  forgotPasswordMessageContainer: {
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.auroraGold + "20",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.auroraGold,
  },
  forgotPasswordMessageText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    textAlign: "center",
  },
  switchButton: {
    padding: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  switchButtonText: {
    color: COLORS.crimson,
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.9,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.crimson,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: "bold",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.midnightNavy,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
  menuSection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 12,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.midnightNavy,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    marginBottom: 16,
  },
  roleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
  },
  roleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
  },
  roleDescription: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dashboardButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.crimson,
    alignSelf: "flex-start",
  },
  dashboardButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.crimson,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    textAlign: "center",
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
  },
  errorHint: {
    color: "#DC2626",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    opacity: 0.8,
  },
});
