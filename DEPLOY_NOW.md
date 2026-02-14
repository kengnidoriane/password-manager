# 🚀 DÉPLOYER MAINTENANT - Guide Ultra-Rapide

## ⏱️ Temps estimé: 15 minutes

---

## 🎯 Ce que vous allez obtenir

✅ Frontend sur Vercel (gratuit, illimité)  
✅ Backend sur Render (gratuit, 750h/mois)  
✅ PostgreSQL (gratuit, 1GB)  
✅ Redis (gratuit, 25MB)  
✅ SSL automatique  
✅ Déploiement automatique depuis GitHub  
✅ **AUCUNE carte bancaire requise**

---

## 📋 Prérequis (2 min)

1. ✅ Compte GitHub avec votre code
2. ✅ Créer compte sur https://vercel.com (gratuit, avec GitHub)
3. ✅ Créer compte sur https://render.com (gratuit, avec GitHub)

---

## 🔥 ÉTAPE 1: Préparer le Code (2 min)

```bash
# 1. Générer un JWT secret sécurisé
node scripts/generate-jwt-secret.js

# Copier le secret affiché, exemple:
# JWT_SECRET=abc123xyz789...

# 2. Pousser sur GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
```

✅ **Checkpoint**: Code sur GitHub avec tous les fichiers

---

## 🔧 ÉTAPE 2: Déployer le Backend (8 min)

### A. Créer les services sur Render

1. Aller sur https://dashboard.render.com
2. Cliquer **"New +"** → **"Blueprint"**
3. Sélectionner votre repository GitHub
4. Cliquer **"Apply"**

⏳ **Attendre 5-10 minutes** pendant que Render crée:
- Backend Spring Boot
- PostgreSQL Database
- Redis Cache

### B. Configurer les variables d'environnement

Une fois le déploiement terminé:

1. Cliquer sur le service **"password-manager-backend"**
2. Aller dans **"Environment"**
3. Cliquer **"Add Environment Variable"**
4. Ajouter ces 3 variables:

```bash
# Variable 1
JWT_SECRET=<collez-votre-secret-généré-à-l-étape-1>

# Variable 2
JWT_EXPIRATION_MS=900000

# Variable 3 (on mettra la vraie URL Vercel après)
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```

5. Cliquer **"Save Changes"**
6. Le service redémarrera automatiquement (1-2 min)

### C. Tester le Backend

1. Copier l'URL de votre backend (ex: `https://password-manager-backend.onrender.com`)
2. Ouvrir dans le navigateur: `https://password-manager-backend.onrender.com/actuator/health`
3. Vous devriez voir: `{"status":"UP"}`

✅ **Checkpoint**: Backend déployé et fonctionnel

---

## 🎨 ÉTAPE 3: Déployer le Frontend (5 min)

### A. Importer le projet sur Vercel

1. Aller sur https://vercel.com/dashboard
2. Cliquer **"Add New..."** → **"Project"**
3. Sélectionner votre repository GitHub
4. Cliquer **"Import"**

### B. Configurer le projet

Dans la page de configuration:

1. **Root Directory**: Cliquer "Edit" et mettre `frontend`
2. **Framework Preset**: Next.js (auto-détecté)
3. **Build Command**: `npm run build` (auto-détecté)

### C. Ajouter les variables d'environnement

Cliquer sur **"Environment Variables"** et ajouter:

```bash
# Variable 1 - Remplacer par votre URL Render
NEXT_PUBLIC_API_URL=https://password-manager-backend.onrender.com/api/v1

# Variable 2
NEXT_PUBLIC_SESSION_TIMEOUT_MS=900000

# Variable 3
NEXT_PUBLIC_CLIPBOARD_TIMEOUT_MS=30000

# Variable 4
NEXT_PUBLIC_PBKDF2_ITERATIONS=100000

# Variable 5
NEXT_PUBLIC_AUTO_LOCK_TIMEOUT_MS=300000

# Variable 6
NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS=5

# Variable 7
NEXT_PUBLIC_LOCKOUT_DURATION_MS=900000
```

### D. Déployer

1. Cliquer **"Deploy"**
2. ⏳ Attendre 2-5 minutes
3. Copier votre URL Vercel (ex: `https://password-manager-xyz.vercel.app`)

✅ **Checkpoint**: Frontend déployé

---

## 🔗 ÉTAPE 4: Connecter Frontend et Backend (2 min)

### Mettre à jour CORS

1. Retourner sur https://dashboard.render.com
2. Cliquer sur **"password-manager-backend"**
3. Aller dans **"Environment"**
4. Trouver la variable **"CORS_ALLOWED_ORIGINS"**
5. Cliquer sur **"Edit"**
6. Remplacer par votre vraie URL Vercel:
   ```
   https://password-manager-xyz.vercel.app
   ```
   ⚠️ **Important**: Pas de slash à la fin!
