## Description

<!-- Décrivez brièvement les changements apportés -->

## Type de changement

- [ ] 🐛 Bug fix (correction non-breaking)
- [ ] ✨ Nouvelle feature (changement non-breaking qui ajoute une fonctionnalité)
- [ ] 💥 Breaking change (fix ou feature qui causerait un dysfonctionnement des fonctionnalités existantes)
- [ ] 📝 Documentation
- [ ] 🎨 Style (formatage, point-virgules manquants, etc.)
- [ ] ♻️ Refactoring
- [ ] ⚡ Performance
- [ ] ✅ Tests

## Checklist

- [ ] Mon code suit les conventions de style du projet
- [ ] J'ai effectué une auto-review de mon code
- [ ] J'ai commenté mon code, particulièrement dans les zones complexes
- [ ] J'ai mis à jour la documentation si nécessaire
- [ ] Mes changements ne génèrent pas de nouveaux warnings
- [ ] J'ai ajouté des tests qui prouvent que mon fix fonctionne ou que ma feature marche
- [ ] Les tests unitaires passent localement
- [ ] Les tests d'intégration passent localement (si applicable)

## Tests effectués

<!-- Décrivez les tests que vous avez effectués -->

**Backend:**
```bash
cd backend
mvn test
mvn checkstyle:check
```

**Frontend:**
```bash
cd frontend
npm test
npm run lint
npm run build
```

## Screenshots (si applicable)

<!-- Ajoutez des screenshots pour les changements UI -->

## Requirements liés

<!-- Référencez les requirements du spec document -->
- Requirements: X.Y, Z.W

## Issues liées

<!-- Référencez les issues GitHub -->
Closes #(issue)

## Notes additionnelles

<!-- Toute information supplémentaire pour les reviewers -->
