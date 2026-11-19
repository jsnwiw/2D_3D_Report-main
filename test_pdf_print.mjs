import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PORT = 8092;
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || !reqPath) reqPath = 'index.html';
  reqPath = reqPath.replace(/^\/+/, '');
  const filePath = path.join(process.cwd(), reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.log(`404: ${req.url} -> ${filePath}`);
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'text/plain',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(data);
  });
});

server.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);

  const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  const debuggingPort = 9225;
  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debuggingPort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    `http://localhost:${PORT}/index.html`
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch(`http://127.0.0.1:${debuggingPort}/json`);
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.type === 'page' && t.url.includes(PORT.toString()));

    if (!tab) {
      console.error('Could not find page tab!');
      process.exit(1);
    }

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    let msgId = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && callbacks.has(data.id)) {
        callbacks.get(data.id)(data);
        callbacks.delete(data.id);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        callbacks.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await new Promise(r => ws.onopen = r);
    await send('Page.enable');
    await send('Runtime.enable');

    console.log('Generating AI report in browser...');
    const result = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          try {
            const { appState } = await import('./js/state.js');
            const { parseCSV } = await import('./js/parser.js');
            const { generateAIReport, printCurrentReport } = await import('./js/ai-report.js');

            const csvData = "부서,매출,비용,인원\\n영업1팀,1200,800,12\\n영업2팀,2500,1100,18\\n개발팀,450,900,25\\n마케팅팀,1800,950,8\\n기획팀,800,400,6\\n글로벌영업,3200,1400,15\\n재무팀,300,200,4\\n고객지원,950,550,14\\n신사업팀,2100,1300,9\\n전략팀,1400,700,5";
            const parsed = parseCSV(csvData);
            appState.parsedData = parsed;
            appState.currentXCol = '부서';
            appState.currentYCol = '매출';

            await generateAIReport({ stream: false });

            // Fill print container as printCurrentReport does
            const aiReportContent = document.getElementById('ai-report-content');
            const reportContainer = document.getElementById('print-report-container');
            reportContainer.innerHTML = aiReportContent.innerHTML;
            reportContainer.style.display = 'block';

            return {
              contentLength: aiReportContent.innerHTML.length,
              printContainerLength: reportContainer.innerHTML.length,
              scrollHeight: reportContainer.scrollHeight,
              offsetHeight: reportContainer.offsetHeight
            };
          } catch (e) {
            return { error: e.message, stack: e.stack };
          }
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('Generation evaluation value:', JSON.stringify(result?.result?.result?.value, null, 2));

    // Also wait a bit or inspect body before print
    const bodyInfo = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const c = document.getElementById('print-report-container');
          return {
            display: window.getComputedStyle(c).display,
            visibility: window.getComputedStyle(c).visibility,
            childrenCount: c.children.length,
            htmlPreview: c.innerHTML.substring(0, 200)
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Print container computed:', bodyInfo?.result?.result?.value);

    // Call Page.printToPDF
    console.log('Testing Page.printToPDF...');
    const pdfRes = await send('Page.printToPDF', {
      paperWidth: 8.27, // A4 width in inches (210mm)
      paperHeight: 11.69, // A4 height in inches (297mm)
      marginTop: 0.4,
      marginBottom: 0.4,
      marginLeft: 0.4,
      marginRight: 0.4,
      printBackground: true
    });

    if (pdfRes?.result?.data) {
      const buffer = Buffer.from(pdfRes.result.data, 'base64');
      fs.writeFileSync('./test_output.pdf', buffer);
      console.log(`PDF saved successfully: test_output.pdf (${buffer.length} bytes)`);

      // Count pages in PDF: search for /Type /Page (or /Count)
      const pdfText = buffer.toString('latin1');
      const pageMatches = pdfText.match(/\/Type\s*\/Page[^s]/g) || [];
      console.log(`Total PDF Pages detected: ${pageMatches.length}`);
    } else {
      console.error('Failed to get PDF data:', pdfRes);
    }

    ws.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    chromeProc.kill();
    server.close();
    process.exit(0);
  }
});
