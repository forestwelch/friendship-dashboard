/**
 * Script to verify all icons used in the codebase exist in the icon library
 * Run with: npx tsx scripts/verify-icons.ts
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";

// Extract all icon classes used in codebase
const iconPattern = /hn-[a-z-]+/g;
const codebaseIcons = new Set<string>();

// Read all TSX/TS files
function extractIconsFromFile(filePath: string) {
  try {
    const content = readFileSync(filePath, "utf-8");
    const matches = content.matchAll(iconPattern);
    for (const match of matches) {
      codebaseIcons.add(match[0]);
    }
  } catch {
    // Skip files that can't be read
  }
}

function walkDir(dir: string, extensions: string[] = [".tsx", ".ts"]) {
  const files = readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = join(dir, file.name);
    if (file.isDirectory() && !file.name.startsWith(".") && file.name !== "node_modules") {
      walkDir(fullPath, extensions);
    } else if (extensions.some((ext) => file.name.endsWith(ext))) {
      extractIconsFromFile(fullPath);
    }
  }
}

// Extract icons from codebase
walkDir(join(process.cwd(), "components"));
walkDir(join(process.cwd(), "app"));
walkDir(join(process.cwd(), "lib"));

// Read icon font CSS to get available icons
const availableIcons = new Set<string>();
try {
  const iconFontPath = join(
    process.cwd(),
    "node_modules/@hackernoon/pixel-icon-library/fonts/iconfont.css"
  );
  const iconFontContent = readFileSync(iconFontPath, "utf-8");
  const iconMatches = iconFontContent.matchAll(/\.(hn-[a-z-]+):/g);
  for (const match of iconMatches) {
    availableIcons.add(match[1]);
  }
} catch (error) {
  console.error("Could not read icon font file:", error);
  process.exit(1);
}

// Compare
const usedIcons = Array.from(codebaseIcons).sort();
const missingIcons: string[] = [];
const foundIcons: string[] = [];

for (const icon of usedIcons) {
  if (availableIcons.has(icon)) {
    foundIcons.push(icon);
  } else {
    missingIcons.push(icon);
  }
}

console.warn(`\n📊 Icon Verification Report\n`);
console.warn(`Total icons used in codebase: ${usedIcons.length}`);
console.warn(`✅ Icons found in library: ${foundIcons.length}`);
console.warn(`❌ Icons NOT found in library: ${missingIcons.length}\n`);

if (missingIcons.length > 0) {
  console.warn("❌ Missing Icons (need to be replaced):");
  missingIcons.forEach((icon) => console.warn(`   - ${icon}`));
  console.warn("");
}

if (foundIcons.length > 0) {
  console.warn("✅ Verified Icons:");
  foundIcons.forEach((icon) => console.warn(`   - ${icon}`));
}

process.exit(missingIcons.length > 0 ? 1 : 0);
