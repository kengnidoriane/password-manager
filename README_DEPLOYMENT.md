# 📦 Guide de Déploiement - Password Manager

## 🎯 Vue d'Ensemble

Ce projet est prêt à être déployé gratuitement sans carte bancaire sur:
- **Frontend**: Vercel (Next.js)
- **Backend**: Render.com (Spring Boot)
- **Database**: PostgreSQL sur Render
- **Cache**: Redis sur Render

---

## 📚 Documentation Disponible

### 🚀 Pour Déployer Maintenant

| Fichier | Description | Temps |
|---------|-------------|-------|
| **[DEPLOY_NOW.md](DEPLOY_NOW.md)** | Guide ultra-rapide avec toutes les commandes | 15 min |
| **[QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md)** | Démarrage rapide en 3 étapes | 15 min |
| **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** | Checklist étape par étape | 25 min |

### 📖 Pour Comprendre

| Fichier | Description |
|---------|-------------|
| **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** | Guide complet et détaillé |
| **[ALTERNATIVES_DEPLOYMENT.md](ALTERNATIVES_DEPLOYMENT.md)** | Comparaison des plateformes gratuites |

### 🛠️ Fichiers de Configuration

| Fichier | Usage |
|---------|-------|
| `render.yaml` | Configuration Render (backend + DB + Redis) |
| `frontend/vercel.json` | Configuration Vercel (frontend) |
| `scripts/generate-jwt-secret.js` | Générer un JWT secret sécurisé |

---

## ⚡ Démarrage Ultra-Rapide

```bash
# 1. Générer JWT secret
node scripts/generate-jwt-secret.js

# 2. Pousser sur GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 3. Déployer Backend sur Render
# → Aller sur https://dashboard.render.com
# → New + → Blueprint → Sélectionner repo → Apply

# 4. Déployer Frontend sur Vercel
# → Aller sur https://vercel.com/dashboard
# → Add New → Project → Sélectionner repo → Deploy

# 5. Configurer CORS
# → Render → Backend → Environment → CORS_ALLOWED_ORIGINS
# → Mettre l'URL Vercel
```

**Suivre le guide complet**: [DEPLOY_NOW.md](DEPLOY_NOW.md)

---

## 🏗️ Architecture de Déploiement

```
┌─────────────────────────────────────────────────────────┐
│                    UTILISATEURS                          │
│                  (Navigateur Web)                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTPS
                     │
        ┌────────────┴────────────┐
        │                         │
   ┌────▼─────┐            ┌─────▼────┐
   │  VERCEL  │            │  RENDER  │
   │          │            │          │
   │ Frontend │◄───────────┤  Backend │
   │ Next.js  │   API      │  Spring  │
   │   PWA    │  Calls     │   Boot   │
   └──────────┘            └─────┬────┘
                                 │
                    ┌────────────┼────────────┐
                    │                         │
              ┌─────▼─────┐           ┌──────▼──────┐
              │PostgreSQL │           │    Redis    │
              │   1GB     │           │    25MB     │
              │  (Render) │           │   (Render)  │
              └───────────┘           └─────────────┘
```

---

## 💰 Coûts

### Plan Gratuit (Recommandé pour commencer)

| Service | Plan | Coût | Limites |
|---------|------|------|---------|
| **Vercel** | Hobby | 0€ | Illimité |
| **Render** | Free | 0€ | 750h/mois, sleep après 15 min |
| **PostgreSQL** | Free | 0€ | 1GB |
| **Redis** | Free | 0€ | 25MB |
| **Cron-job.org** | Free | 0€ | Garder backend actif |
| **TOTAL** | | **0€/mois** | Parfait pour MVP |

### Évolution Future

| Service | Plan | Coût | Avantages |
|---------|------|------|-----------|
| **Render** | Starter | 7€/mois | Pas de sleep, plus de ressources |
| **Vercel** | Pro | 20€/mois | Analytics, plus de membres |

---

## ✅ Fonctionnalités Incluses

### Frontend (Vercel)
- ✅ Déploiement automatique depuis GitHub
- ✅ SSL/HTTPS automatique
- ✅ CDN global
- ✅ Domaines personnalisés
- ✅ Preview deployments (branches)
- ✅ Analytics de base

### Backend (Render)
- ✅ Déploiement automatique depuis GitHub
- ✅ SSL/HTTPS automatique
- ✅ PostgreSQL inclus
- ✅ Redis inclus
- ✅ Logs en temps réel
- ✅ Métriques de base
- ✅ Health checks automatiques

---

## 🔒 Sécurité

