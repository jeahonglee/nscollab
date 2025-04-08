#!/usr/bin/env node
/**
 * Discord Whitelist Import Script
 * 
 * This script reads usernames from a text file and imports them into
 * the discord_whitelist table in Supabase.
 * 
 * Usage:
 *   node import-discord-whitelist.js <path-to-username-file>
 * 
 * Example:
 *   node import-discord-whitelist.js ../lib/supabase/discord_username_list.txt
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if running locally
// or rely on environment variables if running in production
let supabaseUrl;
let supabaseServiceRoleKey;

// Try to load from .env.local if it exists
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      if (!line || line.trim() === '') continue;
      
      const [key, ...valueParts] = line.split('=');
      if (!key) continue;
      
      const value = valueParts.join('=').trim();
      
      if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') {
        supabaseUrl = value.replace(/["']/g, '');
      } else if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') {
        supabaseServiceRoleKey = value.replace(/["']/g, '');
      }
    }
  } catch (err) {
    console.warn('Could not read .env.local file:', err);
  }
}

// Use environment variables or the values loaded from .env.local
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseServiceRoleKey;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:');
  if (!SUPABASE_URL) console.error('- NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_SERVICE_ROLE_KEY) console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease check your .env.local file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function importWhitelist(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    // Read file contents
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    let usernameList = [];
    
    // Check if the file contains a Python-style set format: {'username1', 'username2', ...}
    if (fileContent.trim().startsWith('{') && fileContent.trim().endsWith('}')) {
      // Extract usernames from Python-style set notation
      const setContent = fileContent.trim().slice(1, -1); // Remove { and }
      
      // Use regex to extract quoted strings
      const quotedStrings = setContent.match(/'[^']*'|"[^"]*"/g) || [];
      
      usernameList = quotedStrings.map(quotedString => {
        // Remove the quotes
        return quotedString.slice(1, -1).trim();
      }).filter(username => username.length > 0);
    } else {
      // Fall back to the original newline splitting method
      usernameList = fileContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    }
    
    console.log(`Found ${usernameList.length} usernames to import`);

    if (usernameList.length === 0) {
      console.log('No usernames found in file. Exiting.');
      process.exit(0);
    }

    // Truncate existing table first (optional)
    const truncateConfirm = await promptYesNo('Do you want to clear the existing whitelist before importing? (y/n) ');
    
    if (truncateConfirm) {
      console.log('Clearing existing whitelist...');
      const { error: truncateError } = await supabase
        .from('discord_whitelist')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // This will delete all rows
      
      if (truncateError) {
        console.error('Error clearing whitelist:', truncateError);
        process.exit(1);
      }
      
      console.log('Existing whitelist cleared successfully');
    }

    // Insert usernames in batches to avoid hitting request limits
    const BATCH_SIZE = 50;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < usernameList.length; i += BATCH_SIZE) {
      const batch = usernameList.slice(i, i + BATCH_SIZE);
      const userData = batch.map(username => ({ username }));
      
      const { error } = await supabase
        .from('discord_whitelist')
        .upsert(userData, { onConflict: 'username' });
      
      if (error) {
        console.error(`Error importing batch ${i / BATCH_SIZE + 1}:`, error);
        errorCount += batch.length;
      } else {
        console.log(`Successfully imported batch ${i / BATCH_SIZE + 1} (${batch.length} usernames)`);
        successCount += batch.length;
      }
    }

    console.log('\nImport summary:');
    console.log(`- Total usernames processed: ${usernameList.length}`);
    console.log(`- Successfully imported: ${successCount}`);
    console.log(`- Failed to import: ${errorCount}`);
    
    if (successCount > 0) {
      console.log('\nWhitelist import completed successfully!');
    } else {
      console.error('\nWhitelist import failed entirely.');
      process.exit(1);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Helper function to prompt for confirmation
function promptYesNo(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    
    process.stdin.once('data', (data) => {
      const answer = data.toString().trim().toLowerCase();
      resolve(answer === 'y' || answer === 'yes');
    });
  });
}

// Execute the import function
const filePath = process.argv[2];

if (!filePath) {
  console.error('Please provide a path to the username file.');
  console.error('Usage: node import-discord-whitelist.js <path-to-username-file>');
  process.exit(1);
}

// Resolve the file path if it's relative
const resolvedPath = path.resolve(process.cwd(), filePath);
console.log(`Importing whitelist from: ${resolvedPath}`);

importWhitelist(resolvedPath);
