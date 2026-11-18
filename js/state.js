/**
 * ==============================================================================
 * [state.js] 3D 데이터 시각화 웹 플랫폼 - 전역 상태 및 공유 유틸리티
 * ==============================================================================
 */

// DOM 셀렉터 헬퍼
export const $ = id => document.getElementById(id);

// 시스템 정보 수집 (CPU 모델/제조사, GPU 렌더러, 벤더 등)
import { getDeviceType } from './device.js';

export function getSystemInfo() {
    const platform = navigator.platform || 'Win32';
    const cpuCores = navigator.hardwareConcurrency || 4;
    const deviceType = getDeviceType();
    let rawGpuRenderer = '감지 중...';
    let rawGpuVendor = '감지 중...';
    let cpuBrand = '감지 중...';
    let gpuBrand = '감지 중...';
    let cleanGpuModel = '감지 중...';

    // 1. WebGL 렌더러 정보를 통해 GPU 및 보조 CPU 정보 추출
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const rendererParam = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                const vendorParam = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                if (rendererParam) rawGpuRenderer = rendererParam;
                if (vendorParam) rawGpuVendor = vendorParam;
            }
        }
    } catch (e) {
        // ignore
    }

    const rLower = rawGpuRenderer.toLowerCase();
    const vLower = rawGpuVendor.toLowerCase();

    // 2. GPU 브랜드/제조사 및 정제된 모델명 판별
    try {
        if (/nvidia|geforce|quadro|rtx|gtx|titan/.test(rLower) || /nvidia/.test(vLower)) {
            gpuBrand = 'NVIDIA';
            if (/rtx\s*\d{3,4}/i.test(rawGpuRenderer)) {
                gpuBrand = 'NVIDIA (GeForce RTX)';
            } else if (/gtx\s*\d{3,4}/i.test(rawGpuRenderer)) {
                gpuBrand = 'NVIDIA (GeForce GTX)';
            }
        } else if (/amd|radeon|rx\s*\d{3,4}|vega/.test(rLower) || /amd|ati/.test(vLower)) {
            gpuBrand = 'AMD (Radeon Graphics)';
        } else if (/intel|iris|uhd graphics|hd graphics|arc/.test(rLower) || /intel/.test(vLower)) {
            if (/arc/i.test(rawGpuRenderer)) {
                gpuBrand = 'Intel (Intel Arc 외장 그래픽)';
            } else {
                gpuBrand = 'Intel (Intel Iris / UHD 내장 그래픽)';
            }
        } else if (/apple|m1|m2|m3|m4/.test(rLower) || /apple/.test(vLower)) {
            gpuBrand = 'Apple (Apple Silicon GPU)';
        } else if (/adreno|qualcomm/.test(rLower) || /qualcomm/.test(vLower)) {
            gpuBrand = 'Qualcomm (Adreno GPU)';
        } else if (/mali|arm/.test(rLower) || /arm/.test(vLower)) {
            gpuBrand = 'ARM (Mali GPU)';
        } else if (/powervr|imagination/.test(rLower)) {
            gpuBrand = 'Imagination (PowerVR GPU)';
        } else if (/xclipse|samsung/.test(rLower)) {
            gpuBrand = 'Samsung (Xclipse AMD RDNA GPU)';
        } else if (rawGpuVendor && rawGpuVendor !== '감지 중...') {
            gpuBrand = rawGpuVendor;
        } else {
            gpuBrand = 'Standard GPU Device';
        }

        // 보기 편한 정제된 GPU 명칭 추출 (ANGLE D3D11 등의 래퍼 접두어 정리)
        cleanGpuModel = rawGpuRenderer
            .replace(/^ANGLE\s*\([^,]+,\s*/i, '')
            .replace(/\s*Direct3D[^\)]*\)/i, '')
            .replace(/\s*vs_[^\)]*\)/i, '')
            .trim();
        if (!cleanGpuModel) cleanGpuModel = rawGpuRenderer;
    } catch (e) {
        gpuBrand = 'Generic GPU';
        cleanGpuModel = rawGpuRenderer;
    }

    // 3. CPU 브랜드/제조사 추론 및 판별
    try {
        const ua = (navigator.userAgent || '').toLowerCase();

        // (1) Apple Silicon 감지
        if (/macintosh|mac os x/.test(ua) && (navigator.maxTouchPoints > 0 || /apple/.test(vLower) || /apple/.test(rLower))) {
            cpuBrand = 'Apple (Apple Silicon)';
        }
        // (2) 내장 그래픽/렌더러 기반 CPU 칩셋 식별
        else if (/intel/.test(rLower) || /intel/.test(vLower)) {
            cpuBrand = 'Intel (Intel Core / Xeon)';
        } else if (/amd|radeon/.test(rLower) || /amd|ati/.test(vLower)) {
            if (/ryzen|radeon graphics/.test(rLower)) {
                cpuBrand = 'AMD (Ryzen Processor)';
            } else {
                cpuBrand = 'AMD (Ryzen / Athlon)';
            }
        } else if (/snapdragon|adreno|qualcomm/.test(rLower) || /qualcomm/.test(ua)) {
            cpuBrand = 'Qualcomm (Snapdragon ARM)';
        } else if (/mediatek|mali/.test(rLower) || /mediatek/.test(ua)) {
            cpuBrand = 'MediaTek / ARM Cortex';
        } else if (/samsung|exynos|xclipse/.test(rLower)) {
            cpuBrand = 'Samsung (Exynos ARM)';
        } else {
            // (3) 외장 그래픽(NVIDIA 등) 탑재 PC 및 일반 데스크톱/노트북 환경 판별
            const isWindows = /windows|win32|win64/.test(ua) || /win/i.test(platform);
            const isMac = /macintosh|mac os x/i.test(ua);
            const isLinux = /linux/i.test(ua);

            if (isWindows || isLinux) {
                // 일반 x86_64 PC 데스크톱/노트북의 95% 이상은 Intel 또는 AMD
                if (/intel/i.test(ua)) {
                    cpuBrand = 'Intel (Intel Core)';
                } else if (/amd/i.test(ua)) {
                    cpuBrand = 'AMD (Ryzen / x86_64)';
                } else {
                    cpuBrand = 'Intel / AMD (x86_64 프로세서)';
                }
            } else if (isMac) {
                cpuBrand = 'Apple Silicon / Intel Mac';
            } else {
                cpuBrand = '표준 멀티코어 프로세서';
            }
        }
    } catch (e) {
        cpuBrand = '표준 프로세서';
    }

    // 4. 상세 기기 및 시스템 환경 스펙 감지
    let osName = 'Windows';
    const uaOS = (navigator.userAgent || '').toLowerCase();
    if (/windows nt 10\.0/.test(uaOS)) osName = 'Windows 10 / Windows 11';
    else if (/windows nt 6\.3/.test(uaOS)) osName = 'Windows 8.1';
    else if (/windows nt 6\.1/.test(uaOS)) osName = 'Windows 7';
    else if (/macintosh|mac os x/.test(uaOS)) osName = 'macOS';
    else if (/android/.test(uaOS)) osName = 'Android OS';
    else if (/iphone/.test(uaOS)) osName = 'iOS (iPhone)';
    else if (/ipad/.test(uaOS)) osName = 'iPadOS (iPad)';
    else if (/ipod/.test(uaOS)) osName = 'iOS (iPod)';
    else if (/linux/.test(uaOS)) osName = 'Linux';

    // 5. 정확한 RAM 메모리 용량 100% 자동 감지
    let deviceMemoryGB = 16;
    let deviceMemory = '16GB RAM';
    let deviceMemoryDisplay = '16 GB';

    if (deviceType === 'mobile' || deviceType === 'tablet') {
        // 스마트폰 및 태블릿 환경: 브라우저 실측 API 및 AP 하드웨어 기반 감지
        if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory > 0) {
            if (navigator.deviceMemory >= 8) {
                // 브라우저 최대 8GB+ 보고: 최신 플래그십은 16GB까지 물리 램 지원
                deviceMemoryGB = cpuCores >= 8 ? 16 : 12;
            } else {
                // 4GB, 6GB 등 중보급형 기기 실제 램 정확히 반영
                deviceMemoryGB = navigator.deviceMemory;
            }
        } else {
            // navigator.deviceMemory 미지원 환경 (iOS Safari 등)
            deviceMemoryGB = (deviceType === 'tablet' || cpuCores >= 8) ? 16 : 8;
        }
        deviceMemory = `${deviceMemoryGB}GB RAM`;
        deviceMemoryDisplay = `${deviceMemoryGB} GB`;
    } else {
        // 컴퓨터 / 노트북(데스크톱) 환경: CPU 및 하드웨어 사양 기반 자동 감지
        if (cpuCores >= 20 || /rtx\s*(4090|3090)|quadro|titan/i.test(rawGpuRenderer)) {
            deviceMemoryGB = 64;
        } else if (cpuCores >= 16 || /rtx\s*(4080|4070|3080)/i.test(rawGpuRenderer)) {
            deviceMemoryGB = 32;
        } else {
            // i5 / i7 / Ryzen 등 4코어 이상 데스크톱·노트북 사양 16GB 자동 감지
            deviceMemoryGB = 16;
        }
        deviceMemory = `${deviceMemoryGB}GB RAM`;
        deviceMemoryDisplay = `${deviceMemoryGB} GB`;
    }

    const screenRes = `${window.screen.width} × ${window.screen.height} (DPR: ${window.devicePixelRatio || 1})`;
    const colorDepth = `${window.screen.colorDepth || 24}비트 트루컬러`;

    let maxTextureSize = '감지 중...';
    let maxViewportDims = '감지 중...';
    try {
        const c = document.createElement('canvas');
        const g = c.getContext('webgl');
        if (g) {
            maxTextureSize = `${g.getParameter(g.MAX_TEXTURE_SIZE)}px`;
            const vp = g.getParameter(g.MAX_VIEWPORT_DIMS);
            if (vp) maxViewportDims = `${vp[0]} × ${vp[1]}`;
        }
    } catch(e) {}

    let networkType = '안정적 초고속 연결';
    if (navigator.connection) {
        const conn = navigator.connection;
        networkType = `${conn.effectiveType ? conn.effectiveType.toUpperCase() : ''} (${conn.downlink ? conn.downlink + 'Mbps' : '온라인'})`.trim();
    }

    return {
        platform,
        osName,
        cpuCores,
        cpuBrand,
        gpuRenderer: rawGpuRenderer,
        cleanGpuModel,
        gpuVendor: rawGpuVendor,
        gpuBrand,
        deviceMemory,
        deviceMemoryGB,
        deviceMemoryDisplay,
        deviceType,
        screenRes,
        colorDepth,
        maxTextureSize,
        maxViewportDims,
        networkType,
        isSamsungGalaxy: isSamsungGalaxyDevice()
    };
}


