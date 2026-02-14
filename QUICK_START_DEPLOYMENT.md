# 🚀 Démarrage Rapide - 15 Minutes

## Résumé de l'Architecture

**Frontend**: Vercel (gratuit, illimité)  
**Backend**: Render.com (gratuit, 750h/mois)  
**Database**: PostgreSQL sur Render (gratuit, 1GB)  
**Cache**: Redis sur Render (gratuit, 25MB)

---

## ⚡ Déploiement en 3 Étapes

### 📦 Étape 1: Préparer (2 min)

```bash
# 1. Générer un JWT secret
node scripts/generate-jwt-secret.js
# Copier le secret généré, vous en aurez besoin

# 2. Pousser sur GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 🔧 Étape 2: Backend sur Render (8 min)

1. **Aller sur** https://dashboard.render.com
2. **Cliquer** "New +" → "Blueprint"
3. **Sélectionner** votre repo GitHub
4. **Cliquer** "Apply"
5. **Attendre** 5-10 minutes ⏳

Une fois déployé:
6. **Aller dans** "password-manager-backend" → "Environment"
7. **Ajouter** ces variables:
   ```
   JWT_SECRET=<votre-secret-généré>
   JWT_EXPIRATION_MS=900000
   CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
   ```
8. **Sauvegarder**

✅ **Tester**: Ouvrir `https://password-manager-backend.onrender.com/actuator/health`

### 🎨 Étape 3: Frontend sur Vercel (5 min)

1. **Aller sur** https://vercel.com/dashboard
2. **Cliquer** "Add New..." → "Project"
3. **Sélectionner** votre repo GitHub
4. **Configurer**:
   - Root Directory: `frontend`
   - Framework: Next.js

5. **Ajouter** ces variables d'environnement:
   ```
   NEXT_PUBLIC_API_URL=https://password-manager-backend.onrender.com/api/v1
   NEXT_PUBLIC_SESSION_TIMEOUT_MS=900000
   NEXT_PUBLIC_CLIPBOARD_TIMEOUT_MS=30000
   NEXT_PUBLIC_PBKDF2_ITERATIONS=100000
   NEXT_PUBLIC_AUTO_LOCK_TIMEOUT_MS=300000
   NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS=5
   NEXT_PUBLIC_LOCKOUT_DURATION_MS=900000
   ```

6. **Cliquer** "Deploy"
7. **Attendre** 2-5 minutes ⏳

Une fois déployé:
8. **Copier** votre URL Vercel (ex: `https://password-manager-xyz.vercel.app`)
9. **Retourner sur Render** → Backend → Environment
10. **Modifier** `CORS_ALLOWED_ORIGINS` avec votre vraie URL Vercel
11. **Sauvegarder**

---

## ✅ Test Final

1. **Ouvrir** votre URL Vercel
2. **Créer** un compte
3. **Ajouter** un mot de passe
4. **Générer** un mot de passe

🎉 **Ça marche? Félicitations!**

---

## 🔥 Bonus: Garder le Backend Actif

Le backend Render s'endort après 15 min d'inactivité.

**Solution gratuite** (30 secondes):
1. Aller sur https://cron-job.org
2. Créer un compte (gratuit)
3. Créer un job:
   - **URL**: `https://password-manager-backend.onrender.com/actuator/health`
   - **Intervalle**: Toutes les 10 minutes
4. Activer

✅ Votre backend restera actif 24/7!

---

## 🆘 Problèmes?

### Backend ne démarre pas
- Vérifier les logs sur Render
- Vérifier que toutes les variables sont définies

### Erreur CORS
- Vérifier que `CORS_ALLOWED_ORIGINS` correspond exactement à l'URL Vercel
- Pas de slash final: ✅ `https://app.vercel.app` ❌ `https://app.vercel.app/`

### Frontend ne se connecte pas
- Vérifier `NEXT_PUBLIC_API_URL` sur Vercel
- Doit finir par `/api/v1`

---

## 📚 Documentation Complète

- **Guide détaillé**: `DEPLOYMENT_GUIDE.md`
- **Checklist**: `DEPLOYMENT_CHECKLIST.md`

---

**Temps total: 15 minutes** ⏱️

Bon déploiement! 🚀
