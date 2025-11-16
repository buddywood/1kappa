import { CognitoIdentityProviderClient, AdminGetUserCommand, AdminConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION || process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';

async function checkUserStatus(email: string, confirmIfUnconfirmed: boolean = false) {
  try {
    if (!COGNITO_USER_POOL_ID) {
      console.error('❌ COGNITO_USER_POOL_ID is not set');
      process.exit(1);
    }

    console.log(`🔍 Checking Cognito user status for: ${email}\n`);

    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: email,
    });

    const userDetails = await cognitoClient.send(getUserCommand);
    
    console.log('📋 User Details:');
    console.log(`  Username: ${userDetails.Username}`);
    console.log(`  User Status: ${userDetails.UserStatus}`);
    console.log(`  User Create Date: ${userDetails.UserCreateDate}`);
    console.log(`  User Last Modified: ${userDetails.UserLastModifiedDate}`);
    console.log(`  Enabled: ${userDetails.Enabled}`);
    
    if (userDetails.UserAttributes) {
      const emailAttr = userDetails.UserAttributes.find(attr => attr.Name === 'email');
      const emailVerifiedAttr = userDetails.UserAttributes.find(attr => attr.Name === 'email_verified');
      console.log(`  Email: ${emailAttr?.Value || 'N/A'}`);
      console.log(`  Email Verified: ${emailVerifiedAttr?.Value || 'N/A'}`);
    }

    if (userDetails.UserStatus === 'UNCONFIRMED') {
      console.log('\n⚠️  User is UNCONFIRMED');
      
      if (confirmIfUnconfirmed) {
        console.log('\n🔐 Attempting to manually confirm user...');
        try {
          const confirmCommand = new AdminConfirmSignUpCommand({
            UserPoolId: COGNITO_USER_POOL_ID,
            Username: email,
          });
          await cognitoClient.send(confirmCommand);
          console.log('✅ User manually confirmed successfully!');
          
          // Check status again
          const updatedUser = await cognitoClient.send(getUserCommand);
          console.log(`\n📋 Updated User Status: ${updatedUser.UserStatus}`);
        } catch (confirmError: any) {
          console.error('❌ Error confirming user:', confirmError.message);
        }
      } else {
        console.log('\n💡 To manually confirm this user, run:');
        console.log(`   npm run check-cognito-user -- ${email} --confirm`);
      }
    } else if (userDetails.UserStatus === 'CONFIRMED') {
      console.log('\n✅ User is CONFIRMED');
    } else {
      console.log(`\n⚠️  User status is: ${userDetails.UserStatus}`);
    }

  } catch (error: any) {
    if (error.name === 'UserNotFoundException') {
      console.error(`❌ User not found: ${email}`);
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  } finally {
    await cognitoClient.destroy();
  }
}

const email = process.argv[2];
const shouldConfirm = process.argv.includes('--confirm');

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('\nUsage:');
  console.log('  npm run check-cognito-user -- <email>');
  console.log('  npm run check-cognito-user -- <email> --confirm');
  console.log('\nExample:');
  console.log('  npm run check-cognito-user -- test@example.com');
  console.log('  npm run check-cognito-user -- test@example.com --confirm');
  process.exit(1);
}

checkUserStatus(email, shouldConfirm)
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });

