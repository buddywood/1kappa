import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { COLORS } from '../lib/constants';
import ScreenHeader from './ScreenHeader';
import PrimaryButton from './ui/PrimaryButton';
import SecondaryButton from './ui/SecondaryButton';
import FormCard from './ui/FormCard';
import SectionHeader from './ui/SectionHeader';

interface MemberSetupScreenProps {
  onBack: () => void;
  onStartRegistration: () => void;
  onLogin: () => void;
}

export default function MemberSetupScreen({
  onBack,
  onStartRegistration,
  onLogin,
}: MemberSetupScreenProps) {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Become a Member"
        onBack={onBack}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader
          title="Become a Member"
          subtitle="Join the 1Kappa community and connect with brothers worldwide. Complete your profile and get verified to unlock all features."
          logoSource={require('../assets/stacked-logo.png')}
        />

        {/* Qualification Section */}
        <FormCard style={styles.section}>
          <Text style={styles.sectionTitle}>Who Can Join?</Text>
          <Text style={styles.sectionText}>
            Membership on 1Kappa is open to all initiated members of Kappa Alpha Psi Fraternity, Inc.
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• You must be an initiated member of Kappa Alpha Psi</Text>
            <Text style={styles.bulletItem}>• You must have a valid membership number</Text>
            <Text style={styles.bulletItem}>• You must provide accurate chapter and initiation information</Text>
            <Text style={styles.bulletItem}>• Your membership will be verified before full access is granted</Text>
          </View>
        </FormCard>

        {/* Verification Process Section */}
        <FormCard style={[styles.section, styles.verificationSection]}>
          <Text style={styles.sectionTitle}>Verification Process</Text>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Complete Your Profile</Text>
              <Text style={styles.stepText}>
                Provide your membership number, chapter information, initiation details, and upload a headshot.
              </Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Submit for Verification</Text>
              <Text style={styles.stepText}>
                Your information will be reviewed and verified against fraternity records.
              </Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Get Verified</Text>
              <Text style={styles.stepText}>
                Once verified, you'll have full access to all features including the Steward Marketplace, seller applications, and event promotions.
              </Text>
            </View>
          </View>

          <View style={styles.timelineBox}>
            <Text style={styles.timelineText}>
              <Text style={styles.timelineBold}>Verification Timeline:</Text> Verification typically takes 24-48 hours. You'll receive an email notification once your membership has been verified.
            </Text>
          </View>
        </FormCard>

        {/* Benefits Section */}
        <FormCard style={styles.section}>
          <Text style={styles.sectionTitle}>Member Benefits</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Connect with brothers worldwide through the member directory</Text>
            <Text style={styles.bulletItem}>• Shop authentic merchandise from verified sellers</Text>
            <Text style={styles.bulletItem}>• Claim legacy items from Stewards (verified members only)</Text>
            <Text style={styles.bulletItem}>• Discover and RSVP to fraternity events</Text>
            <Text style={styles.bulletItem}>• Apply to become a Seller, Promoter, or Steward</Text>
            <Text style={styles.bulletItem}>• Support collegiate chapters through purchases and donations</Text>
          </View>
        </FormCard>

        {/* CTA Buttons */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Start Registration"
            onPress={onStartRegistration}
            style={styles.buttonMargin}
          />
          <SecondaryButton
            title="Already Have an Account?"
            onPress={onLogin}
            style={styles.buttonMargin}
          />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 16,
    marginHorizontal: 0,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.midnightNavy,
    marginBottom: 16,
    letterSpacing: 0.1,
  },
  sectionText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    marginBottom: 12,
    lineHeight: 20,
  },
  bulletList: {
    gap: 8,
  },
  bulletItem: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    lineHeight: 20,
  },
  verificationSection: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.crimson,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.midnightNavy,
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    lineHeight: 20,
  },
  timelineBox: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#90CAF9',
    padding: 16,
    marginTop: 8,
  },
  timelineText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    lineHeight: 20,
  },
  timelineBold: {
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  buttonMargin: {
    marginHorizontal: 8,
  },
});