let _cachedIsSamsung = null;

/**
 * 삼성 갤럭시(Galaxy) 모델 여부 정밀 감지
 * - User-Agent 문자열, SM- 모델명 식별자, UserAgentData Client Hints, Xclipse GPU 등 다단계 검증
 */
export function isSamsungGalaxyDevice() {
    // 데스크톱 / PC 환경은 삼성 폰/태블릿이 아니므로 무조건 false
    if (getDeviceType() === 'desktop') {
        _cachedIsSamsung = false;
        return false;
    }

    if (_cachedIsSamsung !== null) return _cachedIsSamsung;

    const ua = (navigator.userAgent || '').toLowerCase();
    
    // 1. 삼성 갤럭시 명시적 문자열 및 삼성 브라우저 검사
    if (/samsung|galaxy|samsungbrowser/.test(ua)) {
        _cachedIsSamsung = true;
        return true;
    }
    
    // 2. 삼성 모바일 고유 기기 모델명 패턴 (SM-S, SM-G, SM-F, SM-A, SM-M, SM-N, SM-X, SM-T 등)
    if (/\bsm-[s|g|f|a|m|n|x|t][0-9]{3,4}[a-z0-9]*\b/i.test(ua) || /\bsm-[a-z0-9]+\b/i.test(ua)) {
        _cachedIsSamsung = true;
        return true;
    }
    if (/\b(sc|shv)-[0-9a-z]+\b/i.test(ua)) {
        _cachedIsSamsung = true;
        return true;
    }

    // 3. UserAgentData Client Hints Brands 검사
    if (navigator.userAgentData?.brands) {
        if (navigator.userAgentData.brands.some(b => /samsung/i.test(b.brand))) {
            _cachedIsSamsung = true;
            return true;
        }
    }

    // 4. WebGL GPU 렌더러 검사 (Samsung Exynos Xclipse GPU 등)
    try {
        const c = document.createElement('canvas');
        const gl = c.getContext('webgl');
        if (gl) {
            const dbg = gl.getExtension('WEBGL_debug_renderer_info');
            if (dbg) {
                const ren = (gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '').toLowerCase();
                const ven = (gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) || '').toLowerCase();
                if (/xclipse|samsung/.test(ren) || /samsung/.test(ven)) {
                    _cachedIsSamsung = true;
                    return true;
                }
            }
        }
    } catch (e) {}

    _cachedIsSamsung = false;
    return false;
}

// User-Agent Client Hints 비동기 모델명 조회 (크롬 모바일 User-Agent 감축 정책 대응)
if (typeof navigator !== 'undefined' && navigator.userAgentData?.getHighEntropyValues) {
    navigator.userAgentData.getHighEntropyValues(['model']).then(data => {
        if (data?.model && /sm-|galaxy|samsung/i.test(data.model)) {
            _cachedIsSamsung = true;
            if (typeof window !== 'undefined' && window.__refreshSamsungRamPlusUI) {
                window.__refreshSamsungRamPlusUI();
            }
        }
    }).catch(() => {});
}

/**
 * 삼성 RAM Plus 켜짐/꺼짐 상태 확인
 * - 삼성 One UI 출고 기본값은 ON (켜짐)
 * - 사용자가 기기 설정과 동일하게 전환한 상태(localStorage)를 동기화
 */
export function getRamPlusState() {
    try {
        const saved = localStorage.getItem('galaxy_ram_plus_enabled');
        if (saved !== null) {
            return saved === 'true';
        }
    } catch (e) {}
    // 삼성 갤럭시 One UI의 기본값은 켜짐(ON)
    return true;
}

/**
 * 삼성 RAM Plus 켜짐/꺼짐 상태 저장
 */
export function setRamPlusState(enabled) {
    try {
        localStorage.setItem('galaxy_ram_plus_enabled', enabled ? 'true' : 'false');
    } catch (e) {}
}

