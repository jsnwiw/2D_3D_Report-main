/**
 * ==============================================================================
 * [ai-report.js] AI 맞춤 분석 보고서 스튜디오 (AI Report Studio) & A4 PDF 인쇄 엔진
 * ==============================================================================
 */
import { $, appState, showToast, sleep } from './state.js';
import { fmt, inferBestReportType, inferBestReportTone } from './analytics.js';
import { render2DChart } from './chart2d.js';

/**
 * 분석 어조별 사전 및 단일 패스 정규식 캐시 (대용량 텍스트 고속 변환)
 */
const TONE_DICTIONARIES = {
    academic: {
        '집계되었습니다.': '집계되었다.',
        '형성하고 있습니다.': '형성하고 있다.',
        '기록하고 있습니다.': '기록하고 있다.',
        '포착하였습니다.': '포착하였다.',
        '제언합니다.': '제언함.',
        '차지하고 있습니다.': '차지한다.',
        '주효합니다.': '주효하다.',
        '구조입니다.': '구조이다.',
        '필요합니다.': '필요하다.',
        '낮습니다.': '낮다.',
        '보입니다.': '보인다.',
        '상태입니다.': '상태이다.',
        '두드러집니다.': '두드러진다.',
        '유도하십시오.': '유도할 것을 권고함.',
        '얻을 수 있습니다.': '얻을 수 있음.',
        '실행하십시오.': '실행할 필요가 있음.',
        '완화하십시오.': '완화할 것을 요함.',
        '가동하십시오.': '가동함이 타당함.',
        '정립하십시오.': '정립할 필요가 있음.',
        '투입하십시오.': '투입할 것을 제언함.',
        '의무화하십시오.': '의무화할 것을 권고함.',
        '전파하십시오.': '전파할 필요가 있음.',
        '부여하십시오.': '부여할 것을 제언함.',
        '끌어올리십시오.': '끌어올려야 함.',
        '삼으십시오.': '삼아야 함.',
        '모니터링하십시오.': '모니터링해야 함.',
        '포착하십시오.': '포착할 것을 권고함.',
        '확대하십시오.': '확대해야 함.',
        '구축하십시오.': '구축할 것을 제언함.',
        '마련하십시오.': '마련해야 함.',
        '극대화하십시오.': '극대화할 것을 요함.',
        '절감하십시오.': '절감해야 함.',
        '정착시키십시오.': '정착시킬 것을 권고함.',
        '단행하십시오.': '단행해야 함.',
        '점검하십시오.': '점검할 것을 요함.',
        '가속화하십시오.': '가속화할 필요가 있음.',
        '감지되었습니다.': '감지되었다.',
        '발견되지 않았습니다.': '발견되지 않았다.',
        '입증했습니다.': '입증하였다.',
        '수립하였습니다.': '수립하였다.',
        '정의하였습니다.': '정의하였다.'
    },
    practical: {
        '집계되었습니다.': '집계되었어요.',
        '형성하고 있습니다.': '형성하고 있어요.',
        '기록하고 있습니다.': '기록하고 있어요.',
        '포착하였습니다.': '포착했어요.',
        '제언합니다.': '제안드려요.',
        '차지하고 있습니다.': '차지하고 있어요.',
        '주효합니다.': '효과적이에요.',
        '구조입니다.': '구조예요.',
        '필요합니다.': '필요해요.',
        '낮습니다.': '낮아요.',
        '보입니다.': '보여줘요.',
        '상태입니다.': '상태예요.',
        '두드러집니다.': '두드러져요.',
        '하십시오.': '해보시는 것을 추천드려요.',
        '얻을 수 있습니다.': '얻으실 수 있어요.',
        '감지되었습니다.': '감지되었어요.',
        '발견되지 않았습니다.': '발견되지 않았어요.',
        '입증했습니다.': '입증했어요.',
        '수립하였습니다.': '수립했어요.',
        '정의하였습니다.': '정의했어요.'
    },
    consulting: {
        '집계되었습니다.': '도출되었습니다.',
        '제언합니다.': '전략적으로 제언드립니다.',
        '하십시오.': '할 것을 강력히 권고드립니다.',
        '구조입니다.': '구조로 분석됩니다.',
        '두드러집니다.': '핵심 레버리지 포인트로 사료됩니다.',
        '필요합니다.': '필수적인 전략 과제로 판단됩니다.'
    },
    audit: {
        '집계되었습니다.': '확인·검증되었습니다.',
        '제언합니다.': '즉시 조치 권고안을 송부합니다.',
        '하십시오.': '에 대해 즉시 시정 조치 요망합니다.',
        '두드러집니다.': '집중 위험 요소로 지적됩니다.',
        '필요합니다.': '긴급 감사가 요구됩니다.'
    },
    inspirational: {
        '집계되었습니다.': '달성해냈습니다!',
        '기록하고 있습니다.': '폭발적으로 질주하고 있습니다!',
        '제언합니다.': '공격적인 성장 액션을 제안합니다!',
        '하십시오.': '하여 성장 모멘텀을 한계 돌파하십시오!',
        '두드러집니다.': '압도적인 초격차를 만들어내고 있습니다!'
    },
    briefing: {
        '집계되었습니다.': '집계됨.',
        '형성하고 있습니다.': '형성 중.',
        '기록하고 있습니다.': '기록 중.',
        '포착하였습니다.': '포착 완료.',
        '제언합니다.': '제언.',
        '차지하고 있습니다.': '점유.',
        '구조입니다.': '구조.',
        '필요합니다.': '필요.',
        '두드러집니다.': '현저.',
        '하십시오.': '조치 요망.',
        '얻을 수 있습니다.': '달성 가능.',
        '감지되었습니다.': '감지됨.',
        '발견되지 않았습니다.': '이상 없음.'
    }
};

const TONE_REGEX_CACHE = {};
function getToneRegex(tone) {
    if (!TONE_REGEX_CACHE[tone]) {
        const dict = TONE_DICTIONARIES[tone];
        if (!dict) return null;
        const keys = Object.keys(dict).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        TONE_REGEX_CACHE[tone] = new RegExp(keys.join('|'), 'g');
    }
    return TONE_REGEX_CACHE[tone];
}

/**
 * 선택된 분석 어조(Tone)에 따라 본문 텍스트 문체 및 종결어미 변환 (단일 패스 고속 치환)
 */
export function applyToneToText(text, tone = 'formal') {
    if (!text || typeof text !== 'string' || tone === 'formal') return text;
    const dict = TONE_DICTIONARIES[tone];
    const regex = getToneRegex(tone);
    if (!dict || !regex) return text;
    return text.replace(regex, match => dict[match] || match);
}

/**
 * 데이터 특성에 따른 AI 추천 보고서 유형 및 어조 배지 UI 갱신
 */
export function updateReportRecommendationUI() {
    if (!appState.parsedData || !appState.analysisResult) return null;
    const yAxisSelect = $('y-axis-select');
    const xAxisSelect = $('x-axis-select');
    const yIdx = parseInt(yAxisSelect ? yAxisSelect.value : (appState.analysisResult.numericCols[0] || 0));
    const xIdx = parseInt(xAxisSelect ? xAxisSelect.value : 0);
    const yColName = appState.parsedData.headers[yIdx] || '값';
    const numStat = appState.analysisResult.numericStats?.[yColName];
    if (!numStat) return null;

    const count = numStat.count || appState.parsedData.rows.length;
    const mean = numStat.mean || 0;
    const median = numStat.median || mean;
    const stddev = numStat.stddev || 0;
    const cv = mean > 0 ? (stddev / mean) * 100 : 0;
    const q1 = numStat.q1 || (mean * 0.7);
    const q3 = numStat.q3 || (mean * 1.3);
    const iqr = Math.max(q3 - q1, 0.001);
    const upperLimit = q3 + 1.5 * iqr;
    const lowerLimit = q1 - 1.5 * iqr;

    const values = appState.parsedData.rows.map(r => parseFloat(r[yIdx])).filter(v => !isNaN(v)).sort((a, b) => b - a);
    const outliers = values.filter(v => v > upperLimit || v < lowerLimit);
    const sum = numStat.sum || values.reduce((a, b) => a + b, 0);
    const top20Count = Math.max(1, Math.round(count * 0.2));
    const top20Sum = values.slice(0, top20Count).reduce((a, b) => a + b, 0);
    const top20Share = sum > 0 ? ((top20Sum / sum) * 100).toFixed(1) : '0';
    const topBottomRatio = values.length > 1 && values[values.length - 1] > 0
        ? (values[0] / values[values.length - 1]).toFixed(1)
        : '1.0';

    const rec = inferBestReportType({
        yColName, count, mean, median, cv, outliers, top20Share, topBottomRatio,
        isDate: appState.analysisResult.dateCols?.includes(xIdx)
    });

    const toneRec = inferBestReportTone(rec.type, { yColName, cv, outliers });

    // 사이드바 배지 업데이트
    const sidebarBadge = $('ai-recommended-report-badge');
    const sidebarName = $('recommended-report-type-name');
    const sidebarReason = $('recommended-report-type-reason');
    if (sidebarBadge && sidebarName) {
        sidebarName.textContent = rec.name;
        if (sidebarReason) sidebarReason.textContent = `${rec.reason} (어조: ${toneRec.name.split(' ')[1] || '맞춤'})`;
        sidebarBadge.style.display = 'block';
    }

    // 모달 내 통합 추천 알림 바 업데이트
    const recommendRow = $('ai-toolbar-recommend-row');
    const detectedReason = $('ai-report-detected-reason');
    const toneReasonBox = $('ai-tone-detected-reason');
    if (detectedReason) {
        detectedReason.innerHTML = `<strong>[유형]</strong> ${rec.name}`;
    }
    if (toneReasonBox) {
        toneReasonBox.innerHTML = `&nbsp;•&nbsp; <strong>[어조]</strong> ${toneRec.name}`;
    }
    if (recommendRow) {
        recommendRow.style.display = 'flex';
    }

    return { typeRec: rec, toneRec };
}

/**
 * AI 리포트 스튜디오 모달 열기 및 자동 작성
 */
export async function openAiReportStudio(options = {}) {
    if (!appState.parsedData || !appState.analysisResult) {
        showToast('⚠️ <strong>데이터 필요:</strong> 먼저 CSV 또는 엑셀 파일을 업로드해 주세요.');
        return;
    }
    const aiReportModal = $('ai-report-modal');
    if (aiReportModal) {
        aiReportModal.style.display = 'flex';
        updateReportRecommendationUI();
        await generateAIReport(options);
    }
}

/**
 * 프로그레스 바 상태 갱신
 */
function setReportProgress(percent, text) {
    const aiProgressBarFill = $('ai-progress-bar-fill');
    const aiProgressText = $('ai-progress-text');
    if (aiProgressBarFill) aiProgressBarFill.style.width = `${percent}%`;
    if (aiProgressText) aiProgressText.textContent = text;
}

/**
 * 🖨️ A4 인쇄 및 PDF 저장
 */
export function printCurrentReport() {
    const aiReportContent = $('ai-report-content');
    const reportContainer = $('print-report-container');
    if (!aiReportContent || !aiReportContent.innerHTML.trim()) {
        showToast('⚠️ 인쇄할 보고서가 없습니다. 먼저 보고서를 작성해 주세요.');
        return;
    }
    if (!reportContainer) return;

    reportContainer.innerHTML = aiReportContent.innerHTML;
    reportContainer.style.display = 'block';

    showToast('📑 <strong>A4 인쇄 창</strong>이 열렸습니다. [대상: PDF로 저장]을 선택하시면 PDF 파일로 보관하실 수 있습니다!');

    setTimeout(() => {
        window.print();
    }, 250);

    window.onafterprint = () => {
        reportContainer.style.display = 'none';
    };
}

/**
 *  ✨ AI 보고서 자동 작성 메인 컨트롤러
 */
