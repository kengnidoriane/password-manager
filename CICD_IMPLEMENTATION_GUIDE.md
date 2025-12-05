# Guide d'Implémentation CI/CD sur GitHub - Étape par Étape

Ce guide vous accompagne dans la mise en place complète du CI/CD pour votre projet Password Manager.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Phase 1: Configuration GitHub](#phase-1-configuration-github)
3. [Phase 2: Configuration des Secrets](#phase-2-configuration-des-secrets)
4. [Phase 3: Configuration du Serveur](#phase-3-configuration-du-serveur)
5. [Phase 4: Test des Workflows](#phase-4-test-des-workflows)
6. [Phase 5: Premier Déploiement](#phase-5-premier-déploiement)
7. [Vérification et Monitoring](#vérification-et-monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Prérequis

Avant de commencer, assurez-vous d'avoir:

- ✅ Un compte GitHub avec accès au repository
- ✅ Un serveur pour staging (optionnel mais recommandé)
- ✅ Un serveur pour production
- ✅ Docker et Docker Compose installés sur les serveurs
- ✅ Accès SSH aux serveurs
- ✅ Un nom de domaine configuré (optionnel pour le début)

**Temps estimé:** 2-3 heures pour la configuration complète

---

## Phase 1: Configuration GitHub

### Étape 1.1: Activer GitHub Actions

1. Allez sur votre repository GitHub
2. Cliquez sur **Settings** (en haut à droite)
3. Dans le menu de gauche, cliquez sur **Actions** → **General**
4. Sous "Actions permissions":
   - Sélectionnez **"Allow all actions and reusable workflows"**
5. Sous "Workflow permissions":
   - Sélectionnez **"Read and write permissions"**
   - Cochez **"Allow GitHub Actions to create and approve pull requests"**
6. Cliquez sur **Save**

✅ **Vérification:** Vous devriez voir un onglet "Actions" dans votre repository.

### Étape 1.2: Activer GitHub Container Registry (GHCR)

1. Toujours dans **Settings**
2. Cliquez sur **Packages** dans le menu de gauche
3. Sous "Package creation":
   - Assurez-vous que les packages peuvent être créés
4. Notez votre nom d'utilisateur GitHub (vous en aurez besoin)

✅ **Vérification:** Vous pouvez voir la section Packages sur votre profil GitHub.

### Étape 1.3: Créer les Environnements

1. Dans **Settings**, cliquez sur **Environments**
2. Cliquez sur **New environment**
3. Créez l'environnement **staging**:
   - Nom: `staging`
   - Cliquez sur **Configure environment**
   - (Optionnel) Ajoutez des "Deployment protection rules" si vous voulez des approbations
   - Cliquez sur **Save protection rules**

4. Répétez pour l'environnement **production**:
   - Nom: `production`
   - **Important:** Activez **"Required reviewers"**
   - Ajoutez-vous (et d'autres membres) comme reviewers
   - (Optionnel) Ajoutez un "Wait timer" de 5-10 minutes
   - Cliquez sur **Save protection rules**

✅ **Vérification:** Vous devriez voir deux environnements listés.

### Étape 1.4: Configurer les Labels (Optionnel mais recommandé)

1. Dans **Settings**, cliquez sur **Labels**
2. Vous pouvez créer les labels manuellement ou utiliser un outil
3. Créez au minimum ces labels:
   - `type: bug` (rouge)
   - `type: feature` (bleu clair)
   - `size/s`, `size/m`, `size/l` (différentes couleurs)
   - `component: frontend` (bleu)
   - `component: backend` (vert)

✅ **Vérification:** Les labels apparaissent dans la liste.

---

## Phase 2: Configuration des Secrets

### Étape 2.1: Générer une Clé SSH pour le Déploiement

Sur votre machine locale:

```bash
# Générer une nouvelle clé SSH (sans passphrase)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key

# Afficher la clé publique
cat ~/.ssh/github_deploy_key.pub

# Afficher la clé privée
cat ~/.ssh/github_deploy_key
```

**Important:** Copiez ces deux clés dans un fichier temporaire.

### Étape 2.2: Configurer l'Accès SSH sur les Serveurs

**Sur votre serveur de staging:**

```bash
# Se connecter au serveur
ssh votre-user@staging.your-domain.com

# Créer un utilisateur pour le déploiement
sudo adduser deploy
sudo usermod -aG docker deploy

# Passer à l'utilisateur deploy
sudo su - deploy

# Créer le dossier .ssh
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Ajouter la clé publique
nano ~/.ssh/authorized_keys
# Collez la clé publique générée précédemment
# Sauvegardez avec Ctrl+X, Y, Enter

chmod 600 ~/.ssh/authorized_keys
exit
```

**Répétez pour le serveur de production.**

✅ **Vérification:** Testez la connexion depuis votre machine:
```bash
ssh -i ~/.ssh/github_deploy_key deploy@staging.your-domain.com
```

### Étape 2.3: Ajouter les Secrets dans GitHub

1. Dans votre repository, allez dans **Settings** → **Secrets and variables** → **Actions**
2. Cliquez sur **New repository secret**
3. Ajoutez les secrets suivants:

**Pour le déploiement SSH:**

| Nom du Secret | Valeur | Description |
|---------------|--------|-------------|
| `STAGING_HOST` | `staging.your-domain.com` | Adresse du serveur staging |
| `STAGING_USER` | `deploy` | Utilisateur SSH pour staging |
| `STAGING_SSH_KEY` | Contenu de `~/.ssh/github_deploy_key` | Clé privée SSH (tout le contenu) |
| `PROD_HOST` | `your-domain.com` | Adresse du serveur production |
| `PROD_USER` | `deploy` | Utilisateur SSH pour production |
| `PROD_SSH_KEY` | Contenu de `~/.ssh/github_deploy_key` | Clé privée SSH |

**Pour l'application:**

| Nom du Secret | Valeur | Exemple |
|---------------|--------|---------|
| `POSTGRES_PASSWORD` | Mot de passe fort | `MyStr0ngP@ssw0rd!` |
| `REDIS_PASSWORD` | Mot de passe fort | `R3d!sP@ssw0rd!` |
| `JWT_SECRET` | Secret très long (256+ bits) | `your-very-long-random-secret-here` |

**Comment ajouter un secret:**
1. Cliquez sur **New repository secret**
2. Entrez le **Name** (ex: `STAGING_HOST`)
3. Entrez la **Value**
4. Cliquez sur **Add secret**
5. Répétez pour chaque secret

✅ **Vérification:** Tous les secrets apparaissent dans la liste (les valeurs sont masquées).

### Étape 2.4: Mettre à Jour les Workflows avec Votre Repository

Modifiez les fichiers de workflow pour utiliser votre nom d'utilisateur:

```bash
# Remplacez "your-username" par votre nom d'utilisateur GitHub
# Dans les fichiers:
# - .github/workflows/deploy-staging.yml
# - .github/workflows/deploy-production.yml
# - docker-compose.prod.yml
```

**Exemple dans `.github/workflows/deploy-staging.yml`:**
```yaml
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: votre-username/password-manager  # ← Changez ici
```

---

## Phase 3: Configuration du Serveur

### Étape 3.1: Préparer le Serveur de Staging

**Connectez-vous au serveur:**
```bash
ssh deploy@staging.your-domain.com
```

**Installez Docker et Docker Compose:**
```bash
# Installer Docker
curl -fsSL https://get.docker.com | sh

# Vérifier l'installation
docker --version
docker-compose --version

# Ajouter l'utilisateur au groupe docker (si pas déjà fait)
sudo usermod -aG docker $USER

# Déconnectez-vous et reconnectez-vous pour appliquer les changements
exit
ssh deploy@staging.your-domain.com
```

**Créer la structure de déploiement:**
```bash
# Créer le répertoire de déploiement
mkdir -p /home/deploy/password-manager
cd /home/deploy/password-manager

# Créer le fichier .env.staging
nano .env.staging
```

**Contenu de `.env.staging`:**
```bash
GITHUB_REPOSITORY=votre-username/password-manager
VERSION=staging

POSTGRES_DB=password_manager
POSTGRES_USER=postgres
POSTGRES_PASSWORD=VOTRE_MOT_DE_PASSE_POSTGRES

REDIS_PASSWORD=VOTRE_MOT_DE_PASSE_REDIS

JWT_SECRET=VOTRE_SECRET_JWT_TRES_LONG
JWT_EXPIRATION=900000
CORS_ALLOWED_ORIGINS=https://staging.your-domain.com

NEXT_PUBLIC_API_URL=https://staging.your-domain.com/api/v1
```

Sauvegardez avec `Ctrl+X`, `Y`, `Enter`.

**Configurer l'authentification au GitHub Container Registry:**
```bash
# Créer un Personal Access Token sur GitHub:
# 1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
# 2. Generate new token (classic)
# 3. Cochez: read:packages, write:packages
# 4. Copiez le token

# Se connecter au registry
echo VOTRE_TOKEN | docker login ghcr.io -u VOTRE_USERNAME --password-stdin
```

**Cloner le repository:**
```bash
cd /home/deploy/password-manager
git clone https://github.com/votre-username/password-manager.git .
```

✅ **Vérification:** 
```bash
ls -la
# Vous devriez voir: docker-compose.prod.yml, .env.staging, etc.
```

### Étape 3.2: Préparer le Serveur de Production

**Répétez les mêmes étapes que pour staging**, mais:
- Utilisez `.env.production` au lieu de `.env.staging`
- Utilisez `VERSION=latest` ou `VERSION=production`
- Utilisez les URLs de production dans `CORS_ALLOWED_ORIGINS` et `NEXT_PUBLIC_API_URL`

### Étape 3.3: Configuration Nginx (Optionnel mais recommandé)

Si vous voulez utiliser Nginx comme reverse proxy:

```bash
# Sur le serveur
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx

# Copier la configuration Nginx
sudo cp /home/deploy/password-manager/nginx/nginx.conf /etc/nginx/sites-available/password-manager

# Modifier avec votre domaine
sudo nano /etc/nginx/sites-available/password-manager
# Remplacez "your-domain.com" par votre vrai domaine

# Activer le site
sudo ln -s /etc/nginx/sites-available/password-manager /etc/nginx/sites-enabled/

# Obtenir un certificat SSL
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Redémarrer Nginx
sudo systemctl restart nginx
```

---

## Phase 4: Test des Workflows

### Étape 4.1: Tester le Workflow CI

1. Créez une branche de test:
```bash
git checkout -b test/ci-setup
```

2. Faites un petit changement (ex: ajoutez un commentaire dans un fichier)
```bash
echo "// Test CI" >> frontend/src/app/page.tsx
git add .
git commit -m "test(ci): verify CI workflow"
git push origin test/ci-setup
```

3. Créez une Pull Request sur GitHub
4. Allez dans l'onglet **Actions**
5. Vous devriez voir le workflow "CI - Tests and Quality Checks" en cours

✅ **Vérification:** Le workflow doit passer au vert (✓).

**Si le workflow échoue:**
- Cliquez sur le workflow pour voir les logs
- Identifiez l'étape qui échoue
- Corrigez le problème
- Poussez un nouveau commit

### Étape 4.2: Tester le Déploiement Staging (Manuel)

1. Allez dans **Actions** → **Deploy to Staging**
2. Cliquez sur **Run workflow**
3. Sélectionnez la branche `develop` (ou `main` pour tester)
4. Cliquez sur **Run workflow**
5. Observez l'exécution

✅ **Vérification:** 
- Le workflow se termine avec succès
- Sur le serveur staging, vérifiez:
```bash
ssh deploy@staging.your-domain.com
cd /home/deploy/password-manager
docker-compose -f docker-compose.prod.yml ps
# Tous les services doivent être "Up"
```

### Étape 4.3: Vérifier l'Application

Ouvrez votre navigateur:
- Frontend: `https://staging.your-domain.com`
- Backend: `https://staging.your-domain.com/api/v1/health`
- Swagger: `https://staging.your-domain.com/swagger-ui.html`

✅ **Vérification:** Toutes les URLs répondent correctement.

---

## Phase 5: Premier Déploiement

### Étape 5.1: Préparer la Release

1. Assurez-vous que tout fonctionne sur staging
2. Mergez toutes les PRs dans `main`
3. Mettez à jour le CHANGELOG (si vous en avez un)

### Étape 5.2: Créer un Tag de Version

```bash
# Assurez-vous d'être sur main et à jour
git checkout main
git pull origin main

# Créer un tag
git tag -a v1.0.0 -m "Release version 1.0.0 - Initial production release"

# Pousser le tag
git push origin v1.0.0
```

### Étape 5.3: Déploiement Automatique

1. Le push du tag déclenche automatiquement le workflow "Deploy to Production"
2. Allez dans **Actions** pour suivre le déploiement
3. Si vous avez configuré des "Required reviewers", vous devrez approuver:
   - Allez dans **Actions** → Cliquez sur le workflow en cours
   - Cliquez sur **Review deployments**
   - Cochez `production`
   - Cliquez sur **Approve and deploy**

### Étape 5.4: Vérification Post-Déploiement

**Sur le serveur:**
```bash
ssh deploy@your-domain.com
cd /home/deploy/password-manager
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs --tail=50
```

**Dans le navigateur:**
- Testez toutes les fonctionnalités principales
- Vérifiez les logs dans la console du navigateur
- Testez l'inscription et la connexion

✅ **Vérification:** L'application fonctionne correctement en production!

---

## Vérification et Monitoring

### Checklist Post-Déploiement

- [ ] Frontend accessible et responsive
- [ ] Backend API répond correctement
- [ ] Base de données fonctionne
- [ ] Redis fonctionne
- [ ] Authentification fonctionne
- [ ] Certificat SSL valide
- [ ] Logs accessibles
- [ ] Pas d'erreurs dans les logs

### Commandes de Monitoring

**Voir les logs en temps réel:**
```bash
ssh deploy@your-domain.com
cd /home/deploy/password-manager
docker-compose -f docker-compose.prod.yml logs -f
```

**Voir l'utilisation des ressources:**
```bash
docker stats
```

**Vérifier la santé des services:**
```bash
curl https://your-domain.com/api/v1/health
```

### Configurer des Alertes (Optionnel)

**Uptime monitoring gratuit:**
- [UptimeRobot](https://uptimerobot.com/) - Gratuit jusqu'à 50 monitors
- [Pingdom](https://www.pingdom.com/) - Essai gratuit
- [StatusCake](https://www.statuscake.com/) - Plan gratuit disponible

**Configuration basique:**
1. Créez un compte
2. Ajoutez votre URL: `https://your-domain.com/api/v1/health`
3. Configurez les notifications par email

---

## Troubleshooting

### Problème: Le workflow CI échoue

**Symptôme:** Tests échouent, build échoue

**Solutions:**
1. Vérifiez les logs dans Actions
2. Testez localement:
```bash
cd backend && mvn test
cd frontend && npm test
```
3. Vérifiez que les services (PostgreSQL, Redis) démarrent correctement
4. Vérifiez les variables d'environnement

### Problème: Impossible de se connecter au serveur

**Symptôme:** "Permission denied" ou "Connection refused"

**Solutions:**
1. Vérifiez la clé SSH:
```bash
ssh -i ~/.ssh/github_deploy_key deploy@your-domain.com
```
2. Vérifiez que la clé publique est dans `~/.ssh/authorized_keys` sur le serveur
3. Vérifiez les permissions:
```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Problème: Les images Docker ne se téléchargent pas

**Symptôme:** "Error response from daemon: pull access denied"

**Solutions:**
1. Vérifiez l'authentification au registry:
```bash
docker login ghcr.io
```
2. Vérifiez que les images existent:
```bash
docker pull ghcr.io/votre-username/password-manager-backend:latest
```
3. Vérifiez les permissions du package sur GitHub

### Problème: Le déploiement réussit mais l'app ne fonctionne pas

**Symptôme:** Erreur 502, 503, ou page blanche

**Solutions:**
1. Vérifiez les logs:
```bash
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
```
2. Vérifiez que les services sont "Up":
```bash
docker-compose -f docker-compose.prod.yml ps
```
3. Vérifiez les variables d'environnement dans `.env.production`
4. Vérifiez la connectivité entre les services:
```bash
docker-compose -f docker-compose.prod.yml exec backend ping postgres
```

### Problème: Certificat SSL invalide

**Symptôme:** "Your connection is not private"

**Solutions:**
1. Vérifiez que Certbot a bien généré le certificat:
```bash
sudo certbot certificates
```
2. Renouvelez le certificat:
```bash
sudo certbot renew
```
3. Vérifiez la configuration Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## Prochaines Étapes

Maintenant que votre CI/CD est configuré:

1. **Automatisez davantage:**
   - Ajoutez des tests E2E avec Cypress
   - Configurez des scans de sécurité automatiques
   - Ajoutez des notifications Slack/Discord

2. **Améliorez le monitoring:**
   - Configurez Prometheus + Grafana
   - Ajoutez des alertes pour les erreurs
   - Configurez des logs centralisés

3. **Optimisez les déploiements:**
   - Implémentez le blue-green deployment
   - Ajoutez des canary deployments
   - Configurez l'auto-scaling

4. **Documentation:**
   - Documentez vos processus de déploiement
   - Créez un runbook pour les incidents
   - Formez votre équipe

---

## Ressources Utiles

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

## Support

Si vous rencontrez des problèmes:
1. Consultez les logs détaillés dans GitHub Actions
2. Vérifiez la section Troubleshooting ci-dessus
3. Ouvrez une issue sur le repository
4. Consultez la documentation officielle des outils utilisés

**Félicitations! Votre CI/CD est maintenant opérationnel! 🎉**
