import dotenv from 'dotenv';
import path from 'path';
import { createBrowser as createMemberBrowser, loginToKappaPortal, verifyMember } from '../services/memberVerification';
import { verifySellerFromContent, createBrowser as createSellerBrowser } from '../services/sellerVerification';
import {
  getPendingMembersForVerification,
  getPendingSellersForVerification,
  getPendingPromotersForVerification,
  updateMemberVerification,
  updateSellerVerification,
  updatePromoterVerification,
} from '../db/queries';
import { initializeDatabase } from '../db/migrations';
import type { Browser, Page } from 'puppeteer';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

// Helper: Wait for a specified number of milliseconds
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check for visible browser mode (--visible or --watch flag, or VERIFICATION_VISIBLE env var)
const args = process.argv.slice(2);
const isVisibleMode = args.includes('--visible') || args.includes('--watch') || process.env.VERIFICATION_VISIBLE === 'true';
const isDebugMode = args.includes('--debug') || args.includes('--record');
const isRecordMode = args.includes('--record');

interface VerificationResult {
  success: boolean;
  verified: boolean;
  notes?: string;
}

/**
 * Verify a single member
 */
async function verifySingleMember(
  page: Page,
  name: string,
  membershipNumber: string
): Promise<VerificationResult> {
  try {
    const result = await verifyMember(page, name, membershipNumber);

    if (result.found && result.nameMatch && result.membershipNumberMatch) {
      return {
        success: true,
        verified: true,
        notes: `Verified: Name and membership number match found. ${result.details?.name ? `Name: ${result.details.name}` : ''} ${result.details?.membershipNumber ? `Membership: ${result.details.membershipNumber}` : ''}`,
      };
    } else if (result.error) {
      return {
        success: false,
        verified: false,
        notes: `Error during verification: ${result.error}`,
      };
    } else {
      let notes = 'Verification failed: ';
      if (!result.nameMatch && !result.membershipNumberMatch) {
        notes += 'Neither name nor membership number matched.';
      } else if (!result.nameMatch) {
        notes += 'Name did not match (membership number matched).';
      } else if (!result.membershipNumberMatch) {
        notes += 'Membership number did not match (name matched).';
      }
      return {
        success: true,
        verified: false,
        notes,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      verified: false,
      notes: `Exception during verification: ${error.message}`,
    };
  }
}

/**
 * Main verification process
 */
async function runVerification() {
  console.log('🚀 Starting member verification process...\n');

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // Initialize database connection
    await initializeDatabase();

    // Fetch all pending members and promoters (sellers are handled separately)
    console.log('📋 Fetching pending members and promoters...');
    const pendingMembers = await getPendingMembersForVerification();
    const pendingPromoters = await getPendingPromotersForVerification();

    const totalPending = pendingMembers.length + pendingPromoters.length;
    console.log(`   Found ${pendingMembers.length} pending members`);
    console.log(`   Found ${pendingPromoters.length} pending promoters`);
    console.log(`   Total: ${totalPending} pending verifications\n`);

    if (totalPending === 0) {
      console.log('✅ No pending verifications. Exiting.');
      return;
    }

    // Initialize browser
    if (isVisibleMode) {
      console.log('🌐 Initializing browser (VISIBLE MODE - you can watch the process)...');
    } else {
      console.log('🌐 Initializing browser...');
    }
    browser = await createMemberBrowser(!isVisibleMode);
    page = await browser.newPage();

    // Set timeouts (longer in visible mode so user can see what's happening)
    if (isVisibleMode) {
      page.setDefaultTimeout(60000); // Longer timeout for visible mode
      page.setDefaultNavigationTimeout(60000);
      console.log('👀 Browser is visible - you can watch the verification process');
      console.log('   Press Ctrl+C to stop at any time\n');
    } else {
      page.setDefaultTimeout(30000);
      page.setDefaultNavigationTimeout(30000);
    }

    // Login to Kappa portal
    console.log('🔐 Logging into Kappa Alpha Psi portal...');
    
    // Record mode: Let user manually log in
    if (isRecordMode) {
      const { recordManualLogin } = await import('../services/memberVerification');
      await recordManualLogin(page);
      console.log('✅ Recording complete. Please check the output above for selectors.');
      return;
    }
    
    const loginSuccess = await loginToKappaPortal(page, isDebugMode);

    if (!loginSuccess) {
      console.error('❌ Failed to login to Kappa portal. Aborting verification.');
      return;
    }

    console.log('✅ Successfully logged in\n');

    // Verify members
    let verifiedCount = 0;
    let failedCount = 0;
    let errorCount = 0;

    // Process regular members
    if (pendingMembers.length > 0) {
      console.log(`\n📝 Processing ${pendingMembers.length} members...`);
      for (const member of pendingMembers) {
        if (!member.name || !member.membership_number) {
          console.log(`   ⚠️  Skipping member ${member.id}: missing name or membership number`);
          await updateMemberVerification(member.id, 'MANUAL_REVIEW', 'Missing name or membership number');
          continue;
        }

        console.log(`   Verifying: ${member.name} (${member.membership_number})...`);
        const result = await verifySingleMember(page, member.name, member.membership_number);

        if (!result.success) {
          errorCount++;
          await updateMemberVerification(member.id, 'MANUAL_REVIEW', `Error during verification: ${result.notes || 'Unknown error'}`);
          console.log(`      ⚠️  Error - marked for manual review: ${result.notes}`);
        } else if (result.verified) {
          verifiedCount++;
          await updateMemberVerification(member.id, 'VERIFIED', result.notes);
          console.log(`      ✅ Verified`);
        } else {
          // Mark for manual review instead of failing
          await updateMemberVerification(member.id, 'MANUAL_REVIEW', result.notes || 'Verification inconclusive - requires manual review');
          console.log(`      ⚠️  Marked for manual review: ${result.notes}`);
        }

        // Small delay between verifications to avoid overwhelming the server
        await delay(1000);
      }
    }


    // Process promoters
    if (pendingPromoters.length > 0) {
      console.log(`\n📝 Processing ${pendingPromoters.length} promoters...`);
      for (const promoter of pendingPromoters) {
        if (!promoter.name || !promoter.membership_number) {
          console.log(`   ⚠️  Skipping promoter ${promoter.id}: missing name or membership number`);
          await updatePromoterVerification(promoter.id, 'MANUAL_REVIEW', 'Missing name or membership number', false);
          continue;
        }

        console.log(`   Verifying: ${promoter.name} (${promoter.membership_number})...`);
        const result = await verifySingleMember(page, promoter.name, promoter.membership_number);

        if (!result.success) {
          errorCount++;
          await updatePromoterVerification(promoter.id, 'MANUAL_REVIEW', `Error during verification: ${result.notes || 'Unknown error'}`, false);
          console.log(`      ⚠️  Error - marked for manual review: ${result.notes}`);
        } else if (result.verified) {
          verifiedCount++;
          // Auto-approve verified promoters
          await updatePromoterVerification(promoter.id, 'VERIFIED', result.notes, true);
          console.log(`      ✅ Verified and auto-approved`);
        } else {
          // Mark for manual review instead of failing
          await updatePromoterVerification(promoter.id, 'MANUAL_REVIEW', result.notes || 'Verification inconclusive - requires manual review', false);
          console.log(`      ⚠️  Marked for manual review: ${result.notes}`);
        }

        await delay(1000);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Verification Summary:');
    console.log(`   ✅ Verified: ${verifiedCount}`);
    console.log(`   ⚠️  Manual Review: ${failedCount}`);
    console.log(`   ⚠️  Errors: ${errorCount}`);
    console.log(`   📝 Total processed: ${totalPending}`);
    console.log('='.repeat(50) + '\n');

  } catch (error: any) {
    console.error('❌ Fatal error during verification:', error);
    console.error(error.stack);
  } finally {
    // Clean up
    if (page) {
      await page.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
    console.log('🏁 Verification process completed.');
  }
}

// Run if called directly
if (require.main === module) {
  runVerification()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

/**
 * Seller verification process (separate from member verification)
 * Searches vendor program page - no login required
 */
export async function runSellerVerification() {
  console.log('🚀 Starting seller verification process...\n');

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // Initialize database connection
    await initializeDatabase();

    // Fetch all pending sellers
    console.log('📋 Fetching pending sellers...');
    const pendingSellers = await getPendingSellersForVerification();

    console.log(`   Found ${pendingSellers.length} pending sellers\n`);

    if (pendingSellers.length === 0) {
      console.log('✅ No pending seller verifications. Exiting.');
      return;
    }

    // Initialize browser (no login needed for vendor program page)
    console.log('🌐 Initializing browser for seller verification...');
    browser = await createSellerBrowser(true); // Always headless for scheduled runs
    page = await browser.newPage();
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    // Navigate to vendor program page once (more efficient than navigating for each seller)
    console.log('📄 Navigating to vendor program page...');
    const VENDOR_PROGRAM_URL = 'https://www.kappaalphapsi1911.com/vendor-program/';
    try {
      await page.goto(VENDOR_PROGRAM_URL, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      // Wait for page content to load
      await page.waitForFunction(
        () => document.body && document.body.innerText.length > 0,
        { timeout: 30000 }
      );
      await delay(1000);
    } catch (navError: any) {
      console.error(`❌ Failed to navigate to vendor program page: ${navError.message}`);
      // Mark all sellers for manual review if we can't load the page
      for (const seller of pendingSellers) {
        await updateSellerVerification(
          seller.id, 
          'MANUAL_REVIEW', 
          `Failed to load vendor program page: ${navError.message}`, 
          false
        );
      }
      throw navError;
    }

    // Get page content once
    let pageContent: { bodyText: string; bodyHTML: string };
    try {
      pageContent = await page.evaluate(() => {
        if (!document.body) {
          return { bodyText: '', bodyHTML: '' };
        }
        return {
          bodyText: (document.body.innerText || document.body.textContent || '').toLowerCase(),
          bodyHTML: (document.body.innerHTML || '').toLowerCase(),
        };
      });
    } catch (contentError: any) {
      console.error(`❌ Failed to extract page content: ${contentError.message}`);
      // Mark all sellers for manual review
      for (const seller of pendingSellers) {
        await updateSellerVerification(
          seller.id, 
          'MANUAL_REVIEW', 
          `Failed to extract page content: ${contentError.message}`, 
          false
        );
      }
      throw contentError;
    }

    let verifiedCount = 0;
    let manualReviewCount = 0;
    let errorCount = 0;

    // Process sellers using the cached page content
    console.log(`\n📝 Processing ${pendingSellers.length} sellers...`);
    for (const seller of pendingSellers) {
      if (!seller.name || !seller.email) {
        console.log(`   ⚠️  Skipping seller ${seller.id}: missing name or email`);
        await updateSellerVerification(seller.id, 'MANUAL_REVIEW', 'Missing name or email', false);
        manualReviewCount++;
        continue;
      }

      console.log(`   Verifying seller: ${seller.name} (${seller.email})...`);
      
      try {
        const result = verifySellerFromContent(pageContent, seller.name, seller.email);

        if (result.found && result.nameMatch && result.emailMatch) {
          verifiedCount++;
          const notes = `Verified on vendor program: Name and email match found. Name: ${result.details?.name || seller.name}, Email: ${result.details?.email || seller.email}`;
          // Auto-approve verified sellers
          await updateSellerVerification(seller.id, 'VERIFIED', notes, true);
          console.log(`      ✅ Verified and auto-approved`);
        } else {
          // Mark for manual review instead of failing
          manualReviewCount++;
          let notes = 'Verification inconclusive - requires manual review: ';
          if (!result.nameMatch && !result.emailMatch) {
            notes += 'Neither name nor email found on vendor program page.';
          } else if (!result.nameMatch) {
            notes += 'Name not found on vendor program page (email found).';
          } else if (!result.emailMatch) {
            notes += 'Email not found on vendor program page (name found).';
          }
          await updateSellerVerification(seller.id, 'MANUAL_REVIEW', notes, false);
          console.log(`      ⚠️  Marked for manual review: ${notes}`);
        }
      } catch (error: any) {
        errorCount++;
        await updateSellerVerification(seller.id, 'MANUAL_REVIEW', `Error during verification: ${error.message}`, false);
        console.log(`      ⚠️  Error - marked for manual review: ${error.message}`);
      }

      await delay(500); // Smaller delay since we're not navigating
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Seller Verification Summary:');
    console.log(`   ✅ Verified: ${verifiedCount}`);
    console.log(`   ⚠️  Manual Review: ${manualReviewCount}`);
    console.log(`   ⚠️  Errors: ${errorCount}`);
    console.log(`   📝 Total processed: ${pendingSellers.length}`);
    console.log('='.repeat(50) + '\n');

  } catch (error: any) {
    console.error('❌ Fatal error during seller verification:', error);
    console.error(error.stack);
  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

export { runVerification };

