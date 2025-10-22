# How to Add Your UPI QR Code

## Problem
The Buy Credits modal is showing a placeholder instead of your actual UPI payment QR code.

## Solution

### Option 1: Using Your Image File (Recommended)

1. **Locate your QR code image** (you mentioned `IMG_20251010_100924.jpg`)

2. **Rename it to** `upi-qr-code.jpg` or `upi-qr-code.png`

3. **Place it in the `/public` folder** of this project:
   ```
   /tmp/cc-agent/58364463/project/public/upi-qr-code.jpg
   ```

4. **Update the code** to use .jpg instead of .svg:
   - Open: `src/components/BuyCreditsModal.tsx`
   - Line 134: Change `src="/upi-qr-code.svg"` to `src="/upi-qr-code.jpg"`

5. **Restart the dev server** if it's running

### Option 2: Using a Different Image Format

If your QR code is in PNG format:

1. Save it as `/public/upi-qr-code.png`
2. Update line 134 in `BuyCreditsModal.tsx` to: `src="/upi-qr-code.png"`

### Option 3: Copy via Command Line

If you have the image file accessible, you can copy it directly:

```bash
# If your image is elsewhere, copy it:
cp /path/to/your/IMG_20251010_100924.jpg /tmp/cc-agent/58364463/project/public/upi-qr-code.jpg

# Verify it's there:
ls -lh /tmp/cc-agent/58364463/project/public/upi-qr-code.jpg
```

## Verification

After adding the image:

1. Open the app in your browser
2. Click the "Credits: X" button in the header
3. The Buy Credits modal should now show your actual QR code
4. You should see a white background with your UPI QR code centered

## Current Placeholder

Right now, the modal shows:
- An SVG placeholder QR code pattern
- Or a "📱 QR Code Placeholder" message with instructions

Once you add your actual image file, it will replace this placeholder automatically.

## Image Requirements

- **Format**: JPG, PNG, or SVG
- **Size**: Any size (will be displayed at 256x256px)
- **Recommended**: Square aspect ratio (1:1) for best display
- **File name**: Must be exactly `upi-qr-code.jpg` (or .png/.svg)
- **Location**: Must be in `/public` folder

## Troubleshooting

**Q: I added the image but still see placeholder**
- Make sure the file is named exactly `upi-qr-code.jpg`
- Check it's in the `/public` folder, not `/src`
- Restart your dev server
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

**Q: The image looks stretched or blurry**
- Try using a square image (same width and height)
- Use a high-resolution image (at least 512x512px)

**Q: Can I use a different filename?**
- Yes, but you need to update `BuyCreditsModal.tsx` line 134 with your filename

---

Need help? The image path in the code is at:
`src/components/BuyCreditsModal.tsx:134`
