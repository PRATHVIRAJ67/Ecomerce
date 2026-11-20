/**
 * Current Android release served from R2 via the website Worker (/download/<file>).
 * Updated on every APK release (see Mobile/Frontend/TODO.md → "Release an APK").
 */
export const ANDROID_RELEASE = {
  version: '1.0.0',
  versionCode: 1,
  /** Versioned, immutable file name. */
  file: 'uru-android-1.0.0.apk',
  /** Always points at the newest release. */
  latest: 'uru-android.apk',
  sizeBytes: 112769764,
  sha256: '608f9ed9a3977a980539468baf5f221de1f1e77825eb749763306adf6ae6b815',
  releasedAt: '2026-11-20',
  minAndroid: 'Android 7.0 or later',
} as const;
