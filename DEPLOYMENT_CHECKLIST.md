# ✅ Checklist de Déploiement Rapide

## 🎯 Avant de Commencer

- [ ] Compte GitHub avec le code du projet
- [ ] Compte Vercel créé (gratuit, sans carte)
- [ ] Compte Render créé (gratuit, sans carte)

---

## 📦 Étape 1: Préparer le Code (5 min)

```bash
# 1. Vérifier que tous les fichiers sont présents
ls render.yaml                    # ✅ Doit exister
ls frontend/vercel.json           # ✅ Doit exister
ls backend/Dockerfile             # ✅ Doit exister

# 2. Pousser sur GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
```

---

## 🚀 Étape 2: Déployer le Backend (10 min)

### Sur Render.com:

1. [ ] Aller sur https://dashboard.render.com
2. [ ] Cliquer "New +" → "Blueprint"
3. [ ] Sélectionner votre repo GitHub
4. [ ] Cliquer "Apply"
5. [ ] Attendre 5-10 minutes (suivre les logs)
6. [ ] Noter l'URL: `https://password-manager-backend.onrender.com`

### Configurer les variables:

7. [ ] Aller dans le service "password-manager-backend"
8. [ ] Cliquer "Environment"
9. [ ] Ajouter:
   ```
   JWT_SECRET=changez-cette-cle-par-une-tres-longue-chaine-aleatoire-minimum-256-bits
   JWT_EXPIRATION_MS=900000
   CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
   ```
10. [ ] Sauvegarder

### Tester:

11. [ ] Ouvrir: `https://password-manager-backend.onrender.com/actuator/health`
12. [ ] Devrait afficher: `{"status":"UP"}`

---

## 🎨 Étape 3: Déployer le Frontend (5 min)

### Sur Vercel:

1. [ ] Aller sur https://vercel.com/dashboard
2. [ ] Cliquer "Add New..." → "Project"
3. [ ] Sélectionner votre repo GitHub
4. [ ] Configurer:
   - **Root Directory**: `frontend`
   - **Framework**: Next.js (auto-détecté)

### Variables d'environnement:

5. [ ] Dans "Environment Variables", ajouter:
   ```
   NEXT_PUBLIC_API_URL=https://password-manager-backend.onrender.com/api/v1
   NEXT_PUBLIC_SESSION_TIMEOUT_MS=900000
   NEXT_PUBLIC_CLIPBOARD_TIMEOUT_MS=30000
   NEXT_PUBLIC_PBKDF2_ITERATIONS=100000
   NEXT_PUBLIC_AUTO_LOCK_TIMEOUT_MS=300000
   NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS=5
   NEXT_PUBLIC_LOCKOUT_DURATION_MS=900000
   ```

6. [ ] Cliquer "Deploy"
7. [ ] Attendre 2-5 minutes
8. [ ] Noter l'URL: `https://your-app.vercel.app`

---

## 🔗 Étape 4: Connecter Frontend et Backend (2 min)

### Mettre à jour CORS:

1. [ ] Retourner sur Render Dashboard
2. [ ] Service "password-manager-backend" → "Environment"
3. [ ] Modifier `CORS_ALLOWED_ORIGINS`:
   ```
   CORS_ALLOWED_ORIGINS=https://your-actual-vercel-url.vercel.app
   ```
4. [ ] Remplacer par votre vraie URL Vercel
5. [ ] Sauvegarder (redémarrage automatique)

---

## ✅ Étape 5: Tests Finaux (5 min)

### Test Backend:
```bash
curl https://password-manager-backend.onrender.com/actuator/health
# Devrait retourner: {"status":"UP"}
```

### Test Frontend:
1. [ ] Ouvrir votre URL Vercel
2. [ ] Ouvrir la console (F12)
3. [ ] Vérifier qu'il n'y a pas d'erreurs

### Test Complet:
1. [ ] Créer un compte
2. [ ] Se connecter
3. [ ] Ajouter un mot de passe
4. [ ] Générer un mot de passe
5. [ ] Se déconnecter

---

## 🎉 C'est Terminé!

Votre application est en ligne:

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://password-manager-backend.onrender.com
- **API Docs**: https://password-manager-backend.onrender.com/swagger-ui.html

---

## ⚠️ Important à Savoir

### Plan Gratuit Render:
- Le backend s'endort après 15 min d'inactivité
- Premier démarrage: 30-60 secondes
- Solution: Utiliser un cron job gratuit pour le garder actif

### Garder le Backend Actif:
1. Aller sur https://cron-job.org (gratuit)
2. Créer un job:
   - URL: `https://password-manager-backend.onrender.com/actuator/health`
   - Intervalle: Toutes les 10 minutes
   - ✅ Votre backend restera actif!

---

## 🆘 Problèmes Courants

### Backend ne démarre pas:
- Vérifier les logs sur Render
- Vérifier les variables d'environnement

### Erreurs CORS:
- Vérifier que `CORS_ALLOWED_ORIGINS` correspond exactement à l'URL Vercel
- Pas de slash final: ✅ `https://app.vercel.app` ❌ `https://app.vercel.app/`

### Frontend ne se connecte pas:
- Vérifier `NEXT_PUBLIC_API_URL` sur Vercel
- Doit pointer vers l'URL Render complète avec `/api/v1`

---

## 📞 Besoin d'Aide?

1. Vérifier les logs:
   - Render: Dashboard → Service → Logs
   - Vercel: Dashboard → Project → Deployments → Logs

2. Vérifier les variables d'environnement
3. Tester les endpoints individuellement

---

**Temps total estimé: 25-30 minutes**

Bonne chance! 🚀
