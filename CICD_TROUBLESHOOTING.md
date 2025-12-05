# Guide de Dépannage CI/CD - Solutions Rapides

Guide de résolution rapide des problèmes courants avec le CI/CD.

## 🔍 Diagnostic Rapide

### Commande de diagnostic globale

```bash
# Sur le serveur
cd /home/deploy/password-manager

# Vérifier l'état des services
docker-compose -f docker-compose.prod.yml ps

# Vérifier les logs récents
docker-compose -f docker-compose.prod.yml logs --tail=100

# Vérifier l'utilisation des ressources
docker stats --no-stream
```

---

## ❌ Problèmes GitHub Actions

### Problème: Workflow ne se déclenche pas

**Symptômes:**
- Aucun workflow n'apparaît dans Actions après un push
- Le workflow n'est pas listé

**Solutions:**
1. Vérifiez que GitHub Actions est activé:
   - Settings → Actions → General → "Allow all actions"

2. Vérifiez la syntaxe YAML:
```bash
# Installer yamllint
pip install yamllint

# Vérifier les fichiers
yamllint .github/workflows/*.yml
```

3. Vérifiez les conditions de déclenchement:
```yaml
on:
  push:
    branches: [ main, develop ]  # Vérifiez le nom de la branche
```

---

### Problème: "Permission denied" dans le workflow

**Symptômes:**
- Erreur: "Resource not accessible by integration"
- Impossible de créer des packages

**Solutions:**
1. Vérifiez les permissions du workflow:
   - Settings → Actions → General → Workflow permissions
   - Sélectionnez "Read and write permissions"

2. Ajoutez les permissions dans le workflow:
```yaml
jobs:
  build:
    permissions:
      contents: read
      packages: write
```

---

### Problème: Tests échouent dans CI mais passent localement

**Symptômes:**
- Tests passent sur votre machine
- Tests échouent dans GitHub Actions

**Solutions:**
1. Vérifiez les versions:
```yaml
# Dans le workflow
- uses: actions/setup-node@v4
  with:
    node-version: '20'  # Même version que localement
```

2. Vérifiez les services (PostgreSQL, Redis):
```yaml
services:
  postgres:
    image: postgres:16-alpine  # Même version
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
```

3. Vérifiez les variables d'environnement:
```yaml
env:
  SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/test_db
```

4. Testez avec les mêmes conditions:
```bash
# Localement, utilisez Docker
docker-compose -f docker-compose.test.yml up -d
mvn test
```

---

### Problème: Build Docker échoue

**Symptômes:**
- "Error building image"
- "No space left on device"

**Solutions:**
1. Nettoyez le cache GitHub Actions:
   - Actions → Caches → Supprimer les anciens caches

2. Vérifiez le Dockerfile:
```bash
# Testez localement
docker build -t test-backend ./backend
docker build -t test-frontend ./frontend
```

3. Optimisez le Dockerfile (multi-stage build):
```dockerfile
# Utilisez des images plus petites
FROM node:20-alpine AS builder
# Au lieu de FROM node:20
```

---

## 🔐 Problèmes de Secrets

### Problème: Secret non reconnu

**Symptômes:**
- Variable vide dans le workflow
- Erreur "secret not found"

**Solutions:**
1. Vérifiez l'orthographe exacte:
```yaml
# Sensible à la casse!
${{ secrets.STAGING_HOST }}  # ✅
${{ secrets.staging_host }}  # ❌
```

2. Vérifiez que le secret existe:
   - Settings → Secrets and variables → Actions
   - Le secret doit être listé

3. Pour les environnements, utilisez:
```yaml
environment:
  name: production
# Les secrets d'environnement sont prioritaires
```

---

### Problème: Clé SSH invalide

**Symptômes:**
- "Permission denied (publickey)"
- "Host key verification failed"

**Solutions:**
1. Vérifiez le format de la clé:
```bash
# La clé doit commencer par:
-----BEGIN OPENSSH PRIVATE KEY-----
# Et finir par:
-----END OPENSSH PRIVATE KEY-----
```

2. Incluez TOUTE la clé (avec les retours à la ligne):
   - Copiez depuis `cat ~/.ssh/github_deploy_key`
   - Incluez les lignes BEGIN et END

3. Testez la clé manuellement:
```bash
ssh -i ~/.ssh/github_deploy_key deploy@your-server.com
```

