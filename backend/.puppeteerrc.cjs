/**
 * Puppeteer configuration for both local development and Heroku deployment
 *
 * On Heroku, the buildpack will install Chrome and set PUPPETEER_EXECUTABLE_PATH
 * Locally, Puppeteer will download and use its own Chrome binary
 */

const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Cache directory for Puppeteer-downloaded browsers
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
