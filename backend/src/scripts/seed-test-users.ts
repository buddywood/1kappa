import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminGetUserCommand, AdminConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import pool from '../db/connection';
import { createUser, createSeller, createPromoter, createSteward, getAllChapters, updateStewardStatus } from '../db/queries-sequelize';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });
dotenv.config();

// Use AWS SDK default credential chain (supports AWS_PROFILE, credentials file, etc.)
// This allows using admin credentials via AWS_PROFILE environment variable
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  // If AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are explicitly set, use them
  // Otherwise, AWS SDK will use default credential chain (AWS_PROFILE, ~/.aws/credentials, etc.)
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  } : {}),
});

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';

// Test password for all test users
const TEST_PASSWORD = 'TestPassword123!';

interface TestUser {
  email: string;
  name: string;
  type: 'seller' | 'member' | 'steward' | 'promoter';
  membership_number?: string;
  business_name?: string;
  kappa_vendor_id?: string;
}

const testUsers: TestUser[] = [
  {
    email: 'buddy+seller@ebilly.com',
    name: 'Buddy Seller',
    type: 'seller',
    membership_number: 'KAP-TEST-SELLER',
    business_name: 'Buddy\'s Kappa Gear',
    kappa_vendor_id: 'VL-TEST-SELLER',
  },
  {
    email: 'buddy+member@ebilly.com',
    name: 'Buddy Member',
    type: 'member',
    membership_number: 'KAP-TEST-MEMBER',
  },
  {
    email: 'buddy+steward@ebilly.com',
    name: 'Buddy Steward',
    type: 'steward',
    membership_number: 'KAP-TEST-STEWARD',
  },
  {
    email: 'buddy+promoter@ebilly.com',
    name: 'Buddy Promoter',
    type: 'promoter',
    membership_number: 'KAP-TEST-PROMOTER',
  },
];