### Inclus dans le Déploiement
- ✅ SSL/TLS automatique (Let's Encrypt)
- ✅ HTTPS forcé
- ✅ Headers de sécurité configurés
- ✅ CORS configuré
- ✅ Rate limiting activé
- ✅ JWT avec secret sécurisé
- ✅ Mots de passe hashés (BCrypt)
- ✅ Zero-knowledge encryption

### À Configurer
- [ ] Domaine personnalisé (optionnel)
- [ ] Monitoring externe (UptimeRobot)
- [ ] Backups automatiques (Render Pro)

---

## 📊 Monitoring

### Inclus Gratuitement

**Render:**
- Logs en temps réel
- Métriques CPU/RAM
- Health checks
- Alertes email

**Vercel:**
- Logs de déploiement
- Analytics de base
- Erreurs runtime

### Recommandé (Gratuit)

**UptimeRobot:**
- Monitoring uptime
- Alertes email/SMS
- 50 monitors gratuits

**Cron-job.org:**
- Garder backend actif
- Monitoring HTTP
- Alertes email

---

## 🚀 Workflow de Déploiement

### Déploiement Automatique

```bash
# 1. Développer localement
git checkout -b feature/nouvelle-fonctionnalite
# ... coder ...

# 2. Pousser sur GitHub
git add .
git commit -m "Ajout nouvelle fonctionnalité"
git push origin feature/nouvelle-fonctionnalite

# 3. Vercel crée automatiquement un preview
# → URL: https://password-manager-xyz-git-feature-nouvelle.vercel.app

# 4. Tester le preview

# 5. Merger dans main
git checkout main
git merge feature/nouvelle-fonctionnalite
git push origin main

# 6. Déploiement automatique en production
# → Vercel: Frontend mis à jour automatiquement
# → Render: Backend mis à jour automatiquement
```

---

## 🔧 Configuration Requise

### Variables d'Environnement Backend (Render)

```bash
# Automatiquement configurées par render.yaml
SPRING_DATASOURCE_URL=<auto>
SPRING_DATASOURCE_USERNAME=<auto>
SPRING_DATASOURCE_PASSWORD=<auto>
SPRING_REDIS_HOST=<auto>
SPRING_REDIS_PORT=<auto>

# À configurer manuellement
JWT_SECRET=<généré-par-script>
JWT_EXPIRATION_MS=900000
CORS_ALLOWED_ORIGINS=<url-vercel>
```

### Variables d'Environnement Frontend (Vercel)

```bash
NEXT_PUBLIC_API_URL=<url-render>/api/v1
NEXT_PUBLIC_SESSION_TIMEOUT_MS=900000
NEXT_PUBLIC_CLIPBOARD_TIMEOUT_MS=30000
NEXT_PUBLIC_PBKDF2_ITERATIONS=100000
NEXT_PUBLIC_AUTO_LOCK_TIMEOUT_MS=300000
NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS=5
NEXT_PUBLIC_LOCKOUT_DURATION_MS=900000
```

---

## 🆘 Support et Dépannage

### Problèmes Courants

| Problème | Solution | Guide |
|----------|----------|-------|
| Backend ne démarre pas | Vérifier logs Render | [DEPLOY_NOW.md](DEPLOY_NOW.md#-problèmes-courants) |
| Erreur CORS | Vérifier CORS_ALLOWED_ORIGINS | [DEPLOY_NOW.md](DEPLOY_NOW.md#-erreur-cors) |
| Frontend ne se connecte pas | Vérifier NEXT_PUBLIC_API_URL | [DEPLOY_NOW.md](DEPLOY_NOW.md#-frontend-ne-se-connecte-pas) |
| Backend s'endort | Configurer cron job | [DEPLOY_NOW.md](DEPLOY_NOW.md#-bonus-garder-le-backend-actif-2-min) |

### Ressources

- **Logs Render**: https://dashboard.render.com → Service → Logs
- **Logs Vercel**: https://vercel.com/dashboard → Project → Deployments
- **Documentation Render**: https://render.com/docs
- **Documentation Vercel**: https://vercel.com/docs

---

## 📈 Prochaines Étapes

### Après le Déploiement

1. ✅ Tester toutes les fonctionnalités
2. ✅ Configurer le cron job (garder backend actif)
3. ✅ Configurer UptimeRobot (monitoring)
4. ✅ Partager avec des utilisateurs test
5. ✅ Collecter les retours
6. ✅ Itérer et améliorer

### Améliorations Futures

1. 🎯 Domaine personnalisé
2. 🎯 Backups automatiques
3. 🎯 Monitoring avancé (Sentry)
4. 🎯 Analytics utilisateurs
5. 🎯 Tests E2E automatisés
6. 🎯 CI/CD avec GitHub Actions

---

## 🎓 Ressources d'Apprentissage

### Tutoriels
- [Déployer Next.js sur Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Déployer Spring Boot sur Render](https://render.com/docs/deploy-spring-boot)
- [PostgreSQL sur Render](https://render.com/docs/databases)

### Communauté
- [Render Community](https://community.render.com/)
- [Vercel Discord](https://vercel.com/discord)
- [Stack Overflow](https://stackoverflow.com/)

---

## 📝 Checklist Finale

Avant de partager votre application:

- [ ] Backend déployé et accessible
- [ ] Frontend déployé et accessible
- [ ] Base de données créée et migrée
- [ ] Redis configuré
- [ ] Variables d'environnement configurées
- [ ] CORS configuré correctement
- [ ] SSL/HTTPS actif
- [ ] Tests fonctionnels passés
- [ ] Cron job configuré (backend actif)
- [ ] Monitoring configuré
- [ ] Documentation à jour
- [ ] URLs sauvegardées

---

## 🎉 Félicitations!

Vous êtes prêt à déployer votre gestionnaire de mots de passe!

**Commencez maintenant**: [DEPLOY_NOW.md](DEPLOY_NOW.md)

---

**Version**: 1.0.0  
**Dernière mise à jour**: Février 2026  
**Auteur**: Guide de déploiement automatisé
