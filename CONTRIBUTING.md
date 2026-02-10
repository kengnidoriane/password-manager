# Guide de Contribution

Merci de votre intérêt pour contribuer au projet Password Manager! 🎉

## 📋 Table des Matières

1. [Code de Conduite](#code-de-conduite)
2. [Comment Contribuer](#comment-contribuer)
3. [Workflow de Développement](#workflow-de-développement)
4. [Standards de Code](#standards-de-code)
5. [Conventions de Commit](#conventions-de-commit)
6. [Pull Requests](#pull-requests)
7. [Tests](#tests)

---

## Code de Conduite

En participant à ce projet, vous acceptez de respecter notre code de conduite:
- Soyez respectueux et inclusif
- Acceptez les critiques constructives
- Concentrez-vous sur ce qui est meilleur pour la communauté
- Faites preuve d'empathie envers les autres membres

---

## Comment Contribuer

### Signaler un Bug

1. Vérifiez que le bug n'a pas déjà été signalé dans les [Issues](../../issues)
2. Créez une nouvelle issue en utilisant le template "Bug Report"
3. Incluez autant de détails que possible
4. Ajoutez des screenshots si applicable

### Proposer une Feature

1. Vérifiez que la feature n'a pas déjà été proposée
2. Créez une nouvelle issue en utilisant le template "Feature Request"
3. Expliquez clairement la motivation et l'impact
4. Discutez avec les mainteneurs avant de commencer le développement

### Améliorer la Documentation

La documentation est toujours la bienvenue! Vous pouvez:
- Corriger des typos
- Clarifier des explications
- Ajouter des exemples
- Traduire la documentation

---

## Workflow de Développement

### 1. Fork et Clone

```bash
# Fork le repository sur GitHub, puis:
git clone https://github.com/VOTRE-USERNAME/password-manager.git
cd password-manager

# Ajouter le remote upstream
git remote add upstream https://github.com/ORIGINAL-OWNER/password-manager.git
```

### 2. Créer une Branche

```bash
# Mettre à jour main
git checkout main
git pull upstream main

# Créer une branche feature
git checkout -b feature/ma-feature

# Ou une branche bugfix
git checkout -b bugfix/mon-bug
```

### 3. Développer

```bash
# Installer les dépendances
cd frontend && npm install
cd ../backend && mvn install

# Démarrer l'environnement de développement
docker-compose up -d

# Faire vos modifications
# ...

# Tester localement
cd frontend && npm test
cd ../backend && mvn test
```

### 4. Commiter

```bash
# Ajouter les fichiers modifiés
git add .

# Commiter avec un message conventionnel
git commit -m "feat(auth): add password reset functionality"
```

### 5. Pousser et Créer une PR

```bash
# Pousser votre branche
git push origin feature/ma-feature

# Créer une Pull Request sur GitHub
```

---

## Standards de Code

### Frontend (TypeScript/React)

**Style:**
- Utilisez TypeScript strict
- Suivez les règles ESLint configurées
- Utilisez Prettier pour le formatage
- Nommage: camelCase pour les variables, PascalCase pour les composants

**Exemple:**
```typescript
// ✅ Bon
const userName = "John";
const UserProfile: React.FC = () => { ... };

// ❌ Mauvais
const user_name = "John";
const userprofile = () => { ... };
```

**Vérification:**
```bash
cd frontend
npm run lint
npx prettier --check .
```

### Backend (Java/Spring Boot)

**Style:**
- Suivez les conventions Java standard
- Utilisez Checkstyle configuré
- Commentez les méthodes publiques avec Javadoc
- Nommage: camelCase pour les méthodes, PascalCase pour les classes

**Exemple:**
```java
// ✅ Bon
public class UserService {
    /**
     * Retrieves a user by ID.
     * @param id the user ID
     * @return the user entity
     */
    public User getUserById(Long id) { ... }
}

// ❌ Mauvais
public class userservice {
    public User get_user(Long id) { ... }
}
```

**Vérification:**
```bash
cd backend
mvn checkstyle:check
mvn spotbugs:check
```

---

## Conventions de Commit

Nous utilisons les [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <description>

[corps optionnel]

[footer optionnel]
```

### Types

- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation uniquement
- `style`: Formatage (pas de changement de code)
- `refactor`: Refactorisation
- `test`: Ajout ou modification de tests
- `chore`: Tâches de maintenance
- `perf`: Amélioration des performances

### Scopes

- `auth`: Authentification
- `vault`: Gestion du coffre-fort
- `crypto`: Cryptographie
- `ui`: Interface utilisateur
- `api`: API backend
- `db`: Base de données
- `ci`: CI/CD

### Exemples

```bash
# Feature
git commit -m "feat(auth): add 2FA support"

# Bug fix
git commit -m "fix(vault): correct encryption key derivation"

# Documentation
git commit -m "docs(api): update Swagger annotations"

# Refactoring
git commit -m "refactor(crypto): simplify key generation logic"

# Tests
git commit -m "test(auth): add property tests for JWT validation"
```

### Breaking Changes

Pour les breaking changes, ajoutez `!` après le type:

```bash
git commit -m "feat(api)!: change authentication endpoint structure

BREAKING CHANGE: The /auth/login endpoint now returns a different response format"
```

---

## Pull Requests

### Avant de Soumettre

- [ ] Le code compile sans erreurs
- [ ] Tous les tests passent
- [ ] Le code suit les standards de style
- [ ] La documentation est à jour
- [ ] Les commits suivent les conventions
- [ ] La branche est à jour avec `main`

### Titre de la PR

Utilisez le même format que les commits:

```
feat(auth): add password reset functionality
```

### Description de la PR

Utilisez le template fourni et incluez:
- Description des changements
- Type de changement
- Checklist complétée
- Tests effectués
- Screenshots (si UI)
- Requirements liés

### Processus de Review

1. **Automated Checks:** Les workflows CI doivent passer
2. **Code Review:** Au moins 1 approbation requise
3. **Tests:** Vérifiez que tous les tests passent
4. **Documentation:** Vérifiez que la doc est à jour
5. **Merge:** Squash and merge dans `main`

### Après le Merge

- Votre branche sera automatiquement supprimée
- Le déploiement staging se déclenchera automatiquement
- Vérifiez que tout fonctionne sur staging

---

## Tests

### Tests Requis

**Frontend:**
```bash
cd frontend

# Tests unitaires
npm test

# Tests avec coverage
npm test -- --coverage

# Linting
npm run lint
```

**Backend:**
```bash
cd backend

# Tests unitaires
mvn test

# Tests avec coverage
mvn test jacoco:report

# Vérifications de qualité
mvn checkstyle:check
mvn spotbugs:check
```

### Écrire des Tests

**Frontend (Jest/React Testing Library):**
```typescript
import { render, screen } from '@testing-library/react';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('should render login form', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});
```

**Backend (JUnit/Spring Boot Test):**
```java
@SpringBootTest
class UserServiceTest {
    @Autowired
    private UserService userService;
    
    @Test
    void shouldCreateUser() {
        User user = userService.createUser("test@example.com");
        assertNotNull(user.getId());
    }
}
```

### Property-Based Tests

Pour les fonctionnalités critiques (crypto, auth), ajoutez des property tests:

**Frontend (fast-check):**
```typescript
import fc from 'fast-check';

it('encryption round-trip should preserve data', () => {
  fc.assert(
    fc.property(fc.string(), (data) => {
      const encrypted = encrypt(data, key);
      const decrypted = decrypt(encrypted, key);
      return decrypted === data;
    })
  );
});
```

---

## Ressources Utiles

### Documentation

- [Guide de Démarrage Rapide](QUICK_START.md)
- [Guide CI/CD](CICD_IMPLEMENTATION_GUIDE.md)
- [Guide de Dépannage](CICD_TROUBLESHOOTING.md)
- [Spec du Projet](.kiro/specs/password-manager/)

### Documentation Utilisateur

- [Guide Utilisateur](docs/user/USER_GUIDE.md) - Manuel complet
- [Démarrage Rapide](docs/user/QUICK_START.md) - Guide de démarrage
- [FAQ](docs/user/FAQ.md) - Questions fréquentes
- [Bonnes Pratiques de Sécurité](docs/user/SECURITY_BEST_PRACTICES.md) - Conseils de sécurité
- [Guide Import/Export](docs/user/IMPORT_EXPORT_GUIDE.md) - Migration de données
- [Dépannage](docs/user/TROUBLESHOOTING.md) - Résolution de problèmes

### Documentation Développeur

- [Onboarding Développeur](docs/developer/DEVELOPER_ONBOARDING.md) - Guide pour nouveaux développeurs
- [Architecture](docs/developer/ARCHITECTURE.md) - Architecture système et décisions de conception
- [Guide d'Intégration API](docs/developer/API_INTEGRATION_GUIDE.md) - Documentation API REST
- [Schéma de Base de Données](docs/developer/DATABASE_SCHEMA.md) - Structure BDD et migrations
- [Procédures de Déploiement](docs/developer/DEPLOYMENT_PROCEDURES.md) - Guide de déploiement
- [Standards de Code](docs/developer/CODING_STANDARDS.md) - Standards et meilleures pratiques

### Outils

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)

### Communauté

- [Issues](../../issues)
- [Pull Requests](../../pulls)
- [Discussions](../../discussions)

---

## Questions?

Si vous avez des questions:
1. Consultez la documentation
2. Cherchez dans les issues existantes
3. Ouvrez une nouvelle issue avec le label `question`
4. Contactez les mainteneurs

---

## Remerciements

Merci à tous les contributeurs qui aident à améliorer ce projet! 🙏

Votre contribution, quelle que soit sa taille, est appréciée et fait une différence.

---

**Happy Coding! 🚀**
