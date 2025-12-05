# Quick Start Guide

Guide rapide pour démarrer avec le projet Password Manager.

## 🚀 Setup Initial (5 minutes)

### 1. Cloner et installer

```bash
# Cloner le repo
git clone https://github.com/your-username/password-manager.git
cd password-manager

# Copier les fichiers d'environnement
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

### 2. Démarrer avec Docker (Recommandé)

```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier que tout fonctionne
docker-compose ps

# Voir les logs
docker-compose logs -f
```

✅ **C'est tout!** L'application est maintenant disponible:
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui.html

### 3. Développement local (Sans Docker)

**Terminal 1 - Backend:**
```bash
# Démarrer seulement les bases de données
docker-compose -f docker-compose.dev.yml up -d

cd backend
mvn spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📝 Workflow de développement

### Créer une nouvelle feature

```bash
# 1. Créer une branche
git checkout -b feature/my-feature

# 2. Faire vos modifications
# ... code ...

# 3. Commit avec message conventionnel
git add .
git commit -m "feat(auth): add password reset functionality"

# 4. Pousser et créer une PR
git push origin feature/my-feature
```

### Format des commits

```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore
Scopes: auth, vault, crypto, ui, api, etc.
```

**Exemples:**
- `feat(crypto): implement AES-256-GCM encryption`
- `fix(auth): correct JWT token expiration`
- `test(vault): add property tests for CRUD operations`
- `docs(api): update Swagger annotations`

### Tester votre code

**Backend:**
```bash
cd backend
mvn test                    # Tests unitaires
mvn checkstyle:check        # Style de code
mvn package                 # Build complet
```

**Frontend:**
```bash
cd frontend
npm test                    # Tests unitaires
npm run lint                # Linting
npm run build               # Build production
```

## 🔄 CI/CD

### Déploiement automatique

- **Push sur `develop`** → Déploie sur staging
- **Tag `v*.*.*`** → Déploie en production

### Déploiement manuel

```bash
# Staging
./scripts/deploy.sh staging latest

# Production
./scripts/deploy.sh production v1.0.0

# Rollback
./scripts/rollback.sh production v0.9.0
```

## 🐛 Debugging

### Backend ne démarre pas

```bash
# Vérifier les logs
docker-compose logs backend

# Vérifier PostgreSQL
docker-compose logs postgres

# Redémarrer
docker-compose restart backend
```

### Frontend ne démarre pas

```bash
# Vérifier les logs
docker-compose logs frontend

# Nettoyer et rebuild
cd frontend
rm -rf .next node_modules
npm install
npm run build
```

### Base de données corrompue

```bash
# Reset complet (⚠️ PERTE DE DONNÉES)
docker-compose down -v
docker-compose up -d
```

## 📚 Ressources

- [README complet](README.md)
- [Guide CI/CD](.github/CICD_SETUP.md)
- [Spec du projet](.kiro/specs/password-manager/)
- [Configuration Backend](backend/CONFIGURATION.md)
- [Configuration Frontend](frontend/README.md)

## 🆘 Aide

**Problèmes courants:**

1. **Port déjà utilisé**: Changez les ports dans `docker-compose.yml`
2. **Permissions Docker**: Ajoutez votre user au groupe docker: `sudo usermod -aG docker $USER`
3. **Mémoire insuffisante**: Augmentez la RAM allouée à Docker (4GB minimum)

**Besoin d'aide?**
- Ouvrez une issue sur GitHub
- Consultez la documentation dans `/docs`
- Vérifiez les logs: `docker-compose logs -f`
