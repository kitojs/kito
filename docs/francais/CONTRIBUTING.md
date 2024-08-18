<div align="center">

[🇺🇸 English](../../CONTRIBUTING.md) `‖` [🇪🇸 Español](../español/CONTRIBUTING.md) `‖` [🇵🇹 Português](../portugues/CONTRIBUTING.md) `‖` [🇫🇷 Français](../francais/CONTRIBUTING.md) `‖` [🇮🇹 Italiano](../italiano/CONTRIBUTING.md)

<hr />

<img src="../../public/static/banners/kito_banner_fr.png" alt="Kito Banner" />

<hr />

</div>

## 🙌🏼 Bienvenue

Bienvenue dans le guide de contribution de Kito ! Ce guide vous fournira des informations importantes à garder à l'esprit lors de votre contribution au projet.

## 🌸 Comment Contribuer

1. **Signaler des problèmes ou des bugs.**  
   Si vous trouvez ou rencontrez un problème ou un bug avec Kito, vous pouvez le signaler en ouvrant un issue sur ce dépôt avec le tag `bug`. Assurez-vous de le décrire de manière claire et concise, en expliquant ce qui doit être résolu et pourquoi vous pensez qu'il s'agit d'un problème valide.

2. **Demander de nouvelles fonctionnalités et améliorations.**  
   Vous avez une idée ou une amélioration en tête ? N'hésitez pas à la partager ! Ouvrez un issue sur ce dépôt avec le tag `feat`, et elle sera examinée. Fournissez une description détaillée de ce que vous souhaitez ajouter et des avantages potentiels.

3. **Contribuer au code.**  
   Si vous souhaitez contribuer directement au code, suivez ces étapes :

- Forkez le dépôt.
- Créez une nouvelle branche (`git checkout -b feature/nouvelle-fonctionnalité`).
- Apportez vos modifications sur votre branche.
- Commitez vos modifications (consultez le [Guide des Commits](#-guide-des-commits)).
- Poussez votre branche (`git push origin feature/nouvelle-fonctionnalité`).
- Ouvrez une Pull Request détaillant les modifications apportées.

## 📕 Guide des Commits

Afin de maintenir un historique de commits bien organisé et clair, il est recommandé de suivre ces directives lors de la rédaction des commits. Les directives décrites améliorent la qualité des contributions et peuvent accroître la pertinence de la révision.

#### Convention

Suivez la convention [Conventional Commits](https://conventionalcommits.org). L'utilisation d'emojis est recommandée mais non obligatoire.

#### Longueur

- La première ligne ne doit pas dépasser 50 caractères et doit être brève, mais suffisamment descriptive pour comprendre la modification effectuée.

- Après la première ligne, ajoutez une ligne blanche et, si nécessaire, incluez une description plus détaillée dans un paragraphe ne dépassant pas 72 caractères par ligne.

- Dans la description étendue, incluez le "pourquoi" et le "comment", pas seulement le "quoi".

**Exemple :**

✨ feat(user-auth): Ajouter une authentification basée sur JWT

Mise en place d'un mécanisme d'authentification basé sur JWT pour les utilisateurs. Cela remplace l'approche précédente basée sur les sessions, améliorant l'évolutivité et la sécurité dans des environnements distribués. Les tests et la documentation ont été mis à jour en conséquence.

#### Focus

Chaque commit doit se concentrer sur une seule tâche ou un seul objectif. Évitez d'apporter trop de changements dans un seul commit et ne mélangez pas des modifications de différents types ou domaines.

**Exemple :**

_Commit 1:_ `📦 build(deps): Mettre à jour la dépendance X vers la version Y.`

_Commit 2:_ `✨ feat(user-auth): Ajouter une fonctionnalité de récupération de mot de passe.`

#### Documentation

Si votre commit modifie également la documentation (par exemple, en ajoutant une fonctionnalité), incluez les modifications de la documentation dans le même commit. Cela permet de maintenir la cohérence entre le commit et la documentation du projet.

#### Commits WIP

Les commits WIP (Work in Progress - Travail en cours) concernent les changements qui sont encore en cours de développement et ne sont pas prêts à être fusionnés dans la branche principale. Plutôt que de commettre des changements WIP qui pourraient perturber le flux de travail, vous pouvez utiliser `git stash` pour les conserver dans un état temporaire sans les ajouter à l'historique des commits.

#### Références

Chaque fois qu'un commit est lié à un issue ou un ticket, incluez-y une référence dans le message du commit. Cela permet de maintenir un historique clair et facilite le suivi des problèmes.

**Exemple :**

```
✨ feat(user-auth): Ajouter une fonctionnalité de récupération de mot de passe

Clôture #123
```

#### Squash

Le terme "squash" fait référence à une méthode permettant de combiner des commits. Lorsque vous avez plusieurs commits pour le même objectif, utilisez cette méthode pour réduire le nombre de commits et améliorer la lisibilité.

Utilisez `git rebase -i` pour faire un squash des commits.

💡 **Conseil supplémentaire :** Lorsque vous devez corriger quelque chose dans un commit récent (et avant de faire un push), utilisez le format `fixup!` pour indiquer que vous êtes en train de corriger ou d'ajuster un commit précédent. Ces commits sont utiles avant de réaliser un squash.

## 👷 Guide des Pull Requests

Veuillez vous assurer que votre Pull Request répond aux critères suivants :

- **Description claire :** Expliquez l'objectif de votre contribution et comment elle améliore le projet.
- **Documentation mise à jour :** Si vous ajoutez de nouvelles fonctionnalités, mettez à jour la documentation en conséquence.
- **Tests inclus :** Si vous apportez des modifications importantes au code, assurez-vous d'ajouter des tests pour vérifier la fonctionnalité.

Après avoir ouvert une Pull Request, d'autres collaborateurs pourront examiner votre code et suggérer des modifications avant qu'il ne soit accepté.

## 🚧 Tests

Il est crucial de s'assurer que toutes les modifications passent les tests actuels du projet. Si vos modifications sont significatives, vous devez écrire vos propres tests pour la fonctionnalité que vous implémentez.

## 🎩 Normes

Il est essentiel de suivre les normes de Kito. Cela inclut le formatage des messages de commit, le formatage du code, la structure des dossiers, la documentation, les tests et tous les autres aspects du projet.

Soyez cohérent avec le style défini et suivez les meilleures pratiques.

## 🎉 Merci !

Merci d'avoir lu ce guide et nous espérons qu'il vous aidera à commencer à contribuer !