4. Ajoutez le host aux known_hosts dans le workflow:
```yaml
- name: Add SSH key
  run: |
    mkdir -p ~/.ssh
    echo "${{ secrets.STAGING_SSH_KEY }}" > ~/.ssh/id_rsa
    chmod 600 ~/.ssh/id_rsa
    ssh-keyscan -H ${{ secrets.STAGING_HOST }} >> ~/.ssh/known_hosts
```

---

## 🖥️ Problèmes Serveur

### Problème: Impossible de se connecter au serveur

**Symptômes:**
- "Connection refused"
- "Connection timed out"

**Solutions:**
1. Vérifiez que le serveur est accessible:
```bash
ping your-server.com
```

2. Vérifiez le firewall:
```bash
# Sur le serveur
sudo ufw status
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
```

3. Vérifiez le service SSH:
```bash
sudo systemctl status ssh
sudo systemctl restart ssh
```

---

### Problème: Docker n'est pas installé ou ne fonctionne pas

**Symptômes:**
- "docker: command not found"
- "Cannot connect to Docker daemon"

**Solutions:**
1. Installez Docker:
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Déconnectez-vous et reconnectez-vous
```

2. Démarrez le service Docker:
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

3. Vérifiez les permissions:
```bash
# L'utilisateur doit être dans le groupe docker
groups
# Si "docker" n'apparaît pas:
sudo usermod -aG docker $USER
```

---

### Problème: Espace disque insuffisant

**Symptômes:**
- "No space left on device"
- Services ne démarrent pas

**Solutions:**
1. Vérifiez l'espace disque:
```bash
df -h
```

2. Nettoyez Docker:
```bash
# Supprimer les images inutilisées
docker image prune -a -f

# Supprimer les volumes inutilisés
docker volume prune -f

# Nettoyage complet
docker system prune -a --volumes -f
```

3. Nettoyez les logs:
```bash
# Limiter la taille des logs Docker
sudo nano /etc/docker/daemon.json
```
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```
```bash
sudo systemctl restart docker
```

---

## 🐳 Problèmes Docker

### Problème: Impossible de pull les images

**Symptômes:**
- "Error response from daemon: pull access denied"
- "manifest unknown"

**Solutions:**
1. Vérifiez l'authentification:
```bash
docker login ghcr.io
# Utilisez votre username GitHub et un Personal Access Token
```

2. Vérifiez que l'image existe:
```bash
# Sur GitHub, allez dans Packages
# L'image doit être visible et publique (ou vous devez avoir accès)
```

3. Vérifiez le nom de l'image:
```bash
# Format correct:
ghcr.io/username/repository-name:tag
# Exemple:
ghcr.io/johndoe/password-manager-backend:latest
```

4. Rendez le package public (si nécessaire):
   - GitHub → Packages → Votre package
   - Package settings → Change visibility → Public

---

### Problème: Conteneurs ne démarrent pas

**Symptômes:**
- Status "Restarting" ou "Exited"
- Services ne répondent pas

**Solutions:**
1. Vérifiez les logs:
```bash
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
```

2. Vérifiez les variables d'environnement:
```bash
# Assurez-vous que .env.production existe et est chargé
cat .env.production

# Testez avec les variables explicites
docker-compose -f docker-compose.prod.yml config
```

3. Vérifiez les dépendances:
```bash
# PostgreSQL et Redis doivent démarrer en premier
docker-compose -f docker-compose.prod.yml up -d postgres redis
# Attendez qu'ils soient healthy
docker-compose -f docker-compose.prod.yml ps
# Puis démarrez le reste
docker-compose -f docker-compose.prod.yml up -d
```

4. Vérifiez les health checks:
```bash
# Testez manuellement
docker-compose -f docker-compose.prod.yml exec backend curl http://localhost:8080/actuator/health
```

---

### Problème: Erreur de connexion entre services

**Symptômes:**
- Backend ne peut pas se connecter à PostgreSQL
- "Connection refused" entre services

**Solutions:**
1. Vérifiez les noms de réseau:
```yaml
# Dans docker-compose.prod.yml
# Utilisez les noms de service, pas localhost
SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/db
# ✅ "postgres" est le nom du service
# ❌ Pas "localhost"
```

2. Vérifiez que les services sont sur le même réseau:
```bash
docker network ls
docker network inspect password-manager_backend-network
```

3. Testez la connectivité:
```bash
docker-compose -f docker-compose.prod.yml exec backend ping postgres
docker-compose -f docker-compose.prod.yml exec backend ping redis
```

---

## 🌐 Problèmes Nginx

### Problème: Erreur 502 Bad Gateway

**Symptômes:**
- Page affiche "502 Bad Gateway"
- Nginx fonctionne mais l'app ne répond pas

