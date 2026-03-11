/**
 * Cross-platform script to copy static files and public folder
 * to standalone build output for production deployment.
 * Works on Windows, Linux, and Mac without any OS-specific commands.
 */

/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');

// Paths
const staticSource = path.join(__dirname, '..', '.next', 'static');
const staticTarget = path.join(__dirname, '..', '.next', 'standalone', '.next', 'static');
const publicSource = path.join(__dirname, '..', 'public');
const publicTarget = path.join(__dirname, '..', '.next', 'standalone', 'public');

/**
 * Copy a directory recursively
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
function copyDirectory(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Main function to copy files
 */
function main() {
  try {
    console.log('Copying files for standalone build...');

    // Copy .next/static to .next/standalone/.next/static
    if (fs.existsSync(staticSource)) {
      console.log('Copying .next/static...');
      copyDirectory(staticSource, staticTarget);
      console.log('Copied .next/static successfully');
    } else {
      console.log('Warning: .next/static not found, skipping...');
    }

    // Copy public to .next/standalone/public
    if (fs.existsSync(publicSource)) {
      console.log('Copying public folder...');
      copyDirectory(publicSource, publicTarget);
      console.log('Copied public folder successfully');
    } else {
      console.log('Warning: public folder not found, skipping...');
    }

    console.log('All files copied successfully!');
  } catch (error) {
    console.error('Error copying files:', error.message);
    process.exit(1);
  }
}

main();
