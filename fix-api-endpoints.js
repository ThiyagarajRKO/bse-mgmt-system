#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const viewsDir = path.join(__dirname, "views");

// Get all .ejs files
const emsFiles = fs
  .readdirSync(viewsDir)
  .filter((file) => file.endsWith(".ejs"));

console.log(`Found ${emsFiles.length} EJS files to process...\n`);

emsFiles.forEach((file) => {
  const filePath = path.join(viewsDir, file);
  let content = fs.readFileSync(filePath, "utf8");
  const originalContent = content;

  // Replace all /api/v1/ with /api/
  content = content.replace(/\/api\/v1\//g, "/api/");

  // Check if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, "utf8");
    const lines = originalContent.split("\n");
    const newLines = content.split("\n");
    let changes = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] !== newLines[i]) {
        changes++;
      }
    }
    console.log(`✓ Updated ${file} (${changes} lines changed)`);
  } else {
    console.log(`- No changes needed in ${file}`);
  }
});

console.log("\nDone! All /api/v1/ references have been replaced with /api/");
