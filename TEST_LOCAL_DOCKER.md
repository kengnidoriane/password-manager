# 🐳 Test Local avec Docker

## 🎯 Objectif

Tester le build Docker en local avant de déployer sur Render.

---

## 📋 Prérequis

- Docker Desktop installé et démarré
- Terminal ouvert dans le dossier du projet

---

## 🚀 Étape 1: Tester le Build Backend

### Build l'image Docker

```bash
cd backend
docker build -t password-manager-backend:test .
```

**Temps estimé**: 5-10 minutes

### Si le build réussit ✅

Vous verrez:
```
Successfully built abc123def456
Successfully tagged password-manager-backend:test
```

### Si le build échoue ❌

Vous verrez les erreurs exactes. Partagez-les moi pour qu'on les corrige.

---

## 🧪 Étape 2: Tester l'Application Localement

### Démarrer tous les services

Retourner à la racine du projet:

```bash
cd ..
docker-compose up -d
```

Cela démarre:
- ✅ PostgreSQL
- ✅ Redis
- ✅ Backend
- ✅ Frontend

### Vérifier que tout fonctionne

```bash
# Vérifier les services
docker-compose ps

# Vérifier les logs du backend
docker-compose logs -f backend

# Tester l'API
curl http://localhost:8080/actuator/health
```

### Arrêter les services

```bash
docker-compose down
```

---

## 🔧 Étape 3: Build Simplifié (Si Problème)

Si le build Docker échoue, essayons un Dockerfile simplifié:

### Créer un nouveau Dockerfile de test

```bash
# Dans le dossier backend
notepad Dockerfile.simple
```

Contenu:

```dockerfile
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Copier le code
COPY pom.xml .
COPY src/main ./src/main

# Build sans tests
RUN apk add --no-cache maven && \
    mvn clean package -DskipTests -Dmaven.test.skip=true

# Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
```

### Tester ce Dockerfile

```bash
docker build -f Dockerfile.simple -t password-manager-backend:simple .
```

---

## 📊 Diagnostic des Erreurs

### Erreur: Tests qui échouent

**Solution**: Vérifier que les tests ne sont pas copiés

```dockerfile
# Copier SEULEMENT src/main, pas src/test
COPY src/main ./src/main
```

### Erreur: Dépendances manquantes

**Solution**: Vérifier le pom.xml

```bash
# Tester le build Maven localement
cd backend
mvn clean package -DskipTests
```

### Erreur: Mémoire insuffisante

**Solution**: Augmenter la mémoire Docker

Docker Desktop → Settings → Resources → Memory: 4GB minimum

---

## 🎯 Commandes Rapides

### Build Backend uniquement

```bash
cd backend
docker build -t test-backend .
```

### Build et Run

```bash
docker build -t test-backend . && docker run -p 8080:8080 test-backend
```

### Voir les logs en temps réel

```bash
docker logs -f <container-id>
```

### Nettoyer les images

```bash
docker system prune -a
```

---

## ✅ Checklist de Test

Avant de déployer sur Render:

- [ ] Build Docker réussit en local
- [ ] Application démarre sans erreur
- [ ] `/actuator/health` retourne `{"status":"UP"}`
- [ ] Connexion PostgreSQL fonctionne
- [ ] Connexion Redis fonctionne (si configuré)

---

## 🆘 Si Ça Ne Marche Pas

Partagez-moi:
1. La commande exacte que vous avez lancée
2. L'erreur complète
3. Les dernières lignes des logs

Je vous aiderai à corriger! 😊

---

**Testez d'abord en local, déployez ensuite!** 🚀
