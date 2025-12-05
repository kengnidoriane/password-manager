# Documentation CI/CD

Bienvenue dans la documentation CI/CD du projet Password Manager.

## 📚 Documents Disponibles

### 🚀 [Guide d'Implémentation Complet](../CICD_IMPLEMENTATION_GUIDE.md)
Guide détaillé étape par étape pour configurer le CI/CD de A à Z.
- Configuration GitHub (Actions, Secrets, Environnements)
- Configuration des serveurs (Staging & Production)
- Tests et validation
- Premier déploiement

**Temps estimé:** 2-3 heures  
**Niveau:** Débutant à Intermédiaire

---

### ✅ [Checklist de Configuration](../CICD_CHECKLIST.md)
Liste de vérification rapide pour s'assurer que tout est configuré.
- Configuration GitHub ☑️
- Secrets ☑️
- Serveurs ☑️
- Tests ☑️
- Monitoring ☑️

**Temps estimé:** 15-30 minutes (vérification)  
**Niveau:** Tous niveaux

---

### 🔧 [Guide de Dépannage](../CICD_TROUBLESHOOTING.md)
Solutions rapides aux problèmes courants.
- Problèmes GitHub Actions
- Problèmes de Secrets
- Problèmes Serveur
- Problèmes Docker
- Problèmes Nginx
- Commandes d'urgence

**Temps estimé:** Variable selon le problème  
**Niveau:** Intermédiaire à Avancé

---

### ⚡ [Guide de Démarrage Rapide](../QUICK_START.md)
Pour démarrer rapidement avec le projet (développement local).
- Setup en 5 minutes
- Workflow de développement
- Tests
- Déploiement

**Temps estimé:** 5-10 minutes  
**Niveau:** Tous niveaux

---

## 🔄 Workflows Disponibles

### 1. CI - Tests and Quality Checks
**Fichier:** [`.github/workflows/ci.yml`](workflows/ci.yml)

**Déclenché par:**
- Push sur `main` ou `develop`
- Pull Requests vers `main` ou `develop`

**Actions:**
- Détection des changements (backend/frontend)
- Tests unitaires
- Vérifications de qualité (ESLint, Checkstyle, Prettier)
- Scan de sécurité (Trivy, npm audit)
- Build des applications

**Optimisation:** Ne teste que les parties modifiées du monorepo.

---

### 2. Pull Request Checks
**Fichier:** [`.github/workflows/pr-checks.yml`](workflows/pr-checks.yml)

**Déclenché par:**
- Ouverture/mise à jour d'une PR

**Actions:**
- Vérification du format du titre
- Détection de fichiers volumineux
- Scan de secrets exposés
- Ajout de labels de taille
- Commentaire avec info de preview

---

### 3. Deploy to Staging
**Fichier:** [`.github/workflows/deploy-staging.yml`](workflows/deploy-staging.yml)

**Déclenché par:**
- Push sur `develop`
- Manuellement via workflow_dispatch

**Actions:**
- Build des images Docker
- Push vers GitHub Container Registry
- Déploiement sur staging
- Smoke tests

**Environnement:** `staging`

---

### 4. Deploy to Production
**Fichier:** [`.github/workflows/deploy-production.yml`](workflows/deploy-production.yml)

**Déclenché par:**
- Push d'un tag `v*.*.*` (ex: `v1.0.0`)
- Manuellement via workflow_dispatch

**Actions:**
- Build des images Docker avec version
- Déploiement en production (Blue-Green)
- Smoke tests
- Rollback automatique en cas d'échec
- Création d'une GitHub Release

**Environnement:** `production` (nécessite approbation)

---

## 🎯 Workflows Typiques

### Développement d'une Feature

```bash
# 1. Créer une branche
git checkout -b feature/my-feature

# 2. Développer et commiter
git add .
git commit -m "feat(scope): description"

# 3. Pousser et créer une PR
git push origin feature/my-feature
# Créer la PR sur GitHub

# 4. Le workflow CI se déclenche automatiquement
# 5. Après review et approbation, merger dans develop

# 6. Le déploiement staging se déclenche automatiquement
```

### Déploiement en Production

```bash
# 1. S'assurer que staging fonctionne bien

# 2. Merger develop dans main
git checkout main
git merge develop
git push origin main

# 3. Créer et pousser un tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 4. Le workflow de production se déclenche
# 5. Approuver le déploiement si nécessaire
# 6. Vérifier que tout fonctionne
```

### Rollback d'Urgence