export async function generateAIReport(options = {}) {
    const aiReportType = $('ai-report-type');
    const aiReportTone = $('ai-report-tone');
    const aiReportEngine = $('ai-report-engine');
    const aiGenerationProgress = $('ai-generation-progress');
    const aiReportContent = $('ai-report-content');
    const xAxisSelect = $('x-axis-select');
    const yAxisSelect = $('y-axis-select');
    const fileNameDisplay = $('file-name');

    try {
        if (!appState.parsedData || !appState.analysisResult) {
            showToast('⚠️ 분석할 데이터가 없습니다.');
            return;
        }

        const type = aiReportType ? aiReportType.value : 'business';
        const typeLabel = aiReportType?.selectedOptions?.[0]?.textContent || '종합 경영·비즈니스 전략 보고서';
        const tone = aiReportTone ? aiReportTone.value : 'formal';
        const engine = aiReportEngine ? aiReportEngine.value : 'builtin';

        if (aiGenerationProgress) aiGenerationProgress.style.display = 'block';
        setReportProgress(20, '1단계: 데이터셋 구조 및 8대 기술통계 지표 산출 중...');


        const yIdx = parseInt(yAxisSelect ? yAxisSelect.value : 1);
        const xIdx = parseInt(xAxisSelect ? xAxisSelect.value : 0);
        const yColName = appState.parsedData.headers[yIdx] || '값';
        const xColName = appState.parsedData.headers[xIdx] || '항목';

        const rows = appState.parsedData.rows;
        const items = rows.map((r, i) => ({
            label: String(r[xIdx] || `항목 #${i + 1}`),
            value: parseFloat(r[yIdx]) || 0,
            idx: i
        })).filter(item => !isNaN(item.value));

        if (items.length === 0) {
            showToast('⚠️ 선택된 지표에 유효한 수치 데이터가 없습니다.');
            if (aiGenerationProgress) aiGenerationProgress.style.display = 'none';
            return;
        }

        await sleep(100);
        setReportProgress(45, '2단계: 1.5×IQR 이상치 탐지 및 파레토 80/20 집중도 진단 중...');

        const sortedDesc = [...items].sort((a, b) => b.value - a.value);
        const values = sortedDesc.map(item => item.value).reverse();
        const count = values.length;
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / count;
        const median = count % 2 === 0 ? (values[count / 2 - 1] + values[count / 2]) / 2 : values[Math.floor(count / 2)];
        const min = values[0];
        const max = values[values.length - 1];
        const range = max - min;
        const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
        const stddev = Math.sqrt(variance);
        const cv = mean > 0 ? ((stddev / mean) * 100) : 0;

        const q1 = values[Math.floor(count * 0.25)];
        const q3 = values[Math.floor(count * 0.75)];
        const iqr = Math.max(q3 - q1, 0.0001);
        const upperLimit = q3 + 1.5 * iqr;
        const lowerLimit = q1 - 1.5 * iqr;
        const highOutliers = items.filter(d => d.value > upperLimit);
        const lowOutliers = items.filter(d => d.value < lowerLimit);
        const outliers = [...highOutliers, ...lowOutliers];

        const top1 = sortedDesc[0] || { label: '항목 1', value: 0 };
        const top2 = sortedDesc[1] || top1;
        const top3 = sortedDesc[2] || top2;
        const bottom1 = sortedDesc[sortedDesc.length - 1] || top1;
        const bottom2 = sortedDesc[sortedDesc.length - 2] || bottom1;
        const top20Count = Math.max(1, Math.round(count * 0.2));
        const top20Sum = sortedDesc.slice(0, top20Count).reduce((acc, cur) => acc + cur.value, 0);
        const top20Share = sum > 0 ? ((top20Sum / sum) * 100).toFixed(1) : '0';
        const top1Share = sum > 0 ? ((top1.value / sum) * 100).toFixed(1) : '0';
        const topBottomRatio = (bottom1 && bottom1.value > 0) ? (top1.value / bottom1.value).toFixed(1) : '∞';
        const top3Sum = sortedDesc.slice(0, 3).reduce((acc, cur) => acc + cur.value, 0);
        const top3Share = sum > 0 ? ((top3Sum / sum) * 100).toFixed(1) : '0';

        //  데이터 특성 기반 AI 최적 보고서 유형 자동 추론
        const recommendedReport = inferBestReportType({
            yColName, count, mean, median, cv, outliers,
            top20Share, topBottomRatio,
            isDate: appState.analysisResult?.dateCols?.includes(xIdx)
        });

        let resolvedType = type;
        let resolvedTypeLabel = typeLabel;

        if (type === 'auto') {
            resolvedType = recommendedReport.type;
            resolvedTypeLabel = recommendedReport.name;
            const autoBadge = $('ai-report-auto-badge');
            if (autoBadge) autoBadge.textContent = `AI 추천 적용`;
            const reasonBox = $('ai-report-detected-reason');
            if (reasonBox) {
                reasonBox.innerHTML = `<strong>[유형]</strong> ${recommendedReport.name}`;
            }
        }

        // 👔 데이터 및 보고서 유형 기반 AI 최적 어조 자동 추론
        const recommendedTone = inferBestReportTone(resolvedType, { yColName, cv, outliers });

        let resolvedTone = tone;
        let resolvedToneLabel = aiReportTone?.selectedOptions?.[0]?.textContent || '전문 비즈니스 격식체';

        if (tone === 'auto') {
            resolvedTone = recommendedTone.tone;
            resolvedToneLabel = recommendedTone.name;
            const toneBadge = $('ai-tone-auto-badge');
            if (toneBadge) toneBadge.textContent = `AI 어조 적용`;
            const toneReasonBox = $('ai-tone-detected-reason');
            if (toneReasonBox) {
                toneReasonBox.innerHTML = `&nbsp;•&nbsp; <strong>[어조]</strong> ${recommendedTone.name}`;
            }
        }

        const recommendRow = $('ai-toolbar-recommend-row');
        if (recommendRow && (type === 'auto' || tone === 'auto')) {
            recommendRow.style.display = 'flex';
        }

        let multiColAnalysis = null;
        const otherNumCols = appState.analysisResult.numericCols ? appState.analysisResult.numericCols.filter(ci => ci !== yIdx && ci !== xIdx) : [];
        if (otherNumCols.length > 0) {
            const otherColNames = otherNumCols.map(ci => appState.parsedData.headers[ci]);
            multiColAnalysis = {
                names: otherColNames,
                info: otherColNames.map(name => {
                    const s = appState.analysisResult.numericStats[name];
                    return s ? `${name}(총합: ${fmt(s.sum || 0)}, 평균: ${fmt(Math.round(s.mean || 0))})` : name;
                }).join(', ')
            };
        }

        await sleep(100);
        setReportProgress(75, '3단계: 3D 공간 시각화 융합 및 비즈니스 전략 인사이트 추론 중...');

        let aiGeneratedSections = null;
        let usedEngineLabel = '⚡ 내장 고성능 AI 엔진 (Built-in Data Intelligence)';

        if (engine === 'gemini') {
            const geminiKey = localStorage.getItem('agy_gemini_api_key');
            if (geminiKey) {
                try {
                    setReportProgress(85, 'Google Gemini LLM에 데이터를 전송하여 보고서를 생성하는 중...');
                    aiGeneratedSections = await callGeminiReportAPI(geminiKey, {
                        type: resolvedType, typeLabel: resolvedTypeLabel, tone: resolvedTone, toneLabel: resolvedToneLabel, xColName, yColName, count, sum, mean, median, min, max, stddev, cv,
                        top1, top20Count, top20Share, outliers, bottom1, topBottomRatio,
                        fileName: appState.currentUploadedFile ? appState.currentUploadedFile.name : '데이터세트'
                    });
                    usedEngineLabel = '🌐 Google Gemini 1.5 Flash (LLM)';
                } catch (err) {
                    console.warn('Gemini API 호출 실패, 내장 AI 엔진으로 폴백:', err);
                    showToast('⚠️ Gemini API 연결 실패로 내장 스마트 AI 엔진으로 자동 전환되었습니다.');
                }
            } else {
                showToast('💡 Gemini API 키가 설정되지 않아 내장 고성능 AI 엔진으로 작성합니다.');
            }
        } else if (engine === 'openai') {
            const openaiKey = localStorage.getItem('agy_openai_api_key');
            if (openaiKey) {
                try {
                    setReportProgress(85, 'OpenAI GPT에 데이터를 전송하여 보고서를 생성하는 중...');
                    aiGeneratedSections = await callOpenAIReportAPI(openaiKey, {
                        type: resolvedType, typeLabel: resolvedTypeLabel, tone: resolvedTone, toneLabel: resolvedToneLabel, xColName, yColName, count, sum, mean, median, min, max, stddev, cv,
                        top1, top20Count, top20Share, outliers, bottom1, topBottomRatio,
                        fileName: appState.currentUploadedFile ? appState.currentUploadedFile.name : '데이터세트'
                    });
                    usedEngineLabel = '🌐 OpenAI GPT-4o-mini (LLM)';
                } catch (err) {
                    console.warn('OpenAI API 호출 실패, 내장 AI 엔진으로 폴백:', err);
                    showToast('⚠️ OpenAI API 연결 실패로 내장 스마트 AI 엔진으로 자동 전환되었습니다.');
                }
            } else {
                showToast('💡 OpenAI API 키가 설정되지 않아 내장 고성능 AI 엔진으로 작성합니다.');
            }
        }

        if (!aiGeneratedSections) {
            aiGeneratedSections = buildBuiltinAIReport({
                type: resolvedType, typeLabel: resolvedTypeLabel, tone: resolvedTone, toneLabel: resolvedToneLabel, xColName, yColName, count, sum, mean, median, min, max, range, stddev, cv,
                top1, top2, top3, bottom1, bottom2, top20Count, top20Sum, top20Share, top1Share, top3Share, topBottomRatio,
                outliers, highOutliers, lowOutliers, q1, q3, iqr, upperLimit, lowerLimit, sortedDesc, multiColAnalysis,
                fileName: appState.currentUploadedFile ? appState.currentUploadedFile.name : (fileNameDisplay?.textContent || '데이터 세트')
            });
        }

        await sleep(80);
        setReportProgress(100, '✨ AI 맞춤형 분석 보고서 작성 완료!');

        // 2D 데이터 시각화 차트 스냅샷 캡처 (보고서 삽입용)
        let snap2D = '';
        try {
            if (!appState.chart2d) {
                render2DChart();
            }
            if (appState.chart2d) {
                snap2D = appState.chart2d.toBase64Image('image/png', 1);
            }
            if (!snap2D) {
                const chartCanvas = $('chart-2d');
                if (chartCanvas) {
                    snap2D = chartCanvas.toDataURL('image/png');
                }
            }
        } catch (e) {
            console.warn('2D 차트 스냅샷 추출 실패:', e);
        }

        const now = new Date();
        const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const docId = `DOC-${now.getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const fileNameStr = appState.currentUploadedFile ? appState.currentUploadedFile.name : (fileNameDisplay?.textContent || '데이터 세트');

        let tableRowsHtml = '';
        const previewRows = appState.parsedData.rows.slice(0, 12);
        previewRows.forEach(r => {
            tableRowsHtml += '<tr>';
            appState.parsedData.headers.slice(0, 6).forEach((_, ci) => {
                tableRowsHtml += `<td>${r[ci]}</td>`;
            });
            tableRowsHtml += '</tr>';
        });

        const finalReportHtml = `
            <div class="report-doc-top">
                <span class="report-doc-confidential">● CONFIDENTIAL / 내부 경영 분석용</span>
                <span class="report-doc-num">문서번호: ${docId}</span>
            </div>

            <div class="report-doc-header">
                <div class="report-title-area">
                    <h2 class="report-main-title report-editable" contenteditable="${appState.isReportEditMode}">${aiGeneratedSections.title}</h2>
                    <p class="report-sub-title report-editable" contenteditable="${appState.isReportEditMode}">${aiGeneratedSections.subtitle}</p>
                </div>
                <div class="report-doc-meta">
                    <div><strong>출력 일시:</strong> ${dateStr}</div>
                    <div><strong>분석 파일:</strong> ${fileNameStr}</div>
                    <div><strong>분석 대상:</strong> [X: ${xColName}] × [Y: ${yColName}]</div>
                    <div class="report-meta-tag">${usedEngineLabel}</div>
                </div>
            </div>

            ${appState.isReportEditMode ? `
            <div class="report-edit-banner">
                <span>✏️ <strong>직접 편집 모드 활성화됨:</strong> 보고서 제목, 요약문, 분석 내용, 제언을 클릭하여 직접 수정할 수 있습니다.</span>
                <span style="font-size:11px; color:#3b82f6;">편집 완료 후 [🖨️ 인쇄 / PDF 저장]을 누르면 수정된 내용 그대로 출력됩니다.</span>
            </div>
            ` : ''}

            <!-- 섹션 1: 경영진 핵심 요약 -->
            <div class="report-section">
                <div class="report-section-title">💡 1. 핵심 경영진 브리핑 (Executive Summary)</div>
                <div class="report-exec-box report-editable" contenteditable="${appState.isReportEditMode}">
                    ${aiGeneratedSections.executiveSummary}
                </div>
            </div>

            <!-- 섹션 2: 8대 핵심 KPI 통계 대시보드 -->
            <div class="report-section">
                <div class="report-section-title">📊 2. 주요 핵심 통계 지표 (Key Performance Indicators)</div>
                <div class="report-stats-grid-8">
                    <div class="report-kpi-card">
                        <div class="report-kpi-label">총 데이터 건수</div>
                        <div class="report-kpi-val">${count.toLocaleString()}건</div>
                    </div>
                    <div class="report-kpi-card">
                        <div class="report-kpi-label">합계 (Total Sum)</div>
                        <div class="report-kpi-val">${fmt(sum)}</div>
                    </div>
                    <div class="report-kpi-card">
                        <div class="report-kpi-label">평균값 (Mean)</div>
                        <div class="report-kpi-val">${fmt(Math.round(mean))}</div>
                    </div>
                    <div class="report-kpi-card">
                        <div class="report-kpi-label">중앙값 (Median)</div>
                        <div class="report-kpi-val">${fmt(Math.round(median))}</div>
                    </div>
                    <div class="report-kpi-card">
                        <div class="report-kpi-label">최대 실적치 (Max)</div>
                        <div class="report-kpi-val" style="color:#10b981;">${fmt(max)}</div>
                    </div>
                    <div class="report-kpi-card">
                        <div class="report-kpi-label">최저치 (Min)</div>
                        <div class="report-kpi-val" style="color:#ef4444;">${fmt(min)}</div>
                    </div>
                    <div class="report-kpi-card">
                        <div class="report-kpi-label">표준편차 (StdDev)</div>
                        <div class="report-kpi-val">${fmt(Math.round(stddev))}</div>
                    </div>
                    <div class="report-kpi-card">
                        <div class="report-kpi-label">변동계수 (CV)</div>
                        <div class="report-kpi-val" style="color:${cv > 50 ? '#f59e0b' : '#3b82f6'};">${cv.toFixed(1)}%</div>
                    </div>
                </div>
            </div>

            <!-- 섹션 3: 2D 데이터 시각화 분석 차트 -->
            <div class="report-section">
                <div class="report-section-title">📈 3. 2D 데이터 시각화 분석 차트 (Data Visualization)</div>
                <div class="report-visual-card single-2d">
                    <div class="report-visual-card-header">
                        <h5>📊 [${xColName}] 기준 [${yColName}] 다변량 2D 분석 차트</h5>
                        <span class="report-visual-badge">2D 고해상도 시각화</span>
                    </div>
                    ${snap2D ? `
                        <div class="report-chart-img-wrap">
                            <img src="${snap2D}" alt="2D 데이터 시각화 차트" class="report-2d-chart-img">
                        </div>
                    ` : `
                        <div class="report-chart-empty">차트 이미지를 생성할 수 없습니다.</div>
                    `}
                    <div class="report-visual-caption">▲ ${xColName} 항목별 ${yColName} 지표 분포 및 수치 비교 (Chart.js 2D 시각화)</div>
                </div>
            </div>

            <!-- 섹션 4: AI 데이터 심층 진단 & 패턴 분석 -->
            <div class="report-section">
                <div class="report-section-title">🔍 4. AI 데이터 심층 진단 & 패턴 분석 (Deep Diagnostics)</div>
                <div class="report-deep-grid">
                    <div class="report-deep-card info report-editable" contenteditable="${appState.isReportEditMode}">
                        <div class="report-deep-title">📊 파레토(Pareto 80/20) 집중도 분석</div>
                        <div>${aiGeneratedSections.paretoDiagnostic}</div>
                    </div>
                    <div class="report-deep-card ${outliers.length > 0 ? 'warning' : 'success'} report-editable" contenteditable="${appState.isReportEditMode}">
                        <div class="report-deep-title">${outliers.length > 0 ? '⚠️ 1.5×IQR 이상치(Outlier) 정밀 진단' : '✅ 통계적 이상치 검증 완료'}</div>
                        <div>${aiGeneratedSections.outlierDiagnostic}</div>
                    </div>
                    <div class="report-deep-card report-editable" contenteditable="${appState.isReportEditMode}">
                        <div class="report-deep-title">🌊 분포 균일도 및 변동 위험도 (CV 분석)</div>
                        <div>${aiGeneratedSections.cvDiagnostic}</div>
                    </div>
                    <div class="report-deep-card report-editable" contenteditable="${appState.isReportEditMode}">
                        <div class="report-deep-title">⚖️ 상·하위 격차 및 스프레드 진단</div>
                        <div>${aiGeneratedSections.spreadDiagnostic}</div>
                    </div>
                </div>
            </div>

            <!-- 섹션 5: AI 전략적 제언 및 실행 권고사항 -->
            <div class="report-section">
                <div class="report-section-title">🎯 5. AI 전략적 제언 및 비즈니스 실행 권고 (Action Items)</div>
                <div class="report-recom-list">
                    ${aiGeneratedSections.recommendations.map((rec, idx) => `
                    <div class="report-recom-item">
                        <span class="report-recom-badge">${idx + 1}</span>
                        <div class="report-recom-content report-editable" contenteditable="${appState.isReportEditMode}">
                            <div style="font-size:14px; font-weight:700; margin-bottom:5px; color:var(--theme-text, #1e293b);">${rec.title}</div>
                            <div style="font-size:13px; line-height:1.6; color:var(--theme-text-muted, #475569);">${rec.desc}</div>
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>

            <!-- 섹션 6: 데이터 품질 및 리스크 거버넌스 가이드 -->
            <div class="report-section">
                <div class="report-section-title">🛡️ 6. 데이터 품질 및 리스크 거버넌스 관리 지침 (Governance & Audit Protocol)</div>
                <div class="report-deep-grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
                    <div class="report-deep-card info report-editable" contenteditable="${appState.isReportEditMode}">
                        <div class="report-deep-title">📋 정기 업데이트 및 모니터링 주기</div>
                        <div>본 보고서 지표는 <strong>주간/월간 단위</strong>로 신규 데이터를 수집하여 3D/2D 대시보드와 동기화하고, 상위 20% 점유율(현재 <strong>${top20Share}%</strong>)의 급격한 변동 추이를 지속 감시할 것을 권고합니다.</div>
                    </div>
                    <div class="report-deep-card ${outliers.length > 0 ? 'warning' : 'success'} report-editable" contenteditable="${appState.isReportEditMode}">
                        <div class="report-deep-title">🚨 통계적 관리 한계선(UCL / LCL) 기준</div>
                        <div>Tukey 1.5×IQR 정상 신뢰구간([<strong>${fmt(Math.max(0, Math.round(lowerLimit)))} ~ ${fmt(Math.round(upperLimit))}</strong>])을 이탈하는 수치가 입력될 경우, 단순 입력 실수 또는 시장 특이 스파이크로 자동 분류하여 24시간 내 유효성 검증을 완료하십시오.</div>
                    </div>
                    <div class="report-deep-card report-editable" contenteditable="${appState.isReportEditMode}">
                        <div class="report-deep-title">✅ 의사결정 승인 및 성과 연계 체계</div>
                        <div>본 보고서의 5대 실행 권고안은 승인 즉시 부서별 세부 KPI 과제로 지정되어야 하며, 분기별 실적 검토 회의 시 3D 공간 타임라인을 통해 진도율을 객관적으로 대조 평가하십시오.</div>
                    </div>
                </div>
            </div>

            <!-- 섹션 7: 로우 데이터 표 미리보기 -->
            <div class="report-section" style="margin-bottom: 10px;">
                <div class="report-section-title">📄 7. 분석 대상 데이터 표 미리보기 (상위 ${previewRows.length}행)</div>
                <table class="report-table">
                    <thead>
                        <tr>${appState.parsedData.headers.slice(0, 6).map(h => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>${tableRowsHtml}</tbody>
                </table>
            </div>

            <!-- 섹션 8: 공문서 승인 및 결재란 -->
            <div class="report-approval-block">
                <table class="report-approval-table">
                    <thead>
                        <tr>
                            <th>작성자</th>
                            <th>데이터 검토</th>
                            <th>최종 승인</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="sign-cell">${usedEngineLabel.split(' ')[1] || 'AI Engine'}</td>
                            <td class="sign-cell">담당 분석관</td>
                            <td class="sign-cell">(인 / 서명)</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        if (aiReportContent) {
            aiReportContent.innerHTML = finalReportHtml;
        }

        // 실시간 AI 텍스트 스트리밍 타이핑 연출
        if (options.stream !== false) {
            const execBox = aiReportContent?.querySelector('.report-exec-box');
            if (execBox && aiGeneratedSections.executiveSummary) {
                const rawHtml = aiGeneratedSections.executiveSummary;
                const paragraphs = rawHtml.match(/<p[\s\S]*?<\/p>/g) || [rawHtml];
                execBox.innerHTML = '<span class="ai-typing-cursor">▌ AI가 데이터를 분석하여 요약 문장을 작성하고 있습니다...</span>';
                for (let i = 0; i < paragraphs.length; i++) {
                    await sleep(100);
                    const p = document.createElement('div');
                    p.className = 'ai-streamed-p';
                    p.innerHTML = paragraphs[i];
                    const cur = execBox.querySelector('.ai-typing-cursor');
                    if (cur) execBox.insertBefore(p, cur);
                    else execBox.appendChild(p);
                }
                const cur = execBox.querySelector('.ai-typing-cursor');
                if (cur) cur.remove();
            }
        }

        showToast('🎉 <strong>AI 자동 보고서 작성 완료!</strong> [🖨️ 인쇄 / PDF 저장] 버튼을 누르면 A4 규격으로 출력 및 보관하실 수 있습니다.');
    } catch (err) {
        console.error('AI 보고서 작성 실패:', err);
        showToast('⚠️ AI 보고서 작성 중 예외가 발생했습니다: ' + (err.message || err));
    } finally {
        setTimeout(() => {
            if (aiGenerationProgress) aiGenerationProgress.style.display = 'none';
        }, 1200);
    }
}

/**
 * 내장 고성능 AI 분석 보고서 생성 엔진
 */
export function buildBuiltinAIReport(ctx = {}) {
    const {
        type = 'business',
        tone = 'formal',
        xColName = '항목',
        yColName = '값',
        count = 1,
        sum = 0,
        mean = 0,
        median = 0,
        min = 0,
        max = 0,
        range = (max - min),
        stddev = 0,
        cv = 0,
        top1 = { label: '우수 항목', value: 0 },
        top2 = { label: '상위 항목 2', value: 0 },
        top3 = { label: '상위 항목 3', value: 0 },
        bottom1 = { label: '하위 항목', value: 0 },
        bottom2 = { label: '하위 항목 2', value: 0 },
        top20Count = 1,
        top20Sum = 0,
        top20Share = '0',
        top1Share = '0',
        top3Share = '0',
        topBottomRatio = '1.0',
        outliers = [],
        highOutliers = [],
        lowOutliers = [],
        q1 = 0,
        q3 = 0,
        iqr = 1,
        upperLimit = (q3 + 1.5 * iqr),
        lowerLimit = (q1 - 1.5 * iqr),
        sortedDesc = [],
        multiColAnalysis = null,
        fileName = '데이터 세트'
    } = ctx;

    const isSales = /매출|수익|판매|수주|금액|sales|revenue|income/i.test(yColName);
    const isCost = /비용|원가|지출|cost|expense|spending/i.test(yColName);
    const isProfit = /이익|순익|영업이익|마진|profit|margin/i.test(yColName);
    const isScore = /점수|평가|만족도|score|rate|grade/i.test(yColName);
    const isVolume = /수량|건수|인원|트래픽|방문|traffic|volume|count/i.test(yColName);

    let domainDesc = '수치 성과';
    if (isSales) domainDesc = '매출 실적';
    else if (isCost) domainDesc = '비용 및 원가 지출';
    else if (isProfit) domainDesc = '수익성 및 영업이익';
    else if (isScore) domainDesc = '품질 및 만족도 평가 지수';
    else if (isVolume) domainDesc = '물동량 및 유입 규모';

    let title = `[AI 정밀 진단] ${xColName}별 ${yColName} 종합 분석 및 전략 인사이트 보고서`;
    let subtitle = `데이터 기반 의사결정 지원을 위한 ${count}개 개체 실적 평가 및 이상치 검증 요약`;

    let executiveSummary = '';
    let recommendations = [];

    const calcTop3Ratio = (sum > 0 && top3Share !== '0') ? top3Share : (sortedDesc && sortedDesc.length >= 3 && sum > 0 ? ((sortedDesc.slice(0, 3).reduce((a, b) => a + b.value, 0) / sum) * 100).toFixed(1) : '0');

    if (type === 'statistical') {
        title = `[통계 심층 정밀 진단] ${yColName}의 공간적 분포 특성 및 통계적 유의성 검정 보고서`;
        subtitle = `1.5×IQR 이상치 다면 검증, 사분위수(IQR) 산포 구조, 변동계수(CV) 및 정규성 정량 평가`;
        executiveSummary = `
            <p><strong>1. 표본 중심 경향성 및 비대칭도(Skewness) 정량 진단:</strong> 본 정밀 통계 보고서는 <strong>${fileName}</strong> 데이터셋(${count}개 ${xColName})의 <strong>${yColName}</strong> 지표를 대상으로 기술통계 및 사분위수 분포를 정밀 분석한 결과입니다. 표본 전체 합계는 <strong>${fmt(sum)}</strong>, 산술평균은 <strong>${fmt(Math.round(mean))}</strong>, 중앙값(Median)은 <strong>${fmt(Math.round(median))}</strong>으로 산출되었습니다. 산술평균과 중앙값의 절대 편차는 <strong>${fmt(Math.abs(Math.round(mean - median)))}</strong>(평균 대비 약 ${mean > 0 ? (Math.abs(mean - median) / mean * 100).toFixed(1) : 0}%) 수준으로, 상위 일부 극단치에 의해 평균이 견인되는 ${mean > median ? '우측 꼬리 비대칭(Positive Skewness)' : '좌측 꼬리 비대칭(Negative Skewness)'} 분포 형태를 명확히 보여줍니다.</p>
            <p><strong>2. 산포도 및 사분위수 범위(IQR) 정밀 구간 분석:</strong> 전체 표본의 1사분위수(Q1, 하위 25%)는 <strong>${fmt(Math.round(q1))}</strong>, 3사분위수(Q3, 상위 25%)는 <strong>${fmt(Math.round(q3))}</strong>으로 측정되었으며, 중간 50% 개체가 밀집된 사분위범위(IQR)는 <strong>${fmt(Math.round(iqr))}</strong>입니다. 한편 표본 표준편차(StdDev)는 <strong>${fmt(Math.round(stddev))}</strong>, 변동계수(CV)는 <strong>${cv.toFixed(1)}%</strong>를 기록하여 데이터의 상대적 산포도와 분산 불안정성을 나타냅니다. 전체 ${count}개 개체 중 상위 3개([${top1.label}], [${top2.label}], [${top3.label}])가 차지하는 비중은 전체의 <strong>${calcTop3Ratio}%</strong>에 이릅니다.</p>
            <p><strong>3. 1.5×IQR Tukey 이상치(Outlier) 검증 결과:</strong> 통계적 이상치 판정 경계선(하한 LCL: ${fmt(Math.max(0, Math.round(lowerLimit)))}, 상한 UCL: ${fmt(Math.round(upperLimit))})을 적용한 결과, 유효 범위를 이탈한 특이 이상치(Anomaly)가 총 <strong>${outliers.length}건</strong>(고위험 이상치: ${highOutliers.length}건, 저위험 이상치: ${lowOutliers.length}건) 검출되었습니다. 이들 이상치는 표본 전체의 모수 추정치를 유의미하게 왜곡시킬 수 있으므로, 단순 평균 의존에서 탈피하여 절사평균 및 중앙값 기반의 이원화된 통계 관리가 요구됩니다.</p>
            <p><strong>4. 통계적 신뢰도 확보를 위한 결론 및 통제 지침:</strong> 현 데이터 구조는 전형적인 실적 중심의 멱법칙(Power Law) 및 롱테일 구조를 띠고 있습니다. 분석 오차와 왜곡을 최소화하기 위해 1.5×IQR 신뢰구간을 상시 모니터링 관리선으로 지정하고, 데이터 품질 거버넌스 프로세스를 수립할 것을 제언합니다.</p>
        `;
        recommendations = [
            {
                title: `통계적 관리 한계선(UCL: ${fmt(Math.round(upperLimit))} / LCL) 기반 3σ 이상 징후 자동 알림 체계 구축`,
                desc: `사분위수 기반 정상 신뢰구간을 상시 통계 관리선으로 시스템에 고정하고, 한계선을 벗어나는 특이치 발생 시 담당 분석관 및 관리자에게 실시간 알림을 발송하도록 자동화하십시오.`
            },
            {
                title: `평균-중앙값 괴리 보정을 위한 5% 절사평균(Trimmed Mean) 및 M-추정량 병행 활용`,
                desc: `산술평균(${fmt(Math.round(mean))})과 중앙값(${fmt(Math.round(median))}) 간 유의미한 괴리가 존재하므로, 상·하위 5% 극단치를 조정한 절사평균을 공식 보고 보조 지표로 승인하여 왜곡을 원천 차단하십시오.`
            },
            {
                title: `시계열 누적 데이터 축적에 따른 변동계수(CV ${cv.toFixed(1)}%) 안정성 추이 트래킹`,
                desc: `정기적 데이터 업데이트 주기마다 변동계수의 시간적 변화율(ΔCV)을 모니터링하여, 프로세스나 시장 환경의 내재적 변동 위험도를 나타내는 '통계적 공정 안정성 지수(Stability Index)'를 산출하십시오.`
            },
            {
                title: `이상치 ${outliers.length}건에 대한 단독 표적 정밀 데이터 실사(Deep-Dive Audit) 수행`,
                desc: `검출된 대표 이상치 [${top1.label}](${fmt(top1.value)}) 등을 포함한 이상치 목록에 대해 입력 오류, 계절적 스파이크, 또는 구조적 독점 요인인지 원인을 명확히 규명하여 데이터베이스 주석으로 관리하십시오.`
            },
            {
                title: `3D 공간 밀도 렌더링을 활용한 다변량 클러스터링(군집 분석) 체계 정착`,
                desc: `단일 지표 분석을 넘어 관련 수치 열들과의 3D 공간 산점도 매핑을 정례화하여, 유사 통계 행동을 보이는 하위 세부 군집(Micro-Clusters)을 자동으로 분류하십시오.`
            }
        ];
    } else if (type === 'risk') {
        title = `[전사적 리스크 정밀 진단] ${yColName} 편차 및 변동 위험 관리 전략 브리핑`;
        subtitle = `상·하위 실적 격차(${topBottomRatio}배) 완화 및 극단치 개체 집중 리스크 모니터링`;
        executiveSummary = `
            <p><strong>1. 핵심 포트폴리오 편중도 및 단일 장애점(SPOF) 리스크 진단:</strong> 본 리스크 평가 보고서는 <strong>${fileName}</strong> 내 <strong>${yColName}</strong>의 구조적 불균형과 변동성으로 인한 비즈니스 취약성을 심층 분석한 문서입니다. 최상위 1위 개체 <strong>[${top1.label}]</strong>의 단독 실적은 <strong>${fmt(top1.value)}</strong>로 전체의 <strong>${top1Share}%</strong>를 독점하고 있으며, 상위 3개 개체 합산 비중은 <strong>${calcTop3Ratio}%</strong>에 이릅니다. 이는 핵심 거래처나 특정 품목 1~2곳에 전사 실적이 종속된 전형적인 집중 리스크(Concentration Risk) 상태입니다.</p>
            <p><strong>2. 극단치 이상치 및 상·하위 스프레드 격차 분석:</strong> 최상위와 최하위 개체 간 스프레드 배율은 <strong>${topBottomRatio}배</strong>(절대 격차: ${fmt(range)})에 달하며, 1.5×IQR 통계 기준치를 벗어나는 고위험 이상치가 <strong>${outliers.length}건</strong> 포착되었습니다. 이러한 극심한 격차는 하위 개체들의 자원 고갈과 수익성 악화를 유발하며, 시장 상황 악화 시 상위 개체의 실적이 단 10%만 감소해도 조직 전체에 치명적인 충격을 줄 수 있는 구조입니다.</p>
            <p><strong>3. 변동계수(CV ${cv.toFixed(1)}%) 기반 다운사이드 리스크 평가:</strong> 변동계수가 ${cv.toFixed(1)}%로 매우 높은 수준을 기록하고 있어 실적의 예측 가능성이 크게 떨어지고 있습니다. 외부 거시경제 충격이나 규제 변화 발생 시 하방 변동성(Downside Risk)이 급격히 확대될 수 있으므로, 조기 경보 및 자원 안전망 구축이 시급합니다.</p>
            <p><strong>4. 종합 비상 대응 가이드라인:</strong> 상위 집중도를 전략적으로 분산시키고, 하위 한계 개체의 누적 손실을 선제 차단하기 위한 5대 위기관리 실행안을 권고합니다.</p>
        `;
        recommendations = [
            {
                title: `최상위 개체 [${top1.label}] 단일 의존도 분산 및 포트폴리오 다변화 플랜 가동`,
                desc: `단일 항목 비중(${top1Share}%)을 차기 분기까지 5%p 이상 하향 분산시키기 위해 2~5위 중위권 차세대 후보군에 영업·마케팅 예산을 전략적으로 우선 배분하십시오.`
            },
            {
                title: `하위 10% 한계 부진군 대상 조기 경보 시스템(EWS: Early Warning System) 즉시 가동`,
                desc: `최하위 실적군([${bottom1.label}] 등)의 고정비 및 운영 손실을 전수 조사하고, 손익분기 한계선(BEP)을 미달하는 개체에 대해 60일 내 개선 또는 구조조정(PIP)을 단행하십시오.`
            },
            {
                title: `변동성(CV ${cv.toFixed(1)}%) 완화를 위한 분기별 리스크 버퍼(Buffer) 예산 편성`,
                desc: `불확실성 지수가 높은 특성을 고려하여, 핵심 지표 하락 시 즉시 투입 가능한 비상 유동성 및 완충 예산을 사전에 확보하십시오.`
            },
            {
                title: `1.5×IQR 이상치 ${outliers.length}건에 대한 상시 스트레스 테스트(Stress Testing) 실시`,
                desc: `상위 극단치 개체의 실적이 -20%, -40% 급락할 때 전사 손익에 미치는 영향을 시나리오별로 모의 분석하고 매뉴얼화하십시오.`
            },
            {
                title: `3D 공간 레이캐스팅 기반 실시간 이상 징후 모니터링 대시보드 운영`,
                desc: `월간 회의 시 3D 시각화 도구를 활용하여 비정상적으로 급증하거나 급락하는 메쉬 개체를 직관적으로 식별하고 현장 조치를 즉시 지시하십시오.`
            }
        ];
    } else if (type === 'summary') {
        title = `[C-Level 최고경영진 핵심 브리핑] ${xColName} × ${yColName} 3대 핵심 경영 지표 요약`;
        subtitle = `신속한 최고 의사결정을 위한 5대 핵심 팩트, 전략적 시사점 및 즉시 실행 과제`;
        executiveSummary = `
            <p><strong>[1. 총괄 실적 및 규모]</strong> 분석 대상 <strong>${count.toLocaleString()}개</strong> ${xColName}의 ${yColName} 총 실적은 <strong>${fmt(sum)}</strong>이며, 개체당 평균 실적은 <strong>${fmt(Math.round(mean))}</strong>, 중앙값은 <strong>${fmt(Math.round(median))}</strong>을 기록하였습니다.</p>
            <p><strong>[2. 핵심 견인축과 파레토 구조]</strong> 상위 20% 핵심 개체가 전체 실적의 <strong>${top20Share}%</strong>를 주도하고 있으며, 1위 <strong>[${top1.label}]</strong>(${fmt(top1.value)}, 점유율 ${top1Share}%)과 상위 3개사 비중이 <strong>${calcTop3Ratio}%</strong>를 형성하여 전사 실적을 견인 중입니다.</p>
            <p><strong>[3. 구조적 격차 및 이상치 이슈]</strong> 최고와 최저의 격차는 <strong>${topBottomRatio}배</strong>에 달하며, 1.5×IQR 기준 통계적 이상치는 <strong>${outliers.length}건</strong>, 변동계수는 <strong>${cv.toFixed(1)}%</strong>로 안정적 관리가 필요한 상태입니다.</p>
            <p><strong>[4. 최고경영진 의사결정 권고]</strong> 상위 성공 DNA를 중위권으로 신속 복제하여 성장 허리를 강화하고, 부진 하위 개체의 자원을 고성과 영역으로 재배치하는 결단이 요구됩니다.</p>
        `;
        recommendations = [
            {
                title: `상위 20% 핵심 캐시카우 그룹에 대한 전사 핵심 자원 우선 투입`,
                desc: `성과 견인력이 확실히 입증된 Top 3 항목([${top1.label}] 등 합계 ${calcTop3Ratio}%)에 전사 R&D와 자원을 우선 집중하여 초격차를 공고히 하십시오.`
            },
            {
                title: `중위권 잠재 개체 선별 육성을 통한 차세대 성장 축 육성`,
                desc: `중앙값(${fmt(Math.round(median))}) 부근의 중위권 항목 실적을 10%만 견인해도 전체 총합 대비 약 2.5배 이상의 강력한 레버리지 효과가 창출됩니다.`
            },
            {
                title: `하위 부진군에 투입되는 가변 비용 긴급 동결 및 재평가`,
                desc: `성과 하위 10% 개체의 비효율 자원을 회수하여 고수익 파이프라인으로 전환 배치하십시오.`
            },
            {
                title: `주간 3D 데이터 시각화 기반 One-Click Executive Dashboard 도입`,
                desc: `데이터 업데이트 시마다 AI 요약 브리핑을 이사회 및 임원 회의의 표준 리포트로 활용하여 보고 준비 시간을 80% 단축하십시오.`
            }
        ];
    } else if (type === 'performance') {
        title = `[성과 평가 & 랭킹] ${xColName}별 ${yColName} 벤치마킹 및 기여도 평가 보고서`;
        subtitle = `상위 챔피언 식별 및 전체 ${count}개 개체 상대 성과(Relative Rank) 평가`;
        executiveSummary = `
            <p><strong>1. 전체 성과 포트폴리오 개요:</strong> 본 성과 평가 보고서는 전체 <strong>${count}개</strong> ${xColName}의 <strong>${yColName}</strong> 달성 실적을 다각도로 벤치마킹하고 객관적 상대 순위를 매긴 성과 분석서입니다. 총 성과 규모는 <strong>${fmt(sum)}</strong>이며, 개체별 평균 성과는 <strong>${fmt(Math.round(mean))}</strong>, 중간 순위 기준 실적(중앙값)은 <strong>${fmt(Math.round(median))}</strong>입니다.</p>
            <p><strong>2. 상위 챔피언 리그 분석 (Tier 1 그룹):</strong> 영예의 1위 챔피언은 <strong>[${top1.label}]</strong> 항목으로 실적 <strong>${fmt(top1.value)}</strong>(점유율 ${top1Share}%)을 달성하여 압도적인 기여도를 입증했습니다. 이어 2위 [${top2.label}](${fmt(top2.value)}), 3위 [${top3.label}](${fmt(top3.value)})까지 상위 3개 항목이 전체의 <strong>${calcTop3Ratio}%</strong>를 견인하고 있으며, 상위 20% 그룹 전체로는 전체의 <strong>${top20Share}%</strong>를 차지하고 있습니다.</p>
            <p><strong>3. 중위권 및 하위권 리그 격차 (Tier 2 vs Tier 3):</strong> 반면 최하위권은 <strong>[${bottom1.label}](${fmt(bottom1.value)})</strong> 등으로 상위권 대비 <strong>${topBottomRatio}배</strong>의 심각한 실적 스프레드를 보이고 있습니다. 이는 동일한 자원 투입 대비 산출물의 생산성 격차가 심화되고 있음을 보여주며, 체계적인 벤치마킹과 역량 전수가 필요합니다.</p>
            <p><strong>4. 성과 향상을 위한 단계적 성장 로드맵:</strong> 챔피언의 성공 방식을 공식 지식 자산으로 표준화하고, 중위권 개체의 상향 평준화를 유도하기 위한 성과 평가 및 보상 연계 체계를 제언합니다.</p>
        `;
        recommendations = [
            {
                title: `챔피언 [${top1.label}]의 핵심 역량 매뉴얼화 및 사내 베스트 프랙티스 공유`,
                desc: `압도적 성과를 낸 상위권의 성공 요인(영업 채널, 마케팅 전략, 품질 관리 등)을 분석하여 전사 표준 가이드북으로 제작하고 워크숍을 정례화하십시오.`
            },
            {
                title: `중위권 그룹(Rank 20~50%) 대상 단계별 도약(Tier-Up) 인센티브 신설`,
                desc: `평균치 이상으로 성장 가능한 잠재 항목에 대해 타겟 달성형 차등 보상 체계를 적용하여 자발적 성장 동기를 부여하십시오.`
            },
            {
                title: `부진 하위 10% 개체 맞춤형 역량 보강 및 컨설팅 지원 (PIP 도입)`,
                desc: `최하위 그룹의 병목 요인을 진단하고, 90일 개선 계획 수립(Performance Improvement Plan)을 통해 하방 실적을 끌어올리십시오.`
            },
            {
                title: `상대 성과 순위 지표의 분기별 동적 3D 모니터링 체계 수립`,
                desc: `월간 단위로 순위 변동 추이를 3D 애니메이션 타임라인으로 추적하여 실적 급등/급락 개체에 즉각적인 피드백을 제공하십시오.`
            }
        ];
    } else if (type === 'distribution') {
        title = `[데이터 분포 구조] ${yColName} 공간 분포 및 사분위수(IQR) 정밀 진단서`;
        subtitle = `Q1~Q3 중위 밀집 구간 분석, 왜곡도 평가 및 통계적 안정성 검증`;
        executiveSummary = `
            <p><strong>1. 데이터 중심 밀집 구조 및 대칭성:</strong> 본 구조 분석서는 <strong>${fileName}</strong> 내 <strong>${yColName}</strong>의 분포 밀도와 분산 형태를 정밀 진단한 리포트입니다. 중앙값(Median) <strong>${fmt(Math.round(median))}</strong>을 기점으로 25% 지점(Q1)은 <strong>${fmt(Math.round(q1))}</strong>, 75% 지점(Q3)은 <strong>${fmt(Math.round(q3))}</strong>으로 측정되었습니다.</p>
            <p><strong>2. 사분위범위(IQR) 기반 50% 핵심 구간:</strong> 핵심 50% 구간의 너비를 나타내는 사분위범위(IQR)는 <strong>${fmt(Math.round(iqr))}</strong>이며, 이는 개체들의 과반수가 이 좁은 밴드에 집중되어 있음을 증명합니다. 산술평균(${fmt(Math.round(mean))})과 중앙값의 위치 관계는 데이터가 상위권 일부 개체에 의해 크게 견인되는 우측 편향 분포임을 나타냅니다.</p>
            <p><strong>3. 꼬리 분포(Tail Distribution) 및 이상치:</strong> 정상 신뢰구간([${fmt(Math.max(0, Math.round(lowerLimit)))} ~ ${fmt(Math.round(upperLimit))}])을 벗어난 이상치는 총 <strong>${outliers.length}건</strong>으로, 상위 꼬리 영역의 개체들이 전체 볼륨 합계(${fmt(sum)}) 형성에 지대한 영향을 미치고 있습니다.</p>
            <p><strong>4. 분포 안정성 평가 결론:</strong> 전반적인 데이터셋의 구조적 건전성을 유지하기 위해 표준 밴드 기준 수립과 극단치 관리 방안을 권고합니다.</p>
        `;
        recommendations = [
            {
                title: `중간 50%(Q1: ${fmt(Math.round(q1))} ~ Q3: ${fmt(Math.round(q3))}) 구간을 실무 기본 표준 벤치마크로 설정`,
                desc: `대다수 정상 개체가 위치한 이 구간을 차기 목표 산정의 기본 베이스라인(Baseline)으로 삼으십시오.`
            },
            {
                title: `상위 극단 이상치(${highOutliers.length}건)의 독립적 특수 관리 파이프라인 분리`,
                desc: `일반 데이터와 성격이 완전히 다른 상위 극단 개체들을 별도 VIP/전략 카테고리로 분리하여 맞춤 관리하십시오.`
            },
            {
                title: `하위 25% 미달 개체의 사분위 이동(Q1 탈출) 집중 지원`,
                desc: `하위 구간에 머물러 있는 항목들이 Q1 상단으로 진입할 수 있도록 기초 역량 지원 패키지를 제공하십시오.`
            },
            {
                title: `시계열 사분위수 밴드 이동 추적을 통한 시장 변화 선제 감지`,
                desc: `IQR 밴드가 상향 또는 하향으로 이동하는 트렌드를 감지하여 업계 및 시장 트렌드 변화에 선제 대응하십시오.`
            }
        ];
    } else if (type === 'forecast') {
        title = `[성장 시나리오 예측] ${yColName} 기반 미래 성장 모멘텀 및 잠재력 예측서`;
        subtitle = `추세 추정 및 낙관·기준·보수 시나리오 기반 중장기 기대 효과 분석`;
        executiveSummary = `
            <p><strong>1. 과거 실적 기반 성장 모멘텀 분석:</strong> 본 성장 시나리오 보고서는 현 데이터셋의 실적 합계 <strong>${fmt(sum)}</strong> 및 상위 집중 모멘텀을 기초로 향후 비즈니스 성장 잠재력을 3가지 시나리오로 투영한 미래 예측서입니다. 현재 개체당 평균은 <strong>${fmt(Math.round(mean))}</strong>이며, 상위 20% 핵심 개체가 전체 실적의 <strong>${top20Share}%</strong>를 주도하고 있습니다.</p>
            <p><strong>2. 3대 미래 예측 시나리오(Best, Base, Conservative):</strong> 
            <br>• <strong>낙관 시나리오(+25% 성장):</strong> 최상위 챔피언 [${top1.label}]의 확장 모멘텀이 유지되고 중위권이 15% 성장할 경우 예상 실적은 <strong>${fmt(Math.round(sum * 1.25))}</strong>에 달할 것으로 추정됩니다.
            <br>• <strong>기준 시나리오(+10% 안정 성장):</strong> 현행 파레토 비율이 유지되는 정상 궤도에서는 약 <strong>${fmt(Math.round(sum * 1.10))}</strong> 수준의 완만한 성장이 전망됩니다.
            <br>• <strong>보수 시나리오(-5% 하방 리스크):</strong> 거시경제 둔화나 최상위 개체의 실적 정체 발생 시 예상 실적은 <strong>${fmt(Math.round(sum * 0.95))}</strong>로 하락할 수 있습니다.</p>
            <p><strong>3. 하방 위험과 상방 기회의 균형:</strong> 상·하위 격차(${topBottomRatio}배)가 방치될 경우 성장 한계에 봉착할 위험이 존재하므로, 시장 지배력 극대화와 리스크 헤징을 병행하는 체계적 시나리오별 대응 전략을 제시합니다.</p>
        `;
        recommendations = [
            {
                title: `[낙관 시나리오 실행] 최상위 [${top1.label}] 모멘텀 극대화로 +25% 추가 성장 견인`,
                desc: `1위 품목/조직에 대한 신규 마케팅과 인프라를 전폭 지원하여 전체 시장 점유율을 비약적으로 확대하십시오.`
            },
            {
                title: `[기준 시나리오 실행] 중위권 개체의 상향 평준화를 통한 건전한 +10% 성장 달성`,
                desc: `중앙값(${fmt(Math.round(median))}) 부근의 중위권 항목 실적을 10% 개선하여 하방 변동성에 흔들리지 않는 튼튼한 허리 라인을 구축하십시오.`
            },
            {
                title: `[보수 시나리오 대비] 하위권 리스크 사전 헤징 및 한계 손실 -5% 이하 억제`,
                desc: `시장 급변 시 부진 개체에 투입되는 가변 비용을 즉시 축소할 수 있는 단계별 비상 플랜을 선제 마련하십시오.`
            },
            {
                title: `타임라인 시계열 플레이어를 활용한 분기별 목표 진도율 실시간 점검`,
                desc: `타임슬라이더 도구를 활용하여 각 시점별 목표치 대비 실제 달성률의 오차를 매월 시각적으로 검증하십시오.`
            }
        ];
    } else if (type === 'efficiency') {
        title = `[자원 최적화 감사] ${xColName}별 ${yColName} 투입 대비 산출 효율성 극대화 보고서`;
        subtitle = `롱테일(Long Tail) 비효율 제거 및 고수익·고효율 포트폴리오 재배치 방안`;
        executiveSummary = `
            <p><strong>1. 투입 자원 대비 산출 성과 현황:</strong> 본 자원 최적화 감사 보고서는 한정된 경영 자원의 투입 대비 성과 창출 효율성을 정밀 점검한 감사 리포트입니다. 총 <strong>${count}개</strong> 개체 중 상위 <strong>${top20Count}개(20%)</strong>가 전체 성과의 <strong>${top20Share}%</strong>를 만들어내고 있는 반면, 하위 50% 개체의 성과 기여도는 극히 미미한 전형적인 롱테일(Long Tail) 비효율 구조를 보입니다.</p>
            <p><strong>2. 롱테일 비효율성 및 ROI 잠식 진단:</strong> 최하위 개체 <strong>[${bottom1.label}](${fmt(bottom1.value)})</strong>를 비롯한 하위 부진군에 유지비, 운영 인력, 마케팅 자원이 관행적으로 지속 투입되고 있다면 이는 전사 한계 생산성과 영업이익률을 갉아먹는 주원인입니다. 최고와 최저의 스프레드는 무려 <strong>${topBottomRatio}배</strong>에 달합니다.</p>
            <p><strong>3. 자원 재배치(Reallocation) 잠재 가치:</strong> 본 감사를 통해 저효율 부문을 과감히 축소하고 고성과 핵심 개체로 자원을 재배치함으로써 전사 자원 회수율(ROI)을 20% 이상 극대화할 수 있습니다.</p>
            <p><strong>4. 최적화 실행 결론:</strong> 자원 배분의 투명성과 효율성을 회복하기 위한 5대 감사 권고안을 제시합니다.</p>
        `;
        recommendations = [
            {
                title: `고성과 챔피언 개체군([${top1.label}] 등)으로의 전략적 자원 재배치(Reallocation)`,
                desc: `투자 대비 성과가 확실한 상위 핵심 개체군에 예산과 인력을 집중 재투자하여 한계 생산성을 극대화하십시오.`
            },
            {
                title: `하위 20% 저효율 개체 통폐합 및 고정 운영 비용 절감`,
                desc: `기여도가 낮은 하위 20% 개체에 대해 서비스 통폐합, 생산 축소, 아웃소싱 등을 검토하여 연간 고정비를 절감하십시오.`
            },
            {
                title: `객관적 통계 지표 기반 자원 할당 공식(Resource Allocation Rule) 수립`,
                desc: `주관적 판단이 아닌 3D 및 2D 통계 지표에 근거하여 분기별 자원 배분을 객관적으로 결정하는 시스템을 정착시키십시오.`
            },
            {
                title: `단위 자원당 산출량(KPI per Cost) 실시간 모니터링 시스템 구축`,
                desc: `각 개체별 투입 비용 대비 성과 비율을 월간 단위로 추적하여 비효율 발생 시 즉시 조치하십시오.`
            }
        ];
    } else if (type === 'action_plan') {
        title = `[실무 액션 플랜] ${xColName} × ${yColName} 실행 과제 및 단계별 KPI 로드맵`;
        subtitle = `즉시 착수 과제(Quick Wins)부터 중장기 체질 개선까지 3단계 실행 가이드`;
        executiveSummary = `
            <p><strong>1. 액션 플랜 수립 배경 및 데이터 현황:</strong> 본 실무 액션 플랜은 <strong>${fileName}</strong>의 분석 결과를 실제 업무 현장에 즉각 적용하기 위한 실천형 실행 로드맵입니다. 분석 지표 <strong>${yColName}</strong>의 전체 규모 <strong>${fmt(sum)}</strong>, 평균 <strong>${fmt(Math.round(mean))}</strong>, 상위 20% 점유율 <strong>${top20Share}%</strong>를 바탕으로 부서별/개체별 즉각적인 조치 과제를 단계별로 정의하였습니다.</p>
            <p><strong>2. 3단계 로드맵 구성(단기-중기-장기):</strong>
            <br>• <strong>1단계(Day 1~30, Quick-Wins):</strong> 최상위 [${top1.label}]의 성공 요인 매뉴얼화 및 특이 이상치(${outliers.length}건) 현장 원인 실사.
            <br>• <strong>2단계(Day 31~90, Acceleration):</strong> 중간 순위 잠재 개체들을 위한 맞춤 마케팅 및 운영 지원, 하위권 PIP 적용.
            <br>• <strong>3단계(Day 91+, Transformation):</strong> 3D 공간 시각화 기반의 전사 실시간 데이터 거버넌스 및 성과 관리 시스템 안착.</p>
            <p><strong>3. 기대 효과 및 실행 다짐:</strong> 상위권의 성공 DNA 확산과 하위권의 병목 해소를 통해 전체 성과 규모의 15% 이상 지속 가능한 성장을 달성할 것을 확신합니다.</p>
        `;
        recommendations = [
            {
                title: `[Phase 1: 1~30일] Quick-Wins — 최상위 성공 사례 벤치마킹 및 공유`,
                desc: `[${top1.label}]의 성과 요인을 매뉴얼화하고, 하위 부진 개체에 대한 긴급 현장 인터뷰를 실시하여 즉시 개선 가능한 단기 조치를 단행하십시오.`
            },
            {
                title: `[Phase 2: 30~90일] 중위권 전담 지원 TF 구성 및 타겟 KPI 부여`,
                desc: `성장 잠재력이 높은 중간 순위 개체들을 선별하여 전담 멘토링과 마케팅 예산을 우선 지원하고 달성률을 매주 점검하십시오.`
            },
            {
                title: `[Phase 3: 90일 이후] 본 시스템을 통한 실시간 데이터 거버넌스 완성`,
                desc: `CSV/엑셀 데이터 업데이트와 3D 시각화 보고서 자동 출력을 정기 주간 회의 프로세스로 제도화하여 경영 판단 속도를 3배 가속화하십시오.`
            },
            {
                title: `이상치 및 리스크 요인에 대한 지속적 피드백 루프 구축`,
                desc: `월별 실적 집계 시 이상치 판정 알고리즘을 상시 실행하여 조기 경보가 실무에 즉시 반영되도록 하십시오.`
            }
        ];
    } else {
        // 기본 종합 경영 보고서 (business)
        title = `[종합 경영 전략] ${xColName}별 ${yColName} 심층 분석 및 비즈니스 인텔리전스 보고서`;
        subtitle = `데이터 기반 의사결정 지원을 위한 ${count}개 개체 실적 평가, 파레토 집중도 및 이상치 검증 요약`;
        executiveSummary = `
            <p><strong>1. 종합 경영 성과 총괄 브리핑:</strong> 본 보고서는 <strong>${fileName}</strong> 데이터셋의 총 <strong>${count.toLocaleString()}개</strong> ${xColName} 항목을 대상으로, <strong>${yColName}</strong> 지표를 3D 공간 모델링 및 다변량 통계 기법으로 정밀 교차 검증한 종합 경영 분석서입니다. 전체 실적 합계는 <strong>${fmt(sum)}</strong>이며, 개체당 평균 실적은 <strong>${fmt(Math.round(mean))}</strong>, 중앙값(Median)은 <strong>${fmt(Math.round(median))}</strong>으로 집계되었습니다. 산술평균과 중앙값 간의 편차는 <strong>${fmt(Math.abs(Math.round(mean - median)))}</strong> 수준으로, 상위 일부 품목에 의해 전체 평균이 견인되는 구조를 명확히 드러냅니다.</p>
            <p><strong>2. 파레토 80/20 집중도 및 핵심 성장 엔진:</strong> 파레토 분석 결과, 상위 <strong>${top20Count}개(20%)</strong> 핵심 항목이 전체 성과의 <strong>${top20Share}%</strong>를 견인하고 있어 매우 강력한 성장 모멘텀을 형성하고 있습니다. 특히 1위 챔피언 항목인 <strong>[${top1.label}]</strong>의 단독 실적은 <strong>${fmt(top1.value)}</strong>(점유율 ${top1Share}%)에 달하며, 상위 3개사([${top1.label}], [${top2.label}], [${top3.label}])의 합산 비중은 <strong>${calcTop3Ratio}%</strong>를 차지하고 있습니다. 이들 핵심 상위 항목의 안정적 실적 방어와 지속적인 자원 투자가 조직 전체의 성패를 가르는 핵심 척도입니다.</p>
            <p><strong>3. 상·하위 격차 스프레드 및 리스크 진단:</strong> 반면 최하위 개체 <strong>[${bottom1.label}](${fmt(bottom1.value)})</strong>를 비롯한 하위권 그룹과의 스프레드 배율은 <strong>${topBottomRatio}배</strong>(격차: ${fmt(range)})에 달해 심각한 실적 양극화가 관찰됩니다. 변동계수(CV)는 <strong>${cv.toFixed(1)}%</strong>로 비교적 높은 변동성을 나타내며, 1.5×IQR 판정 기준을 벗어난 통계적 이상치(Anomaly)가 총 <strong>${outliers.length}건</strong> 포착되었습니다. 이러한 편중성은 상위 거래선 변동 시 전사 손익이 급변할 수 있는 구조적 취약점을 내포합니다.</p>
            <p><strong>4. 다변량 상관 분석 및 전략적 제언 요약:</strong> ${multiColAnalysis ? `연계된 다른 수치 지표(${multiColAnalysis.names.slice(0, 3).join(', ')})와의 종합적 교차 분석 결과, 단순 단일 지표 성장뿐 아니라 전사적 시너지 창출이 가능한 전략적 레버리지 포인트가 확인되었습니다.` : '단일 지표의 단기적 성과 극대화와 더불어 장기적 리스크 완화를 위한 균형 잡힌 접근이 필요합니다.'} 이를 바탕으로 고성과 개체의 모범 사례 확산, 중위권 잠재 성장군 육성, 하위권 한계 개체 정리를 포함한 5대 핵심 비즈니스 실행 과제를 제언합니다.</p>
        `;

        recommendations = [
            {
                title: `고성과 우수 챔피언 [${top1.label}]의 성공 모범 사례(Best Practice) 전사 확산`,
                desc: `전체 실적의 ${top1Share}%를 달성한 최상위 항목의 핵심 성공 요인(영업 채널, 제품 매력도, 고객 접점 등)을 정밀 분석하고, 이를 표준 가이드라인으로 정립하여 중위권 항목에 전파함으로써 전반적인 실적 상향 평준화를 견인하십시오.`
            },
            {
                title: `중위권 잠재 항목(Rank 20~50%) 집중 지원을 통한 제2의 핵심 성장 엔진 육성`,
                desc: `평균치(${fmt(Math.round(mean))}) 부근에 위치한 중간 그룹 항목들에 선별적 자원과 타겟 마케팅 지원을 투입할 경우, 상위권 추가 확대 대비 최소 비용으로 최대의 전체 실적 증대 레버리지(추정 효과: +12~18%)를 달성할 수 있습니다.`
            },
            {
                title: `하위 10% 한계 개체에 대한 구조조정 및 생산성 개선 계획(PIP) 단행`,
                desc: `최하위군 [${bottom1.label}] 등 성과가 지속 부진한 개체의 원인을 철저히 실사하고, 손익분기점(BEP) 미달 개체에 대해서는 품목 통폐합, 자원 회수, 또는 서비스 전환을 단행하여 고정비 누수를 차단하십시오.`
            },
            {
                title: `1.5×IQR 이상치(${outliers.length}건) 및 변동성(CV ${cv.toFixed(1)}%) 조기 경보 모니터링 가동`,
                desc: `통계적 관리 한계선([${fmt(Math.max(0, Math.round(lowerLimit)))} ~ ${fmt(Math.round(upperLimit))}])을 시스템에 상시 설정하여, 월간 실적 집계 시 급등·급락 이상 징후를 조기에 감지하고 리스크를 선제 통제하십시오.`
            },
            {
                title: `3D 공간 시각화 및 2D 다축 대시보드 기반 전사 데이터 경영 체계 정착`,
                desc: `본 시스템의 3D 공간 시각화와 2D 차트를 정기 경영진 회의의 표준 분석 도구로 채택하여, 직관적이고 객관적인 데이터 기반 의사결정 속도를 기존 대비 3배 이상 가속화하십시오.`
            }
        ];
    }

    // 2. 파레토 진단 (Pareto 80/20 & Concentration Analysis)
    const top20PctRounded = Math.round((top20Count / Math.max(1, count)) * 100);
    const paretoDiagnostic = `
        <p>전체 ${count}개 개체 중 상위 <strong>${top20Count}개(${top20PctRounded}%)</strong> 핵심 항목이 총 ${yColName} 합계의 <strong>${top20Share}%</strong>를 독점 견인하고 있습니다. 상위 3개사([${top1 ? top1.label : ''}], [${top2 ? top2.label : ''}], [${top3 ? top3.label : ''}])의 누적 점유율만 <strong>${calcTop3Ratio}%</strong>에 달합니다.</p>
        <p>${parseFloat(top20Share) >= 70
            ? `⚠️ <strong>초고도 쏠림 구조:</strong> 소수 챔피언에 실적이 극도로 편중된 전형적인 하이퍼 파레토(Hyper-Pareto) 구조입니다. 1위 항목([${top1 ? top1.label : ''}])의 변동 하나가 조직 전체의 실적 지표를 좌우하므로, 단기 실적 방어와 함께 중위권 육성을 통한 포트폴리오 다변화가 절대적으로 시급합니다.`
            : parseFloat(top20Share) >= 50
            ? `📊 <strong>전형적 파레토 구조:</strong> 실적이 상위권에 집중되어 있으면서도 중위권의 허리 라인이 일정 수준 지탱하는 구조입니다. 상위 핵심 개체에는 프리미엄 혜택과 자원을, 중위권에는 추가 성장 유인을 제공하는 이원화 전략이 주효합니다.`
            : `✅ <strong>균등 분산형 구조:</strong> 실적이 특정 상위권에 편중되지 않고 고르게 분산되어 있어, 특정 고객사나 개체의 이탈 충격을 시스템적으로 흡수할 수 있는 우수한 안정성을 확보하고 있습니다.`
        }</p>
    `;

    // 3. 이상치(IQR) 진단 (Tukey's Fences Outlier Deep-Dive)
    let outlierDiagnostic = '';
    const calcLower = lowerLimit !== undefined ? lowerLimit : (q1 - 1.5 * iqr);
    const calcUpper = upperLimit !== undefined ? upperLimit : (q3 + 1.5 * iqr);

    if (outliers && outliers.length > 0) {
        const topOutlier = (highOutliers && highOutliers[0]) ? highOutliers[0] : (outliers[0] || { label: '이상치', value: 0 });
        const outlierRatio = mean > 0 ? (topOutlier.value / mean).toFixed(1) : '1.0';
        const outlierNamesStr = outliers.slice(0, 3).map(o => `[${o.label}]: ${fmt(o.value)}`).join(', ');
        outlierDiagnostic = `
            <p>Tukey의 1.5×IQR 판정 기준([${fmt(Math.max(0, Math.round(calcLower)))} ~ ${fmt(Math.round(calcUpper))}])을 벗어나는 <strong>통계적 이상치(Anomaly) ${outliers.length}건</strong>이 검출되었습니다.</p>
            <p>• <strong>대표 극단값:</strong> <strong>${topOutlier.label}</strong> (${fmt(topOutlier.value)}, 평균 대비 <strong>${outlierRatio}배</strong>)<br>
            • <strong>주요 이상치 개체:</strong> ${outlierNamesStr}${outliers.length > 3 ? ` 외 ${outliers.length - 3}건` : ''}</p>
            <p>이러한 극단치는 단순 산술평균을 비정상적으로 부풀려 착시를 유발할 수 있으므로, 성과 지표 산정 시 중앙값(${fmt(Math.round(median))}) 또는 5% 절사평균을 기준 지표로 병행 검토해야 합니다.</p>
        `;
    } else {
        outlierDiagnostic = `
            <p>1.5×IQR 사분위수 정상 신뢰구간([${fmt(Math.max(0, Math.round(calcLower)))} ~ ${fmt(Math.round(calcUpper))}])을 이탈하는 특이 이상치가 전혀 발견되지 않았습니다.</p>
            <p>모든 데이터 포인트(${count}건)가 정상적인 통계 밴드 내에 균일하게 수렴하고 있어, 데이터의 통계적 정합성과 모수 추정치의 신뢰도가 매우 높게 검증되었습니다.</p>
        `;
    }

    // 4. CV 안정성 진단 (Coefficient of Variation)
    let cvDiagnostic = '';
    if (cv < 25) {
        cvDiagnostic = `
            <p>변동계수(CV)는 <strong>${cv.toFixed(1)}%</strong>로 <strong>'매우 안정적(Highly Stable)'</strong> 등급에 해당합니다.</p>
            <p>항목 간 편차가 극히 적어 전사적 운영 프로세스가 고도로 표준화되어 있으며, 예측 오차가 적어 차기 목표 수립 및 자원 계획의 달성 신뢰도가 95% 이상으로 높게 평가됩니다.</p>
        `;
    } else if (cv <= 50) {
        cvDiagnostic = `
            <p>변동계수(CV)는 <strong>${cv.toFixed(1)}%</strong>로 <strong>'적정 균형(Healthy Dispersion)'</strong> 등급입니다.</p>
            <p>개체별 고유 역량과 시장 환경에 따른 정상적인 실적 편차가 반영된 상태로, 건강한 내부 경쟁과 성장 사다리가 원활히 작동하는 최적의 생태계 분포를 나타냅니다.</p>
        `;
    } else if (cv <= 80) {
        cvDiagnostic = `
            <p>변동계수(CV)는 <strong>${cv.toFixed(1)}%</strong>로 <strong>'변동성 주의(Moderate Risk)'</strong> 수준입니다.</p>
            <p>평균 대비 표준편차(${fmt(Math.round(stddev))})가 상당히 커서 실적의 변동 폭이 넓습니다. 외부 환경 변화에 취약한 하위 개체들의 최소 실적 보증 가이드라인 마련이 요구됩니다.</p>
        `;
    } else {
        cvDiagnostic = `
            <p>변동계수(CV)가 <strong>${cv.toFixed(1)}%</strong>에 달해 <strong>'심각한 양극화(Extreme Disparity)'</strong> 경보 상태입니다.</p>
            <p>상위권과 하위권의 격차가 비정상적으로 벌어져 있어 조직 내 사기 저하 및 자원 낭비가 우려됩니다. 하위권의 병목 원인을 현장 정밀 진단하여 근본적 구조 개선을 단행해야 합니다.</p>
        `;
    }

    // 5. 상하위 스프레드 진단 (Spread & Dispersion Ratio)
    const calcRange = range !== undefined ? range : (max - min);
    const top3Ratio = (sortedDesc && sortedDesc.length >= 3)
        ? ((sortedDesc.slice(0, 3).reduce((a, b) => a + b.value, 0) / (sum || 1)) * 100).toFixed(1)
        : (top1Share || '0');

    const spreadDiagnostic = `
        <p>최고 실적 [<strong>${top1 ? top1.label : '최고'}</strong>](${fmt(top1 ? top1.value : 0)})과 최저 실적 [<strong>${bottom1 ? bottom1.label : '최저'}</strong>](${fmt(bottom1 ? bottom1.value : 0)})의 스프레드 배율은 <strong>${topBottomRatio}배</strong>(절대 격차: <strong>${fmt(calcRange)}</strong>)입니다.</p>
        <p>상위 3개 항목([${top1 ? top1.label : ''}], [${top2 ? top2.label : ''}], [${top3 ? top3.label : ''}])의 합계 비중이 총합의 <strong>${top3Ratio}%</strong>를 형성하고 있으며, 중앙값 대비 최상위 배율은 ${median > 0 ? (top1.value / median).toFixed(1) : '1.0'}배에 달해 상방 레버리지 잠재력과 하방 리스크 완충 체계의 동시 가동이 필수적입니다.</p>
    `;

    return {
        title,
        subtitle,
        executiveSummary: applyToneToText(executiveSummary, tone),
        paretoDiagnostic: applyToneToText(paretoDiagnostic, tone),
        outlierDiagnostic: applyToneToText(outlierDiagnostic, tone),
        cvDiagnostic: applyToneToText(cvDiagnostic, tone),
        spreadDiagnostic: applyToneToText(spreadDiagnostic, tone),
        recommendations: recommendations.map(r => ({
            title: r.title,
            desc: applyToneToText(r.desc, tone)
        }))
    };
}

/**
 * Gemini LLM API 호출
 */
async function callGeminiReportAPI(apiKey, data) {
    const prompt = `
당신은 맥킨지/BCG 수준의 수석 데이터 사이언티스트이자 경영 전략 컨설턴트입니다. 다음 데이터 통계 분석 요약치를 바탕으로 최고경영진 및 실무진이 감탄할 정도로 정밀하고 상세한 고품질 한국어 비즈니스 분석 보고서 콘텐츠를 JSON 형식으로 작성해 주세요.

[데이터 통계 정보]
- 보고서 유형: ${data.typeLabel || data.type} (유형 코드: ${data.type})
- 작성 지침: 선택된 보고서 유형의 핵심 목적과 관점에 맞춰 피상적인 요약이 아닌, 수치 간의 인과관계, 비즈니스 영향도, 리스크 요인, 기회 요인을 심층적으로 분석하세요.
- 문체 어조: ${data.toneLabel || data.tone} (어조 코드: ${data.tone})
- 문체 지침: 지정된 어조를 본문 전체와 제언 항목에 일관되게 적용하세요.
- 파일명: ${data.fileName}
- 분석 지표: [X: ${data.xColName}] × [Y: ${data.yColName}]
- 총 표본 건수: ${data.count}건
- 합계: ${data.sum}
- 평균: ${data.mean}
- 중앙값: ${data.median}
- 최소치: ${data.min}, 최대치: ${data.max}
- 표준편차: ${data.stddev}, 변동계수(CV): ${data.cv}%
- 최상위 챔피언: ${data.top1.label} (${data.top1.value})
- 상위 20% 점유율: ${data.top20Share}%
- 최하위 개체: ${data.bottom1.label} (${data.bottom1.value})
- 격차 배율: ${data.topBottomRatio}배
- 이상치 건수: ${data.outliers.length}건

[작성 세부 요구사항]
1. executiveSummary: 반드시 4단락 이상의 풍부한 <p> 태그 HTML로 작성하며, ①전체 볼륨과 중심 경향성, ②상위 20% 파레토 집중도 및 핵심 견인축, ③이상치와 하위 격차 스프레드 리스크, ④전략적 시사점을 수치와 함께 상세히 서술하세요.
2. paretoDiagnostic, outlierDiagnostic, cvDiagnostic, spreadDiagnostic: 각각 2~3문장 이상의 심층 통계 해석과 실행 전략 시사점을 작성하세요.
3. recommendations: 단순한 구호가 아니라 실행 가능한 4~5개의 전략적 액션 아이템(제목, 구체적 실행 방안, 추진 기간 및 기대 KPI 포함)을 상세히 작성하세요.

반드시 아래 JSON 포맷만을 반환하세요 (마크다운 코드블록이나 불필요한 서문 없이 오직 순수 JSON 문자열만 반환):
{
  "title": "보고서 제목 문자열",
  "subtitle": "부제목 문자열",
  "executiveSummary": "경영진 핵심 요약 브리핑 HTML 단락 (<p>태그 포함 4단락 이상)",
  "paretoDiagnostic": "파레토 집중도 분석 상세 내용 문자열",
  "outlierDiagnostic": "이상치 분석 상세 내용 문자열",
  "cvDiagnostic": "변동성 및 CV 분석 상세 내용 문자열",
  "spreadDiagnostic": "상하위 격차 분석 상세 내용 문자열",
  "recommendations": [
    { "title": "제언 1 제목", "desc": "제언 1 상세 실행 방안 및 기대 효과" },
    { "title": "제언 2 제목", "desc": "제언 2 상세 실행 방안 및 기대 효과" },
    { "title": "제언 3 제목", "desc": "제언 3 상세 실행 방안 및 기대 효과" },
    { "title": "제언 4 제목", "desc": "제언 4 상세 실행 방안 및 기대 효과" }
  ]
}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.3 }
        })
    });

    if (!response.ok) throw new Error(`Gemini API 오류 (${response.status})`);
    const resJson = await response.json();
    const candidateText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) throw new Error('Gemini 응답 텍스트 없음');
    const cleanJson = candidateText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    return JSON.parse(cleanJson);
}

