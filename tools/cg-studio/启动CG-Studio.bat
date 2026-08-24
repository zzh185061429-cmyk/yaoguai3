@echo off
chcp 65001 >nul
title CG Studio 批量生图工作台
cd /d "%~dp0"
echo [CG Studio] 正在启动，浏览器将自动打开 http://127.0.0.1:17891
echo [CG Studio] 关闭本窗口即停止服务（配置与已生成图片不受影响）
start /b cmd /c "timeout /t 2 >nul & start "" http://127.0.0.1:17891"
node server.mjs
pause
