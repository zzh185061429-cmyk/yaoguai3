@echo off
chcp 65001 >nul
title NAI Studio - NovelAI 角色立绘工作台
cd /d "%~dp0"
echo.
echo   NAI Studio 启动中... 浏览器访问 http://127.0.0.1:17892
echo   (关闭本窗口即停止服务; 端口被占用时: set PORT=18000 ^&^& node server.mjs)
echo.
node server.mjs
pause
