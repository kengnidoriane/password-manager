# CI/CD Setup Guide

Ce guide explique comment configurer et utiliser les workflows GitHub Actions pour ce projet.

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Configuration initiale](#configuration-initiale)
3. [Secrets requis](#secrets-requis)
4. [Workflows disponibles](#workflows-disponibles)
5. [Déploiement](#déploiement)

## Vue d'ensemble

Le projet utilise GitHub Actions pour:
- ✅ Tests automatiques (backend + frontend)
- ✅ Vérifications de qualité de code (ESLint, Checkstyle, Prettier)
- ✅ Scan de sécurité (Trivy, npm audit)
- ✅ Build et push des images Docker
- ✅ Déploiement automatique (staging + production)

## Configuration initiale

### 1. Activer GitHub Actions

1. Allez dans **Settings** → **Actions** → **General**
2. Sous "Actions permissions", sélectionnez **Allow all actions**
3. Sous "Workflow permissions", sélectionnez **Read and write permissions**

### 2. Activer GitHub Container Registry

1. Allez dans **Settings** → **Packages**
2. Assurez-vous que le package visibility est configuré

### 3. Créer les environnements

1. Allez dans **Settings** → **Environments**
2. Créez deux environnements:
   - `staging`
   - `production`
3. Pour `production`, activez **Required reviewers** (recommandé)

## Secrets requis

Configurez ces secrets dans **Settings** → **Secrets and variables** → **Actions**:

### Pour le déploiement SSH (Option 1)

```
STAGING_HOST=staging.your-domain.com
STAGING_USER=deploy
STAGING_SSH_KEY=<votre clé SSH privée>

PROD_HOST=your-domain.com
PROD_USER=deploy
PROD_SSH_KEY=<votre clé SSH privée>
```

### Pour Kubernetes (Option 2)

```
KUBE_CONFIG=<votre kubeconfig en base64>
```

Pour encoder votre kubeconfig:
```bash
cat ~/.kube/config | base64 -w 0
```

### Secrets optionnels

```
CODECOV_TOKEN=<token pour coverage reports>
SLACK_WEBHOOK=<webhook pour notifications>
```

## Workflows disponibles

### 1. CI - Tests and Quality Checks (`ci.yml`)

**Déclenché par:**
- Push sur `main` ou `develop`
- Pull requests vers `main` ou `develop`

**Actions:**
- Détecte les changements (backend/frontend)
- Execute les tests unitaires
- Vérifie la qualité du code
- Scan de sécurité
- Build les applications

**Optimisation:** Ne teste que les parties modifiées du monorepo.

### 2. Pull Request Checks (`pr-checks.yml`)

**Déclenché par:**
- Ouverture/mise à jour d'une PR

**Actions:**
- Vérifie le format du titre de la PR
- Détecte les fichiers volumineux
- Scan pour secrets exposés
- Ajoute des labels de taille
- Commente avec info de preview

### 3. Deploy to Staging (`deploy-staging.yml`)

**Déclenché par:**
- Push sur `develop`
- Manuellement via workflow_dispatch

**Actions:**
- Build les images Docker
- Push vers GitHub Container Registry
- Déploie sur l'environnement staging
- Execute des smoke tests

### 4. Deploy to Production (`deploy-production.yml`)

**Déclenché par:**
- Push d'un tag `v*.*.*` (ex: `v1.0.0`)
- Manuellement via workflow_dispatch

**Actions:**
- Build les images Docker avec version
- Déploie en production (Blue-Green)
- Execute des smoke tests
- Rollback automatique en cas d'échec
- Crée une GitHub Release

## Déploiement

### Déploiement Staging

**Automatique:**
```bash
git checkout develop
git add .
git commit -m "feat(auth): add JWT authentication"
git push origin develop
```

**Manuel:**
1. Allez dans **Actions** → **Deploy to Staging**
2. Cliquez sur **Run workflow**
3. Sélectionnez la branche `develop`

### Déploiement Production

**Via tag (recommandé):**
```bash
# Créer et pousser un tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

**Manuel:**
1. Allez dans **Actions** → **Deploy to Production**
2. Cliquez sur **Run workflow**
3. Entrez la version (ex: `v1.0.0`)

### Rollback

Si un déploiement échoue, le workflow effectue automatiquement un rollback.

**Rollback manuel:**
```bash
# Redéployer une version précédente
git tag -a v1.0.1 -m "Rollback to stable version"
git push origin v1.0.1
```

## Configuration du serveur de déploiement

### Option 1: Déploiement SSH + Docker Compose

**Sur votre serveur:**

1. Installer Docker et Docker Compose
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

2. Créer le répertoire de déploiement
```bash
sudo mkdir -p /opt/password-manager
sudo chown $USER:$USER /opt/password-manager
```

3. Cloner le repo
```bash
cd /opt/password-manager
git clone https://github.com/your-username/password-manager.git .
```

4. Créer `docker-compose.prod.yml`
```yaml
version: '3.8'
services:
  backend:
    image: ghcr.io/your-username/password-manager-backend:latest
    environment:
      SPRING_PROFILES_ACTIVE: prod
    ports:
      - "8080:8080"
  
  frontend:
    image: ghcr.io/your-username/password-manager-frontend:latest
    ports:
      - "3000:3000"
```

5. Configurer l'authentification GitHub Container Registry
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

### Option 2: Déploiement Kubernetes

**Créer les manifests K8s:**

```bash
# Voir les fichiers dans le dossier k8s/ (à créer via les tasks)
kubectl apply -f k8s/
```

## Monitoring

### Voir les logs de déploiement

1. Allez dans **Actions**
2. Cliquez sur le workflow en cours
3. Consultez les logs de chaque job

### Notifications

Pour recevoir des notifications Slack/Discord:

1. Créez un webhook
2. Ajoutez le secret `SLACK_WEBHOOK`
3. Décommentez les sections de notification dans les workflows

## Troubleshooting

### Les tests échouent

```bash
# Tester localement
cd backend && mvn test
cd frontend && npm test
```

### Le build Docker échoue

```bash
# Tester le build localement
docker build -t test-backend ./backend
docker build -t test-frontend ./frontend
```

### Problèmes de permissions

Vérifiez que:
- Les secrets sont bien configurés
- Les environnements existent
- Les permissions GitHub Actions sont activées

### Le déploiement échoue

1. Vérifiez les logs dans Actions
2. Testez la connexion SSH manuellement
3. Vérifiez que Docker est installé sur le serveur
4. Vérifiez les credentials du registry

## Bonnes pratiques

1. **Toujours tester localement** avant de pousser
2. **Utiliser des branches feature** pour le développement
3. **Créer des PRs** pour review avant merge
4. **Tagger les releases** avec semantic versioning
5. **Monitorer les déploiements** dans Actions
6. **Garder les secrets à jour** et sécurisés

## Ressources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