async function createCognitoUser(email: string, name: string): Promise<string | null> {
  // Check if Cognito is configured
  if (!COGNITO_USER_POOL_ID) {
    console.warn(`  ⚠️  COGNITO_USER_POOL_ID not set, skipping Cognito creation for ${email}`);
    return null;
  }

  try {
    // Check if user already exists
    try {
      const getUserCommand = new AdminGetUserCommand({
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: email,
      });
      const existingUser = await cognitoClient.send(getUserCommand);
      const cognitoSub = existingUser.UserAttributes?.find(
        attr => attr.Name === 'sub'
      )?.Value;
      
      if (cognitoSub) {
        console.log(`  ✓ Cognito user already exists: ${email}`);
        return cognitoSub;
      }
    } catch (error: any) {
      // Handle credential errors - skip Cognito if credentials aren't available
      if (error.name === 'CredentialsProviderError' || 
          error.message?.includes('Could not load credentials') ||
          error.message?.includes('credentials')) {
        console.warn(`  ⚠️  AWS credentials not available, skipping Cognito creation for ${email}`);
        return null;
      }
      
      if (error.name !== 'UserNotFoundException') {
        // If it's a permissions error, return null to skip Cognito
        if (error.name === 'AccessDeniedException' || error.name === 'UnauthorizedException') {
          console.warn(`  ⚠️  No permission to check Cognito user ${email}, skipping Cognito creation`);
          return null;
        }
        throw error;
      }
      // User doesn't exist, continue to create
    }

    // Create user in Cognito
    try {
      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'name', Value: name },
        ],
        MessageAction: 'SUPPRESS', // Don't send welcome email
      });

      await cognitoClient.send(createUserCommand);
      console.log(`  ✓ Created Cognito user: ${email}`);

      // Set permanent password
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: email,
        Password: TEST_PASSWORD,
        Permanent: true,
      });

      await cognitoClient.send(setPasswordCommand);
      console.log(`  ✓ Set password for: ${email}`);

      // Confirm the user
      try {
        const confirmCommand = new AdminConfirmSignUpCommand({
          UserPoolId: COGNITO_USER_POOL_ID,
          Username: email,
        });
        await cognitoClient.send(confirmCommand);
        console.log(`  ✓ Confirmed Cognito user: ${email}`);
      } catch (confirmError: any) {
        // User might already be confirmed, that's okay
        if (confirmError.name !== 'NotAuthorizedException') {
          console.warn(`  ⚠️  Could not confirm user ${email}:`, confirmError.message);
        }
      }

      // Get the Cognito user sub
      const getUserCommand = new AdminGetUserCommand({
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: email,
      });
      const cognitoUser = await cognitoClient.send(getUserCommand);
      const cognitoSub = cognitoUser.UserAttributes?.find(
        attr => attr.Name === 'sub'
      )?.Value;

      if (!cognitoSub) {
        throw new Error('Failed to get Cognito user sub');
      }

      return cognitoSub;
    } catch (createError: any) {
      // Handle credential errors - skip Cognito if credentials aren't available
      if (createError.name === 'CredentialsProviderError' || 
          createError.message?.includes('Could not load credentials') ||
          createError.message?.includes('credentials')) {
        console.warn(`  ⚠️  AWS credentials not available, skipping Cognito creation for ${email}`);
        return null;
      }
      // Re-throw to be caught by outer catch
      throw createError;
    }
  } catch (error: any) {
    // Handle permissions errors gracefully
    if (error.name === 'CredentialsProviderError' || 
        error.message?.includes('Could not load credentials') ||
        error.message?.includes('credentials')) {
      console.warn(`  ⚠️  AWS credentials not available, skipping Cognito creation for ${email}`);
      return null;
    }
    if (error.name === 'AccessDeniedException' || error.name === 'UnauthorizedException') {
      console.warn(`  ⚠️  No permission to create Cognito user ${email}:`, error.message);
      console.warn(`  ⚠️  Continuing with database-only setup (user will need to be created in Cognito manually)`);
      return null;
    }
    
    if (error.name === 'UsernameExistsException') {
      // User exists, get the sub
      try {
        const getUserCommand = new AdminGetUserCommand({
          UserPoolId: COGNITO_USER_POOL_ID,
          Username: email,
        });
        const cognitoUser = await cognitoClient.send(getUserCommand);
        const cognitoSub = cognitoUser.UserAttributes?.find(
          attr => attr.Name === 'sub'
        )?.Value;
        if (cognitoSub) {
          return cognitoSub;
        }
      } catch (getError: any) {
        // If we can't get the user either, return null
        if (getError.name === 'CredentialsProviderError' || 
            getError.message?.includes('Could not load credentials') ||
            getError.message?.includes('credentials')) {
          console.warn(`  ⚠️  AWS credentials not available, skipping Cognito creation for ${email}`);
          return null;
        }
        if (getError.name === 'AccessDeniedException' || getError.name === 'UnauthorizedException') {
          return null;
        }
        throw getError;
      }
    }
    throw error;
  }
}

