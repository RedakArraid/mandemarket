@echo off
chcp 65001 >nul
echo 🐳 ======================================
echo 🚀 Installation automatique MandeMarket
echo 🐳 ======================================

REM Vérifier les privilèges administrateur
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Ce script doit être exécuté en tant qu'administrateur
    echo 💡 Clic droit sur ce fichier → "Exécuter en tant qu'administrateur"
    pause
    exit /b 1
)

echo 🔍 Vérification de l'environnement...

REM Vérifier WSL2
wsl --list --verbose >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ WSL2 est installé
) else (
    echo ❌ WSL2 n'est pas installé
    echo 🔧 Installation de WSL2...
    
    REM Activer les fonctionnalités Windows
    echo   📦 Activation des fonctionnalités Windows...
    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
    
    REM Installer WSL2
    echo   🐧 Installation de WSL2...
    wsl --install --no-launch
    wsl --set-default-version 2
    
    echo ✅ WSL2 installé avec succès
    echo ⚠️  Redémarrez Windows puis relancez ce script
    pause
    exit /b 0
)

REM Vérifier Docker
docker --version >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ Docker est installé
    docker ps >nul 2>&1
    if %errorLevel% equ 0 (
        echo ✅ Docker Desktop fonctionne
    ) else (
        echo ❌ Docker Desktop ne fonctionne pas
        echo 💡 Démarrez Docker Desktop manuellement
        pause
        exit /b 1
    )
) else (
    echo ❌ Docker n'est pas installé
    echo 🔧 Téléchargement de Docker Desktop...
    echo 💡 L'installation va s'ouvrir dans une nouvelle fenêtre
    start https://desktop.docker.com/win/stable/Docker%%20Desktop%%20Installer.exe
    echo ⚠️  Installez Docker Desktop puis relancez ce script
    pause
    exit /b 0
)

echo 🚀 Tout est prêt, démarrage du projet...

REM Construire les images
echo   🏗️ Construction des images Docker...
docker-compose build --no-cache

REM Démarrer les services
echo   🚀 Démarrage des services...
docker-compose up -d

REM Vérifier l'état
echo   🔍 Vérification de l'état...
docker-compose ps

echo ✅ MandeMarket démarré avec succès !
echo 🌐 URLs d'accès :
echo    Frontend: http://localhost:3000
echo    Backend: http://localhost:4002
echo    Adminer: http://localhost:8080
echo    Admin: http://localhost:3000/admin

echo 🐳 ======================================
echo ✅ Installation terminée !
echo 🐳 ======================================
pause 