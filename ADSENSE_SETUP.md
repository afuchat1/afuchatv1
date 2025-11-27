# Google AdSense Setup Instructions

## Compliant Native Ads Implementation

Your AfuChat platform now has compliant native ads that match your design while being properly labeled as "Sponsored" content.

## How It Works

- **Ad Placement**: Native ads appear every 5 posts in your feed
- **Labeling**: Each ad is clearly marked with a "Sponsored" badge
- **Design**: Ads blend with your feed aesthetic while remaining distinguishable
- **Compliance**: Fully compliant with Google AdSense policies and FTC guidelines

## Setup Steps

### 1. Get Your Google AdSense Publisher ID

1. Sign up for Google AdSense at https://www.google.com/adsense/
2. Complete the AdSense account setup and verification
3. Once approved, find your publisher ID (format: `ca-pub-XXXXXXXXXXXXXXXX`)

### 2. Update Your Code

Open `index.html` and replace the placeholder with your actual publisher ID:

```html
<!-- Replace XXXXXXXXXXXXXXXX with your actual publisher ID -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
 crossorigin="anonymous"></script>
```

### 3. Create Ad Units in AdSense

1. Log into your AdSense account
2. Navigate to "Ads" → "By ad unit" → "Display ads"
3. Create responsive display ad units
4. Copy the ad slot IDs (format: `1234567890`)

### 4. Update Ad Slots

Open `src/components/ads/NativeAdCard.tsx` and update:

```typescript
// Replace with your actual ad client ID
data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
```

## Features

✅ **Compliant with Google Policies**: Ads are clearly labeled and distinguishable
✅ **Professional Design**: Matches your feed aesthetic
✅ **Responsive**: Works on all device sizes
✅ **Strategic Placement**: Every 5th post for optimal visibility
✅ **Performance Optimized**: Lazy loading and efficient rendering

## Adding Ads to Other Pages

To add native ads to other pages, simply import and use the `NativeAdCard` component:

```tsx
import { NativeAdCard } from '@/components/ads/NativeAdCard';

// In your component JSX
<NativeAdCard slot="your-ad-slot-id" />
```

## Important Notes

⚠️ **Never Disguise Ads**: Always keep the "Sponsored" label visible
⚠️ **Test Before Launch**: Preview ads in AdSense before going live
⚠️ **Monitor Performance**: Check AdSense dashboard regularly
⚠️ **Policy Compliance**: Review Google AdSense policies periodically

## Support

For AdSense policy questions: https://support.google.com/adsense/
For platform integration help: Contact your development team
