# Checklist CI/CD - Configuration Rapide

Utilisez cette checklist pour vous assurer que tout est configuré correctement.

## ☑️ Configuration GitHub

### Actions & Permissions
- [ ] GitHub Actions activé (Settings → Actions → General)
- [ ] "Allow all actions" sélectionné
- [ ] "Read and write permissions" activé
- [ ] "Allow GitHub Actions to create and approve pull requests" coché

### Container Registry
- [ ] GitHub Container Registry (GHCR) accessible
- [ ] Nom d'utilisateur GitHub noté

### Environnements
- [ ] Environnement `staging` créé
- [ ] Environnement `production` créé
- [ ] "Required reviewers" activé pour production
- [ ] Reviewers ajoutés pour production

### Labels (Optionnel)
- [ ] Labels de type créés (bug, feature, etc.)
- [ ] Labels de taille créés (s, m, l, xl)
- [ ] Labels de composant créés (frontend, backend)

---

## 🔐 Secrets GitHub

### Secrets de Déploiement
- [ ] `STAGING_HOST` configuré
- [ ] `STAGING_USER` configuré
- [ ] `STAGING_SSH_KEY` configuré (clé privée complète)
- [ ] `PROD_HOST` configuré
- [ ] `PROD_USER` configuré
- [ ] `PROD_SSH_KEY` configuré (clé privée complète)

### Secrets d'Application
- [ ] `POSTGRES_PASSWORD` configuré (mot de passe fort)
- [ ] `REDIS_PASSWORD` configuré (mot de passe fort)
- [ ] `JWT_SECRET` configuré (256+ bits)

### Vérification
- [ ] Tous les secrets apparaissent dans Settings → Secrets
- [ ] Aucune valeur visible (toutes masquées)

---

## 🖥️ Configuration Serveur Staging

### Installation
- [ ] Docker installé (`docker --version`)
- [ ] Docker Compose installé (`docker-compose --version`)
- [ ] Utilisateur `deploy` créé
- [ ] Utilisateur `deploy` dans le groupe docker

### SSH
- [ ] Clé SSH publique ajoutée à `~/.ssh/authorized_keys`
- [ ] Permissions correctes (700 pour .ssh, 600 pour authorized_keys)
- [ ] Connexion SSH testée depuis votre machine

### Structure de Déploiement
- [ ] Répertoire `/home/deploy/password-manager` créé
- [ ] Repository cloné dans ce répertoire
- [ ] Fichier `.env.staging` créé et configuré
- [ ] Authentification GHCR configurée (`docker login ghcr.io`)

### Nginx (Si utilisé)
- [ ] Nginx installé
- [ ] Configuration copiée et modifiée
- [ ] Certificat SSL obtenu (Certbot)
- [ ] Nginx redémarré

---

## 🖥️ Configuration Serveur Production

### Installation
- [ ] Docker installé
- [ ] Docker Compose installé
- [ ] Utilisateur `deploy` créé
- [ ] Utilisateur `deploy` dans le groupe docker

### SSH
- [ ] Clé SSH publique ajoutée
- [ ] Permissions correctes
- [ ] Connexion SSH testée

### Structure de Déploiement
- [ ] Répertoire `/home/deploy/password-manager` créé
- [ ] Repository cloné
- [ ] Fichier `.env.production` créé et configuré
- [ ] Authentification GHCR configurée

### Nginx (Si utilisé)
- [ ] Nginx installé et configuré
- [ ] Certificat SSL obtenu
- [ ] Domaine pointant vers le serveur

---

## 📝 Fichiers de Configuration

### Workflows Modifiés
- [ ] `.github/workflows/ci.yml` - Nom de repository mis à jour
- [ ] `.github/workflows/deploy-staging.yml` - Nom de repository mis à jour
- [ ] `.github/workflows/deploy-production.yml` - Nom de repository mis à jour
- [ ] `docker-compose.prod.yml` - GITHUB_REPOSITORY mis à jour

### Fichiers d'Environnement
- [ ] `.env.staging` créé sur le serveur staging
- [ ] `.env.production` créé sur le serveur production
- [ ] Toutes les variables renseignées
- [ ] Mots de passe forts utilisés

