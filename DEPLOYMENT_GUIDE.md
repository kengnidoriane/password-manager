# Guide de Déploiement Complet
## Password Manager - Vercel + Render.com

---

## 🎯 Architecture de Déploiement

```
┌─────────────────────────────────────────────────────────┐
│                    UTILISATEURS                          │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
   ┌────▼─────┐            ┌─────▼────┐
   │  VERCEL  │            │  RENDER  │
   │ Frontend │◄───────────┤  Backend │
   │ Next.js  │   API      │  Spring  │
   └──────────┘            └─────┬────┘
                                 │
                    ┌────────────┼────────────┐
                    │                         │
              ┌─────▼─────┐           ┌──────▼──────┐
              │PostgreSQL │           │    Redis    │
              │  (Render) │           │   (Render)  │
              └───────────┘           └─────────────┘
```

---

## 📋 Étape 1: Préparation des Comptes

### 1.1 Créer un compte Vercel
1. Aller sur https://vercel.com
2. Cliquer sur "Sign Up"
3. Choisir "Continue with GitHub"
4. Autoriser Vercel à accéder à vos repos
5. ✅ Aucune carte bancaire requise

### 1.2 Créer un compte Render.com
1. Aller sur https://render.com
2. Cliquer sur "Get Started"
3. Choisir "Sign up with GitHub"
4. Autoriser Render à accéder à vos repos
5. ✅ Aucune carte bancaire requise

---

## 📋 Étape 2: Préparer le Code

### 2.1 Vérifier les fichiers de configuration

Assurez-vous que ces fichiers existent:
- ✅ `render.yaml` (à la racine du projet)
- ✅ `frontend/vercel.json` (configuration Vercel)
- ✅ `backend/Dockerfile` (pour Render)

### 2.2 Pousser le code sur GitHub

```bash
# Si pas encore fait
git add .
git commit -m "Préparation pour déploiement Vercel + Render"
git push origin main
```

---

## 📋 Étape 3: Déployer le Backend sur Render

### 3.1 Créer le service Backend

1. **Connecter le repository**
   - Aller sur https://dashboard.render.com
   - Cliquer sur "New +"
   - Choisir "Blueprint"
   - Sélectionner votre repository GitHub
   - Render détectera automatiquement le fichier `render.yaml`

2. **Configurer le déploiement**
   - Cliquer sur "Apply"
   - Render va créer automatiquement:
     - ✅ Backend Spring Boot
     - ✅ PostgreSQL Database
     - ✅ Redis Cache

3. **Attendre le déploiement** (5-10 minutes)
   - Suivre les logs en temps réel
   - Le backend sera disponible sur: `https://password-manager-backend.onrender.com`

### 3.2 Configurer les variables d'environnement

Render configure automatiquement la plupart des variables, mais vous devez ajouter:

1. Aller dans le service "password-manager-backend"
2. Cliquer sur "Environment"
3. Ajouter ces variables:

```bash
# JWT Secret (générer une clé sécurisée)
JWT_SECRET=votre-cle-secrete-tres-longue-et-aleatoire-minimum-256-bits

# JWT Expiration (15 minutes)
JWT_EXPIRATION_MS=900000

# CORS (sera mis à jour après déploiement Vercel)
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app

# Session timeout
SESSION_TIMEOUT_MINUTES=15
```

4. Cliquer sur "Save Changes"
5. Le service redémarrera automatiquement

### 3.3 Vérifier le déploiement Backend

```bash
# Tester l'API
curl https://password-manager-backend.onrender.com/actuator/health

# Devrait retourner:
# {"status":"UP"}
```

---

## 📋 Étape 4: Déployer le Frontend sur Vercel

### 4.1 Importer le projet

1. **Aller sur Vercel Dashboard**
   - https://vercel.com/dashboard
   - Cliquer sur "Add New..."
   - Choisir "Project"

2. **Importer le repository**
   - Sélectionner votre repository GitHub
   - Cliquer sur "Import"

3. **Configurer le projet**
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 4.2 Configurer les variables d'environnement

Dans la section "Environment Variables", ajouter:

```bash
# URL du Backend (remplacer par votre URL Render)
NEXT_PUBLIC_API_URL=https://password-manager-backend.onrender.com/api/v1

# Session timeout (15 minutes)
NEXT_PUBLIC_SESSION_TIMEOUT_MS=900000

# Clipboard timeout (30 secondes)
NEXT_PUBLIC_CLIPBOARD_TIMEOUT_MS=30000

# PBKDF2 iterations
NEXT_PUBLIC_PBKDF2_ITERATIONS=100000

# Auto-lock timeout (5 minutes)
NEXT_PUBLIC_AUTO_LOCK_TIMEOUT_MS=300000

# Max login attempts
NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS=5

# Lockout duration (15 minutes)
NEXT_PUBLIC_LOCKOUT_DURATION_MS=900000
```

### 4.3 Déployer

1. Cliquer sur "Deploy"
2. Attendre le build (2-5 minutes)
3. Votre app sera disponible sur: `https://your-app.vercel.app`

---

## 📋 Étape 5: Connecter Frontend et Backend

### 5.1 Mettre à jour CORS sur Render

1. Retourner sur Render Dashboard
2. Aller dans "password-manager-backend"
3. Cliquer sur "Environment"
4. Modifier `CORS_ALLOWED_ORIGINS`:

```bash
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```

5. Remplacer `your-app.vercel.app` par votre vraie URL Vercel
6. Sauvegarder (le service redémarrera)

### 5.2 Tester la connexion

1. Ouvrir votre app Vercel: `https://your-app.vercel.app`
2. Ouvrir la console du navigateur (F12)
3. Vérifier qu'il n'y a pas d'erreurs CORS
4. Essayer de créer un compte

