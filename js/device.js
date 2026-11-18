// device.js – 휴대폰·태블릿·컴퓨터 구분 및 UI 조정 헬퍼
// Returns one of: "mobile", "tablet", "desktop"
export function getDeviceType() {
  const ua = (navigator.userAgent || '').toLowerCase();
  const platform = (navigator.platform || '').toLowerCase();

  // 1. 모바일(스마트폰) 명시적 감지 (iPhone, Android Mobile 등)
  if (/iphone|ipod/i.test(ua) || /iphone|ipod/i.test(platform)) {
    return 'mobile';
  }
  if (/android/i.test(ua) && /mobile/i.test(ua)) {
    return 'mobile';
  }

  // 2. 태블릿 명시적 감지 (iPad, Android Tablet 등)
  if (/ipad/i.test(ua) || /ipad/i.test(platform)) {
    return 'tablet';
  }
  if (/android/i.test(ua) && !/mobile/i.test(ua)) {
    return 'tablet';
  }
  // iPadOS 13+ 데스크톱 사파리 모드 대응 (Mac UA + 멀티터치 지원)
  if (/macintosh|mac os x/i.test(ua) && (navigator.maxTouchPoints || 0) > 1) {
    return 'tablet';
  }

  // 3. 데스크톱 PC 명시적 감지 (Windows, Mac, Linux 등 PC 환경)
  if (/win/i.test(platform) || /windows nt/i.test(ua) || /macintosh|macintel/i.test(platform) || (/linux/i.test(platform) && !/android/i.test(ua))) {
    return 'desktop';
  }

  // 4. 기타 보조 판별 (터치 스크린 폭 기반)
  const isTouch = ('ontouchstart' in window) || ((navigator.maxTouchPoints || 0) > 0);
  const screenMin = Math.min(window.screen.width, window.screen.height);
  if (isTouch && screenMin <= 500) return 'mobile';
  if (isTouch && screenMin <= 900) return 'tablet';

  return 'desktop';
}

// Global exposure for debugging
if (typeof window !== 'undefined') {
  window.getDeviceType = getDeviceType;
}
