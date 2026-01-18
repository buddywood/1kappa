import puppeteer, { Browser, Page } from 'puppeteer';

const VENDOR_PROGRAM_URL = 'https://www.kappaalphapsi1911.com/vendor-program/';

export interface SellerVerificationResult {
  found: boolean;
  nameMatch: boolean;
  emailMatch: boolean;
  details?: {
    name?: string;
    email?: string;
  };
  error?: string;
}

/**
 * Helper: Wait for a specified number of milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verify seller from cached page content (more efficient, avoids context issues)
 */
export function verifySellerFromContent(
  pageContent: { bodyText: string; bodyHTML: string },
  name: string,
  email: string
): SellerVerificationResult {
  try {
    const bodyText = pageContent.bodyText.toLowerCase();
    const bodyHTML = pageContent.bodyHTML.toLowerCase();
    
    // Normalize the search terms (case-insensitive, trim whitespace)
    const normalizedName = name.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check for name match (case-insensitive, partial match)
    // Try to match the full name or parts of it
    const nameParts = normalizedName.split(/\s+/).filter(part => part.length > 1);
    let nameMatch = false;
    let matchedName = '';
    
    // Check if full name appears
    if (bodyText.includes(normalizedName) || bodyHTML.includes(normalizedName)) {
      nameMatch = true;
      matchedName = name;
    } else {
      // Check if significant parts of the name appear together
      // (e.g., first and last name)
      if (nameParts.length >= 2) {
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];
        
        // Check if both first and last name appear in close proximity
        const firstNameIndex = bodyText.indexOf(firstName);
        const lastNameIndex = bodyText.indexOf(lastName);
        
        if (firstNameIndex !== -1 && lastNameIndex !== -1) {
          // Check if they're within 100 characters of each other (likely same entry)
          const distance = Math.abs(firstNameIndex - lastNameIndex);
          if (distance < 100) {
            nameMatch = true;
            matchedName = name;
          }
        }
      } else if (nameParts.length === 1 && nameParts[0].length > 2) {
        // Single name part - check if it appears
        if (bodyText.includes(nameParts[0]) || bodyHTML.includes(nameParts[0])) {
          nameMatch = true;
          matchedName = name;
        }
      }
    }
    
    // Check for email match (exact match, case-insensitive)
    const emailMatch = bodyText.includes(normalizedEmail) || bodyHTML.includes(normalizedEmail);
    let matchedEmail = '';
    
    if (emailMatch) {
      matchedEmail = email;
    }
    
    // Verification is successful if both name and email are found
    const verified = nameMatch && emailMatch;
    
    if (verified) {
      console.log(`✅ Found seller: ${name} (${email})`);
    } else {
      if (!nameMatch && !emailMatch) {
        console.log(`   ❌ Neither name nor email found`);
      } else if (!nameMatch) {
        console.log(`   ❌ Name not found (email found)`);
      } else if (!emailMatch) {
        console.log(`   ❌ Email not found (name found)`);
      }
    }
    
    return {
      found: verified,
      nameMatch,
      emailMatch,
      details: verified ? {
        name: matchedName || name,
        email: matchedEmail || email,
      } : undefined,
    };
  } catch (error: any) {
    console.error(`❌ Error verifying seller: ${error.message}`);
    return {
      found: false,
      nameMatch: false,
      emailMatch: false,
      error: error.message,
    };
  }
}

/**
 * Search for a seller on the vendor program page by name and email
 * (Legacy function - kept for backward compatibility, but verifySellerFromContent is preferred)
 */
