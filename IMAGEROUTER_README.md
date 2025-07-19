# ImageRouter Integration

This app now supports native image and video generation using ImageRouter API, which provides access to multiple AI models.

## Features

### 🎨 **Image Generation**
- **Dual Model Generation**: Automatically generates 2 images per request using:
  - `stabilityai/sdxl-turbo:free`
  - `black-forest-labs/FLUX-1-schnell:free`
- **High Quality**: Both models provide excellent image quality
- **Fast Generation**: Optimized for speed with turbo models

### ✏️ **Image Editing**
- **Advanced Editing**: Uses `HiDream-ai/HiDream-I1-Full:free` model
- **Multiple Images**: Support for editing up to 16 images at once
- **Mask Support**: Optional mask files for precise editing

### 🎬 **Video Generation**
- **AI Video**: Uses `minimax/hailuo-02-standard` model
- **Text-to-Video**: Generate videos from text prompts
- **High Quality**: Professional video generation
- **Fully Integrated**: Available as AI tool in chat interface

## How It Works

### For Users:
1. **Image Generation**: Simply ask "Generate an image of..." or "Create a picture of..."
2. **Image Editing**: Upload an image and ask "Edit this image to..." 
3. **Video Generation**: Ask "Generate a video of..." or "Create a video showing..."

### For Developers:
The AI automatically uses these custom tools instead of Arcade toolkit:
- `generateImage` - Prioritized for all image generation requests
- `editImage` - Used when users upload images for editing
- `generateVideo` - Used for video generation requests

## API Endpoints

- `POST /api/images/generate` - Generate images
- `POST /api/images/edit` - Edit images (multipart/form-data)
- `POST /api/videos/generate` - Generate videos

## UI Components

### ImageResult Component
- **Responsive Grid**: Displays 1-2 images per row
- **Model Badges**: Shows which AI model generated each image
- **Download**: Direct download of generated media
- **Full Screen**: Click to view images in full resolution
- **Video Player**: Built-in controls for generated videos

### Integration
- **Seamless Chat UI**: Results appear directly in chat
- **No UI Changes**: Maintains existing chat interface
- **Tool Results**: Integrated with existing tool result system

## Models Used

| Type | Model | Purpose |
|------|-------|---------|
| Image | `stabilityai/sdxl-turbo:free` | Fast, high-quality image generation |
| Image | `black-forest-labs/FLUX-1-schnell:free` | Alternative style and quality |
| Edit | `HiDream-ai/HiDream-I1-Full:free` | Advanced image editing |
| Video | `minimax/hailuo-02-standard` | Professional video generation |

## Example Usage

**User**: "Generate an image of a sunset over mountains"
**Result**: 2 images generated simultaneously using both SDXL-Turbo and FLUX models

**User**: "Edit this image to make it more colorful" (with uploaded image)
**Result**: Edited image using HiDream model

**User**: "Create a video of waves crashing on a beach"
**Result**: AI-generated video using Hailuo model

**User**: "Generate a video showing a sunset over mountains"
**Result**: Professional quality video generated with minimax/hailuo-02-standard

## Technical Details

- **Authentication**: Protected by Clerk authentication
- **Error Handling**: Graceful error messages and fallbacks
- **Performance**: Parallel generation for faster results
- **Storage**: Images served directly from ImageRouter CDN
- **Formats**: Supports PNG for images, MP4 for videos