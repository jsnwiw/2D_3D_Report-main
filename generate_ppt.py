import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Color Palette (Dark Theme / Glassmorphism Concept)
    BG_COLOR = RGBColor(15, 23, 42)        # Slate 900
    CARD_BG = RGBColor(30, 41, 59)         # Slate 800
    CARD_BORDER = RGBColor(51, 65, 85)     # Slate 700
    CODE_BG = RGBColor(10, 15, 30)         # Very dark slate
    PRIMARY_BLUE = RGBColor(59, 130, 246)  # Blue 500
    ACCENT_CYAN = RGBColor(6, 182, 212)    # Cyan 500
    ACCENT_GREEN = RGBColor(16, 185, 129)  # Emerald 500
    ACCENT_PURPLE = RGBColor(168, 85, 247) # Purple 500
    TEXT_WHITE = RGBColor(248, 250, 252)   # Slate 50
    TEXT_MUTED = RGBColor(148, 163, 184)   # Slate 400
    TEXT_YELLOW = RGBColor(251, 191, 36)   # Amber 400

    blank_layout = prs.slide_layouts[6]

    def add_slide_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_COLOR
        bg.line.fill.background()
        return bg

    def add_header(slide, title, category="3D & 2D DATA VISUALIZATION PLATFORM"):
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.4))
        tf = cat_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = category.upper()
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN
        p.font.name = "Segoe UI"

        t_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.7), Inches(0.7))
        tf2 = t_box.text_frame
        tf2.word_wrap = True
        p2 = tf2.paragraphs[0]
        p2.text = title
        p2.font.size = Pt(22)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_WHITE
        p2.font.name = "Segoe UI"

    def add_card(slide, left, top, width, height, title="", border_color=CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = border_color
        card.line.width = Pt(1)

        if title:
            tb = slide.shapes.add_textbox(Inches(left + 0.2), Inches(top + 0.15), Inches(width - 0.4), Inches(0.4))
            p = tb.text_frame.paragraphs[0]
            p.text = title
            p.font.size = Pt(14)
            p.font.bold = True
            p.font.color.rgb = PRIMARY_BLUE
            p.font.name = "Segoe UI"
        return card

    def add_code_box(slide, left, top, width, height, code_text, lang_title=""):
        box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        box.fill.solid()
        box.fill.fore_color.rgb = CODE_BG
        box.line.color.rgb = CARD_BORDER
        box.line.width = Pt(1)

        tb = slide.shapes.add_textbox(Inches(left + 0.2), Inches(top + 0.15), Inches(width - 0.4), Inches(height - 0.3))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = 0

        if lang_title:
            p0 = tf.paragraphs[0]
            p0.text = f"// {lang_title}"
            p0.font.size = Pt(9.5)
            p0.font.color.rgb = ACCENT_CYAN
            p0.font.name = "Consolas"
            p0.font.bold = True

        first = not bool(lang_title)
        for line in code_text.strip().split("\n"):
            p = tf.add_paragraph() if not first else tf.paragraphs[0]
            first = False
            p.text = line
            p.font.size = Pt(10)
            p.font.name = "Consolas"
            p.font.color.rgb = RGBColor(226, 232, 240)
        return box

    # -------------------------------------------------------------
    # SLIDE 1: Cover Slide
    # -------------------------------------------------------------
    s1 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s1)

    # Accent badge
    b1 = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(3.2), Inches(0.4))
    b1.fill.solid()
    b1.fill.fore_color.rgb = RGBColor(30, 58, 138)
    b1.line.color.rgb = PRIMARY_BLUE
    p = b1.text_frame.paragraphs[0]
    p.text = "⚡ WebGPU & 3D Interactive Web Platform"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN
    p.alignment = PP_ALIGN.CENTER

    # Main Title
    t1 = s1.shapes.add_textbox(Inches(0.8), Inches(2.3), Inches(11.5), Inches(1.6))
    tf = t1.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "3D & 2D 인터랙티브 데이터 분석\n및 시각화 대시보드 시스템"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.font.name = "Segoe UI"

    # Subtitle
    sub = s1.shapes.add_textbox(Inches(0.8), Inches(4.1), Inches(11.5), Inches(1.0))
    p = sub.text_frame.paragraphs[0]
    p.text = "Vulkan / WebGPU 기반 3D 차트 엔진 · AI 맞춤형 비즈니스 리포트 · 크로스 플랫폼 PWA"
    p.font.size = Pt(16)
    p.font.color.rgb = TEXT_MUTED
    p.font.name = "Segoe UI"

    # Metadata Card
    c = add_card(s1, 0.8, 5.2, 11.7, 1.4)
    tb = s1.shapes.add_textbox(Inches(1.0), Inches(5.35), Inches(11.3), Inches(1.1))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "📌 발표 개요: 웹 표준 최신 기술을 활용한 고성능 3D 데이터 시각화 아키텍처 및 구현 분석"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = PRIMARY_BLUE
    
    p2 = tf.add_paragraph()
    p2.text = "• 핵심 기술 스택: Three.js (r160) WebGPURenderer, Chart.js, SheetJS, Vanilla ES Modules, PWA Service Worker\n• 지원 환경: 데스크톱 Windows/macOS/Linux, 모바일 및 태블릿(Android/iOS/iPadOS) 100% 반응형 최적화"
    p2.font.size = Pt(11.5)
    p2.font.color.rgb = TEXT_WHITE

    # -------------------------------------------------------------
    # SLIDE 2: Project Overview & Background
    # -------------------------------------------------------------
    s2 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s2)
    add_header(s2, "프로젝트 개요 및 개발 배경", "PROJECT OVERVIEW & MOTIVATION")

    cards_data = [
        ("기존 2D 차트의 한계 극복", "• 엑셀 및 일반 웹 차트는 2차원 평면 데이터에 국한\n• 다차원(X, Y, Z, 시간) 복합 데이터의 상관관계 직관적 인지 어려움\n• 고용량 데이터 렌더링 시 브라우저 버벅임 발생", PRIMARY_BLUE),
        ("차세대 WebGPU 저수준 가속", "• 차세대 표준 WebGPU(Vulkan / Direct3D 12) 파이프라인 도입\n• CPU-GPU 통신 드라이버 오버헤드 획기적 단축\n• 대용량 3D 메쉬 객체도 60~120 FPS로 부드럽게 렌더링", ACCENT_CYAN),
        ("엔터프라이즈급 원스톱 파이프라인", "• 엑셀(.xlsx, .xls) & CSV 원클릭 드래그앤드롭 파싱\n• 10종 3D 공간 차트와 2D 대시보드 실시간 양방향 연동\n• 브라우저 단독 실행 AI 통계 분석 및 A4 인쇄 보고서 생성", ACCENT_GREEN)
    ]
    for i, (title, content, color) in enumerate(cards_data):
        x = 0.8 + i * 4.0
        add_card(s2, x, 1.6, 3.7, 4.8, title, color)
        tb = s2.shapes.add_textbox(Inches(x + 0.2), Inches(2.2), Inches(3.3), Inches(4.0))
        tf = tb.text_frame
        tf.word_wrap = True
        for line in content.split("\n"):
            p = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
            p.text = line
            p.font.size = Pt(12)
            p.font.color.rgb = TEXT_WHITE
            p.font.name = "Segoe UI"
            p.space_after = Pt(8)

    # -------------------------------------------------------------
    # SLIDE 3: System Architecture
    # -------------------------------------------------------------
    s3 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s3)
    add_header(s3, "전체 시스템 아키텍처 및 모듈 구조", "ARCHITECTURE & DATA FLOW")

    # Architecture Overview Box
    add_card(s3, 0.8, 1.5, 11.7, 5.3, "Clean Modular Architecture (ES6 Modules)")
    tb = s3.shapes.add_textbox(Inches(1.0), Inches(2.05), Inches(11.3), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True

    flow_items = [
        ("1. 데이터 인입 및 파싱 레이어 (parser.js)", "SheetJS(.xlsx) + Vanilla CSV Parser로 인코딩(EUC-KR/UTF-8) 자동 판별 및 수치/날짜/범주 정규화"),
        ("2. 전역 상태 및 텔레메트리 레이어 (state.js, device.js)", "반응형 appState 컨테이너, GPU 엔진 상태, 하드웨어 사양(CPU, GPU, RAM) 자동 감지"),
        ("3. 3D 공간 렌더링 엔진 (renderer3d.js)", "Three.js r160 WebGPURenderer (Vulkan Fallback), 10종 지오메트리 빌더, Raycaster 호버/클릭 인터랙션"),
        ("4. 2D 보조 대시보드 레이어 (chart2d.js)", "Chart.js v4 연동, 3D 선택 데이터와 2D 차트 간 양방향 하이라이트 동기화"),
        ("5. 지능형 통계 및 보고서 엔진 (ai-report.js)", "기술 통계량(평균/표준편차/사분위수/이상치) 자동 연산 및 A4 비즈니스 인쇄 PDF 생성"),
        ("6. PWA 및 오프라인 서비스 레이어 (pwa.js, sw.js)", "Service Worker Stale-While-Revalidate 캐시 및 안드로이드/모바일 Standalone 앱 설치 지원")
    ]
    for idx, (head, desc) in enumerate(flow_items):
        p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
        p.text = head
        p.font.bold = True
        p.font.size = Pt(12.5)
        p.font.color.rgb = ACCENT_CYAN
        p.space_before = Pt(4)

        p2 = tf.add_paragraph()
        p2.text = f"   └ {desc}"
        p2.font.size = Pt(11)
        p2.font.color.rgb = TEXT_WHITE
        p2.space_after = Pt(4)

    # -------------------------------------------------------------
    # SLIDE 4: Core Implementation - 3D Engine (renderer3d.js)
    # -------------------------------------------------------------
    s4 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s4)
    add_header(s4, "핵심 구현 1: WebGPU / 3D 가속 렌더러 (renderer3d.js)", "CORE MODULE IMPLEMENTATION")

    add_card(s4, 0.8, 1.5, 5.0, 5.3, "Three.js 3D 렌더링 주요 기술")
    tb = s4.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(4.6), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True
    pts = [
        "• WebGPURenderer & WebGL 2.0 스마트 폴백",
        "• 10종 3D 차트 빌더 (막대, 원기둥, 피라미드, 산점도, 서피스 등)",
        "• Raycaster 레이캐스팅을 통한 마우스/터치 호버 반응 (1.08x 스케일 확대 & 발광 피드백)",
        "• Vector3.project(camera) 화면 투영 좌표 동기화 (3D 객체 위에 2D HTML 툴팁 추적)",
        "• 궤도 제어(OrbitControls) & 부드러운 카메라 애니메이션"
    ]
    for pt in pts:
        p = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
        p.text = pt
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(12)

    code_3d = """// renderer3d.js: WebGPURenderer 초기화 & 스마트 폴백
export async function init3DRenderer(container) {
  let renderer;
  try {
    // 차세대 저수준 WebGPU 엔진 시도 (Vulkan/Direct3D 12)
    renderer = new THREE.WebGPURenderer({ 
      antialias: true, alpha: true 
    });
    await renderer.init();
    appState.gpuEngineState.backendName = 'WebGPU (Vulkan / D3D12)';
  } catch (err) {
    // 구형 브라우저 대응 WebGL 2.0 세이프 모드 폴백
    renderer = new THREE.WebGLRenderer({ 
      antialias: true, alpha: true 
    });
    appState.gpuEngineState.backendName = 'WebGL 2.0 (Safe Mode)';
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  return renderer;
}"""
    add_code_box(s4, 6.0, 1.5, 6.5, 5.3, code_3d, "Three.js WebGPU / WebGL2 Fallback Engine")

    # -------------------------------------------------------------
    # SLIDE 5: Core Implementation - Hardware & RAM Detection (state.js)
    # -------------------------------------------------------------
    s5 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s5)
    add_header(s5, "핵심 구현 2: 하드웨어 텔레메트리 & RAM 감지 (state.js)", "HARDWARE TELEMETRY & MEMORY ENGINE")

    add_card(s5, 0.8, 1.5, 5.0, 5.3, "지능형 하드웨어 감지 알고리즘")
    tb = s5.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(4.6), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True
    pts5 = [
        "• 웹 브라우저 Device Memory API 한계 극복:",
        "  - 크롬 등 브라우저는 보안(핑거프린팅 방지)으로 최대 8GB까지만 보고함",
        "• 플래그십 AP & GPU 정밀 판별:",
        "  - Mali-G925(Dimensity 9300+), Snapdragon 8 Gen 등 플래그십 감지",
        "  - 8GB 상한 보고 시 태블릿/폰 실제 물리 RAM(12GB)으로 정밀 보정",
        "• 삼성 One UI RAM Plus(가상 메모리) 감지 & 토글 연동",
        "• 실시간 FPS & 프레임 타임 틱 스파크라인 시각화"
    ]
    for pt in pts5:
        p = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
        p.text = pt
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(8)

    code_hw = """// state.js: 기기 스펙 정밀 감지 및 브라우저 메모리 보정
export function getSystemInfo() {
  const deviceType = getDeviceType(); // mobile/tablet/desktop
  let deviceMemoryGB = 12; // 플래그십 기본 12GB RAM

  if (deviceType === 'mobile' || deviceType === 'tablet') {
    if (typeof navigator.deviceMemory === 'number') {
      if (navigator.deviceMemory >= 8) {
        // 브라우저 8GB 상한 필터링 -> 최신 플래그십 물리 12GB 반영
        deviceMemoryGB = 12;
      } else {
        deviceMemoryGB = navigator.deviceMemory; // 4GB, 6GB 등
      }
    }
  }
  // 삼성 One UI RAM Plus 가상 메모리 결합
  const isGalaxy = isSamsungGalaxyDevice();
  const isRamPlusOn = isGalaxy ? getRamPlusState() : false;
  const memoryDisplay = isRamPlusOn 
    ? `${deviceMemoryGB} GB + RAM Plus` 
    : `${deviceMemoryGB} GB`;

  return { deviceMemoryGB, memoryDisplay, deviceType };
}"""
    add_code_box(s5, 6.0, 1.5, 6.5, 5.3, code_hw, "Hardware & RAM Detection Algorithm")

    # -------------------------------------------------------------
    # SLIDE 6: Core Implementation - Data Parser (parser.js)
    # -------------------------------------------------------------
    s6 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s6)
    add_header(s6, "핵심 구현 3: 무결점 엑셀 & CSV 파서 (parser.js)", "ROBUST DATA PARSING PIPELINE")

    add_card(s6, 0.8, 1.5, 5.0, 5.3, "데이터 파싱 파이프라인 특징")
    tb = s6.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(4.6), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True
    pts6 = [
        "• 멀티 포맷 지원: .xlsx, .xls, .csv 드래그앤드롭 즉시 파싱",
        "• 한국어 인코딩 완벽 대응:",
        "  - EUC-KR / CP949 / UTF-8 바이트 시퀀스 자동 판별",
        "  - 한글 깨짐 현상 원천 차단",
        "• 데이터 타입 자동 분류:",
        "  - 수치형(Numeric), 시계열/날짜(Date), 범주형(Categorical)",
        "• 3D 시각화용 축(X, Y, Z, Color) 자동 추천 매핑"
    ]
    for pt in pts6:
        p = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
        p.text = pt
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(12)

    code_parser = """// parser.js: 엑셀 & CSV 바이너리 디코딩 및 인코딩 자동 보정
export async function loadAndParseFile(file) {
  const isExcel = /\\.(xlsx|xls)$/i.test(file.name);
  let rows = [];

  if (isExcel) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  } else {
    // CSV: UTF-8 시도 후 깨짐 감지 시 EUC-KR 자동 재디코딩
    const buffer = await file.arrayBuffer();
    let text = new TextDecoder('utf-8').decode(buffer);
    if (text.includes('\\uFFFD')) {
      text = new TextDecoder('euc-kr').decode(buffer);
    }
    rows = parseCSVText(text);
  }
  return analyzeDataSchema(rows); // 스키마 및 축 자동 분석
}"""
    add_code_box(s6, 6.0, 1.5, 6.5, 5.3, code_parser, "Multi-Format Binary Data Parser")

    # -------------------------------------------------------------
    # SLIDE 7: Core Implementation - AI Report Generator (ai-report.js)
    # -------------------------------------------------------------
    s7 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s7)
    add_header(s7, "핵심 구현 4: 원클릭 AI 비즈니스 분석 보고서 (ai-report.js)", "CLIENT-SIDE AI REPORT GENERATION")

    add_card(s7, 0.8, 1.5, 5.0, 5.3, "클라이언트 사이드 AI 분석 엔진")
    tb = s7.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(4.6), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True
    pts7 = [
        "• 서버 전송 없는 100% 온디바이스 통계 분석 (보안 및 개인정보 보호)",
        "• 핵심 분석 지표 자동 산출:",
        "  - 평균, 중간값, 표준편차, 사분위수(IQR)",
        "  - 이상치(Outlier) 및 급격한 변동 구간 자동 탐지",
        "  - 시계열 성장률 및 추세 예측",
        "• A4 규격 자동 맞춤 PDF 출력 및 인쇄 최적화 CSS 제공"
    ]
    for pt in pts7:
        p = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
        p.text = pt
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(12)

    code_ai = """// ai-report.js: 통계 연산 및 A4 인쇄 보고서 자동 생성
export function generateAIReport(parsedData) {
  const stats = calculateDescriptiveStats(parsedData.numericColumns);
  const outliers = detectOutliersIQR(parsedData.records);
  const trend = analyzeTrendDirection(parsedData.records);

  const reportHTML = `
    <article class="a4-report-page">
      <h2>📊 데이터 정밀 AI 통계 보고서</h2>
      <section class="summary-badge-grid">
        <div class="kpi-card">평균: ${stats.mean.toFixed(2)}</div>
        <div class="kpi-card">표준편차: ${stats.stdDev.toFixed(2)}</div>
        <div class="kpi-card">이상치: ${outliers.length}건 발견</div>
      </section>
      <div class="insight-text">${generateBusinessInsights(trend, stats)}</div>
    </article>
  `;
  renderReportModal(reportHTML);
}"""
    add_code_box(s7, 6.0, 1.5, 6.5, 5.3, code_ai, "On-Device Analytical Insights Engine")

    # -------------------------------------------------------------
    # SLIDE 8: Core Implementation - PWA & Mobile App Installation (pwa.js, sw.js)
    # -------------------------------------------------------------
    s8 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s8)
    add_header(s8, "핵심 구현 5: 모바일/태블릿 PWA 앱 설치 (pwa.js, sw.js)", "PROGRESSIVE WEB APP & STANDALONE")

    add_card(s8, 0.8, 1.5, 5.0, 5.3, "네이티브급 PWA 앱 설치 아키텍처")
    tb = s8.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(4.6), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True
    pts8 = [
        "• 구글 WebAPK 기술 기반 독립형 앱(Standalone) 설치:",
        "  - 태블릿/폰 홈 화면 및 앱 서랍에 전용 앱 아이콘 생성",
        "  - 브라우저 주소창 제거, 전체화면 몰입형 실행",
        "• beforeinstallprompt 이벤트 캡처로 1클릭 설치 UI 제공",
        "• Service Worker 오프라인 캐싱 (Stale-While-Revalidate):",
        "  - 네트워크 불안정 환경에서도 즉시 구동"
    ]
    for pt in pts8:
        p = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
        p.text = pt
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(12)

    code_pwa = """// pwa.js: PWA 설치 프롬프트 캡처 & 1클릭 설치
let deferredPrompt = null;

export function initPWA() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // 기본 안내바 대신 커스텀 버튼 활성화
    deferredPrompt = e;
    $('btn-pwa-install').style.display = 'inline-flex';
  });

  $('btn-pwa-install')?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') showToast('앱 설치를 진행합니다.');
      deferredPrompt = null;
    }
  });
  // Service Worker 등록 (오프라인 캐시 보장)
  navigator.serviceWorker.register('./sw.js', { scope: './' });
}"""
    add_code_box(s8, 6.0, 1.5, 6.5, 5.3, code_pwa, "PWA Standalone Installation Controller")

    # -------------------------------------------------------------
    # SLIDE 9: Responsive UI & Glassmorphism Design
    # -------------------------------------------------------------
    s9 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s9)
    add_header(s9, "디자인 시스템: Glassmorphism & 반응형 레이아웃", "UI/UX & DESIGN SYSTEM")

    cards_ui = [
        ("🎨 Glassmorphism 일원화", "• backdrop-filter: blur(16px)\n• 은은한 글래스 반투명 테두리 및 그림자\n• 직관적이고 현대적인 인터페이스 토큰", PRIMARY_BLUE),
        ("🌓 원클릭 다크 / 라이트 테마", "• CSS 변수(--bg-primary, --text-main)\n• 3D 배경, 안개(Fog), 바닥 그리드 실시간 동기화\n• localStorage 테마 설정 영구 보존", ACCENT_CYAN),
        ("📱 모바일 / 태블릿 반응형 터치", "• 스마트폰 빠른 메뉴 하단 고정 바\n• 태블릿 분할 화면 및 3D 터치 제스처\n• 뷰포트 바운스 스크롤 방지 & 독립 스크롤", ACCENT_PURPLE)
    ]
    for i, (title, content, color) in enumerate(cards_ui):
        x = 0.8 + i * 4.0
        add_card(s9, x, 1.6, 3.7, 4.8, title, color)
        tb = s9.shapes.add_textbox(Inches(x + 0.2), Inches(2.2), Inches(3.3), Inches(4.0))
        tf = tb.text_frame
        tf.word_wrap = True
        for line in content.split("\n"):
            p = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
            p.text = line
            p.font.size = Pt(12)
            p.font.color.rgb = TEXT_WHITE
            p.font.name = "Segoe UI"
            p.space_after = Pt(10)

    # -------------------------------------------------------------
    # SLIDE 10: Performance & Key Achievements
    # -------------------------------------------------------------
    s10 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s10)
    add_header(s10, "성능 지표 및 주요 기대 효과", "PERFORMANCE & KEY ACHIEVEMENTS")

    stats = [
        ("60 ~ 120 FPS", "초당 프레임 수", "WebGPU 저수준 가속 파이프라인으로 대규모 3D 메쉬도 지연 없는 실시간 렌더링"),
        ("100% 온디바이스", "보안 및 프라이버시", "서버 업로드 없이 브라우저 내부에서만 데이터 파싱 및 통계 분석 완료"),
        ("< 0.5 초", "파일 로딩 및 파싱", "SheetJS 및 바이너리 파서로 대용량 엑셀/CSV 데이터도 즉각 3D 공간에 매핑"),
        ("크로스 플랫폼 PWA", "모바일/태블릿/PC", "설치 한 번으로 데스크톱 앱 및 안드로이드/태블릿 전용 네이티브 앱처럼 구동")
    ]
    for i, (metric, label, desc) in enumerate(stats):
        col = i % 2
        row = i // 2
        x = 0.8 + col * 5.9
        y = 1.6 + row * 2.6
        add_card(s10, x, y, 5.7, 2.3, "")

        tb = s10.shapes.add_textbox(Inches(x + 0.2), Inches(y + 0.15), Inches(5.3), Inches(2.0))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = metric
        p1.font.size = Pt(28)
        p1.font.bold = True
        p1.font.color.rgb = ACCENT_CYAN

        p2 = tf.add_paragraph()
        p2.text = label
        p2.font.size = Pt(13)
        p2.font.bold = True
        p2.font.color.rgb = PRIMARY_BLUE
        p2.space_after = Pt(4)

        p3 = tf.add_paragraph()
        p3.text = desc
        p3.font.size = Pt(11)
        p3.font.color.rgb = TEXT_WHITE

    # -------------------------------------------------------------
    # SLIDE 11: Summary & Q&A
    # -------------------------------------------------------------
    s11 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s11)

    t11 = s11.shapes.add_textbox(Inches(0.8), Inches(2.2), Inches(11.7), Inches(1.5))
    tf = t11.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "감사합니다\nThank You"
    p.font.size = Pt(42)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.alignment = PP_ALIGN.CENTER

    sub11 = s11.shapes.add_textbox(Inches(0.8), Inches(4.2), Inches(11.7), Inches(1.2))
    p = sub11.text_frame.paragraphs[0]
    p.text = "3D & 2D 인터랙티브 데이터 분석 및 시각화 플랫폼\nLive Demo: https://jsnwiw.github.io/2D_3D_Report-main/"
    p.font.size = Pt(16)
    p.font.color.rgb = ACCENT_CYAN
    p.alignment = PP_ALIGN.CENTER

    output_path = r"C:\Users\두드림\Desktop\2D_3D_Report-main\3D_2D_Data_Visualization_Presentation.pptx"
    prs.save(output_path)
    print(f"Presentation saved successfully to: {output_path}")

if __name__ == "__main__":
    create_deck()
