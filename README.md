# Exam Hub — Frontend

Interface React du gestionnaire d'examens QCM.

**React + Vite en JavaScript · react-router-dom · appels API via `fetch` uniquement**

Dépôt backend associé : [exam-hub-qcm](https://github.com/heiredjio-beep/exam-hub-qcm)

---

## Prérequis

Node.js 20 ou plus, npm 10 ou plus.

**Le backend doit tourner avant de démarrer le frontend.** Suivez d'abord le README
du dépôt backend, puis vérifiez que `curl http://localhost:4000/api/health` répond.

---

## Installation

```bash
git clone https://github.com/heiredjio-beep/Examen-hub-qcm-frontEnd.git
cd Examen-hub-qcm-frontEnd

cp .env.example .env      # sous Windows PowerShell : copy .env.example .env
npm install
npm run dev               # interface sur http://localhost:5173
```

Le port 5173 est **figé** (`strictPort`) : le backend n'autorise que cette origine
en CORS. Si Vite basculait silencieusement sur 5174, toutes les requêtes seraient
rejetées sans message clair.

---

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement sur 5173 |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Sert le build de production |
| `npm run lint` | Analyse statique |

---

## Variables d'environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4000/api` | URL de base de l'API, préfixe `/api` inclus |

Le fichier `.env` n'est jamais versionné, `.env.example` sert de modèle.

---

## Comptes de test

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | `admin@examhub.local` | `Admin123!` |
| Étudiant | `andry@examhub.local` | `Etudiant123!` |
| Étudiant | `miora@examhub.local` | `Etudiant123!` |
| Étudiant désactivé | `tiana@examhub.local` | `Etudiant123!` |

Créés par `npm run db:seed` côté backend.

### Scénario de démonstration

1. Se connecter avec `tiana@examhub.local` → message **« Ce compte a été désactivé »**,
   différent de celui d'un mauvais mot de passe (RG-11)
2. Se connecter en administrateur → `/admin`, les quatre compteurs
3. `/admin/courses` → supprimer PROG2 → **409 lisible à l'écran** (RG-09)
4. `/admin/exams/3/questions` → **bandeau de verrouillage**, boutons grisés (RG-08)
5. Se connecter avec `miora@examhub.local` → seul l'examen ouvert et non passé apparaît
   (RG-02, RG-03) ; l'examen fermé est absent
6. Passer l'examen en laissant des questions sans réponse → confirmation → note et
   correction complète immédiates (RG-05, RG-06, RG-12)
7. Revenir sur `/student` → l'examen a disparu de la liste (RG-02)
8. **Onglet réseau ouvert pendant le passage** : la réponse de `/api/my/exams/1` ne
   contient aucun champ `isCorrect` (RG-07)

---

## Structure

```
src/
├── api/client.js            apiFetch — le seul point d'appel de l'API
├── auth/AuthContext.jsx     session, login, logout, persistance du token
├── routes/ProtectedRoute.jsx garde de navigation par rôle
├── components/Layout.jsx    barre de navigation et enveloppe commune
├── styles/app.css           feuille de styles partagée
├── pages/                   une page par route, un propriétaire par page
├── App.jsx                  déclaration des onze routes
└── main.jsx                 point d'entrée
```

`App.jsx`, `client.js`, `AuthContext.jsx`, `ProtectedRoute.jsx`, `Layout.jsx` et
`app.css` appartiennent au socle. **Les onze routes sont déjà déclarées** : remplissez
uniquement votre page dans `src/pages/`, sans toucher à `App.jsx`.

---

## Appeler l'API

Passez toujours par `apiFetch`. Il préfixe l'URL, ajoute l'en-tête
`Authorization: Bearer`, sérialise le corps en JSON, et lève une `ApiError`
portant **le message renvoyé par le serveur**.

```js
import { apiFetch } from '../api/client';

const cours = await apiFetch('/courses');
await apiFetch('/courses', { method: 'POST', body: { code: 'PROG2', name: 'Programmation 2' } });
```

Affichage d'une erreur — RG-13, le message du serveur est repris **tel quel** :

```jsx
try {
  await apiFetch(`/courses/${id}`, { method: 'DELETE' });
} catch (erreur) {
  setMessageErreur(erreur.message);
}
```

```jsx
{messageErreur && <p className="message message-erreur">{messageErreur}</p>}
```

N'inventez jamais votre propre texte d'erreur : le correcteur vérifie que le message
du serveur apparaît bien à l'écran, pas seulement dans la console.

Une réponse 401 vide automatiquement la session et renvoie l'utilisateur
vers `/login` — aucune page n'a à gérer le token expiré.

---

## Routes

| Route | Rôle exigé | Page | Propriétaire |
|---|---|---|---|
| `/login` | — | `Login.jsx` | P2 |
| `/admin` | ADMIN | `admin/Dashboard.jsx` | P3 |
| `/admin/students` | ADMIN | `admin/Students.jsx` | P2 |
| `/admin/courses` | ADMIN | `admin/Courses.jsx` | P3 |
| `/admin/exams` | ADMIN | `admin/Exams.jsx` | P3 |
| `/admin/exams/:id/questions` | ADMIN | `admin/QuestionEditor.jsx` | P4 |
| `/admin/exams/:id/results` | ADMIN | `admin/ExamResults.jsx` | P4 |
| `/student` | STUDENT | `student/AvailableExams.jsx` | P5 |
| `/student/exams/:id` | STUDENT | `student/TakeExam.jsx` | P5 |
| `/student/exams/:id/result` | STUDENT | `student/ExamResult.jsx` | P5 |
| `/student/results` | STUDENT | `student/MyResults.jsx` | P5 |

### Le parcours étudiant

`TakeExam.jsx` affiche toutes les questions sur une seule page, avec **un groupe de
boutons radio par question** : deux réponses sont mécaniquement impossibles. Un compteur
« X sur Y questions répondues » et l'heure de fermeture restent visibles.

La soumission demande une **confirmation explicite**, avertit s'il reste des questions
sans réponse, et rappelle que l'envoi est définitif. Le bouton est désactivé pendant
l'appel pour éviter le double clic — même si le serveur s'en protège déjà.

Le résultat complet est renvoyé par `POST /submit` lui-même : il est transmis à
`ExamResult.jsx` par l'état de navigation React, sans second appel. Ouvrir l'URL de
résultat directement renvoie vers l'historique, c'est volontaire.

Non connecté → renvoi vers `/login`. Connecté avec le mauvais rôle → renvoi vers
l'espace de son rôle réel. Ces gardes ne protègent rien en soi : la vraie protection
est le `roleGuard` côté serveur.

---

## Styles

Utilisez les classes de `src/styles/app.css` plutôt que d'écrire du CSS dans votre
page — c'est ce qui évite que l'application ait cinq styles différents.

| Classe | Usage |
|---|---|
| `.carte`, `.carte-entete` | Bloc de contenu |
| `.table`, `.table-vide` | Tableaux |
| `.champ` | Groupe label + input |
| `.bouton`, `.bouton-secondaire`, `.bouton-danger` | Boutons |
| `.badge`, `.badge-succes`, `.badge-erreur`, `.badge-alerte` | Étiquettes d'état |
| `.message`, `.message-erreur`, `.message-succes` | Messages |
| `.texte-discret` | Texte secondaire |
| `.choix-ligne` | Ligne de choix cliquable (passage d'examen) |
| `.choix-correct`, `.choix-errone` | Correction en vert / rouge |
| `.note-globale` | Note affichée en grand |
| `.compteurs`, `.compteur-valeur`, `.compteur-libelle` | Grille de compteurs |

---

## Travail en équipe

- Aucun push direct sur `main` ni sur `develop` — tout passe par une Pull Request
- Une tâche = une branche = une PR, branche créée depuis `develop`
- Format de branche : `type/perimetre-description-courte`
- Format de commit : `type(scope): description à l'infinitif, en minuscule, sans point final`
- Le code poussé doit démarrer sans erreur console
