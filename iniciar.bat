@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Reputacion OS

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js no esta instalado. Descargalo de https://nodejs.org ^(version LTS^) y volve a intentar.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando dependencias por primera vez...
  call npm install
  if errorlevel 1 (
    echo.
    echo Fallo "npm install". Revisa tu conexion a internet y volve a intentar.
    pause
    exit /b 1
  )
)

node scripts\iniciar.mjs
echo.
pause
