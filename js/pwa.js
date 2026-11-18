/**
 * ==============================================================================
 * [pwa.js] 3D 데이터 시각화 웹 플랫폼 - PWA(Progressive Web App) 설치 및 제어 매니저
 * ==============================================================================
 * - 휴대폰, 태블릿, 데스크톱 PC 전 기기 앱 설치(Add to Home Screen) 지원
 * - 안드로이드/크롬/엣지 네이티브 설치 프롬프트 연동
 * - iOS Safari '홈 화면에 추가' 가이드 모달 제공
 * - 오프라인 상태 감지 및 Service Worker 생명주기 관리
 * ==============================================================================
 */

import { showToast, $ } from './state.js';

let deferredPrompt = null;
let isStandaloneMode = false;

/**
 * PWA 독립 앱(Standalone) 모드로 실행 중인지 확인
 */
export function checkIsStandalone() {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://')
    );
}

/**
 * iOS 기기인지 확인
 */
export function isIOS() {
    const ua = navigator.userAgent || '';
    return /iphone|ipad|ipod/i.test(ua) && !window.MSStream;
}

/**
 * PWA 설치 및 서비스 워커 초기화
 */
export function initPWA() {
    isStandaloneMode = checkIsStandalone();

    const installBtns = [
        $('btn-pwa-install'),
        $('mobile-pwa-install'),
        $('btn-modal-install-app')
    ].filter(Boolean);

    // 1. 이미 앱으로 설치되어 단독 실행 중인 경우 UI 처리
    if (isStandaloneMode) {
        console.log('📱 [PWA] Standalone 앱 모드로 실행 중입니다.');
        installBtns.forEach(btn => {
            btn.style.display = 'none'; // 이미 앱이므로 설치 버튼 숨김
        });
    }

    // 2. 크롬/엣지/안드로이드 네이티브 PWA 설치 프롬프트 이벤트 가로채기
    window.addEventListener('beforeinstallprompt', (e) => {
        // 브라우저 기본 미니 정보 표시줄 차단
        e.preventDefault();
        // 나중에 사용하기 위해 이벤트 저장
        deferredPrompt = e;
        console.log('💡 [PWA] beforeinstallprompt 이벤트 감지 - 앱 설치 버튼 활성화');

        // 설치 버튼 표시 및 활성화
        installBtns.forEach(btn => {
            btn.style.display = '';
            btn.classList.add('pulse-highlight');
        });
    });

    // 3. 앱 설치 완료 이벤트
    window.addEventListener('appinstalled', () => {
        console.log('🎉 [PWA] 앱 설치가 성공적으로 완료되었습니다.');
        deferredPrompt = null;
        installBtns.forEach(btn => {
            btn.style.display = 'none';
        });
        showToast('🎉 앱이 성공적으로 설치되었습니다! 홈 화면이나 앱 목록에서 실행할 수 있습니다.', 4000);
    });

    // 4. 설치 버튼 클릭 이벤트 핸들러 등록
    installBtns.forEach(btn => {
        btn.addEventListener('click', handleInstallClick);
    });

    // 5. iOS 설치 안내 모달 닫기 버튼
    const closeIosModal = $('btn-close-pwa-ios-modal');
    closeIosModal?.addEventListener('click', () => {
        const modal = $('pwa-ios-modal');
        if (modal) modal.style.display = 'none';
    });

    // 6. Service Worker 등록
    registerServiceWorker();

    // 7. 네트워크 온라인/오프라인 상태 모니터링
    window.addEventListener('online', () => {
        showToast('🟢 네트워크가 다시 연결되었습니다. (온라인)', 3000);
    });
    window.addEventListener('offline', () => {
        showToast('📡 오프라인 모드로 전환되었습니다. 캐시된 기능과 데이터는 계속 사용할 수 있습니다.', 4000);
    });
}

/**
 * 앱 설치 버튼 클릭 처리
 */
async function handleInstallClick() {
    if (deferredPrompt) {
        // 안드로이드 / 윈도우 / 크롬 / 엣지 등 지원 브라우저
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] 사용자 응답: ${outcome}`);
        if (outcome === 'accepted') {
            showToast('📱 앱 설치를 진행합니다...', 3000);
        }
        deferredPrompt = null;
    } else if (isIOS()) {
        // iOS Safari 안내창 열기
        const modal = $('pwa-ios-modal');
        if (modal) {
            modal.style.display = 'flex';
        } else {
            showToast('📲 Safari 하단의 <b>공유 버튼(공유 아이콘)</b>을 누른 뒤<br><b>"홈 화면에 추가"</b>를 선택해 주세요.', 5000);
        }
    } else {
        // 이미 설치되었거나 브라우저 메뉴에서 수동 설치 안내
        showToast('ℹ️ 브라우저 주소창 우측의 <b>[설치 ⊕]</b> 아이콘 또는<br>브라우저 메뉴(⋮)에서 <b>[앱 설치 / 홈 화면에 추가]</b>를 눌러주세요.', 4500);
    }
}

/**
 * Service Worker 안전 등록
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js', { scope: './' })
                .then(reg => {
                    console.log('✅ [PWA] ServiceWorker 등록 완료 (scope):', reg.scope);

                    // 새 버전 업데이트 감지
                    reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        newWorker?.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showToast('🔄 앱의 최신 업데이트가 준비되었습니다. 새로고침 시 적용됩니다.', 4000);
                            }
                        });
                    });
                })
                .catch(err => {
                    console.warn('⚠️ [PWA] ServiceWorker 등록 중 오류:', err);
                });
        });
    }
}
