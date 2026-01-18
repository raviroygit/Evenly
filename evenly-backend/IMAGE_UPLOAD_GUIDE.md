# Image Upload Guide - Transaction Attachments

## Supported Image Formats ✅

The transaction attachment feature supports the following image formats:

| Format | Extension | MIME Type | Notes |
|--------|-----------|-----------|-------|
| **JPEG** | `.jpg`, `.jpeg` | `image/jpeg` | ✅ Recommended - Best compatibility |
| **PNG** | `.png` | `image/png` | ✅ Recommended - Supports transparency |
| **GIF** | `.gif` | `image/gif` | ✅ Supported - Animated GIFs work |
| **WebP** | `.webp` | `image/webp` | ✅ Supported - Modern format |
| **BMP** | `.bmp` | `image/bmp` | ✅ Supported - Uncompressed format |
| **SVG** | `.svg` | `image/svg+xml` | ✅ Supported - Vector graphics |

## File Size Limit

**Maximum file size**: 10 MB per image

Images larger than 10 MB will be rejected with an error message.

## Unsupported Formats ❌

The following formats are **NOT supported**:

| Format | Extension | Why Not Supported | Solution |
|--------|-----------|-------------------|----------|
| **HEIC/HEIF** | `.heic`, `.heif` | Apple proprietary format | Convert to JPEG before uploading |
| **TIFF** | `.tif`, `.tiff` | Large file size, not web-friendly | Convert to JPEG or PNG |
| **RAW** | `.raw`, `.cr2`, `.nef`, `.arw` | Camera raw formats, very large | Convert to JPEG |
| **PDF** | `.pdf` | Document format, not an image | Extract image or convert to JPEG |
| **AVIF** | `.avif` | New format, limited support | Convert to WebP or JPEG |

## Common Issues and Solutions

### Issue 1: iPhone Photos Not Uploading (HEIC Format)

**Problem**: iPhone photos taken in default mode use HEIC format, which is not supported.

**Error Message**:
```
Unsupported image format: image/heic. Supported formats: JPEG, PNG, GIF, WebP, BMP, SVG.
Note: HEIC/HEIF images (iPhone photos) need to be converted to JPEG first.
```

**Solutions**:

#### Option 1: Change iPhone Camera Settings (Permanent Fix)
1. Open iPhone **Settings**
2. Go to **Camera** → **Formats**
3. Select **Most Compatible** (instead of High Efficiency)
4. New photos will be saved as JPEG

#### Option 2: Convert Photo Before Uploading
1. Open the photo in iPhone **Photos** app
2. Tap **Share** button
3. Select **Save to Files** or share to another app
4. iOS will automatically convert it to JPEG

#### Option 3: Use Third-Party Converter App
- Download a HEIC to JPEG converter app from App Store
- Convert photos before uploading

### Issue 2: File Too Large

**Error Message**:
```
File too large: maximum size is 10MB, got 15.23MB
```

**Solutions**:
1. **Compress the image**: Use online tools like TinyPNG, Squoosh, or ImageOptim
2. **Resize the image**: Reduce image dimensions before uploading
3. **Change format**: Convert PNG to JPEG (usually smaller)
4. **Use phone's built-in compression**: Most camera apps have quality settings

### Issue 3: Invalid File Signature

**Error Message**:
```
Invalid image file: file signature not recognized.
Please ensure you are uploading a valid image file (JPEG, PNG, GIF, WebP, BMP, or SVG).
```

**Common Causes**:
- File is corrupted
- File extension doesn't match actual file type (renamed file)
- File is not actually an image (e.g., text file renamed to .jpg)

**Solutions**:
1. Re-save the image using an image editor
2. Take a new photo/screenshot
3. Download the image again from original source

### Issue 4: Upload Fails with No Error

**Possible Causes**:
- Network timeout (slow connection)
- File corrupted during transfer
- Cloudinary service temporarily unavailable

**Solutions**:
1. Check internet connection
2. Try again after a few seconds
3. Try uploading a different image to verify service works
4. Check app logs for detailed error

## Best Practices for Image Uploads

### 1. Optimize Before Uploading
- Resize images to reasonable dimensions (e.g., 1920x1080 max)
- Compress images to reduce file size
- Use JPEG for photos, PNG for screenshots/graphics

### 2. Recommended Settings
- **Quality**: 80-90% (good balance between quality and size)
- **Resolution**: 72-150 DPI (higher not needed for screens)
- **Color Space**: sRGB (standard for web)

### 3. For Best Results
- Use good lighting when taking photos of receipts
- Ensure text is readable in the photo
- Keep file size under 5 MB for faster uploads
- Use JPEG or PNG formats

## API Usage

### Create Transaction with Image

