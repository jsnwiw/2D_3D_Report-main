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
  window.getDeviceMemory = getDeviceMemory; // 기존 API
  // performance.memory (Chrome 전용) 은 힙 사용량을 반환
  window.getPerformanceMemory = function() {
    if (performance && performance.memory) {
      return {
        usedJSHeapSizeMB: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        totalJSHeapSizeMB: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
      };
    }
    return null; // 지원 안 함
  };
  // 새로운 헬퍼: 버킷 + 힙 메모리 표시용 함수
  window.showDeviceMemory = function() {
    const el = document.getElementById('ram-display');
    // ① Device Memory API (버킷)
    if ('deviceMemory' in navigator) {
      const bucket = navigator.deviceMemory;
      el.textContent = `≈ ${bucket} GB (버킷)`;
    } else {
      el.textContent = 'Device Memory API를 지원하지 않음';
    }
    // ② Chrome 전용 힙 메모리 (보조)
    if (performance && performance.memory) {
      const used = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
      const total = (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(1);
      el.textContent += ` ‑ 현재 힙: ${used} MB / ${total} MB`;
    }
  };
}

if (typeof window !== 'undefined') {
  window.getDeviceType = getDeviceType;
  window.getDeviceMemory = getDeviceMemory; // 기존 API
  // performance.memory (Chrome 전용) 은 힙 사용량을 반환
  window.getPerformanceMemory = function() {
    if (performance && performance.memory) {
      return {
        usedJSHeapSizeMB: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        totalJSHeapSizeMB: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
      };
    }
    return null; // 지원 안 함
  };
}
if (typeof window !== 'undefined') {
  window.getDeviceType = getDeviceType;
}
