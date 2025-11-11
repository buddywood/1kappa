import pool from '../db/connection';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

async function deleteTestUser(email: string) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Find the user
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      console.log('✅ No user found in database with that email');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`📋 Found user:`, {
      id: user.id,
      email: user.email,
      role: user.role,
      member_id: user.member_id,
      seller_id: user.seller_id,
      promoter_id: user.promoter_id,
    });
    
    // Delete associated records based on role
    if (user.member_id) {
      console.log(`🗑️  Deleting member record (id: ${user.member_id})...`);
      await pool.query('DELETE FROM members WHERE id = $1', [user.member_id]);
      console.log('✅ Member record deleted');
    }
    
    if (user.seller_id) {
      console.log(`🗑️  Deleting seller record (id: ${user.seller_id})...`);
      await pool.query('DELETE FROM sellers WHERE id = $1', [user.seller_id]);
      console.log('✅ Seller record deleted');
    }
    
    if (user.promoter_id) {
      console.log(`🗑️  Deleting promoter record (id: ${user.promoter_id})...`);
      await pool.query('DELETE FROM promoters WHERE id = $1', [user.promoter_id]);
      console.log('✅ Promoter record deleted');
    }
    
    // Delete the user record
    console.log(`🗑️  Deleting user record (id: ${user.id})...`);
    await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
    console.log('✅ User record deleted');
    
    console.log('✅ Test user successfully deleted from database');
  } catch (error) {
    console.error('❌ Error deleting test user:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

const email = process.argv[2] || 'test@example.com';

deleteTestUser(email)
  .then(() => {
    console.log('✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });


