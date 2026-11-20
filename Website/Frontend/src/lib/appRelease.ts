/**
 * Current Android release served from R2 via the website Worker (/download/<file>).
 * Updated on every APK release (see Mobile/Frontend/TODO.md → "Release an APK").
 */
export const ANDROID_RELEASE = {
  version: '1.0.1',
  versionCode: 2,
  /** Versioned, immutable file name. */
  file: 'uru-android-1.0.1.apk',
  /** Always points at the newest release. */
  latest: 'uru-android.apk',
  sizeBytes: 112772984,
  sha256: '9af77621ceab662ad709b8b6bee364e6262d09de20ca6b2e5406951aa8cd2107',
  releasedAt: '2026-11-20',
  minAndroid: 'Android 7.0 or later',
} as const;