7. Cliquer **"Save Changes"**
8. Attendre le redémarrage (1-2 min)

✅ **Checkpoint**: Frontend et Backend connectés

---

## ✅ ÉTAPE 5: Test Final (2 min)

### Tester l'application

1. Ouvrir votre URL Vercel: `https://password-manager-xyz.vercel.app`
2. Cliquer sur **"S'inscrire"** ou **"Register"**
3. Créer un compte:
   - Email: `test@example.com`
   - Master Password: `TestPassword123!`
4. Sauvegarder la clé de récupération
5. Se connecter
6. Ajouter un mot de passe de test
7. Générer un mot de passe

### ✅ Ça marche?

🎉 **FÉLICITATIONS!** Votre application est en ligne!

---

## 🔥 BONUS: Garder le Backend Actif (2 min)

Le backend Render s'endort après 15 min d'inactivité. Solution gratuite:

### Configurer un Cron Job

1. Aller sur https://cron-job.org
2. Créer un compte gratuit
3. Cliquer **"Create cronjob"**
4. Configurer:
   - **Title**: Keep Backend Alive
   - **URL**: `https://password-manager-backend.onrender.com/actuator/health`
   - **Schedule**: `*/10 * * * *` (toutes les 10 minutes)
5. Cliquer **"Create"**

✅ Votre backend restera actif 24/7!

---

## 📱 Vos URLs Finales

Notez vos URLs:

```
Frontend: https://password-manager-xyz.vercel.app
Backend:  https://password-manager-backend.onrender.com
API Docs: https://password-manager-backend.onrender.com/swagger-ui.html
Health:   https://password-manager-backend.onrender.com/actuator/health
```

---

## 🆘 Problèmes Courants

### ❌ Backend ne démarre pas

**Vérifier:**
1. Logs sur Render: Dashboard → Service → Logs
2. Variables d'environnement définies
3. PostgreSQL et Redis créés

**Solution:**
- Vérifier que `JWT_SECRET` est défini
- Vérifier les logs pour l'erreur exacte

### ❌ Erreur CORS

**Symptôme:** Erreur dans la console du navigateur

**Solution:**
1. Vérifier `CORS_ALLOWED_ORIGINS` sur Render
2. Doit correspondre EXACTEMENT à l'URL Vercel
3. Pas de slash final: ✅ `https://app.vercel.app` ❌ `https://app.vercel.app/`

### ❌ Frontend ne se connecte pas

**Vérifier:**
1. `NEXT_PUBLIC_API_URL` sur Vercel
2. Doit finir par `/api/v1`
3. Backend accessible: tester `/actuator/health`

**Solution:**
- Redéployer le frontend après avoir corrigé la variable

### ❌ Base de données vide

**Normal!** C'est votre première installation.

**Solution:**
- Créer un compte via l'interface
- Les tables sont créées automatiquement par Flyway

---

## 📊 Monitoring

### Vérifier la santé

```bash
# Backend
curl https://password-manager-backend.onrender.com/actuator/health

# Devrait retourner:
# {"status":"UP","components":{"db":{"status":"UP"},"redis":{"status":"UP"}}}
```

### Logs

- **Render**: Dashboard → Service → Logs (temps réel)
- **Vercel**: Dashboard → Project → Deployments → Logs

---

## 🚀 Prochaines Étapes

1. ✅ Tester toutes les fonctionnalités
2. ✅ Partager avec des amis/collègues
3. ✅ Configurer un domaine personnalisé (optionnel)
4. ✅ Activer le monitoring (UptimeRobot gratuit)
5. ✅ Collecter les retours utilisateurs

---

## 📚 Documentation Complète

- **Guide détaillé**: `DEPLOYMENT_GUIDE.md`
- **Alternatives**: `ALTERNATIVES_DEPLOYMENT.md`
- **Checklist**: `DEPLOYMENT_CHECKLIST.md`

---

## 🎉 C'est Terminé!

Votre gestionnaire de mots de passe est maintenant:
- ✅ En ligne et accessible publiquement
- ✅ Sécurisé avec SSL
- ✅ Gratuit (pas de carte bancaire)
- ✅ Déployé automatiquement depuis GitHub

**Temps total: ~15 minutes** ⏱️

---

## 💡 Conseils

1. **Sauvegarder vos URLs** dans un fichier
2. **Tester régulièrement** pour vérifier que tout fonctionne
3. **Surveiller les logs** les premiers jours
4. **Configurer le cron job** pour éviter le sleep
5. **Partager avec prudence** (c'est encore en test)

---

**Besoin d'aide?** Vérifiez les logs et la section dépannage ci-dessus.

**Bon déploiement!** 🚀