```bash
curl -X POST https://evenly-backend-374738393915.us-central1.run.app/api/v1/khata/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "customerId=UUID" \
  -F "type=give" \
  -F "amount=100.00" \
  -F "description=Payment for services" \
  -F "image=@/path/to/receipt.jpg"
```

### Supported Mimetypes in API
```javascript
const supportedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/svg+xml',
];
```

## Validation Details

The image upload system performs multiple validation checks:

### 1. Configuration Check
- Verifies Cloudinary credentials are configured
- Prevents upload attempts if service not configured

### 2. File Size Check
- Maximum: 10 MB (10,485,760 bytes)
- Checked before upload to save bandwidth

### 3. MIME Type Check
- Validates Content-Type header
- Rejects unsupported formats immediately

### 4. File Signature Check (Magic Numbers)
- Reads first 12 bytes of file
- Verifies file is actually an image
- Prevents fake extensions (e.g., `.txt` renamed to `.jpg`)

**Recognized Signatures**:
```
JPEG:  FF D8 FF
PNG:   89 50 4E 47
GIF:   47 49 46 38
WebP:  52 49 46 46 (RIFF header)
BMP:   42 4D
SVG:   3C 3F 78 6D 6C or 3C 73 76 67
```

### 5. Cloudinary Upload
- Uploaded to `evenly/khata` folder
- Only allowed formats: jpg, jpeg, png, gif, webp, bmp, svg
- Returns secure HTTPS URL

## Error Codes

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `Invalid file: buffer is empty or null` | No file selected or file read failed | Select a file before uploading |
| `File too large: maximum size is 10MB` | File exceeds size limit | Compress or resize image |
| `Unsupported image format: {type}` | File format not supported | Convert to JPEG, PNG, or WebP |
| `Invalid image file: file signature not recognized` | Corrupted file or wrong file type | Use valid image file |
| `Cloudinary upload failed: {error}` | Cloudinary service error | Retry or check service status |
| `No file uploaded` | Request missing file | Include file in multipart form data |

## Mobile App Implementation

### React Native Example

```javascript
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const uploadTransactionImage = async (customerId, amount, type) => {
  // Pick image from gallery
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8, // Compress to 80% quality
  });

  if (result.canceled) return;

  const uri = result.assets[0].uri;

  // Check file size (max 10MB)
  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (fileInfo.size > 10 * 1024 * 1024) {
    Alert.alert('Error', 'Image too large. Maximum size is 10MB.');
    return;
  }

  // Create form data
  const formData = new FormData();
  formData.append('customerId', customerId);
  formData.append('type', type);
  formData.append('amount', amount.toString());
  formData.append('image', {
    uri: uri,
    type: 'image/jpeg', // Force JPEG type
    name: 'receipt.jpg',
  });

  // Upload
  const response = await fetch(
    'https://evenly-backend-374738393915.us-central1.run.app/api/v1/khata/transactions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    }
  );

  const data = await response.json();
  if (!data.success) {
    Alert.alert('Upload Failed', data.message);
  }
};
```

### HEIC Conversion in React Native

```javascript
import * as ImageManipulator from 'expo-image-manipulator';

const convertHEICtoJPEG = async (uri) => {
  const manipResult = await ImageManipulator.manipulateAsync(
    uri,
    [], // No transformations, just convert
    {
      format: ImageManipulator.SaveFormat.JPEG,
      compress: 0.8,
    }
  );
  return manipResult.uri;
};

// Use before upload
const imageUri = await convertHEICtoJPEG(result.assets[0].uri);
```

## Testing

### Test with Different Formats

```bash
# Test JPEG (should work)
curl -X POST http://localhost:3002/api/v1/khata/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@test.jpg"

# Test PNG (should work)
curl -X POST http://localhost:3002/api/v1/khata/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@test.png"

# Test HEIC (should fail with clear error)
curl -X POST http://localhost:3002/api/v1/khata/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@test.heic"

# Expected error:
# "Unsupported image format: image/heic. Supported formats: JPEG, PNG, GIF, WebP, BMP, SVG.
#  Note: HEIC/HEIF images (iPhone photos) need to be converted to JPEG first."
```

### Test File Size Limit

```bash
# Create 15MB test file (should fail)
dd if=/dev/zero of=large.jpg bs=1M count=15

curl -X POST http://localhost:3002/api/v1/khata/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@large.jpg"

# Expected error:
# "File too large: maximum size is 10MB, got 15.00MB"
```

## Summary

✅ **Supported**: JPEG, PNG, GIF, WebP, BMP, SVG
❌ **Not Supported**: HEIC/HEIF, TIFF, RAW, PDF, AVIF
📏 **Max Size**: 10 MB
🔒 **Validation**: File type, size, and signature checks
📱 **Mobile Tip**: Change iPhone settings to "Most Compatible" for JPEG photos

For any issues not covered here, check the backend logs for detailed error messages.
