/**
 * Migration script to regenerate previews for existing images
 * Regenerates all previews with current settings (quantization levels, etc.)
 * Note: Gamma correction is applied at render time, so it will automatically apply to all images
 *
 * Run via: npx tsx scripts/migrate-images.ts
 */

/* eslint-disable no-console */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { base64ToPixelData, QUANTIZATION_LEVELS } from "../lib/utils/pixel-data-processing";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Use service role key for migrations (bypasses RLS)
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kaokqdggrlavjurtwlcb.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Prefer service role key, fallback to anon key
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  console.error("Need either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_KEY");
  console.error("Also need NEXT_PUBLIC_SUPABASE_URL (or it will use default)");
  process.exit(1);
}

if (!supabaseServiceRoleKey) {
  console.warn(
    "⚠️  Using anon key instead of service role key. Service role key is recommended for migrations."
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateImages() {
  console.log("Starting image migration...");

  try {
    // Fetch all images that have pixel_data (regenerate all previews)
    const { data: images, error: fetchError } = await supabase
      .from("pixel_art_images")
      .select("id, pixel_data, width, height")
      .not("pixel_data", "is", null);

    if (fetchError) {
      console.error("Error fetching images:", fetchError);
      return;
    }

    if (!images || images.length === 0) {
      console.log("No images found to process.");
      return;
    }

    console.log(`Found ${images.length} images to regenerate previews`);
    console.log(
      `Note: Gamma correction (0.6) is applied at render time, so it will automatically apply to all images`
    );

    let successCount = 0;
    let errorCount = 0;

    // Process each image
    for (const img of images) {
      try {
        if (!img.pixel_data) {
          console.log(`Skipping image ${img.id}: no pixel_data`);
          continue;
        }

        console.log(`Processing image ${img.id}...`);

        // Decode pixel_data to Uint8Array
        const pixelData = base64ToPixelData(img.pixel_data);
        const width = img.width || 128;
        const height = img.height || 128;

        // Generate preview as grayscale PNG
        // Note: generatePreview uses browser APIs, so we need to use Node.js canvas
        const preview = await generatePreviewInNode(pixelData, width, height);

        // Update the image with preview
        const { error: updateError } = await supabase
          .from("pixel_art_images")
          .update({ preview: preview })
          .eq("id", img.id);

        if (updateError) {
          console.error(`Error updating image ${img.id}:`, updateError);
          errorCount++;
        } else {
          console.log(`✓ Successfully migrated image ${img.id}`);
          successCount++;
        }
      } catch (error) {
        console.error(`Error processing image ${img.id}:`, error);
        errorCount++;
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

/**
 * Generate preview in Node.js environment (PNG format)
 * Uses node-canvas library
 */
async function generatePreviewInNode(
  pixelData: Uint8Array,
  width: number,
  height: number
): Promise<string> {
  // For Node.js, we need to use a canvas library
  // Since generatePreview uses browser APIs, we'll create a Node.js compatible version
  // This requires installing 'canvas' package: npm install canvas

  try {
    // Try to use node-canvas if available
    let canvasModule;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      canvasModule = require("canvas");
      console.log(`  Canvas module loaded successfully`);
    } catch (requireError) {
      console.error(`  Failed to require canvas module:`, requireError);
      throw new Error("Canvas module not found. Run: npm install canvas");
    }

    if (!canvasModule || !canvasModule.createCanvas) {
      throw new Error("Canvas module does not export createCanvas");
    }

    const { createCanvas } = canvasModule;
    console.log(`  Creating canvas ${width}x${height}...`);
    const canvas = createCanvas(width, height);

    if (!canvas) {
      throw new Error("createCanvas returned undefined");
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    ctx.imageSmoothingEnabled = false;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    console.log(`  Filling pixel data (${pixelData.length} pixels)...`);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const intensityLevel = pixelData[index]; // 0-127
        // Normalize intensity based on quantization levels (0-63 for 64 levels, 0-127 for 128 levels, etc.)
        const maxIntensity = QUANTIZATION_LEVELS - 1;
        const grayscaleValue = Math.round((intensityLevel / maxIntensity) * 255); // 0-255
        const pixelIndex = (y * width + x) * 4;
        data[pixelIndex] = grayscaleValue; // R
        data[pixelIndex + 1] = grayscaleValue; // G
        data[pixelIndex + 2] = grayscaleValue; // B
        data[pixelIndex + 3] = 255; // Alpha
      }
    }

    console.log(`  Putting image data to canvas...`);
    ctx.putImageData(imageData, 0, 0);

    // Convert to PNG buffer
    console.log(`  Converting to PNG buffer...`);
    const buffer = canvas.toBuffer("image/png");

    if (!buffer || buffer.length === 0) {
      throw new Error("PNG buffer is empty");
    }

    console.log(`  PNG buffer created, length: ${buffer.length}`);
    const base64 = buffer.toString("base64");
    console.log(`  Converted to base64, length: ${base64.length}`);

    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error(`  Error details:`, error);
    if (error instanceof Error) {
      console.error(`  Error message: ${error.message}`);
      console.error(`  Error stack: ${error.stack}`);
    }
    throw error;
  }
}

// Run migration
migrateImages()
  .then(() => {
    console.log("Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });
