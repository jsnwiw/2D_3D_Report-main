/**
 * ==============================================================================
 * [ui.js] 글로벌 상단 바, 사이드바 아코디언 메뉴, 업로드 패널, GPU 모달 & FPS 그래프
 * ==============================================================================
 */
import * as THREE from 'three';
import { $, appState, showToast, getSystemInfo, isSamsungGalaxyDevice, getRamPlusState, setRamPlusState } from './state.js';
import { loadAndParseFile } from './parser.js';
import { update3DTheme } from './renderer3d.js';

let totalRenderFrames = 0;

/**
 * 단일 아코디언 섹션 열기
 */
export function openAccordionSection(sectionId) {
    const section = $(sectionId);
    if (!section) return;

    document.querySelectorAll('.accordion-item').forEach(item => {
        if (item === section) {
            item.classList.add('active');
            const h = item.querySelector('.accordion-header');
            const b = item.querySelector('.accordion-body');
            const c = item.querySelector('.chevron');
            if (h) h.classList.add('active');
            if (b) b.classList.add('open');
            if (c) c.textContent = '▴';
        } else {
            item.classList.remove('active');
            const h = item.querySelector('.accordion-header');
            const b = item.querySelector('.accordion-body');
            const c = item.querySelector('.chevron');
            if (h) h.classList.remove('active');
            if (b) b.classList.remove('open');
            if (c) c.textContent = '▾';
        }
    });

    const menuContent = document.querySelector('.menu-content');
    if (menuContent) {
        setTimeout(() => {
            const rect = section.getBoundingClientRect();
            const containerRect = menuContent.getBoundingClientRect();
            if (rect.top < containerRect.top || rect.bottom > containerRect.bottom) {
                section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 80);
    }
}

/**
 * 아코디언 헤더 토글 이벤트
 */
export function setupAccordionUI() {
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            const parent = header.closest('.accordion-item');
            if (!parent) return;
            const isOpen = parent.classList.contains('active');
            if (isOpen) {
                parent.classList.remove('active');
                header.classList.remove('active');
                const body = parent.querySelector('.accordion-body');
                const chevron = header.querySelector('.chevron');
                if (body) body.classList.remove('open');
                if (chevron) chevron.textContent = '▾';
            } else {
                openAccordionSection(parent.id);
            }
        });
    });
}

/**
 * 메뉴 패널 스크롤 네비게이션
 */
export function setupMenuScroll() {
    const menuContent = document.querySelector('.menu-content');
    const menuPanel = $('menu-panel');
    const btnScrollTop = $('btn-scroll-top');
    const btnScrollBottom = $('btn-scroll-bottom');

    btnScrollTop?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (menuContent) menuContent.scrollTo({ top: 0, behavior: 'smooth' });
    });
    btnScrollBottom?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (menuContent) menuContent.scrollTo({ top: menuContent.scrollHeight, behavior: 'smooth' });
    });
}

/**
 * 업로드 카드 접기/펼치기 토글
 */
export function setupUploadCardToggle() {
    const uploadPanel = $('upload-panel');
    const btnToggleUploadCard = $('btn-toggle-upload-card');

    btnToggleUploadCard?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!uploadPanel) return;
        const isCollapsed = uploadPanel.classList.toggle('collapsed');
        document.body.classList.toggle('upload-collapsed', isCollapsed);
    });
}

/**
 * GPU 엔진 정보 모달 및 실시간 FPS 성능 갱신
 */
export function updateGpuModalLivePerformance() {
    totalRenderFrames++;
    const modalGpuFps = $('modal-gpu-fps');
    const modalGpuFpsBadge = $('modal-gpu-fps-badge');
    const modalGpuFpsStats = $('modal-gpu-fps-stats');
    const modalGpuFrameCount = $('modal-gpu-frame-count');
    const gpuState = appState.gpuEngineState;

    if (!modalGpuFps) return;
    modalGpuFps.textContent = `${gpuState.fps} FPS (${gpuState.frameTimeMs} ms)`;

    if (modalGpuFpsBadge) {
        if (gpuState.fps >= 55) {
            modalGpuFpsBadge.className = 'fps-status-badge smooth';
            modalGpuFpsBadge.textContent = '🟢 쾌적 (Ultra Smooth)';
        } else if (gpuState.fps >= 30) {
            modalGpuFpsBadge.className = 'fps-status-badge good';
            modalGpuFpsBadge.textContent = '🟡 보통 (Smooth)';
        } else {
            modalGpuFpsBadge.className = 'fps-status-badge heavy';
            modalGpuFpsBadge.textContent = '🔴 부하 발생 (Lagging)';
        }
    }

    if (modalGpuFpsStats) {
        const minStr = gpuState.minFps === 999 ? '-' : `${gpuState.minFps} FPS`;
        const avgStr = gpuState.avgFps > 0 ? `${gpuState.avgFps} FPS` : '-';
        const maxStr = gpuState.maxFps > 0 ? `${gpuState.maxFps} FPS` : '-';
        modalGpuFpsStats.textContent = `최저: ${minStr} | 평균: ${avgStr} | 최고: ${maxStr}`;
    }

    if (modalGpuFrameCount) {
        modalGpuFrameCount.textContent = `누적 렌더링: ${totalRenderFrames.toLocaleString()} frames`;
    }

    drawFpsSparkline();
}

/**
 * 시스템 정보 (CPU, GPU, 엔진) 패널 초기화
 */
export function initSystemInfo() {
    const info = getSystemInfo();
    const platformEl = $('system-platform');
    const manufacturerEl = $('system-manufacturer');
    const cpuEl = $('system-cpu');
    const gpuEl = $('system-gpu');
    const gpuEngineEl = $('gpu-engine-info');

    // 실시간 감지된 하드웨어 정보를 gpuEngineState에 반영
    if (info.cleanGpuModel && info.cleanGpuModel !== '감지 중...') {
        appState.gpuEngineState.gpuName = info.cleanGpuModel;
    }
    if (info.gpuBrand && info.gpuBrand !== '감지 중...') {
        appState.gpuEngineState.vendor = info.gpuBrand;
    }

    if (platformEl) platformEl.textContent = `🖥 플랫폼: ${info.platform}`;
    if (manufacturerEl) manufacturerEl.textContent = `🏭 GPU 제조사 / 브랜드: ${info.gpuBrand} (${info.gpuVendor})`;
    if (cpuEl) cpuEl.textContent = `⚙️ CPU 코어 / 제조사: ${info.cpuCores}코어 (${info.cpuBrand})`;
    if (gpuEl) gpuEl.textContent = `🎮 GPU 모델: ${info.cleanGpuModel}`;
    if (gpuEngineEl) {
        const engine = appState.gpuEngineState;
        gpuEngineEl.textContent = `⚡ 엔진: ${engine.backendName}`;
    }

    // GPU 모달 요소도 실제 감지값으로 즉시 채우기 (모달 열기 전에도 준비)
    const modalPlatform = $('modal-system-platform');
    const modalCpu = $('modal-system-cpu');
    const modalMemory = $('modal-system-memory');
    const modalGpuApi = $('modal-gpu-api');
    const modalGpuDevice = $('modal-gpu-device');
    const modalGpuVendor = $('modal-gpu-vendor');
    const modalMaxTexture = $('modal-gpu-max-texture');
    const modalGpuArchitecture = $('modal-gpu-architecture');
    const modalGpuFeatures = $('modal-gpu-features');

    if (modalPlatform) modalPlatform.textContent = `${info.osName} (${info.platform})`;
    if (modalCpu) modalCpu.textContent = `${info.cpuBrand} • ${info.cpuCores} 논리 코어`;
    
    // 삼성 갤럭시 전용 RAM Plus 및 메모리 표시 동기화
    updateSamsungRamPlusUI();

    if (modalGpuApi) modalGpuApi.textContent = appState.gpuEngineState.backendName;
    if (modalGpuDevice) modalGpuDevice.textContent = info.cleanGpuModel || appState.gpuEngineState.gpuName;
    if (modalGpuVendor) modalGpuVendor.textContent = info.gpuBrand || appState.gpuEngineState.vendor;
    if (modalMaxTexture) modalMaxTexture.textContent = info.maxTextureSize;
    if (modalGpuArchitecture) modalGpuArchitecture.textContent = appState.gpuEngineState.architecture;
    if (modalGpuFeatures && appState.gpuEngineState.featuresCount > 0) {
        modalGpuFeatures.textContent = `${appState.gpuEngineState.featuresCount}개 하드웨어 기능 활성화됨`;
    }
}

/**
 * 삼성 갤럭시 모델 한정 RAM Plus 가상 메모리 동적 UI 처리
 * - 삼성 갤럭시 기기가 아닌 경우 RAM Plus 항목을 완전히 숨김
 * - 삼성 갤럭시 기기에서 RAM Plus가 켜져 있을 때만 RAM Plus 표시 및 뱃지 활성화
 */
/**
 * 삼성 RAM Plus 및 기기별 물리 램 용량 동기화 UI (100% 자동 감지)
 */
export function updateSamsungRamPlusUI() {
    const isGalaxy = isSamsungGalaxyDevice();
    const rowRamPlus = $('row-samsung-ramplus');
    const modalMemory = $('modal-system-memory');
    const statusEl = $('modal-ramplus-status');
    const btnToggle = $('btn-toggle-ramplus');
    const sysInfo = getSystemInfo();

    const displayRam = sysInfo.deviceMemoryDisplay || `${sysInfo.deviceMemoryGB} GB`;

    if (!isGalaxy) {
        // 삼성 갤럭시가 아닌 기기(PC, 노트북, 아이폰, iPad, 일반 안드로이드 등)는 RAM Plus UI 비활성화
        if (rowRamPlus) rowRamPlus.style.display = 'none';
        if (modalMemory) {
            modalMemory.textContent = displayRam;
        }
        return;
    }

    // 삼성 갤럭시 모델인 경우:
    const isRamPlusOn = getRamPlusState();

    if (rowRamPlus) {
        rowRamPlus.style.display = 'flex';
    }

    if (statusEl) {
        if (isRamPlusOn) {
            statusEl.textContent = '🟢 켜짐 (가상 메모리 +4GB~8GB)';
            statusEl.style.color = '';
            statusEl.className = 'info-val highlight';
        } else {
            statusEl.textContent = '⚪ 꺼짐';
            statusEl.style.color = '#94a3b8';
            statusEl.className = 'info-val';
        }
    }

    if (btnToggle) {
        btnToggle.textContent = isRamPlusOn ? '꺼짐으로 변경' : '켜짐으로 변경';
        btnToggle.title = isRamPlusOn ? '클릭 시 RAM Plus 꺼짐 상태로 변경' : '클릭 시 RAM Plus 켜짐 상태로 변경';
    }

    if (modalMemory) {
        const base = sysInfo.deviceMemoryGB || 16;
        const displayBase = `${base} GB`;
        const finalDisplay = isRamPlusOn ? `${base} GB + RAM Plus` : displayBase;
        modalMemory.textContent = finalDisplay;
    }
}

/**
 * FPS 스파크라인 그래프
 */
export function drawFpsSparkline() {
    const canvas = $('fps-sparkline-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const history = appState.gpuEngineState.fpsHistory;
    if (history.length < 2) return;

    const maxVal = Math.max(75, ...history, appState.gpuEngineState.maxFps || 60);
    const y60 = h - (60 / maxVal) * (h - 10) - 4;

    // 60 FPS 기준 가이드라인
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, y60);
    ctx.lineTo(w, y60);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(52, 211, 153, 0.5)';
    ctx.font = '9px monospace';
    ctx.fillText('60 FPS 기준선', 6, Math.max(10, y60 - 2));

    // 트렌드 라인
    const stepX = w / (history.length - 1);
    ctx.beginPath();
    history.forEach((fps, i) => {
        const x = i * stepX;
        const y = h - (fps / maxVal) * (h - 10) - 4;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(129, 140, 248, 0.35)');
    grad.addColorStop(1, 'rgba(129, 140, 248, 0.0)');
    ctx.fillStyle = grad;
    ctx.fill();

    const lastX = (history.length - 1) * stepX;
    const lastY = h - (history[history.length - 1] / maxVal) * (h - 10) - 4;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#34d399';
    ctx.fill();
}

export function setupGpuModal() {
    const badge = $('gpu-engine-badge');
    const mobileBadge = $('mobile-gpu-engine-badge');
    const modal = $('gpu-info-modal');
    const btnClose = $('btn-close-gpu-modal');
    const modalPlatform = $('modal-system-platform');
    const modalCpu = $('modal-system-cpu');
    const modalMemory = $('modal-system-memory');
    const modalGpuApi = $('modal-gpu-api');
    const modalGpuDevice = $('modal-gpu-device');
    const modalGpuVendor = $('modal-gpu-vendor');
    const modalMaxTexture = $('modal-gpu-max-texture');
    const modalGpuArchitecture = $('modal-gpu-architecture');
    const modalGpuFeatures = $('modal-gpu-features');

    const openGpuModal = () => {
        if (!modal) return;
        const sysInfo = getSystemInfo();
        if (modalPlatform) modalPlatform.textContent = `${sysInfo.osName} (${sysInfo.platform})`;
        if (modalCpu) modalCpu.textContent = `${sysInfo.cpuBrand} • ${sysInfo.cpuCores} 논리 코어`;
        
        // 삼성 갤럭시 모델 한정 RAM Plus 및 메모리 동기화
        updateSamsungRamPlusUI();

        if (modalGpuApi) modalGpuApi.textContent = appState.gpuEngineState.backendName;
        if (modalGpuDevice) modalGpuDevice.textContent = sysInfo.cleanGpuModel || appState.gpuEngineState.gpuName;
        if (modalGpuVendor) modalGpuVendor.textContent = sysInfo.gpuBrand || appState.gpuEngineState.vendor;
        if (modalMaxTexture) modalMaxTexture.textContent = sysInfo.maxTextureSize;
        if (modalGpuArchitecture) modalGpuArchitecture.textContent = appState.gpuEngineState.architecture;
        if (modalGpuFeatures) modalGpuFeatures.textContent = `${appState.gpuEngineState.featuresCount}개 하드웨어 기능 활성화됨`;
        updateGpuModalLivePerformance();
        modal.style.display = 'flex';
    };

    badge?.addEventListener('click', openGpuModal);
    mobileBadge?.addEventListener('click', openGpuModal);

    // 삼성 RAM Plus 상태 토글 버튼 이벤트 등록
    const btnToggleRamPlus = $('btn-toggle-ramplus');
    btnToggleRamPlus?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const current = getRamPlusState();
        const next = !current;
        setRamPlusState(next);
        updateSamsungRamPlusUI();
        showToast(`삼성 RAM Plus: ${next ? '🟢 켜짐 (+4GB~8GB)' : '⚪ 꺼짐'}으로 전환되었습니다.`);
    });

    btnClose?.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
    });
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    window.__updateGpuModalLive = () => {
        if (modal && modal.style.display !== 'none') {
            updateGpuModalLivePerformance();
        }
    };
    window.__refreshSamsungRamPlusUI = updateSamsungRamPlusUI;
}

/**
 * 드래그 앤 드롭 파일 로더
 */
export function setupDragAndDrop(onFileLoaded) {
    const overlay = $('drag-drop-overlay');
    let dragCounter = 0;

    window.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        if (overlay) overlay.style.display = 'flex';
    });

    window.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter <= 0 && overlay) overlay.style.display = 'none';
    });

    window.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    window.addEventListener('drop', (e) => {
        e.preventDefault();
        dragCounter = 0;
        if (overlay) overlay.style.display = 'none';

        const file = e.dataTransfer?.files?.[0];
        if (file) {
            loadAndParseFile(file, onFileLoaded);
        }
    });
}