/**
 * OpenAI GPT API 호출
 */
async function callOpenAIReportAPI(apiKey, data) {
    const prompt = `
당신은 맥킨지/BCG 수준의 수석 데이터 사이언티스트이자 경영 전략 컨설턴트입니다. 다음 데이터 통계 분석 요약치를 바탕으로 최고경영진 및 실무진이 감탄할 정도로 정밀하고 상세한 고품질 한국어 비즈니스 분석 보고서 콘텐츠를 JSON 형식으로 작성해 주세요.

[데이터 통계 정보]
- 보고서 유형: ${data.typeLabel || data.type} (유형 코드: ${data.type})
- 작성 지침: 선택된 보고서 유형의 핵심 목적과 관점에 맞춰 피상적인 요약이 아닌, 수치 간의 인과관계, 비즈니스 영향도, 리스크 요인, 기회 요인을 심층적으로 분석하세요.
- 문체 어조: ${data.toneLabel || data.tone} (어조 코드: ${data.tone})
- 문체 지침: 지정된 어조를 본문 전체와 제언 항목에 일관되게 적용하세요.
- 파일명: ${data.fileName}
- 분석 지표: [X: ${data.xColName}] × [Y: ${data.yColName}]
- 총 표본 건수: ${data.count}건
- 합계: ${data.sum}
- 평균: ${data.mean}
- 중앙값: ${data.median}
- 최소치: ${data.min}, 최대치: ${data.max}
- 표준편차: ${data.stddev}, 변동계수(CV): ${data.cv}%
- 최상위 챔피언: ${data.top1.label} (${data.top1.value})
- 상위 20% 점유율: ${data.top20Share}%
- 최하위 개체: ${data.bottom1.label} (${data.bottom1.value})
- 격차 배율: ${data.topBottomRatio}배
- 이상치 건수: ${data.outliers.length}건

[작성 세부 요구사항]
1. executiveSummary: 반드시 4단락 이상의 풍부한 <p> 태그 HTML로 작성하며, ①전체 볼륨과 중심 경향성, ②상위 20% 파레토 집중도 및 핵심 견인축, ③이상치와 하위 격차 스프레드 리스크, ④전략적 시사점을 수치와 함께 상세히 서술하세요.
2. paretoDiagnostic, outlierDiagnostic, cvDiagnostic, spreadDiagnostic: 각각 2~3문장 이상의 심층 통계 해석과 실행 전략 시사점을 작성하세요.
3. recommendations: 단순한 구호가 아니라 실행 가능한 4~5개의 전략적 액션 아이템(제목, 구체적 실행 방안, 추진 기간 및 기대 KPI 포함)을 상세히 작성하세요.

반드시 아래 JSON 포맷만을 반환하세요 (마크다운 코드블록 없이 순수 JSON만 반환):
{
  "title": "보고서 제목 문자열",
  "subtitle": "부제목 문자열",
  "executiveSummary": "경영진 핵심 요약 브리핑 HTML 단락 (<p>태그 포함 4단락 이상)",
  "paretoDiagnostic": "파레토 집중도 분석 상세 내용 문자열",
  "outlierDiagnostic": "이상치 분석 상세 내용 문자열",
  "cvDiagnostic": "변동성 및 CV 분석 상세 내용 문자열",
  "spreadDiagnostic": "상하위 격차 분석 상세 내용 문자열",
  "recommendations": [
    { "title": "제언 1 제목", "desc": "제언 1 상세 실행 방안 및 기대 효과" },
    { "title": "제언 2 제목", "desc": "제언 2 상세 실행 방안 및 기대 효과" },
    { "title": "제언 3 제목", "desc": "제언 3 상세 실행 방안 및 기대 효과" },
    { "title": "제언 4 제목", "desc": "제언 4 상세 실행 방안 및 기대 효과" }
  ]
}
`;

    const url = 'https://api.openai.com/v1/chat/completions';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.3
        })
    });

    if (!response.ok) throw new Error(`OpenAI API 오류 (${response.status})`);
    const resJson = await response.json();
    const content = resJson.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenAI 응답 텍스트 없음');
    return JSON.parse(content);
}