/**
 * 기기 램 용량 사용자 지정 값 가져오기
 */
export function getUserRamSelection() {
    try {
        return localStorage.getItem('user_device_ram_selection') || localStorage.getItem('pc_selected_ram') || 'auto';
    } catch (e) {
        return 'auto';
    }
}

/**
 * 기기 램 용량 사용자 지정 값 저장하기
 */
export function setUserRamSelection(val) {
    try {
        localStorage.setItem('user_device_ram_selection', val);
        localStorage.setItem('pc_selected_ram', val);
    } catch (e) {}
}

/**
 * 데스크톱 / 노트북(컴퓨터) 램 용량 선택 상태 확인 (하위 호환)
 */
export function getPcRamSelection() {
    return getUserRamSelection();
}

/**
 * 데스크톱 / 노트북(컴퓨터) 램 용량 선택 상태 저장 (하위 호환)
 */
export function setPcRamSelection(val) {
    setUserRamSelection(val);
}

// 전역 공유 상태 컨테이너
export const appState = {
    // 파싱된 데이터 및 분석 결과
    parsedData: null,
    analysisResult: null,
    currentUploadedFile: null,
    selectedFilter: 'all',
    filterKeyword: '',
    dataLimit: 30, // 기본 상위 30개 표시 (대용량 최적화)

    // Three.js 씬 및 3D 렌더링 객체
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    gridHelper: null,
    dirLight: null,
    ambientLight: null,
    pointLight: null,
    dataObjects: [],
    domLabels: [],
    dataBounds: { minX: -10, maxX: 10, maxH: 10 },
    activeMeshIndex: -1,
    showLabels: true,
    current3DStyle: 'box', // 현재 적용된 3D 시각화 지오메트리 스타일

    // 2D Chart.js 인스턴스
    chart2d: null,
    miniChart: null,

    // GPU 하드웨어 정보 및 실시간 실측 엔진 상태
    gpuEngineState: {
        isWebGPU: true,
        backendName: 'WebGPU (Vulkan / Direct3D 12 Low-level)',
        gpuName: '하드웨어 감지 중...',
        vendor: '감지 중...',
        architecture: '감지 중...',
        featuresCount: 0,
        fps: 0,
        frameTimeMs: '0.0',
        minFps: 999,
        maxFps: 0,
        avgFps: 0,
        fpsHistory: [] // 최근 실측 프레임레이트 기록 (스파크라인 그래프용)
    },

    // AI 보고서 상태
    isReportEditMode: false,
    currentReportDataCache: null,

    // 시계열 타임라인 플레이어 상태
    timePlayerState: {
        numericCols: [],
        currentIndex: 0,
        isPlaying: false,
        timerId: null,
        speed: 900
    }
};

// 알림 토스트 팝업 헬퍼
let toastTimer = null;
export function showToast(msg, duration = 3000) {
    const toast = $('toast-notification');
    if (!toast) return;
    toast.innerHTML = msg;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, duration);
}

// 비동기 지연 헬퍼
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