/**
 * 상단 바 메뉴 토글, 전체화면 & 캡처
 */
export function setupTopBarActions() {
    const menuPanel = $('menu-panel');
    const btnToggleMenu = $('btn-toggle-menu');
    const btnCloseMenu = $('btn-close-menu');
    const btnFullscreen = $('btn-fullscreen');
    const btnScreenshot = $('btn-screenshot');
    const mobileActionBar = $('mobile-action-bar');
    const usageGuideModal = $('usage-guide-modal');
    const btnUsageGuide = $('btn-usage-guide');
    const btnCloseUsageGuide = $('btn-close-usage-guide');
    const btnCloseUsageGuideBottom = $('btn-close-usage-guide-bottom');
    const btnUsageGuideFile = $('btn-usage-guide-file');
    let usageGuideReturnFocus = null;

    const closeUsageGuide = () => {
        if (!usageGuideModal || usageGuideModal.style.display === 'none') return;
        usageGuideModal.style.display = 'none';
        usageGuideModal.setAttribute('aria-hidden', 'true');
        if (usageGuideReturnFocus instanceof HTMLElement && usageGuideReturnFocus.isConnected) {
            usageGuideReturnFocus.focus();
        }
        usageGuideReturnFocus = null;
    };

    const openUsageGuide = () => {
        if (!usageGuideModal) return;
        usageGuideReturnFocus = document.activeElement;
        usageGuideModal.style.display = 'flex';
        usageGuideModal.setAttribute('aria-hidden', 'false');
        btnCloseUsageGuide?.focus();
    };

    btnUsageGuide?.addEventListener('click', openUsageGuide);
    btnCloseUsageGuide?.addEventListener('click', closeUsageGuide);
    btnCloseUsageGuideBottom?.addEventListener('click', closeUsageGuide);
    btnUsageGuideFile?.addEventListener('click', () => {
        closeUsageGuide();
        $('csv-upload')?.click();
    });
    usageGuideModal?.addEventListener('click', event => {
        if (event.target === usageGuideModal) closeUsageGuide();
    });
    usageGuideModal?.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeUsageGuide();
            return;
        }
        if (event.key !== 'Tab') return;

        const focusable = [...usageGuideModal.querySelectorAll(
            'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
        )].filter(element => element.getClientRects().length > 0);
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    btnToggleMenu?.addEventListener('click', () => {
        if (menuPanel) menuPanel.classList.toggle('open');
    });
    mobileActionBar?.addEventListener('click', event => {
        const action = event.target.closest('[data-mobile-target]');
        if (action) $(action.dataset.mobileTarget)?.click();
    });
    btnCloseMenu?.addEventListener('click', () => {
        if (menuPanel) menuPanel.classList.remove('open');
    });

    setupThemeToggle();

    btnFullscreen?.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.();
            btnFullscreen.textContent = '⛶ 축소';
        } else {
            document.exitFullscreen?.();
            btnFullscreen.textContent = '⛶';
        }
    });

    btnScreenshot?.addEventListener('click', () => {
        if (!appState.renderer || !appState.scene || !appState.camera) return;
        const tooltip = $('hover-tooltip');
        if (tooltip) tooltip.style.display = 'none';
        appState.renderer.render(appState.scene, appState.camera);
        const dataUrl = appState.renderer.domElement.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `3d-dashboard-capture-${Date.now()}.png`;
        a.click();
        showToast('📸 <strong>3D 화면 캡처 완료!</strong> 고화질 PNG 이미지로 저장되었습니다.');
    });

    /**
     * 상단 글로벌 컨트롤 바 부드러운 관성 가로 스크롤 (Inertial Smooth Momentum Scroll)
     * - 마우스 휠 조작 시 딱딱하게 끊기지 않고 부드럽게 감속(Lerp)되며 미끄러지듯 스크롤됩니다.
     */
    const makeSmoothHorizontalScroll = (element) => {
        if (!element) return;
        let targetScroll = element.scrollLeft;
        let isAnimating = false;

        const step = () => {
            const maxScroll = element.scrollWidth - element.clientWidth;
            targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));
            const diff = targetScroll - element.scrollLeft;

            if (Math.abs(diff) > 0.5) {
                element.scrollLeft += diff * 0.2;
                requestAnimationFrame(step);
            } else {
                element.scrollLeft = targetScroll;
                isAnimating = false;
            }
        };

        element.addEventListener('wheel', (e) => {
            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            if (delta !== 0) {
                e.preventDefault();
                if (!isAnimating) {
                    targetScroll = element.scrollLeft;
                }
                targetScroll += delta * 1.15;
                if (!isAnimating) {
                    isAnimating = true;
                    requestAnimationFrame(step);
                }
            }
        }, { passive: false });
    };

    const topBarRight = document.querySelector('.top-bar-right');
    if (topBarRight) makeSmoothHorizontalScroll(topBarRight);
}

