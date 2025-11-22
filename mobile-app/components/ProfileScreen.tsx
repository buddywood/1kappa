import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../lib/constants";
import { useAuth } from "../lib/auth";
import ScreenHeader from "./ScreenHeader";
import { forgotPassword } from "../lib/cognito";

const REMEMBERED_EMAIL_KEY = "@1kappa:remembered_email";
const REMEMBER_ME_KEY = "@1kappa:remember_me";

interface ProfileScreenProps {
  onBack: () => void;
  initialMode?: "login" | "register";
}

export default function ProfileScreen({
  onBack,
  initialMode = "login",
}: ProfileScreenProps) {
  const { isGuest, user, login, logout } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLogin, setIsLogin] = React.useState(initialMode === "login");
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
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

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email, password);

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
              </View>
            </View>
            <Text style={styles.userName}>{user.name || user.email}</Text>
            {user.email && <Text style={styles.userEmail}>{user.email}</Text>}
          </View>

          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>My Orders</Text>
              <Text style={styles.menuItemArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>Saved Items</Text>
              <Text style={styles.menuItemArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>Settings</Text>
              <Text style={styles.menuItemArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={logout}
            >
              <Text style={[styles.menuItemText, styles.logoutText]}>
                Log Out
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={isLogin ? "Login" : "Sign Up"} onBack={onBack} />
      <View style={styles.headerWrapper}>
        <View style={styles.headerContainer}>
          <View style={styles.logoColumn}>
            <Image
              source={require("../assets/icon.png")}
              style={styles.logo}
              resizeMode="contain"
              width={60}
              height={60}
            />
          </View>
          <View style={styles.textColumn}>
            <Text style={styles.title}>
              {isLogin ? "Welcome Back" : "Create Account"}
            </Text>
            <Text style={styles.subtitle}>
              {isLogin
                ? "Sign in to access your account"
                : "Join the brotherhood marketplace"}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.headerDivider} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          <View style={styles.formContainer}>
            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.midnightNavy + "50"}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={COLORS.midnightNavy + "50"}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.midnightNavy + "50"}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordIcon}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={24}
                    color={COLORS.midnightNavy + "80"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {isLogin && (
              <View style={styles.rememberMeRow}>
                <TouchableOpacity
                  style={styles.rememberMeContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      rememberMe && styles.checkboxChecked,
                    ]}
                  >
                    {rememberMe && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={COLORS.white}
                      />
                    )}
                  </View>
                  <Text style={styles.rememberMeText}>Remember me</Text>
                </TouchableOpacity>
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
              </View>
            )}

            {needsVerification ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Verification Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter code from email"
                    placeholderTextColor={COLORS.midnightNavy + "50"}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    loading && styles.primaryButtonDisabled,
                  ]}
                  onPress={handleVerifyEmail}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>
                    {loading ? "Verifying..." : "Verify Email"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  loading && styles.primaryButtonDisabled,
                ]}
                onPress={isLogin ? handleLogin : handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>
                  {loading
                    ? isLogin
                      ? "Signing In..."
                      : "Creating Account..."
                    : isLogin
                    ? "Sign In"
                    : "Create Account"}
                </Text>
              </TouchableOpacity>
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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  headerWrapper: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  headerContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 0,
    paddingBottom: 16,
    backgroundColor: COLORS.cream,
    marginTop: 6,
    marginBottom: 0,
    alignSelf: "center",
    width: "auto",
    gap: 8,
  },
  logoColumn: {
    alignItems: "center",
    justifyContent: "center",
  },
  textColumn: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: 4,
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
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginHorizontal: 8,
    marginTop: 12,
  },
  formContainer: {
    width: "100%",
    paddingTop: 20,
    paddingHorizontal: 8,
  },
  logo: {
    width: 80,
    height: 80,
    marginTop: 0,
    marginBottom: 0,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.midnightNavy,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: COLORS.midnightNavy,
    borderWidth: 1,
    borderColor: COLORS.frostGray + "AA",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.frostGray + "AA",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerDivider: {
    height: 1,
    width: "100%",
    backgroundColor: COLORS.frostGray + "60",
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.midnightNavy,
  },
  passwordIcon: {
    padding: 16,
    paddingLeft: 8,
  },
  rememberMeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 14,
    width: "100%",
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.crimson,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  checkboxChecked: {
    backgroundColor: "#0D0D0F",
    borderColor: "#0D0D0F",
  },
  rememberMeText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.8,
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
  primaryButton: {
    backgroundColor: COLORS.crimson,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
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
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    fontWeight: "500",
  },
  menuItemArrow: {
    fontSize: 18,
    color: COLORS.crimson,
    fontWeight: "bold",
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: COLORS.crimson,
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
  primaryButtonDisabled: {
    opacity: 0.6,
  },
});
