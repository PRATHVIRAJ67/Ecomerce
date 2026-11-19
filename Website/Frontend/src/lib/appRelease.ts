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
  sizeBytes: 0,
  sha256: '',
  releasedAt: '2026-11-20',
  minAndroid: 'Android 7.0 or later',
} as const;
