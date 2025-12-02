import axios from 'axios';
import * as cheerio from 'cheerio';
import { createChapter } from '../db/queries-sequelize';
import pool from '../db/connection';

const WIKIPEDIA_URL = 'https://en.wikipedia.org/wiki/List_of_Kappa_Alpha_Psi_chapters';

interface ChapterData {
  name: string;
  chartered: string;
  institution?: string;
  location: string;
  status: string;
  type: 'Collegiate' | 'Alumni';
}

// Mapping of US states to Kappa Alpha Psi provinces
const stateToProvince: Record<string, string> = {
  // North Central Province
  'IL': 'North Central',
  'IN': 'North Central',
  'IA': 'North Central',
  'WI': 'North Central',
  'MN': 'North Central',
  
  // Northern Province
  'MI': 'Northern',
  'NY': 'Northern',
  
  // East Central Province
  'OH': 'East Central',
  
  // South Central Province
  'KY': 'South Central',
  'TN': 'South Central',
  
  // Middle Western Province
  'MO': 'Middle Western',
  'KS': 'Middle Western',
  'OK': 'Middle Western',
  'NE': 'Middle Western',
  'CO': 'Middle Western',
  
  // Eastern Province
  'MD': 'Eastern',
  'VA': 'Eastern',
  'DC': 'Eastern',
  
  // Northeastern Province
  'PA': 'Northeastern',
  'NJ': 'Northeastern',
  'CT': 'Northeastern',
  'MA': 'Northeastern',
  'RI': 'Northeastern',
  'DE': 'Northeastern',
  
  // Southeastern Province
  'GA': 'Southeastern',
  'SC': 'Southeastern',
  
  // Southern Province
  'FL': 'Southern',
  'AL': 'Southern',
  
  // Southwestern Province
  'TX': 'Southwestern',
  'LA': 'Southwestern',
  'MS': 'Southwestern',
  'AR': 'Southwestern',
  'NM': 'Southwestern',
  
  // Middle Eastern Province
  'NC': 'Middle Eastern',
  'WV': 'Middle Eastern',
  
  // Western Province
  'CA': 'Western',
  'OR': 'Western',
  'WA': 'Western',
  'NV': 'Western',
  'AZ': 'Western',
  'HI': 'Western',
  'AK': 'Western',
  'UT': 'Western',
};

function parseLocation(location: string): { city: string | null; state: string | null } {
  if (!location || location.trim() === '') {
    return { city: null, state: null };
  }

  // Handle various formats: "City, ST", "City, State", "City, ST, Country", etc.
  const parts = location.split(',').map(p => p.trim());
  
  if (parts.length < 2) {
    // Try to extract state abbreviation if it's a 2-letter code at the end
    const match = location.match(/\b([A-Z]{2})\b$/);
    if (match) {
      const state = match[1];
      const city = location.replace(/\s*[A-Z]{2}\s*$/, '').trim();
      return { city: city || null, state };
    }
    return { city: location || null, state: null };
  }

  const city = parts[0] || null;
  let state = parts[1] || null;

  // If state is a full state name, try to keep it, but prefer abbreviation if available
  // For now, just use what's provided
  if (state && state.length > 2) {
    // Could add state name to abbreviation mapping here if needed
  }

  return { city, state };
}

function parseCharteredYear(chartered: string): number | null {
  if (!chartered || chartered.trim() === '') {
    return null;
  }

  // Extract year from various formats: "1911", "1911-01-01", etc.
  const yearMatch = chartered.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return parseInt(yearMatch[0], 10);
  }

  return null;
}

function parseStatus(status: string): string {
  if (!status || status.trim() === '') {
    return 'Active';
  }
  
  const normalized = status.trim();
  // Common status values: "Active", "Inactive", "Closed", etc.
  if (normalized.toLowerCase() === 'active') {
    return 'Active';
  }
  if (normalized.toLowerCase() === 'inactive' || normalized.toLowerCase() === 'closed') {
    return 'Inactive';
  }
  
  return normalized;
}

function getProvinceFromState(state: string | null): string | null {
  if (!state) {
    return null;
  }

  const stateCode = state.trim().toUpperCase();
  // Handle state codes that might have extra characters
  const code = stateCode.length > 2 ? stateCode.substring(0, 2) : stateCode;
  return stateToProvince[code] || null;
}

