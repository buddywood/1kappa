import { spawn } from 'child_process';
import path from 'path';

/**
 * Unified database seeder that routes to appropriate seeding functions
 * based on command-line flags.
 * 
 * Usage:
 *   npm run seed -- --test        # Seed test data (products, sellers, promoters)
 *   npm run seed -- --prod        # Seed production chapters (collegiate + alumni)
 *   npm run seed -- --test --clear # Clear and seed test data
 */

function showUsage() {
  console.log(`
🌱 Database Seeder

Usage:
  npm run seed -- [flags]

Flags:
  --test        Seed test data (products, sellers, promoters)
  --prod        Seed production chapters (collegiate + alumni from Wikipedia)
  --clear       Clear existing data before seeding (only works with --test)
  --help        Show this help message

Examples:
  npm run seed -- --test              # Seed test data
  npm run seed -- --prod              # Seed production chapters
  npm run seed -- --test --clear      # Clear and seed test data
  npm run seed -- --prod --test       # Seed both production chapters and test data
`);
}

async function runScript(scriptPath: string, args: string[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = spawn('tsx', [scriptPath, ...args], {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, '../..'),
    });

    script.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    script.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  // Determine what to seed
  const seedTest = args.includes('--test');
  const seedProd = args.includes('--prod');
  const shouldClear = args.includes('--clear');

  // If no flags specified, show usage
  if (!seedTest && !seedProd) {
    console.log('❌ Please specify what to seed: --test or --prod\n');
    showUsage();
    process.exit(1);
  }

  try {
    // Always seed industries (they're needed for registration)
    console.log('🏭 Seeding industries...\n');
    await runScript(path.join(__dirname, '../scripts/seed-industries.ts'));
    console.log('✅ Industries seeded successfully!\n');

    // Seed production chapters
    if (seedProd) {
      console.log('📚 Seeding production chapters...\n');
      
      // Seed collegiate chapters
      console.log('📖 Seeding collegiate chapters...');
      await runScript(path.join(__dirname, '../scripts/seed-chapters.ts'));
      
      // Seed alumni chapters (this is the proper way to seed alumni data)
      console.log('\n📖 Seeding alumni chapters...');
      await runScript(path.join(__dirname, '../scripts/seed-alumni-chapters.ts'));
      
      console.log('\n✅ Production chapters seeded successfully!\n');
    }

    // Seed test data
    if (seedTest) {
      console.log('🧪 Seeding test data...\n');
      const testArgs = shouldClear ? ['--clear'] : [];
      await runScript(path.join(__dirname, './seed-test.ts'), testArgs);
      console.log('\n✅ Test data seeded successfully!\n');
    }

    console.log('🎉 All seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default main;