```bash
# Méthode 1: Via script (sur le serveur)
ssh deploy@your-domain.com
cd /home/deploy/password-manager
./scripts/rollback.sh production v0.9.0

# Méthode 2: Via nouveau tag
git tag -a v1.0.1 -m "Rollback to stable version"
git push origin v1.0.1
```

---

## 🔐 Secrets Requis

### Secrets de Déploiement

| Secret | Description | Exemple |
|--------|-------------|---------|
| `STAGING_HOST` | Adresse du serveur staging | `staging.example.com` |
| `STAGING_USER` | Utilisateur SSH staging | `deploy` |
| `STAGING_SSH_KEY` | Clé privée SSH staging | `-----BEGIN OPENSSH...` |
| `PROD_HOST` | Adresse du serveur production | `example.com` |
| `PROD_USER` | Utilisateur SSH production | `deploy` |
| `PROD_SSH_KEY` | Clé privée SSH production | `-----BEGIN OPENSSH...` |

### Secrets d'Application

| Secret | Description | Génération |
|--------|-------------|------------|
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | `openssl rand -base64 32` |
| `REDIS_PASSWORD` | Mot de passe Redis | `openssl rand -base64 32` |
| `JWT_SECRET` | Secret pour JWT | `openssl rand -base64 64` |

---

## 📊 Monitoring

### Vérifier l'État des Workflows

1. Allez dans l'onglet **Actions** du repository
2. Vous verrez tous les workflows récents
3. Cliquez sur un workflow pour voir les détails
4. Cliquez sur un job pour voir les logs

### Vérifier l'État des Déploiements

1. Allez dans l'onglet **Environments**
2. Vous verrez l'historique des déploiements
3. Cliquez sur un déploiement pour voir les détails

### Vérifier les Services sur le Serveur

```bash
# Se connecter au serveur
ssh deploy@your-domain.com

# Vérifier l'état
cd /home/deploy/password-manager
docker-compose -f docker-compose.prod.yml ps

# Voir les logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 🆘 Support

### En cas de problème

1. **Consultez le guide de dépannage:** [CICD_TROUBLESHOOTING.md](../CICD_TROUBLESHOOTING.md)
2. **Vérifiez les logs:**
   - Dans GitHub Actions
   - Sur le serveur (`docker-compose logs`)
3. **Ouvrez une issue** avec:
   - Description du problème
   - Logs pertinents
   - Étapes pour reproduire

### Ressources Utiles

- [Documentation GitHub Actions](https://docs.github.com/en/actions)
- [Documentation Docker](https://docs.docker.com/)
- [Documentation Docker Compose](https://docs.docker.com/compose/)
- [Documentation Nginx](https://nginx.org/en/docs/)

---

## 🔄 Mises à Jour

### Mettre à Jour les Workflows

1. Modifiez les fichiers dans `.github/workflows/`
2. Committez et poussez
3. Les workflows seront automatiquement mis à jour

### Mettre à Jour la Configuration Serveur

1. Modifiez `docker-compose.prod.yml` ou `nginx/nginx.conf`
2. Committez et poussez
3. Sur le serveur:
```bash
cd /home/deploy/password-manager
git pull
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📈 Métriques et KPIs

### Métriques à Suivre

- **Temps de build:** Objectif < 10 minutes
- **Taux de succès des déploiements:** Objectif > 95%
- **Temps de déploiement:** Objectif < 5 minutes
- **Fréquence des déploiements:** Variable selon le projet
- **Temps de rollback:** Objectif < 2 minutes

### Où Voir les Métriques

- GitHub Actions → Insights
- Environments → Deployment history
- Logs des workflows

---

## 🎓 Formation

### Pour les Nouveaux Développeurs

1. Lire le [Guide de Démarrage Rapide](../QUICK_START.md)
2. Lire le [Guide d'Implémentation](../CICD_IMPLEMENTATION_GUIDE.md)
3. Faire un déploiement test sur staging
4. Participer à une review de PR

### Pour les DevOps

1. Lire tous les documents CI/CD
2. Vérifier la configuration des serveurs
3. Tester les procédures de rollback
4. Configurer le monitoring avancé

---

## 📝 Changelog

### Version 1.0.0 (Décembre 2024)
- Configuration initiale du CI/CD
- Workflows pour CI, staging et production
- Documentation complète
- Scripts de déploiement et rollback

---

**Maintenu par:** L'équipe DevOps  
**Dernière mise à jour:** Décembre 2024  
**Contact:** [Ouvrir une issue](../../issues)