async function scrapeCollegiateChapters(): Promise<void> {
  console.log('📚 Scraping collegiate chapters from Wikipedia...\n');
  console.log('Fetching Wikipedia page...');
  
  const response = await axios.get(WIKIPEDIA_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const $ = cheerio.load(response.data);
  const chapters: ChapterData[] = [];

  // Build a map of tables to their section by iterating through document in order
  let currentSection: 'Collegiate' | 'Alumni' = 'Collegiate';
  const tableSectionMap = new Map<any, 'Collegiate' | 'Alumni'>();
  
  // Get the main content area
  const $content = $('#content, #bodyContent, .mw-parser-output').first();
  const $elements = $content.length > 0 ? $content : $('body');
  
  // Iterate through headings and tables in document order
  $elements.find('h2, h3, table.wikitable').each((_, elem) => {
    const $elem = $(elem);
    const tagName = (elem as any).tagName?.toLowerCase() || '';
    
    // Check if this is a section heading
    if (tagName === 'h2' || tagName === 'h3') {
      const text = $elem.text().toLowerCase().trim();
      // Check for "Alumni chapters" or just "Alumni" (but not "Collegiate/Undergraduate chapters")
      if ((text.includes('alumni chapters') || (text.includes('alumni') && !text.includes('collegiate') && !text.includes('undergraduate')))) {
        currentSection = 'Alumni';
        console.log(`Found Alumni section: "${$elem.text()}"`);
      } else if (text.includes('collegiate') || text.includes('undergraduate')) {
        currentSection = 'Collegiate';
        console.log(`Found Collegiate section: "${$elem.text()}"`);
      }
    }
    
    // If this is a table, assign it to the current section
    if (tagName === 'table' && $elem.hasClass('wikitable')) {
      tableSectionMap.set(elem, currentSection);
    }
  });

  // Find all tables on the page
  const tables = $('table.wikitable');
  console.log(`Found ${tables.length} tables on the page\n`);

  tables.each((tableIndex, table) => {
    const $table = $(table);
    const headers: string[] = [];
    
    // Get headers from the first row
    $table.find('tr').first().find('th, td').each((_, cell) => {
      headers.push($(cell).text().trim());
    });

    // Get the section for this table from our map
    let chapterType: 'Collegiate' | 'Alumni' = tableSectionMap.get(table) || 'Collegiate';
    
    // Also check for table caption
    const $caption = $table.find('caption');
    if ($caption.length) {
      const captionText = $caption.text().toLowerCase();
      if (captionText.includes('alumni')) {
        chapterType = 'Alumni';
      }
    }
    
    // Fallback: use prevAll if not in map
    if (!tableSectionMap.has(table) && !$caption.length) {
      // Look for the closest heading before this table
      const prevHeading = $table.prevAll('h2, h3, h4').first();
      if (prevHeading.length) {
        const headingText = prevHeading.text().toLowerCase();
        if (headingText.includes('alumni chapters') || (headingText.includes('alumni') && !headingText.includes('collegiate') && !headingText.includes('undergraduate'))) {
          chapterType = 'Alumni';
        } else if (headingText.includes('collegiate') || headingText.includes('undergraduate')) {
          chapterType = 'Collegiate';
        }
      }
    }

    // Find the column indices - handle various header formats
    const nameIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('name') || lower === '' || lower === 'chapter';
    });
    const charteredIndex = headers.findIndex(h => h.toLowerCase().includes('chartered'));
    const locationIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('location') || lower.includes('city') || lower.includes('state');
    });
    const statusIndex = headers.findIndex(h => h.toLowerCase().includes('status'));

    // Skip if we don't have the essential columns (name is required)
    if (nameIndex === -1) {
      return;
    }

    // Process each row (skip header row) - ONLY COLLEGIATE CHAPTERS
    $table.find('tr').slice(1).each((_, row) => {
      const $row = $(row);
      const cells = $row.find('td, th');
      
      if (cells.length === 0) {
        return;
      }

      const name = cells.eq(nameIndex).text().trim();
      if (!name || name === '') {
        return;
      }

      // If the chapter name contains "Alumni", skip it (it's an Alumni chapter)
      if (name.toLowerCase().includes('alumni')) {
        return;
      }

      // Only process if it's a Collegiate chapter
      if (chapterType !== 'Collegiate') {
        return;
      }

      const chartered = charteredIndex >= 0 ? cells.eq(charteredIndex).text().trim() : '';
      const location = locationIndex >= 0 ? cells.eq(locationIndex).text().trim() : '';
      const status = statusIndex >= 0 ? cells.eq(statusIndex).text().trim() : 'Active';

      chapters.push({
        name,
        chartered,
        location,
        status,
        type: 'Collegiate',
      });
    });
  });

  console.log(`Found ${chapters.length} collegiate chapters to process\n`);

  // Insert chapters into database
  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  let updated = 0;

  for (const chapterData of chapters) {
    try {
      // Check if chapter already exists
      const existing = await pool.query(
        'SELECT id, province FROM chapters WHERE name = $1 AND type = $2',
        [chapterData.name, chapterData.type]
      );

      if (existing.rows.length > 0) {
        // Chapter exists - update province if it's null
        const existingChapter = existing.rows[0];
        if (!existingChapter.province) {
          const { state } = parseLocation(chapterData.location);
          const province = getProvinceFromState(state);
          if (province) {
            await pool.query(
              'UPDATE chapters SET province = $1 WHERE id = $2',
              [province, existingChapter.id]
            );
            updated++;
            if (updated % 10 === 0) {
              console.log(`Updated ${updated} chapters with province...`);
            }
          }
        }
        console.log(`Skipping duplicate: ${chapterData.name}`);
        skipped++;
        continue;
      }

      const { city, state } = parseLocation(chapterData.location);
      const charteredYear = parseCharteredYear(chapterData.chartered);
      const status = parseStatus(chapterData.status);
      const province = getProvinceFromState(state);

      await createChapter({
        name: chapterData.name,
        type: chapterData.type,
        status,
        chartered: charteredYear,
        province,
        city,
        state,
        contact_email: null,
      });

      inserted++;
      if (inserted % 10 === 0) {
        console.log(`Inserted ${inserted} collegiate chapters...`);
      }
    } catch (error) {
      console.error(`Error inserting chapter ${chapterData.name}:`, error);
      errors++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total collegiate chapters found: ${chapters.length}`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated (province): ${updated}`);
  console.log(`Skipped (duplicates): ${skipped}`);
  console.log(`Errors: ${errors}`);
}

async function main() {
  try {
    await scrapeCollegiateChapters();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    await pool.end();
    process.exit(1);
  }
}

main();

