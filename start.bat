@echo off
chcp 65001 > nul
title 3D 데이터 시각화 로컬 서버 실행기

echo ===================================================
echo   🚀 3D 데이터 시각화 웹 플랫폼을 실행합니다...
echo ===================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [Node.js 감지됨] 로컬 웹 서버 시작 중...
    start "" http://localhost:8080/index.html
    node -e "const http=require('http'),fs=require('fs'),path=require('path');const m={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png'};http.createServer((q,s)=>{let p=path.join(__dirname,q.url.split('?')[0]);if(p.endsWith(path.sep))p=path.join(p,'index.html');if(!fs.existsSync(p)){s.statusCode=404;return s.end('Not Found');}s.setHeader('Content-Type',m[path.extname(p)]||'text/plain');fs.createReadStream(p).pipe(s);}).listen(8080,()=>console.log('✅ http://localhost:8080 에서 실행 중입니다. (종료하려면 이 창을 닫으세요)'));"
    pause
    exit /b
)

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [Python 감지됨] 로컬 웹 서버 시작 중...
    start "" http://localhost:8000/index.html
    python -m http.server 8000
    pause
    exit /b
)

where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [Python 감지됨] 로컬 웹 서버 시작 중...
    start "" http://localhost:8000/index.html
    py -m http.server 8000
    pause
    exit /b
)

echo [안내] Node.js 또는 Python이 감지되지 않았습니다.
echo Chrome 브라우저 바로가기에 --allow-file-access-from-files 옵션을 주거나,
echo VSCode의 Live Server 확장 프로그램으로 index.html을 열어주세요.
pause
