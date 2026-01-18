import dotenv from 'dotenv';
import path from 'path';
import { runSellerVerification } from './verify-members';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

// Run seller verification
if (require.main === module) {
  runSellerVerification()
    .then(() => {
      console.log('✅ Seller verification completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seller verification failed:', error);
      process.exit(1);
    });
}

export { runSellerVerification };