**Solutions:**
1. Vérifiez que les services backend/frontend sont up:
```bash
docker-compose -f docker-compose.prod.yml ps
```

2. Vérifiez les logs Nginx:
```bash
sudo tail -f /var/log/nginx/error.log
```

3. Vérifiez la configuration upstream:
```nginx
upstream backend {
    server backend:8080;  # Nom du service Docker
    # OU
    server localhost:8080;  # Si Nginx est hors Docker
}
```

4. Testez la connexion:
```bash
curl http://localhost:8080/api/v1/health
```

---

### Problème: Certificat SSL invalide

**Symptômes:**
- "Your connection is not private"
- Certificat expiré

**Solutions:**
1. Vérifiez le certificat:
```bash
sudo certbot certificates
```

2. Renouvelez le certificat:
```bash
sudo certbot renew
sudo systemctl reload nginx
```

3. Testez le renouvellement automatique:
```bash
sudo certbot renew --dry-run
```

4. Vérifiez la configuration SSL dans Nginx:
```nginx
ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
```

---

## 🔄 Problèmes de Déploiement

### Problème: Déploiement réussit mais l'ancienne version est toujours active

**Symptômes:**
- Workflow passe au vert
- Mais les changements ne sont pas visibles

**Solutions:**
1. Vérifiez que les nouvelles images sont utilisées:
```bash
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

2. Forcez la recréation des conteneurs:
```bash
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

3. Vérifiez la version des images:
```bash
docker images | grep password-manager
```

4. Nettoyez le cache du navigateur (Ctrl+Shift+R)

---

### Problème: Rollback ne fonctionne pas

**Symptômes:**
- Script de rollback échoue
- Ancienne version ne démarre pas

**Solutions:**
1. Vérifiez que l'ancienne version existe:
```bash
docker images | grep password-manager
# L'image avec le tag de l'ancienne version doit exister
```

2. Pull l'ancienne version si nécessaire:
```bash
export VERSION=v0.9.0
docker-compose -f docker-compose.prod.yml pull
```

3. Rollback manuel:
```bash
docker-compose -f docker-compose.prod.yml down
export VERSION=v0.9.0
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📊 Problèmes de Performance

### Problème: Application lente

**Symptômes:**
- Temps de réponse élevé
- Timeouts fréquents

**Solutions:**
1. Vérifiez les ressources:
```bash
docker stats
htop  # ou top
```

2. Augmentez les ressources allouées:
```yaml
# Dans docker-compose.prod.yml
deploy:
  resources:
    limits:
      cpus: '2'      # Augmentez
      memory: 2G     # Augmentez
```

3. Vérifiez les logs pour les erreurs:
```bash
docker-compose -f docker-compose.prod.yml logs --tail=1000 | grep -i error
```

4. Optimisez la base de données:
```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d password_manager
# Puis:
VACUUM ANALYZE;
REINDEX DATABASE password_manager;
```

---

## 🆘 Commandes d'Urgence

### Redémarrage complet

```bash
cd /home/deploy/password-manager

# Arrêter tout
docker-compose -f docker-compose.prod.yml down

# Nettoyer (⚠️ ATTENTION: supprime les données)
docker-compose -f docker-compose.prod.yml down -v

# Redémarrer
docker-compose -f docker-compose.prod.yml up -d

# Vérifier
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

### Rollback d'urgence

```bash
# Méthode 1: Via script
./scripts/rollback.sh production v0.9.0

# Méthode 2: Manuel
docker-compose -f docker-compose.prod.yml down
export VERSION=v0.9.0
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Backup d'urgence

```bash
# Backup de la base de données
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres password_manager > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup des volumes
docker run --rm -v password-manager_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup_$(date +%Y%m%d_%H%M%S).tar.gz /data
```

---

## 📞 Obtenir de l'Aide

Si le problème persiste:

1. **Collectez les informations:**
```bash
# Logs complets
docker-compose -f docker-compose.prod.yml logs > logs.txt

# État des services
docker-compose -f docker-compose.prod.yml ps > status.txt

# Configuration
docker-compose -f docker-compose.prod.yml config > config.txt
```

2. **Vérifiez la documentation:**
   - [GitHub Actions Docs](https://docs.github.com/en/actions)
   - [Docker Docs](https://docs.docker.com/)
   - Votre fichier `CICD_IMPLEMENTATION_GUIDE.md`

3. **Ouvrez une issue:**
   - Incluez les logs
   - Décrivez les étapes pour reproduire
   - Mentionnez ce que vous avez déjà essayé

---

**Dernière mise à jour:** Décembre 2024