export async function verifySeller(
  page: Page,
  name: string,
  email: string
): Promise<SellerVerificationResult> {
  try {
    console.log(`🔍 Searching for seller: ${name} (${email})`);
    
    // Navigate to vendor program page (fresh navigation for each seller to avoid context issues)
    console.log(`📄 Navigating to vendor program page...`);
    
    try {
      await page.goto(VENDOR_PROGRAM_URL, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
    } catch (navError: any) {
      // If navigation fails, try again with networkidle
      console.log(`   ⚠️  First navigation attempt failed, retrying...`);
      await page.goto(VENDOR_PROGRAM_URL, { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
      });
    }
    
    // Wait for page to fully load and ensure body exists
    await page.waitForFunction(
      () => document.body && document.body.innerText.length > 0,
      { timeout: 30000 }
    );
    await delay(1000); // Small delay for any dynamic content
    
    // Get all text content from the page
    // Extract content in a single evaluate call to avoid context issues
    let bodyText = '';
    let bodyHTML = '';
    
    try {
      const content = await page.evaluate(() => {
        if (!document.body) {
          return { bodyText: '', bodyHTML: '' };
        }
        return {
          bodyText: document.body.innerText || document.body.textContent || '',
          bodyHTML: document.body.innerHTML || '',
        };
      });
      
      bodyText = (content.bodyText || '').toLowerCase();
      bodyHTML = (content.bodyHTML || '').toLowerCase();
      
      if (!bodyText && !bodyHTML) {
        throw new Error('Page content is empty');
      }
    } catch (error: any) {
      console.error(`Error extracting page content: ${error.message}`);
      // Try alternative method
      try {
        const textContent = await page.evaluate(() => {
          return document.body?.innerText || document.body?.textContent || '';
        });
        const htmlContent = await page.evaluate(() => {
          return document.body?.innerHTML || '';
        });
        bodyText = (textContent || '').toLowerCase();
        bodyHTML = (htmlContent || '').toLowerCase();
      } catch (fallbackError: any) {
        throw new Error(`Failed to extract page content: ${fallbackError.message}`);
      }
    }
    
    // Normalize the search terms (case-insensitive, trim whitespace)
    const normalizedName = name.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check for name match (case-insensitive, partial match)
    // Try to match the full name or parts of it
    const nameParts = normalizedName.split(/\s+/).filter(part => part.length > 1);
    let nameMatch = false;
    let matchedName = '';
    
    // Check if full name appears
    if (bodyText.includes(normalizedName) || bodyHTML.includes(normalizedName)) {
      nameMatch = true;
      matchedName = name;
    } else {
      // Check if significant parts of the name appear together
      // (e.g., first and last name)
      if (nameParts.length >= 2) {
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];
        
        // Check if both first and last name appear in close proximity
        const firstNameIndex = bodyText.indexOf(firstName);
        const lastNameIndex = bodyText.indexOf(lastName);
        
        if (firstNameIndex !== -1 && lastNameIndex !== -1) {
          // Check if they're within 100 characters of each other (likely same entry)
          const distance = Math.abs(firstNameIndex - lastNameIndex);
          if (distance < 100) {
            nameMatch = true;
            matchedName = name;
          }
        }
      } else if (nameParts.length === 1 && nameParts[0].length > 2) {
        // Single name part - check if it appears
        if (bodyText.includes(nameParts[0]) || bodyHTML.includes(nameParts[0])) {
          nameMatch = true;
          matchedName = name;
        }
      }
    }
    
    // Check for email match (exact match, case-insensitive)
    const emailMatch = bodyText.includes(normalizedEmail) || bodyHTML.includes(normalizedEmail);
    let matchedEmail = '';
    
    if (emailMatch) {
      matchedEmail = email;
    }
    
    // If both match, try to find them in the same context (same vendor entry)
    let foundTogether = false;
    if (nameMatch && emailMatch) {
      // Try to find if name and email appear near each other (within 200 chars)
      const nameIndex = bodyText.indexOf(normalizedName);
      const emailIndex = bodyText.indexOf(normalizedEmail);
      
      if (nameIndex !== -1 && emailIndex !== -1) {
        const distance = Math.abs(nameIndex - emailIndex);
        if (distance < 200) {
          foundTogether = true;
        }
      } else {
        // Try with HTML
        const nameIndexHTML = bodyHTML.indexOf(normalizedName);
        const emailIndexHTML = bodyHTML.indexOf(normalizedEmail);
        
        if (nameIndexHTML !== -1 && emailIndexHTML !== -1) {
          const distance = Math.abs(nameIndexHTML - emailIndexHTML);
          if (distance < 200) {
            foundTogether = true;
          }
        }
      }
    }
    
    // Verification is successful if both name and email are found
    // and ideally they appear together (same vendor entry)
    const verified = nameMatch && emailMatch;
    
    if (verified) {
      console.log(`✅ Found seller: ${name} (${email})`);
      if (!foundTogether) {
        console.log(`   ⚠️  Name and email found but not in same context`);
      }
    } else {
      if (!nameMatch && !emailMatch) {
        console.log(`   ❌ Neither name nor email found`);
      } else if (!nameMatch) {
        console.log(`   ❌ Name not found (email found)`);
      } else if (!emailMatch) {
        console.log(`   ❌ Email not found (name found)`);
      }
    }
    
    return {
      found: verified,
      nameMatch,
      emailMatch,
      details: verified ? {
        name: matchedName || name,
        email: matchedEmail || email,
      } : undefined,
    };
  } catch (error: any) {
    console.error(`❌ Error verifying seller: ${error.message}`);
    return {
      found: false,
      nameMatch: false,
      emailMatch: false,
      error: error.message,
    };
  }
}

/**
 * Create a browser instance for seller verification
 * @param headless - Whether to run in headless mode (default: true)
 */
export async function createBrowser(headless: boolean = true): Promise<Browser> {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
  ];

  // Only add these args in headless mode
  if (headless) {
    args.push('--disable-accelerated-2d-canvas', '--disable-gpu');
  }

  // On Heroku, use the Chrome binary provided by the buildpack
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ||
                        process.env.CHROME_BIN ||
                        undefined;

  return await puppeteer.launch({
    headless: headless ? true : false,
    executablePath,
    args,
    defaultViewport: headless ? undefined : { width: 1280, height: 720 },
  });
}