/**
 * 3D 스타일 UI 동기화 (플로팅 툴바, 상단 퀵 셀렉트, 메뉴 셀렉트)
 */
export function sync3DStyleUI(style) {
    if (!style) return;
    appState.current3DStyle = style;
    document.querySelectorAll('.btn-3d-style').forEach(btn => {
        if (btn.dataset.style === style) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    const quickBar = $('quick-bar-style');
    if (quickBar && quickBar.value !== style) quickBar.value = style;
    const barStyle = $('bar-style');
    if (barStyle && barStyle.value !== style) barStyle.value = style;
}

/**
 * 3D 뷰포트 플로팅 형태 전환 툴바 이벤트 리스너 바인딩
 */
export function setupFloating3DToolbar(onStyleChange) {
    document.querySelectorAll('.btn-3d-style').forEach(btn => {
        btn.addEventListener('click', () => {
            const style = btn.dataset.style;
            if (!style) return;
            sync3DStyleUI(style);
            if (onStyleChange) onStyleChange(style);
        });
    });
}

/**
 * 환경 설정 (배경색, 조명 조절, 포인트 라이트 등)
 */
export function setupLightingControls() {
    const bgColor = $('bg-color');
    const ambientIntensity = $('ambient-intensity');
    const dirIntensity = $('dir-intensity');
    const pointIntensity = $('point-intensity');
    const pointColor = $('point-color');
    const exposureIntensity = $('exposure-intensity');
    const btnResetLighting = $('btn-reset-lighting');

    bgColor?.addEventListener('input', (e) => {
        const c = e.target.value;
        if (appState.scene) {
            appState.scene.background = new THREE.Color(c);
            if (appState.scene.fog) appState.scene.fog.color = new THREE.Color(c);
        }
    });

    ambientIntensity?.addEventListener('input', (e) => {
        if (appState.ambientLight) appState.ambientLight.intensity = parseFloat(e.target.value);
        const val = $('val-ambient');
        if (val) val.textContent = e.target.value;
    });

    dirIntensity?.addEventListener('input', (e) => {
        if (appState.dirLight) appState.dirLight.intensity = parseFloat(e.target.value);
        const val = $('val-dir');
        if (val) val.textContent = e.target.value;
    });

    /**
     * 🔦 포인트 라이트 (PointLight) 강도 조절
     * [사용 이유]: 차트 중심부 및 사각지대 입체광의 밝기를 동적으로 조절하여 눈부심 방지 및 음영 디테일 조정
     * [사용 방법]: 슬라이더(0.0 ~ 3.0) 조작 시 appState.pointLight.intensity에 실시간 반영
     */
    pointIntensity?.addEventListener('input', (e) => {
        const intensity = parseFloat(e.target.value);
        if (appState.pointLight) appState.pointLight.intensity = intensity;
        const val = $('val-point');
        if (val) val.textContent = e.target.value;
    });

    /**
     * 🔦 포인트 라이트 (PointLight) 색상 변경
     * [사용 이유]: 순수 흰색(#ffffff)을 기본으로 유지하여 차트 데이터 본연의 테마 색상 왜곡을 방지하며,
     *            필요 시 원하는 무드/틴트 색상으로 자유롭게 전환 가능
     * [사용 방법]: 색상 피커에서 색상 선택 시 Three.js Color 객체로 변환하여 실시간 조명 색상 변경
     */
    pointColor?.addEventListener('input', (e) => {
        const hex = e.target.value;
        if (appState.pointLight) {
            appState.pointLight.color.set(hex);
        }
    });

    exposureIntensity?.addEventListener('input', (e) => {
        if (appState.renderer) appState.renderer.toneMappingExposure = parseFloat(e.target.value);
        const val = $('val-exposure');
        if (val) val.textContent = e.target.value;
    });

    btnResetLighting?.addEventListener('click', () => {
        const defaultBg = '#f1f5f9';
        const defaultPointColor = '#ffffff';

        if (appState.scene) {
            appState.scene.background = new THREE.Color(defaultBg);
            if (appState.scene.fog) appState.scene.fog.color = new THREE.Color(defaultBg);
        }
        if (appState.ambientLight) appState.ambientLight.intensity = 0.7;
        if (appState.dirLight) appState.dirLight.intensity = 0.9;
        if (appState.pointLight) {
            appState.pointLight.intensity = 0.8;
            appState.pointLight.color.set(defaultPointColor);
        }
        if (appState.renderer) appState.renderer.toneMappingExposure = 1.1;

        if (bgColor) bgColor.value = defaultBg;
        if (ambientIntensity) ambientIntensity.value = '0.7';
        if (dirIntensity) dirIntensity.value = '0.9';
        if (pointIntensity) pointIntensity.value = '0.8';
        if (pointColor) pointColor.value = defaultPointColor;
        if (exposureIntensity) exposureIntensity.value = '1.1';

        const valAmbient = $('val-ambient');
        const valDir = $('val-dir');
        const valPoint = $('val-point');
        const valExposure = $('val-exposure');
        if (valAmbient) valAmbient.textContent = '0.7';
        if (valDir) valDir.textContent = '0.9';
        if (valPoint) valPoint.textContent = '0.8';
        if (valExposure) valExposure.textContent = '1.1';

        showToast('💡 조명 및 환경설정이 기본값(흰색 포인트 조명)으로 초기화되었습니다.');
    });
}

/**
 * 다크모드 / 라이트모드 전환 토글 시스템
 */
export function setupThemeToggle() {
    const btn = $('btn-toggle-theme');
    const icon = $('theme-toggle-icon');
    const text = $('theme-toggle-text');
    const mobileIcon = $('mobile-theme-icon');

    // 이전 저장 테마 또는 시스템 선호 감지 (기본은 라이트)
    const savedTheme = localStorage.getItem('app-theme') || 'light';
    const isDark = savedTheme === 'dark';

    const applyTheme = (dark, showNotify = false) => {
        document.body.classList.toggle('dark-mode', dark);
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        if (icon) icon.textContent = dark ? '☀️' : '🌙';
        if (text) text.textContent = dark ? '라이트' : '다크';
        if (mobileIcon) mobileIcon.textContent = dark ? '☀️' : '🌙';
        if (btn) {
            btn.title = dark ? '라이트 모드로 전환' : '다크 모드로 전환';
            btn.classList.toggle('active', dark);
        }
        localStorage.setItem('app-theme', dark ? 'dark' : 'light');
        update3DTheme(dark);
        if (showNotify) {
            showToast(dark ? '🌙 <strong>다크 모드</strong>로 전환되었습니다.' : '☀️ <strong>라이트 모드</strong>로 전환되었습니다.');
        }
    };

    applyTheme(isDark, false);

    btn?.addEventListener('click', () => {
        const currentlyDark = document.body.classList.contains('dark-mode');
        applyTheme(!currentlyDark, true);
    });
}
