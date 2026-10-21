@echo off
title Push Smart Grocery ke GitHub
color 0A
echo ========================================================
echo   Smart Grocery - Push ke GitHub (Hydroslogan-art)
echo ========================================================
echo.

set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\Git\bin"

echo [1/3] Memeriksa status repositori...
git add .
git commit -m "Simpan aplikasi Smart Grocery" 2>nul
git branch -M main
git remote set-url origin https://github.com/Hydroslogan-art/smart-grocery.git 2>nul || git remote add origin https://github.com/Hydroslogan-art/smart-grocery.git

echo.
echo [2/3] Mengunggah (push) ke GitHub branch main...
echo (Jika peramban terbuka meminta login, silakan klik 'Authorize GitCredentialManager')
echo.

git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo  [BERHASIL] Seluruh file sukses ter-upload ke GitHub!
    echo  Link: https://github.com/Hydroslogan-art/smart-grocery
    echo ========================================================
) else (
    echo ========================================================
    echo  [PERINGATAN] Terjadi kendala saat push.
    echo  Pastikan Anda telah login ke akun GitHub di browser.
    echo ========================================================
)

echo.
pause
