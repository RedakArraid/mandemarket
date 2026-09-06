# 🚀 Guide d'installation Windows - MandeMarket

## **📋 Prérequis**

- Windows 10/11 (version 2004 ou plus récente)
- Connexion Internet
- Privilèges administrateur

---

## **🎯 Installation automatique (Recommandée)**

### **Option 1 : Script PowerShell (Complet)**

1. **Télécharger le script**
   ```powershell
   # Dans PowerShell en tant qu'administrateur
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Exécuter le script**
   ```powershell
   # Clic droit sur setup-windows.ps1 → "Exécuter en tant qu'administrateur"
   .\setup-windows.ps1
   ```

3. **Suivre les instructions**
   - Le script installe automatiquement WSL2 et Docker Desktop
   - Redémarrage Windows requis après installation
   - Relancer le script après redémarrage

### **Option 2 : Script Batch (Simple)**

1. **Exécuter le script**
   ```cmd
   # Clic droit sur setup-windows.bat → "Exécuter en tant qu'administrateur"
   setup-windows.bat
   ```

2. **Suivre les instructions**
   - Installation automatique de WSL2
   - Téléchargement de Docker Desktop
   - Configuration automatique

---

## **🔧 Installation manuelle**

### **1. Installer WSL2**

```powershell
# Dans PowerShell en tant qu'administrateur
wsl --install
wsl --set-default-version 2
```

**Redémarrer Windows**

### **2. Installer Docker Desktop**

1. **Télécharger** : https://www.docker.com/products/docker-desktop/
2. **Installer** Docker Desktop
3. **Configurer** WSL2 dans Docker Desktop Settings

### **3. Démarrer le projet**

```bash
# Cloner le projet
git clone <url-du-repo>
cd mandemarket

# Construire et démarrer
docker compose build --no-cache
docker compose up -d
```

---

## **🌐 URLs d'accès**

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Interface utilisateur |
| **Backend API** | http://localhost:4002 | API REST |
| **Adminer** | http://localhost:8080 | Interface base de données |
| **Admin** | http://localhost:3000/admin | Interface admin (voir aussi `/admin/login`) |

**Identifiants admin (seed / Docker, dev uniquement) :**

Voir le tableau complet dans [CREDENTIALS.md](./CREDENTIALS.md). Exemple administrateur :

- Email : `admin@mandemarket.com`
- Mot de passe : `Admin@2024!` (ou la valeur de `SEED_ADMIN_PASSWORD` dans `backend/.env.docker`)

**Ports base de données (docker compose du repo) :** PostgreSQL **5433**, Redis **6380**, Adminer **8080**.

---

## **🔍 Vérification**

### **1. Vérifier WSL2**
```powershell
wsl --list --verbose
```

### **2. Vérifier Docker**
```powershell
docker --version
docker ps
```

### **3. Vérifier les services**
```bash
docker compose ps
docker compose logs -f
```

---

## **⚠️ Dépannage**

### **Problème : WSL2 ne démarre pas**
```powershell
# Réinstaller WSL
wsl --unregister Ubuntu
wsl --install Ubuntu
```

### **Problème : Docker Desktop ne démarre pas**
1. Redémarrer Windows
2. Vérifier les mises à jour Windows
3. Réinstaller Docker Desktop

### **Problème : Ports occupés**
```bash
# Vérifier les ports
netstat -an | findstr :3000
netstat -an | findstr :4002

# Modifier docker-compose.yml si nécessaire
ports:
  - "3001:3000"  # Au lieu de "3000:3000"
```

### **Problème : Antivirus bloque Docker**
1. Désactiver temporairement l'antivirus
2. Ajouter Docker aux exclusions

---

## **🚀 Commandes utiles**

```bash
# Voir les logs
docker compose logs -f frontend
docker compose logs -f backend

# Redémarrer un service
docker compose restart frontend

# Reconstruire après modification
docker compose build frontend --no-cache
docker compose up -d frontend

# Arrêter tout
docker compose down

# Nettoyer tout
docker compose down -v
docker system prune -a
```

---

## **📞 Support**

Si vous rencontrez des problèmes :

1. **Vérifiez les prérequis** (Windows 10/11, privilèges admin)
2. **Suivez le guide de dépannage** ci-dessus
3. **Consultez les logs** : `docker compose logs -f`
4. **Redémarrez Windows** après installation de WSL2

---

**Félicitations !** Votre environnement MandeMarket est prêt.

*Guide revu en mai 2026 (commandes `docker compose`, alignement avec [CREDENTIALS.md](./CREDENTIALS.md)).*