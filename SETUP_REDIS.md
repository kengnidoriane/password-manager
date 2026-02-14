# 🔴 Configuration Redis Gratuit avec Upstash

## ⚠️ Problème

Render ne supporte pas Redis dans les Blueprints gratuits. Nous allons utiliser **Upstash Redis** (gratuit, sans carte bancaire).

---

## ✅ Solution: Upstash Redis (2 minutes)

### Étape 1: Créer un Compte Upstash

1. Aller sur https://upstash.com
2. Cliquer **"Sign Up"**
3. Choisir **"Continue with GitHub"**
4. Autoriser Upstash
5. ✅ Aucune carte bancaire requise

### Étape 2: Créer une Base Redis

1. Dans le dashboard Upstash, cliquer **"Create Database"**
2. Configurer:
   - **Name**: `password-manager-redis`
   - **Type**: Regional
   - **Region**: Europe (Frankfurt) ou le plus proche
   - **TLS**: Enabled (recommandé)
3. Cliquer **"Create"**

### Étape 3: Copier les Informations de Connexion

Une fois créé, vous verrez:

```
Endpoint: redis-12345.upstash.io
Port: 6379
Password: AaBbCcDd1234567890...
```

**Copier ces 3 informations**, vous en aurez besoin.

---

## 🔧 Configuration sur Render

### Étape 1: Déployer d'Abord

1. Sur Render, cliquer **"Apply"** pour déployer
2. Attendre que le backend démarre (même s'il y a des erreurs Redis)

### Étape 2: Ajouter les Variables Redis

1. Aller dans **Dashboard Render**
2. Cliquer sur le service **"password-manager-backend"**
3. Aller dans **"Environment"**
4. Modifier ces variables:

```bash
# Remplacer par vos vraies valeurs Upstash
SPRING_REDIS_HOST=redis-12345.upstash.io
SPRING_REDIS_PORT=6379
SPRING_REDIS_PASSWORD=AaBbCcDd1234567890...
SPRING_REDIS_SSL_ENABLED=true
```

5. Cliquer **"Save Changes"**
6. Le service redémarrera automatiquement

---

## 🎯 Plan Gratuit Upstash

- ✅ 10,000 commandes/jour
- ✅ 256 MB de stockage
- ✅ TLS/SSL inclus
- ✅ Pas de carte bancaire
- ✅ Parfait pour commencer

---

## 🔄 Alternative: Déployer Sans Redis (Temporaire)

Si vous voulez tester rapidement sans Redis:

### Option 1: Désactiver Redis dans le Code

Modifier `backend/src/main/resources/application.yml`:

```yaml
spring:
  cache:
    type: none  # Désactiver le cache
  session:
    store-type: none  # Désactiver les sessions Redis
```

### Option 2: Utiliser Railway.app

Railway supporte Redis gratuitement dans les Blueprints.

Voir: [ALTERNATIVES_DEPLOYMENT.md](ALTERNATIVES_DEPLOYMENT.md)

---

## ✅ Vérification

Une fois Redis configuré, tester:

```bash
curl https://password-manager-backend.onrender.com/actuator/health
```

Devrait retourner:
```json
{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "redis": {"status": "UP"}
  }
}
```

---

## 📊 Résumé

**Avec Upstash Redis:**
- Frontend: Vercel (gratuit)
- Backend: Render (gratuit)
- PostgreSQL: Render (gratuit)
- Redis: Upstash (gratuit)
- **Total: 0€/mois**

---

## 🆘 Besoin d'Aide?

Si vous préférez une solution tout-en-un, utilisez **Railway.app** qui inclut Redis:

Voir: [ALTERNATIVES_DEPLOYMENT.md](ALTERNATIVES_DEPLOYMENT.md) - Option 2

---

**Upstash est la meilleure solution gratuite pour Redis!** 🚀
