/**
 * ==============================================================================
 * [sw.js] 3D 데이터 시각화 웹 플랫폼 - PWA Service Worker (v1.0.0)
 * ==============================================================================
 * - 모든 기기(스마트폰, 태블릿, PC)에서 오프라인 사용 및 홈 화면 앱 설치 완벽 지원
 * - 캐시 전략: Stale-While-Revalidate & Network-First 혼합으로 항상 최신 버전 유지
 * ==============================================================================
 */

const CACHE_NAME = '3d-vis-pwa-v7';

// 오프라인 상태에서도 동작하기 위한 핵심 정적 자원 목록
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './style.css',
    './css/variables.css',
    './css/components.css',
    './css/modals.css',
    './css/report.css',
    './css/responsive.css',
    './icon-192.png',
    './icon-512.png',
    './main.js',
    './js/state.js',
    './js/device.js',
    './js/parser.js',
    './js/analytics.js',
    './js/renderer3d.js',
    './js/chart2d.js',
    './js/timeline.js',
    './js/ai-report.js',
    './js/ui.js'
];

// 1. Service Worker 설치 단계 (정적 리소스 사전 캐싱)
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[PWA SW] 핵심 정적 자원 사전 캐싱 시작...');
            // 일부 파일이 실패해도 설치가 중단되지 않도록 개별 add 처리
            return Promise.allSettled(
                STATIC_ASSETS.map(url => cache.add(url).catch(err => {
                    console.warn(`[PWA SW] 캐싱 실패 건너뜀 (${url}):`, err);
                }))
            );
        }).then(() => {
            console.log('[PWA SW] 설치 완료 - 즉시 활성화(skipWaiting)');
            return self.skipWaiting();
        })
    );
});

// 2. Service Worker 활성화 단계 (이전 버전의 오래된 캐시 정리)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(name => {
                    if (name !== CACHE_NAME) {
                        console.log('[PWA SW] 오래된 캐시 삭제:', name);
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => {
            console.log('[PWA SW] 클라이언트 제어권 즉시 획득(claim)');
            return self.clients.claim();
        })
    );
});

// 2-1. 메시지 이벤트 수신 (클라이언트에서 즉시 업데이트 요청 시)
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// 3. 네트워크 요청 가로채기 (Fetch 이벤트)
self.addEventListener('fetch', event => {
    const request = event.request;

    // HTTP/HTTPS GET 요청만 캐싱 대상
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Chrome 확장 프로그램 등 지원하지 않는 스킴 제외
    if (!url.protocol.startsWith('http')) return;

    // HTML 탐색 요청(Navigation): 네트워크 우선, 실패 시 캐시된 index.html 반환 (오프라인 지원)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match('./index.html') || caches.match('./'))
        );
        return;
    }

    // 외부 CDN 자원 (Three.js, Chart.js, SheetJS 등): Stale-While-Revalidate
    if (url.origin.includes('unpkg.com') || url.origin.includes('jsdelivr.net') || url.origin.includes('cdnjs.cloudflare.com')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(request).then(cachedResponse => {
                    const fetchPromise = fetch(request).then(networkResponse => {
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => cachedResponse);

                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    // 로컬 앱 자원: Network First, 오프라인 시 Cache 반환
    event.respondWith(
        fetch(request)
            .then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    const copy = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(request).then(cachedResponse => {
                    if (cachedResponse) return cachedResponse;
                    // 이미지 요청 실패 시 대체(기본 아이콘)
                    if (request.destination === 'image') {
                        return caches.match('./icon-192.png');
                    }
                    return new Response('오프라인 상태입니다.', { status: 503, statusText: 'Offline' });
                });
            })
    );
});