---

## 📋 Étape 6: Configuration du Domaine Personnalisé (Optionnel)

### 6.1 Domaine pour le Frontend (Vercel)

1. Aller dans les paramètres du projet Vercel
2. Cliquer sur "Domains"
3. Ajouter votre domaine (ex: `passwordmanager.com`)
4. Suivre les instructions DNS

### 6.2 Domaine pour le Backend (Render)

1. Aller dans les paramètres du service Render
2. Cliquer sur "Custom Domain"
3. Ajouter votre domaine (ex: `api.passwordmanager.com`)
4. Suivre les instructions DNS

---

## 📋 Étape 7: Vérification Post-Déploiement

### 7.1 Tests de Santé

```bash
# Backend Health
curl https://password-manager-backend.onrender.com/actuator/health

# Frontend
curl -I https://your-app.vercel.app
```

### 7.2 Tests Fonctionnels

1. **Inscription**
   - Créer un nouveau compte
   - Vérifier la génération de la clé de récupération
   - ✅ Compte créé avec succès

2. **Connexion**
   - Se connecter avec les identifiants
   - ✅ Session établie

3. **Vault**
   - Créer une nouvelle entrée
   - Modifier une entrée
   - Supprimer une entrée
   - ✅ Toutes les opérations fonctionnent

4. **Générateur de mots de passe**
   - Générer un mot de passe
   - Personnaliser les options
   - ✅ Génération réussie

5. **Sync**
   - Ouvrir dans un autre onglet
   - Vérifier la synchronisation
   - ✅ Données synchronisées

---

## 🔧 Dépannage

### Problème: Backend ne démarre pas

**Solution:**
```bash
# Vérifier les logs sur Render
# Dashboard > Service > Logs

# Vérifier les variables d'environnement
# Dashboard > Service > Environment
```

### Problème: Erreurs CORS

**Solution:**
```bash
# Vérifier CORS_ALLOWED_ORIGINS sur Render
# Doit correspondre exactement à l'URL Vercel
# Exemple: https://your-app.vercel.app (sans slash final)
```

### Problème: Base de données non accessible

**Solution:**
```bash
# Vérifier que PostgreSQL est bien créé
# Dashboard > Databases > password-manager-db

# Vérifier les variables de connexion
# Elles sont automatiquement injectées par Render
```

### Problème: Frontend ne se connecte pas au Backend

**Solution:**
```bash
# Vérifier NEXT_PUBLIC_API_URL sur Vercel
# Doit pointer vers l'URL Render
# Exemple: https://password-manager-backend.onrender.com/api/v1
```

---

## 📊 Limites du Plan Gratuit

### Render.com (Backend)
- ✅ 750 heures/mois de compute
- ✅ PostgreSQL: 1GB de stockage
- ✅ Redis: 25MB
- ⚠️ Le service s'endort après 15 min d'inactivité
- ⚠️ Premier démarrage peut prendre 30-60 secondes

### Vercel (Frontend)
- ✅ Bande passante illimitée
- ✅ 100 déploiements/jour
- ✅ Domaines personnalisés illimités
- ✅ SSL automatique
- ✅ Pas de limite de temps d'activité

---

## 🚀 Optimisations

### 1. Garder le Backend actif

Créer un cron job gratuit sur cron-job.org:
```bash
# Ping toutes les 10 minutes
URL: https://password-manager-backend.onrender.com/actuator/health
Interval: */10 * * * *
```

### 2. Activer le cache

Le cache Redis est déjà configuré dans votre code.

### 3. Monitoring

Utiliser les outils gratuits:
- **Render**: Logs et métriques intégrés
- **Vercel**: Analytics intégré
- **UptimeRobot**: Monitoring gratuit (50 monitors)

---

## 📈 Mise à l'échelle Future

Quand vous aurez besoin de plus de ressources:

### Render.com
- **Starter Plan**: $7/mois
  - Pas de sleep
  - Plus de ressources
  - PostgreSQL 10GB

### Vercel
- **Pro Plan**: $20/mois
  - Analytics avancés
  - Plus de membres d'équipe

---

## ✅ Checklist de Déploiement

- [ ] Compte Vercel créé
- [ ] Compte Render créé
- [ ] Code poussé sur GitHub
- [ ] `render.yaml` configuré
- [ ] Backend déployé sur Render
- [ ] PostgreSQL créé
- [ ] Redis créé
- [ ] Variables d'environnement Backend configurées
- [ ] Frontend déployé sur Vercel
- [ ] Variables d'environnement Frontend configurées
- [ ] CORS configuré
- [ ] Tests de santé passés
- [ ] Tests fonctionnels passés
- [ ] Monitoring configuré

---

## 🆘 Support

Si vous rencontrez des problèmes:

1. **Vérifier les logs**
   - Render: Dashboard > Service > Logs
   - Vercel: Dashboard > Project > Deployments > Logs

2. **Vérifier les variables d'environnement**
   - Toutes les variables sont-elles définies?
   - Les URLs sont-elles correctes?

3. **Tester les endpoints**
   - Backend health: `/actuator/health`
   - Frontend: Page d'accueil

---

## 🎉 Félicitations!

Votre application est maintenant déployée et accessible publiquement!

**URLs:**
- Frontend: https://your-app.vercel.app
- Backend: https://password-manager-backend.onrender.com
- API Docs: https://password-manager-backend.onrender.com/swagger-ui.html

**Prochaines étapes:**
1. Partager l'application avec des utilisateurs test
2. Collecter les retours
3. Itérer et améliorer
4. Configurer un domaine personnalisé
5. Mettre en place le monitoring

---

**Version:** 1.0.0  
**Date:** Février 2026  
**Auteur:** Guide de déploiement automatisé
