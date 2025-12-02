require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: console.log,
    seederStorage: 'sequelize',
    dialectOptions: {
      ssl: process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('neon') || process.env.DATABASE_URL.includes('heroku'))
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
      ssl: process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('neon') || process.env.DATABASE_URL.includes('heroku'))
        ? { rejectUnauthorized: false }
        : false
    }
  }
};

