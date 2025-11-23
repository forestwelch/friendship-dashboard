# Pixel Art Widget Workflow

## How It Works

The pixel art widget system allows you to upload images, convert them to pixel art, and display them on friend dashboards.

## Current Workflow

### Option 1: Upload First, Then Add Widget (Recommended)

1. **Go to Admin → Upload Pixel Art**
   - Navigate to `/admin/upload/[friend-slug]` (e.g., `/admin/upload/daniel`)
   - Select an image file (PNG, JPG, or HEIC)
   - Choose the widget size (1x1, 2x2, or 3x3)
   - The image will be automatically:
     - Converted from HEIC to PNG (if needed)
     - Cropped to fit the widget size
     - Pixelated and color-quantized to match the friend's theme palette
   - Click "Save Pixel Art" to upload to Supabase

2. **Add Pixel Art Widget**
   - Go to Admin → Manage Widgets for the friend
   - Click "+ Add Widget"
   - Select "Pixel Art" and choose a size
   - The widget will automatically find and display a pixel art image of matching size

### Option 2: Add Widget First, Then Upload

1. **Add Pixel Art Widget**
   - Go to Admin → Manage Widgets
   - Add a Pixel Art widget of desired size
   - Save the layout

2. **Upload Pixel Art**
   - Go to Admin → Upload Pixel Art
   - Upload an image matching the widget size
   - The image will be linked to the widget automatically (if widget_id is set)

## How Images Are Matched

The system matches pixel art images to widgets using this priority:

1. **By Widget ID** (if widget_id is set in pixel_art_images table)
2. **By Size** (first image of matching size for the friend)

## Image Processing

When you upload an image:

1. **HEIC Conversion**: If the file is HEIC/HEIF, it's converted to PNG
2. **Cropping**: Image is center-cropped to fit the widget dimensions:
   - 1x1: 80x80px
   - 2x2: 168x168px (80*2 + 8 gap)
   - 3x3: 256x256px (80*3 + 8*2 gaps)
3. **Pixelation**: Image is downscaled and upscaled to create pixelated effect
4. **Color Quantization**: Colors are mapped to the friend's theme palette:
   - Primary color
   - Secondary color
   - Accent color
   - Background color
   - Text color
5. **Animation**: When displayed, tiles flip in a cascading animation

## Database Structure

### `pixel_art_images` table:
- `id`: Unique identifier
- `friend_id`: Which friend this image belongs to
- `widget_id`: (Optional) Links to specific widget
- `size`: Widget size (1x1, 2x2, 3x3)
- `image_data`: Base64 encoded PNG image

## Future Improvements

- [ ] Link uploaded images to widgets directly in the upload UI
- [ ] Preview widget placement before uploading
- [ ] Edit/delete uploaded images
- [ ] Batch upload multiple sizes at once
- [ ] Image gallery view


