import pool from '../db/connection';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

async function approveMember(emailOrCognitoSubOrId: string) {
  try {
    console.log(`🔍 Looking for fraternity member with email, cognito_sub, or id: ${emailOrCognitoSubOrId}`);
    
    // Try to find member by ID first (if it's a number)
    let memberResult;
    const numericId = parseInt(emailOrCognitoSubOrId);
    if (!isNaN(numericId)) {
      memberResult = await pool.query('SELECT * FROM fraternity_members WHERE id = $1', [numericId]);
    }
    
    // If not found by ID, try email
    if (!memberResult || memberResult.rows.length === 0) {
      memberResult = await pool.query('SELECT * FROM fraternity_members WHERE email = $1', [emailOrCognitoSubOrId]);
    }
    
    // If not found by email, try cognito_sub
    if (memberResult.rows.length === 0) {
      memberResult = await pool.query('SELECT * FROM fraternity_members WHERE cognito_sub = $1', [emailOrCognitoSubOrId]);
    }
    
    if (memberResult.rows.length === 0) {
      console.log('❌ No fraternity member found with that email, cognito_sub, or id');
      return;
    }
    
    const member = memberResult.rows[0];
    console.log(`📋 Found fraternity member:`, {
      id: member.id,
      name: member.name,
      email: member.email,
      cognito_sub: member.cognito_sub,
      membership_number: member.membership_number,
      current_verification_status: member.verification_status,
      registration_status: member.registration_status,
    });
    
    if (member.verification_status === 'VERIFIED') {
      console.log('✅ Member is already verified');
      return;
    }
    
    // Update verification status to VERIFIED
    console.log(`🔧 Updating member verification status to VERIFIED...`);
    
    const updateResult = await pool.query(
      `UPDATE fraternity_members 
       SET verification_status = 'VERIFIED', 
           verification_date = CURRENT_TIMESTAMP,
           verification_notes = COALESCE(verification_notes || E'\n', '') || 'Manually approved via script',
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [member.id]
    );
    
    const updatedMember = updateResult.rows[0];
    console.log('✅ Member verification status successfully updated to VERIFIED');
    console.log(`\n📝 Updated Member Details:`);
    console.log(`   ID: ${updatedMember.id}`);
    console.log(`   Name: ${updatedMember.name}`);
    console.log(`   Email: ${updatedMember.email}`);
    console.log(`   Membership Number: ${updatedMember.membership_number}`);
    console.log(`   Verification Status: ${updatedMember.verification_status}`);
    console.log(`   Verification Date: ${updatedMember.verification_date}`);
    console.log(`\n💡 The member account is now verified and can access verified member features.`);
  } catch (error: any) {
    console.error('❌ Error approving member:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

const identifier = process.argv[2];

if (!identifier) {
  console.error('❌ Please provide an email, cognito_sub, or member id as an argument');
  console.log('\nUsage:');
  console.log('  npm run approve-member -- <email>');
  console.log('  npm run approve-member -- <cognito_sub>');
  console.log('  npm run approve-member -- <member_id>');
  console.log('\nExample:');
  console.log('  npm run approve-member -- test@example.com');
  console.log('  npm run approve-member -- 84e83438-4051-70ce-8ad5-a302decfc078');
  console.log('  npm run approve-member -- 1');
  process.exit(1);
}

approveMember(identifier)
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });

