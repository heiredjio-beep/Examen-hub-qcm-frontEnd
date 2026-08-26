## Ce que fait cette PR

<!-- Une phrase. Exemple : ajoute la page /admin/courses avec creation et edition. -->

## Regles de gestion couvertes

<!-- Exemple : RG-09 - le message 409 du serveur s'affiche a l'ecran, pas seulement en console -->

## Comment tester

<!--
Donnez le parcours exact, pas une description vague.
Exemple :
1. Backend demarre, npm run dev cote front
2. Se connecter avec admin@examhub.local / Admin123!
3. Aller sur /admin/courses, creer PROG2, puis retenter le meme code -> message d'erreur visible
-->

## Points d'attention pour le relecteur

<!-- Ce qui merite un second regard : un choix discutable, un cas limite, une dependance. -->

---

## Checklist auteur

Cochez seulement ce que vous avez reellement verifie.

**Avant tout**

- [ ] La PR cible `develop`, pas `main`
- [ ] La branche part de `develop` a jour et a ete rebasee ce matin
- [ ] Le nom de branche suit `type/perimetre-description-courte`

**Perimetre**

- [ ] Je n'ai modifie que des fichiers qui m'appartiennent
- [ ] Je n'ai pas touche a `src/App.jsx` : ma route y est deja declaree
- [ ] Je n'ai pas touche a `client.js`, `AuthContext.jsx`, `ProtectedRoute.jsx`, `Layout.jsx` ni `styles/`
- [ ] Si j'avais besoin d'un fichier appartenant a quelqu'un d'autre, je lui ai demande avant

**Code**

- [ ] `npm run dev` demarre sans erreur dans la console du navigateur
- [ ] Tous les appels API passent par `apiFetch`, aucun `fetch` en direct
- [ ] Les messages d'erreur affiches sont ceux renvoyes par le serveur, repris tels quels
- [ ] J'ai utilise les classes de `styles/app.css`, je n'ai pas invente mon propre style
- [ ] Les dates sont converties depuis l'UTC a l'affichage, et vers l'UTC a l'envoi

**Depot**

- [ ] `git diff` ne montre aucun marqueur de conflit (`<<<<<<<`, `=======`, `>>>>>>>`)
- [ ] Aucun secret, aucun `.env`, aucun `node_modules/`, aucun `dist/`
- [ ] Mes commits sont decoupes par idee, pas en un seul bloc
- [ ] Mes messages suivent `type(scope): description a l'infinitif, sans point final`
