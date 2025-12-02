require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

// Helper function to determine if SSL should be enabled
function shouldUseSSL(databaseUrl) {
  if (!databaseUrl) return false;
  
  // Check for sslmode=require in the URL
  if (databaseUrl.includes('sslmode=require')) return true;
  
  // Check for common cloud database providers
  if (databaseUrl.includes('neon') || 
      databaseUrl.includes('heroku') ||
      databaseUrl.includes('amazonaws.com') ||
      databaseUrl.includes('rds.amazonaws.com') ||
      databaseUrl.includes('cloud.google.com') ||
      databaseUrl.includes('azure')) {
    return true;
  }
  
  // For production, enable SSL if not localhost
  if (process.env.NODE_ENV === 'production' && !databaseUrl.includes('localhost')) {
    return true;
  }
  
  return false;
}

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: console.log,
    seederStorage: 'sequelize',
    dialectOptions: {
      ssl: shouldUseSSL(process.env.DATABASE_URL)
        ? { rejectUnauthorized: false }
        : false
    }
  },
  test: {
    url: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    seederStorage: 'sequelize',
    dialectOptions: {
      ssl: false
    }
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    seederStorage: 'sequelize',
    dialectOptions: {
      ssl: shouldUseSSL(process.env.DATABASE_URL)
        ? { rejectUnauthorized: false }
        : false
    }
  }
};

