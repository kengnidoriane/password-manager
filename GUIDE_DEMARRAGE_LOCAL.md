# Guide de Démarrage Local - Password Manager
## Lancer l'application sur votre machine Windows

**Date:** 12 février 2026  
**Système:** Windows  
**Durée estimée:** 15-20 minutes

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Installation des Outils](#installation-des-outils)
3. [Configuration de l'Environnement](#configuration-de-lenvironnement)
4. [Démarrage avec Docker Compose](#démarrage-avec-docker-compose)
5. [Démarrage Manuel](#démarrage-manuel)
6. [Vérification](#vérification)
7. [Utilisation](#utilisation)
8. [Arrêt de l'Application](#arrêt-de-lapplication)
9. [Dépannage](#dépannage)

---

## Prérequis

### Logiciels Requis

Vous devez installer les outils suivants sur votre machine Windows :

1. **Docker Desktop** (recommandé) OU **Java + Node.js + PostgreSQL + Redis**
2. **Git** (pour cloner le projet)
3. **Un éditeur de code** (VS Code recommandé)

---

## Installation des Outils

### Option 1 : Docker Desktop (Recommandé - Plus Simple)

#### Étape 1 : Installer Docker Desktop

1. Téléchargez Docker Desktop depuis : https://www.docker.com/products/docker-desktop/
2. Exécutez l'installateur
3. Redémarrez votre ordinateur si demandé
4. Lancez Docker Desktop
5. Vérifiez l'installation :

```cmd
docker --version
docker-compose --version
```

Vous devriez voir quelque chose comme :
```
Docker version 24.0.0
Docker Compose version v2.20.0
```

#### Étape 2 : Installer Git

1. Téléchargez Git depuis : https://git-scm.com/download/win
2. Exécutez l'installateur (gardez les options par défaut)
3. Vérifiez l'installation :

```cmd
git --version
```

### Option 2 : Installation Manuelle (Plus Complexe)

Si vous ne voulez pas utiliser Docker, vous devez installer :

#### 1. Java 17+

1. Téléchargez Java JDK 17 depuis : https://adoptium.net/
2. Installez et ajoutez Java au PATH
3. Vérifiez :

```cmd
java -version
```

#### 2. Maven

1. Téléchargez Maven depuis : https://maven.apache.org/download.cgi
2. Extrayez dans `C:\Program Files\Maven`
3. Ajoutez au PATH : `C:\Program Files\Maven\bin`
4. Vérifiez :

```cmd
mvn -version
```

#### 3. Node.js 18+

1. Téléchargez Node.js depuis : https://nodejs.org/
2. Installez (version LTS recommandée)
3. Vérifiez :

```cmd
node --version
npm --version
```

#### 4. PostgreSQL 14+

1. Téléchargez PostgreSQL depuis : https://www.postgresql.org/download/windows/
2. Installez avec le mot de passe : `postgres`
3. Créez une base de données :

```cmd
psql -U postgres
CREATE DATABASE password_manager;
\q
```

#### 5. Redis

1. Téléchargez Redis depuis : https://github.com/microsoftarchive/redis/releases
2. Installez et démarrez le service Redis

---

## Configuration de l'Environnement

### Étape 1 : Cloner le Projet

Ouvrez PowerShell ou CMD et exécutez :

```cmd
cd C:\Users\VotreNom\Documents
git clone <url-du-repo>
cd password-manager
```

### Étape 2 : Créer les Fichiers de Configuration

#### Pour le Backend

Créez le fichier `backend\.env` :

```cmd
cd backend
copy .env.example .env
```

Éditez `backend\.env` avec ces valeurs :

```env
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/password_manager
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres

# Redis
SPRING_REDIS_HOST=localhost
SPRING_REDIS_PORT=6379

# JWT
JWT_SECRET=votre-secret-jwt-super-long-et-securise-changez-moi-en-production
JWT_EXPIRATION=900000

# Server
SERVER_PORT=8080
```

#### Pour le Frontend

Créez le fichier `frontend\.env.local` :

```cmd
cd ..\frontend
copy .env.example .env.local
```

Éditez `frontend\.env.local` avec ces valeurs :

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Démarrage avec Docker Compose (Méthode Recommandée)

### Étape 1 : Démarrer Tous les Services

Depuis la racine du projet :

```cmd
docker-compose up -d
```

Cette commande va :
- Démarrer PostgreSQL sur le port 5432
- Démarrer Redis sur le port 6379
- Construire et démarrer le backend sur le port 8080
- Construire et démarrer le frontend sur le port 3000

### Étape 2 : Vérifier que Tout Fonctionne

```cmd
docker-compose ps
```

Vous devriez voir 4 services en cours d'exécution :
- `password-manager-postgres`
- `password-manager-redis`
- `password-manager-backend`
- `password-manager-frontend`

### Étape 3 : Voir les Logs

Pour voir les logs en temps réel :

```cmd
docker-compose logs -f
```

Pour voir les logs d'un service spécifique :

```cmd
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## Démarrage Manuel (Sans Docker)

### Étape 1 : Démarrer PostgreSQL et Redis

Assurez-vous que PostgreSQL et Redis sont démarrés :

```cmd
# Vérifier PostgreSQL
psql -U postgres -c "SELECT 1"

# Vérifier Redis
redis-cli ping
```

### Étape 2 : Démarrer le Backend

Ouvrez un terminal PowerShell/CMD :

```cmd
cd backend

# Compiler le projet
mvn clean install -DskipTests

# Démarrer l'application
mvn spring-boot:run
```

Le backend démarre sur : http://localhost:8080

### Étape 3 : Démarrer le Frontend

Ouvrez un NOUVEAU terminal PowerShell/CMD :

```cmd
cd frontend

# Installer les dépendances (première fois seulement)
npm install

# Démarrer le serveur de développement
npm run dev
```

Le frontend démarre sur : http://localhost:3000

---

## Vérification

### 1. Vérifier le Backend

Ouvrez votre navigateur et allez sur :

**Health Check:**
```
http://localhost:8080/api/v1/health
```

Vous devriez voir :
```json
{
  "status": "UP"
}
```

**Documentation API (Swagger):**
```
http://localhost:8080/swagger-ui.html
```

### 2. Vérifier le Frontend

Ouvrez votre navigateur et allez sur :

```
http://localhost:3000
```

Vous devriez voir la page d'accueil du Password Manager.

### 3. Vérifier la Base de Données

```cmd
# Se connecter à PostgreSQL
psql -U postgres -d password_manager

# Lister les tables
\dt

# Vous devriez voir les tables créées par Flyway
# Quitter
\q
```

---

## Utilisation

### Créer un Compte

1. Allez sur http://localhost:3000
2. Cliquez sur "Créer un compte"
3. Entrez votre email
4. Créez un mot de passe maître (minimum 12 caractères)
5. **IMPORTANT:** Sauvegardez votre clé de récupération !
6. Cliquez sur "S'inscrire"

### Se Connecter

1. Allez sur http://localhost:3000/login
2. Entrez votre email
3. Entrez votre mot de passe maître
4. Cliquez sur "Se connecter"

### Ajouter un Mot de Passe

1. Une fois connecté, cliquez sur "Ajouter un identifiant"
2. Remplissez les informations :
   - Nom du site
   - URL
   - Nom d'utilisateur
   - Mot de passe (ou générez-en un)
3. Cliquez sur "Enregistrer"

### Générer un Mot de Passe

1. Allez dans "Générateur" dans le menu
2. Configurez les options :
   - Longueur (8-128 caractères)
   - Types de caractères
3. Cliquez sur "Générer"
4. Copiez ou sauvegardez le mot de passe

---

## Arrêt de l'Application

### Avec Docker Compose

```cmd
# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (données)
docker-compose down -v
```

### Manuel

1. Dans le terminal du frontend : `Ctrl + C`
2. Dans le terminal du backend : `Ctrl + C`
3. Arrêter PostgreSQL et Redis si nécessaire

---

## Dépannage

### Problème : Le port 8080 est déjà utilisé

**Solution :**

```cmd
# Trouver le processus qui utilise le port
netstat -ano | findstr :8080

# Tuer le processus (remplacez PID par le numéro trouvé)
taskkill /PID <PID> /F
```

### Problème : Le port 3000 est déjà utilisé

**Solution :**

```cmd
# Trouver le processus
netstat -ano | findstr :3000

# Tuer le processus
taskkill /PID <PID> /F
```

### Problème : Docker ne démarre pas

**Solutions :**

1. Vérifiez que la virtualisation est activée dans le BIOS
2. Redémarrez Docker Desktop
3. Vérifiez que WSL 2 est installé :

```cmd
wsl --list --verbose
```

### Problème : Erreur de connexion à la base de données

**Solutions :**

1. Vérifiez que PostgreSQL est démarré :

```cmd
# Avec Docker
docker-compose ps postgres

# Manuel
psql -U postgres -c "SELECT 1"
```

2. Vérifiez les credentials dans `backend\.env`

3. Vérifiez que la base de données existe :

```cmd
psql -U postgres -l
```

### Problème : Le frontend ne se connecte pas au backend

**Solutions :**

1. Vérifiez que le backend est démarré :

```
http://localhost:8080/api/v1/health
```

2. Vérifiez `frontend\.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

3. Vérifiez la console du navigateur (F12) pour les erreurs CORS

### Problème : Erreur "Cannot find module"

**Solution :**

```cmd
cd frontend
rm -rf node_modules
rm package-lock.json
npm install
```

### Problème : Erreur Maven "BUILD FAILURE"

**Solutions :**

1. Nettoyez le cache Maven :

```cmd
cd backend
mvn clean
```

2. Vérifiez la version de Java :

```cmd
java -version
```

Doit être Java 17 ou supérieur.

3. Mettez à jour les dépendances :

```cmd
mvn clean install -U
```

---

## Commandes Utiles

### Docker Compose

```cmd
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Voir les logs
docker-compose logs -f

# Reconstruire les images
docker-compose build

# Redémarrer un service
docker-compose restart backend

# Voir l'état des services
docker-compose ps

# Exécuter une commande dans un conteneur
docker-compose exec backend bash
```

### Backend (Maven)

```cmd
# Compiler
mvn clean compile

# Tester
mvn test

# Construire le JAR
mvn clean package

# Démarrer
mvn spring-boot:run

# Nettoyer
mvn clean
```

### Frontend (npm)

```cmd
# Installer les dépendances
npm install

# Démarrer en développement
npm run dev

# Construire pour la production
npm run build

# Démarrer en production
npm start

# Linter
npm run lint

# Tests
npm test
```

### Base de Données

```cmd
# Se connecter
psql -U postgres -d password_manager

# Lister les tables
\dt

# Voir la structure d'une table
\d users

# Exécuter une requête
SELECT * FROM users;

# Quitter
\q
```

---

## Accès Rapide

Une fois l'application démarrée, voici les URLs importantes :

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Application web |
| **Backend API** | http://localhost:8080/api/v1 | API REST |
| **Swagger UI** | http://localhost:8080/swagger-ui.html | Documentation API |
| **Health Check** | http://localhost:8080/api/v1/health | Vérification santé |
| **Actuator** | http://localhost:8080/actuator | Métriques Spring Boot |

---

## Prochaines Étapes

Maintenant que l'application fonctionne en local, vous pouvez :

1. **Explorer les fonctionnalités** :
   - Créer un compte
   - Ajouter des mots de passe
   - Générer des mots de passe sécurisés
   - Organiser avec des dossiers et tags
   - Consulter le tableau de bord de sécurité

2. **Développer** :
   - Modifier le code frontend dans `frontend/src/`
   - Modifier le code backend dans `backend/src/`
   - Les changements sont rechargés automatiquement

3. **Tester** :
   - Exécuter les tests frontend : `npm test`
   - Exécuter les tests backend : `mvn test`

4. **Consulter la documentation** :
   - API : http://localhost:8080/swagger-ui.html
   - README : `README.md`
   - Documentation complète : `docs/`

---

## Support

Si vous rencontrez des problèmes :

1. Consultez la section [Dépannage](#dépannage)
2. Vérifiez les logs :
   - Docker : `docker-compose logs -f`
   - Backend : Logs dans le terminal
   - Frontend : Console du navigateur (F12)
3. Consultez la documentation dans `docs/`

---

## Résumé des Commandes

### Démarrage Rapide (Docker)

```cmd
# 1. Cloner le projet
git clone <url>
cd password-manager

# 2. Créer les fichiers .env
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local

# 3. Démarrer
docker-compose up -d

# 4. Vérifier
docker-compose ps

# 5. Ouvrir dans le navigateur
start http://localhost:3000
```

### Démarrage Rapide (Manuel)

```cmd
# Terminal 1 - Backend
cd backend
mvn spring-boot:run

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev

# Ouvrir dans le navigateur
start http://localhost:3000
```

---

**Bon développement ! 🚀**

**Version:** 1.0.0  
**Dernière mise à jour:** 12 février 2026