/**
 * AI 보고서 모달 및 툴바 이벤트 바인딩
 */
export function bindAiReportEvents() {
    const aiReportModal = $('ai-report-modal');
    const btnCloseReportModal = $('btn-close-report-modal');
    const btnGenerateAiReport = $('btn-generate-ai-report');
    const btnReportEditMode = $('btn-report-edit-mode');
    const reportEditLabel = $('report-edit-label');
    const btnReportCopy = $('btn-report-copy');
    const btnReportPrint = $('btn-report-print');
    const aiReportPaper = $('ai-report-paper');
    const aiReportContent = $('ai-report-content');
    const aiApiModal = $('ai-api-modal');
    const btnAiApiSettings = $('btn-ai-api-settings');
    const btnCloseApiModal = $('btn-close-api-modal');
    const inputGeminiKey = $('input-gemini-key');
    const inputOpenaiKey = $('input-openai-key');
    const btnSaveApiKeys = $('btn-save-api-keys');
    const btnClearApiKeys = $('btn-clear-api-keys');

    // 모달 열기 버튼들
    $('btn-print-report')?.addEventListener('click', () => openAiReportStudio());
    $('btn-open-report-from-analysis')?.addEventListener('click', () => openAiReportStudio());
    $('btn-auto-report-quick')?.addEventListener('click', () => openAiReportStudio({ stream: true }));

    // 사이드바 AI 추천 보고서 배지 클릭 시 자동 추천 모드로 모달 오픈
    const sidebarRecBadge = $('ai-recommended-report-badge');
    sidebarRecBadge?.addEventListener('click', () => {
        const aiReportType = $('ai-report-type');
        if (aiReportType) aiReportType.value = 'auto';
        openAiReportStudio({ stream: true });
    });

    // 보고서 유형 셀렉트박스 변경 시 UI 상태 업데이트
    const aiReportType = $('ai-report-type');
    const autoBadge = $('ai-report-auto-badge');
    const reasonBox = $('ai-report-detected-reason');
    const aiReportTone = $('ai-report-tone');
    const toneAutoBadge = $('ai-tone-auto-badge');
    const toneReasonBox = $('ai-tone-detected-reason');

    aiReportType?.addEventListener('change', () => {
        if (aiReportType.value === 'auto') {
            if (autoBadge) {
                autoBadge.textContent = 'AI 추천 ON';
                autoBadge.style.background = 'linear-gradient(135deg, #4f46e5, #7c3aed)';
            }
            updateReportRecommendationUI();
        } else {
            if (autoBadge) {
                autoBadge.textContent = '수동 선택';
                autoBadge.style.background = '#475569';
            }
            if (reasonBox) {
                reasonBox.innerHTML = `<strong>[유형 수동]</strong> ${aiReportType.selectedOptions[0]?.textContent.split(' ')[1] || '선택됨'}`;
            }
            // 어조가 auto일 때 선택된 보고서 유형에 맞춰 추천 어조 실시간 갱신
            if (aiReportTone && aiReportTone.value === 'auto') {
                const recTone = inferBestReportTone(aiReportType.value);
                if (toneReasonBox) {
                    toneReasonBox.innerHTML = `&nbsp;•&nbsp; <strong>[어조 추천]</strong> ${recTone.name}`;
                }
            }
        }
    });

    // 어조 셀렉트박스 변경 시 상태 업데이트
    aiReportTone?.addEventListener('change', () => {
        if (aiReportTone.value === 'auto') {
            if (toneAutoBadge) {
                toneAutoBadge.textContent = 'AI 어조 ON';
                toneAutoBadge.style.background = 'linear-gradient(135deg, #4f46e5, #7c3aed)';
            }
            updateReportRecommendationUI();
        } else {
            if (toneAutoBadge) {
                toneAutoBadge.textContent = '수동 선택';
                toneAutoBadge.style.background = '#475569';
            }
            if (toneReasonBox) {
                toneReasonBox.innerHTML = `&nbsp;•&nbsp; <strong>[어조 수동]</strong> ${aiReportTone.selectedOptions[0]?.textContent.split(' ')[1] || '선택됨'}`;
            }
        }
    });

    // 모달 상단 배지 클릭 시 언제든 AI 자동 추천으로 재설정
    autoBadge?.addEventListener('click', () => {
        if (aiReportType) {
            aiReportType.value = 'auto';
            aiReportType.dispatchEvent(new Event('change'));
            generateAIReport();
        }
    });

    toneAutoBadge?.addEventListener('click', () => {
        if (aiReportTone) {
            aiReportTone.value = 'auto';
            aiReportTone.dispatchEvent(new Event('change'));
            generateAIReport();
        }
    });
    btnGenerateAiReport?.addEventListener('click', () => generateAIReport({ stream: true }));

    // 닫기 핸들러
    btnCloseReportModal?.addEventListener('click', () => {
        if (aiReportModal) aiReportModal.style.display = 'none';
    });
    aiReportModal?.addEventListener('click', (e) => {
        if (e.target === aiReportModal) aiReportModal.style.display = 'none';
    });

    // 직접 편집 모드 토글
    btnReportEditMode?.addEventListener('click', () => {
        appState.isReportEditMode = !appState.isReportEditMode;
        if (aiReportPaper) aiReportPaper.classList.toggle('editing', appState.isReportEditMode);
        if (aiReportContent) {
            aiReportContent.querySelectorAll('.report-editable').forEach(el => {
                el.contentEditable = appState.isReportEditMode ? 'true' : 'false';
            });
        }
        if (btnReportEditMode) btnReportEditMode.classList.toggle('active', appState.isReportEditMode);
        if (reportEditLabel) reportEditLabel.textContent = appState.isReportEditMode ? '편집 완료' : '직접 편집';
        showToast(appState.isReportEditMode ? '✏️ <strong>직접 편집 모드가 켜졌습니다:</strong> 보고서 텍스트를 클릭하여 자유롭게 수정한 후 인쇄할 수 있습니다.' : '💾 <strong>편집 완료:</strong> 수정된 내용이 저장되었습니다.');
    });

    // 클립보드 복사
    btnReportCopy?.addEventListener('click', async () => {
        if (!aiReportContent || !aiReportContent.innerText.trim()) {
            showToast('⚠️ 복사할 보고서 내용이 없습니다.');
            return;
        }
        try {
            await navigator.clipboard.writeText(aiReportContent.innerText);
            showToast('📋 <strong>보고서 복사 완료!</strong> 워드, 노션, 슬랙 등에 바로 붙여넣기(Ctrl+V)하실 수 있습니다.');
        } catch (err) {
            console.error('클립보드 복사 에러:', err);
            showToast('⚠️ 클립보드 복사에 실패했습니다.');
        }
    });

    // 인쇄
    btnReportPrint?.addEventListener('click', printCurrentReport);

    // API 설정 모달
    btnAiApiSettings?.addEventListener('click', () => {
        if (inputGeminiKey) inputGeminiKey.value = localStorage.getItem('agy_gemini_api_key') || '';
        if (inputOpenaiKey) inputOpenaiKey.value = localStorage.getItem('agy_openai_api_key') || '';
        if (aiApiModal) aiApiModal.style.display = 'flex';
    });
    btnCloseApiModal?.addEventListener('click', () => {
        if (aiApiModal) aiApiModal.style.display = 'none';
    });
    aiApiModal?.addEventListener('click', (e) => {
        if (e.target === aiApiModal) aiApiModal.style.display = 'none';
    });

    btnSaveApiKeys?.addEventListener('click', () => {
        if (inputGeminiKey) localStorage.setItem('agy_gemini_api_key', inputGeminiKey.value.trim());
        if (inputOpenaiKey) localStorage.setItem('agy_openai_api_key', inputOpenaiKey.value.trim());
        showToast('🔑 <strong>API 키 저장 완료:</strong> 브라우저 로컬 저장소에 안전하게 보관되었습니다.');
        if (aiApiModal) aiApiModal.style.display = 'none';
    });

    btnClearApiKeys?.addEventListener('click', () => {
        localStorage.removeItem('agy_gemini_api_key');
        localStorage.removeItem('agy_openai_api_key');
        if (inputGeminiKey) inputGeminiKey.value = '';
        if (inputOpenaiKey) inputOpenaiKey.value = '';
        showToast('🗑️ 저장된 API 키가 모두 삭제되었습니다.');
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (aiApiModal && aiApiModal.style.display !== 'none') aiApiModal.style.display = 'none';
            else if (aiReportModal && aiReportModal.style.display !== 'none') aiReportModal.style.display = 'none';
        }
    });
}