### Nginx
- [ ] `nginx/nginx.conf` - Domaines mis à jour
- [ ] Certificats SSL en place
- [ ] Configuration testée (`nginx -t`)

---

## 🧪 Tests

### Test CI Workflow
- [ ] Branche de test créée
- [ ] Commit poussé
- [ ] Pull Request créée
- [ ] Workflow CI exécuté avec succès
- [ ] Tous les checks passent au vert

### Test Déploiement Staging
- [ ] Workflow "Deploy to Staging" exécuté manuellement
- [ ] Déploiement réussi
- [ ] Services démarrés sur le serveur (`docker-compose ps`)
- [ ] Frontend accessible
- [ ] Backend API répond
- [ ] Swagger accessible

### Test Déploiement Production
- [ ] Tag de version créé (`v1.0.0`)
- [ ] Tag poussé sur GitHub
- [ ] Workflow "Deploy to Production" déclenché
- [ ] Approbation donnée (si required reviewers)
- [ ] Déploiement réussi
- [ ] Application accessible en production

---

## ✅ Vérifications Post-Déploiement

### Fonctionnalités
- [ ] Page d'accueil charge correctement
- [ ] Inscription fonctionne
- [ ] Connexion fonctionne
- [ ] API répond correctement
- [ ] Base de données accessible
- [ ] Redis fonctionne

### Sécurité
- [ ] HTTPS activé (certificat valide)
- [ ] Pas d'erreurs SSL
- [ ] Headers de sécurité présents
- [ ] CORS configuré correctement

### Performance
- [ ] Temps de chargement acceptable (<3s)
- [ ] Pas d'erreurs dans la console
- [ ] Logs propres (pas d'erreurs critiques)

### Monitoring
- [ ] Logs accessibles (`docker-compose logs`)
- [ ] Health check endpoint répond (`/api/v1/health`)
- [ ] Uptime monitoring configuré (optionnel)

---

## 📊 Monitoring Continu

### Quotidien
- [ ] Vérifier les logs d'erreur
- [ ] Vérifier l'uptime
- [ ] Vérifier les performances

### Hebdomadaire
- [ ] Vérifier les mises à jour de sécurité
- [ ] Vérifier l'espace disque
- [ ] Vérifier les backups

### Mensuel
- [ ] Renouveler les certificats SSL (automatique avec Certbot)
- [ ] Audit de sécurité
- [ ] Revue des logs

---

## 🚨 Procédures d'Urgence

### En cas de problème en production
- [ ] Procédure de rollback documentée
- [ ] Script de rollback testé (`./scripts/rollback.sh`)
- [ ] Contacts d'urgence définis
- [ ] Backup récent disponible

### Rollback Rapide
```bash
# Méthode 1: Via script
./scripts/rollback.sh production v0.9.0

# Méthode 2: Via tag
git tag -a v1.0.1 -m "Rollback to stable"
git push origin v1.0.1
```

---

## 📚 Documentation

- [ ] Guide CI/CD lu et compris
- [ ] Procédures documentées
- [ ] Équipe formée
- [ ] Runbook créé pour les incidents

---

## 🎯 Prochaines Améliorations

### Court terme (1-2 semaines)
- [ ] Ajouter des tests E2E
- [ ] Configurer des notifications (Slack/Discord)
- [ ] Améliorer les logs

### Moyen terme (1-2 mois)
- [ ] Implémenter le monitoring avancé (Prometheus/Grafana)
- [ ] Ajouter des alertes automatiques
- [ ] Optimiser les temps de build

### Long terme (3-6 mois)
- [ ] Implémenter le blue-green deployment
- [ ] Configurer l'auto-scaling
- [ ] Ajouter des tests de charge

---

## ✨ Statut Global

**Date de configuration:** _______________

**Configuré par:** _______________

**Statut:**
- [ ] ✅ Tout est configuré et testé
- [ ] ⚠️ Configuration partielle (noter ce qui manque)
- [ ] ❌ Configuration à faire

**Notes:**
_______________________________________
_______________________________________
_______________________________________

---

**Dernière mise à jour:** _______________