async function seedTestUsers(): Promise<void> {
  console.log('👤 Seeding test users (Cognito + Database)...\n');
  
  // Check if using AWS_PROFILE for admin access
  if (process.env.AWS_PROFILE) {
    console.log(`📋 Using AWS Profile: ${process.env.AWS_PROFILE}\n`);
  } else if (!process.env.AWS_ACCESS_KEY_ID) {
    console.log('💡 Tip: To create Cognito users, use admin credentials:');
    console.log('   AWS_PROFILE=your-admin-profile npm run seed:test-users\n');
  }

  try {
    // Get chapters for assigning to users
    const chapters = await getAllChapters();
    const collegiateChapters = chapters.filter(c => c.type === 'Collegiate' && c.status === 'Active');
    const availableChapters = collegiateChapters.length > 0 ? collegiateChapters : chapters;

    if (availableChapters.length === 0) {
      console.warn('⚠️  No chapters found. Please seed chapters first.');
      return;
    }

    for (const testUser of testUsers) {
      try {
        console.log(`\n📝 Processing ${testUser.type}: ${testUser.name} (${testUser.email})`);

        // Create Cognito user (returns null if no permissions)
        const cognitoSub = await createCognitoUser(testUser.email, testUser.name);
        
        // If Cognito creation failed, generate a placeholder sub for database
        // Users will need to be created in Cognito manually or via admin
        const finalCognitoSub = cognitoSub || `test-${testUser.email.replace(/[@+]/g, '-')}-${Date.now()}`;
        
        if (!cognitoSub) {
          console.warn(`  ⚠️  Using placeholder cognito_sub for database. User must be created in Cognito manually.`);
        }

        // 1. Create or update User record first (needed for FOREIGN KEYs in role tables)
        const userRole = testUser.type === 'seller' ? 'SELLER' : 
                        testUser.type === 'promoter' ? 'PROMOTER' :
                        testUser.type === 'steward' ? 'STEWARD' : 
                        testUser.type === 'member' ? 'MEMBER' : 'GUEST';

        let userId: number;
        
        // Check for existing user
        const existingUserQuery = await pool.query(
          'SELECT id FROM users WHERE cognito_sub = $1 OR email = $2',
          [finalCognitoSub, testUser.email]
        );

        if (existingUserQuery.rows.length > 0) {
          userId = existingUserQuery.rows[0].id;
          // Update existing user
          await pool.query(
            `UPDATE users 
             SET email = $1, 
                 role = $2, 
                 onboarding_status = 'ONBOARDING_FINISHED',
                 cognito_sub = $3
             WHERE id = $4`,
            [
              testUser.email,
              userRole,
              finalCognitoSub,
              userId,
            ]
          );
          console.log(`  ✓ Updated user record: ${testUser.name} (ID: ${userId})`);
        } else {
          // Create new user
          const newUser = await createUser({
            cognito_sub: finalCognitoSub,
            email: testUser.email,
            role: userRole as 'ADMIN' | 'SELLER' | 'PROMOTER' | 'GUEST' | 'STEWARD' | 'MEMBER',
            onboarding_status: 'ONBOARDING_FINISHED',
          });
          userId = newUser.id;
          console.log(`  ✓ Created user record: ${testUser.name} (ID: ${userId})`);
        }

        // 2. Create/Get Fraternity Member (needed for member, steward, promoter, and member sellers)
        // Note: New schema links User -> FraternityMember via email matching, no explicit FK in some directions
        let memberId: number | null = null;
        if (testUser.type === 'member' || testUser.type === 'steward' || testUser.type === 'promoter' || (testUser.type === 'seller' && testUser.membership_number)) {
          // Check if member already exists
          const existingMember = await pool.query(
            'SELECT id FROM fraternity_members WHERE email = $1',
            [testUser.email]
          );

          if (existingMember.rows.length > 0) {
            memberId = existingMember.rows[0].id;
            console.log(`  ✓ Fraternity Member already exists: ${testUser.name}`);
          } else {
            // Create new member
            const initiatedChapter = availableChapters[Math.floor(Math.random() * availableChapters.length)];
            const seasons = ['Fall', 'Spring'];
            const season = seasons[Math.floor(Math.random() * seasons.length)];
            const year = 2015 + Math.floor(Math.random() * 10); 
            
            const memberResult = await pool.query(
              `INSERT INTO fraternity_members (
                email, name, membership_number, registration_status, 
                initiated_chapter_id, initiated_season, initiated_year, verification_status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'VERIFIED')
              RETURNING id`,
              [
                testUser.email,
                testUser.name,
                testUser.membership_number,
                'COMPLETE',
                initiatedChapter.id,
                season,
                year,
              ]
            );
            memberId = memberResult.rows[0].id;
            console.log(`  ✓ Created Fraternity Member: ${testUser.name}`);
          }
        }

        // 3. Create/Update Role-specific records linked to userId
        let sellerId: number | null = null;
        let promoterId: number | null = null;
        let stewardId: number | null = null;

        if (testUser.type === 'seller') {
          // Check if seller already exists by email (Sellers have email column)
          const existingSeller = await pool.query(
            'SELECT id FROM sellers WHERE email = $1',
            [testUser.email]
          );

          if (existingSeller.rows.length > 0) {
            sellerId = existingSeller.rows[0].id;
            // Ensure user_id is set
            await pool.query('UPDATE sellers SET user_id = $1 WHERE id = $2', [userId, sellerId]);
            console.log(`  ✓ Seller already exists and linked: ${testUser.name}`);
          } else {
            const sponsoringChapter = availableChapters[Math.floor(Math.random() * availableChapters.length)];
            const seller = await createSeller({
              user_id: userId,
              email: testUser.email,
              name: testUser.name,
              sponsoring_chapter_id: sponsoringChapter.id,
              business_name: testUser.business_name || null,
              kappa_vendor_id: testUser.kappa_vendor_id || 'VL-TEST',
            });
            sellerId = seller.id;

            // Approve the seller
            await pool.query(
              'UPDATE sellers SET status = $1 WHERE id = $2',
              ['APPROVED', sellerId]
            );
            console.log(`  ✓ Created and approved seller: ${testUser.name}`);
          }
        }

        if (testUser.type === 'promoter') {
          if (!memberId) {
            throw new Error(`Promoter ${testUser.name} must be a fraternity member`);
          }

          // Check if promoter already exists by email
          const existingPromoter = await pool.query(
            'SELECT id FROM promoters WHERE email = $1',
            [testUser.email]
          );

          if (existingPromoter.rows.length > 0) {
            promoterId = existingPromoter.rows[0].id;
            // Ensure user_id is set
            await pool.query('UPDATE promoters SET user_id = $1 WHERE id = $2', [userId, promoterId]);
            console.log(`  ✓ Promoter already exists and linked: ${testUser.name}`);
          } else {
            const sponsoringChapter = availableChapters[Math.floor(Math.random() * availableChapters.length)];
            // createPromoter might not accept user_id in the version imported, 
            // but we can update it explicitly or pass it if supported.
            // Based on models, Promoter has user_id.
            // We use createPromoter from queries which calls Promoter.create.
            // If createPromoter signature doesn't support user_id, we'll need to update it manually after.
            // Checking previous context, createPromoter wasn't fully shown, but let's assume standard pattern.
            // Safe approach: create then update.
             
            const promoter = await createPromoter({
              email: testUser.email,
              name: testUser.name,
              sponsoring_chapter_id: sponsoringChapter.id,
              headshot_url: undefined,
              social_links: {},
            });
            promoterId = promoter.id;

            // Update user_id and Approve
            await pool.query(
              'UPDATE promoters SET status = $1, user_id = $2 WHERE id = $3',
              ['APPROVED', userId, promoterId]
            );
            console.log(`  ✓ Created and approved promoter: ${testUser.name}`);
          }
        }

        if (testUser.type === 'steward') {
          // Check if steward already exists for this USER
          const existingSteward = await pool.query(
            'SELECT id FROM stewards WHERE user_id = $1',
            [userId]
          );

          if (existingSteward.rows.length > 0) {
            stewardId = existingSteward.rows[0].id;
            console.log(`  ✓ Steward already exists for user: ${testUser.name}`);
          } else {
            // Create new steward linked to user
            const sponsoringChapter = availableChapters[Math.floor(Math.random() * availableChapters.length)];
            
            // We can't rely on createSteward to take user_id if the signature hasn't been updated in queries-sequelize types
            // But we can insert directly or use createSteward and update.
            // createSteward was shown in previous step taking `user_id?: number | null`.
            const steward = await createSteward({
              user_id: userId,
              sponsoring_chapter_id: sponsoringChapter.id,
            });
            stewardId = steward.id;

            // Approve the steward
            await updateStewardStatus(stewardId, 'APPROVED');
            console.log(`  ✓ Created and approved steward: ${testUser.name}`);
          }
        }

        console.log(`  ✅ Completed setup for ${testUser.name}`);
      } catch (error: any) {
        console.error(`  ❌ Error processing ${testUser.name}:`, error.message);
        throw error;
      }
    }

    console.log('\n✅ Test users seeded successfully!');
    console.log('\n📋 Test User Credentials:');
    console.log('   All users use password: TestPassword123!');
    testUsers.forEach(user => {
      console.log(`   - ${user.name}: ${user.email}`);
    });
    console.log('\n');
  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedTestUsers();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { seedTestUsers };

