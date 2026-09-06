# Tchat sécurisé — Projet TWEB 2021-2022

Application de messagerie en ligne de commande (Node.js) : messages privés, broadcast et groupes, avec persistance SQLite et chiffrement des échanges.

Projet de l’UE *Web for Internet of Things* (ISTIC / IRISA), réalisé en binôme à partir du TD3.

## Fonctionnalités

- Authentification par nom + mot de passe (minimum 8 caractères). **Les mots de passe ne sont pas chiffrés** : ils s’affichent en clair à la saisie, et le serveur les loggue en clair une fois le canal AES déchiffré. En base, bcrypt ne fait qu’un hash (non réversible), ce n’est pas du chiffrement.
- Messages privés (`s;`) et messages à tous (`b;`)
- Groupes publics ou privés : création, invitation, kick, ban / unban
- Historique des messages et des actions de groupe
- Export / suppression des messages privés d’un utilisateur (`getdata;`, `deldata;`)
- Canal chiffré : échange de clés ECDH (courbe `secp521r1`) puis AES-256-CBC

## Stack

| Couche | Techno |
| --- | --- |
| Transport | [Socket.IO](https://socket.io/) 2.x |
| Client CLI | [Inquirer](https://www.npmjs.com/package/inquirer), [Chalk](https://www.npmjs.com/package/chalk) |
| Base | SQLite (`Main.db`) via `sqlite3` |
| Mots de passe | Non chiffrés (saisie et logs en clair ; hash bcrypt en base seulement) |
| Crypto | module `crypto` de Node.js |

Le serveur écoute par défaut sur `127.0.0.1:8080`.

## Structure

```
src/
  client/client+.js          Client interactif
  server/server+.js          Serveur Socket.IO
  server/CreateDataBase.js   Crée Main.db et les tables
  server/ShowTable.js        Affiche une table (debug)
  server/DeleteAllData.js    Vide toutes les tables
  Modules/
    Commande.js              Parseur des commandes CLI
    FormatMessage.js         Formats JSON client / serveur
    SendMessage.js           Chiffrement + emit des événements
    Func_Crypt.js            AES-256-CBC
    Func_DataBase.js         Accès SQLite
startercode/                 Exemple TCP brut (TD3)
websocket/                   Mini-tchat Socket.IO pédagogique
ui/                          IHM : terminaux serveur + clients
  server.js                  Lanceur PTY (port 3456)
  public/index.html          Grille de terminaux
```

## Prérequis

- [Node.js](https://nodejs.org/) (LTS recommandé)
- npm

Toutes les commandes se lancent **à la racine du repo** (le dossier qui contient `src/` et `package.json`). `Main.db` est créé dans ce même dossier.

Le script est dans `src/server/CreateDataBase.js`, pas dans `server/` : `node server/CreateDataBase.js` depuis la racine échoue.

## Installation

Une seule fois, dans PowerShell :

```powershell
cd C:\Users\Frede\Documents\dev\Projets\Projet-TWEB-2021-2022
npm install
```

Si les dépendances ne sont pas encore dans `package.json` :

```powershell
npm install socket.io@2 socket.io-client@2 sqlite3 bcrypt inquirer chalk debug yargs
```

`sqlite3` peut échouer à compiler sous Windows. Dans ce cas, installe les [build tools](https://github.com/nodejs/node-gyp#on-windows) ou utilise une version précompilée de Node LTS.

## Démarrage

Toujours à la racine. **Lancer le serveur avant les clients** : le client se connecte à `http://localhost:8080` et n’échange les clés que si le serveur est déjà up.

### IHM terminaux (recommandé)

Une page web ouvre le vrai serveur et autant de clients CLI que tu veux, chacun dans son terminal.

```powershell
npm run ui
```

Puis ouvre [http://127.0.0.1:3456](http://127.0.0.1:3456). Le panneau **Serveur** démarre à l’ouverture de la page. Clique **+ Client** pour un nouveau terminal `client+.js`. Fermer l’onglet arrête le serveur tchat et tous les clients.

Ne lance pas `npm run server` en même temps : les deux voudraient le port 8080.

### 1. Créer la base (une seule fois)

```powershell
npm run db:create
```

Équivalent : `node src/server/CreateDataBase.js`

Le fichier `Main.db` est créé dans le dossier courant (la racine du repo).

### 2. Lancer le serveur (sans IHM)

```powershell
npm run server
```

Équivalent : `node src/server/server+.js`

Tu dois voir `Serveur en marche ...`. Il écoute sur **`127.0.0.1:8080`**. Laisse ce terminal ouvert.

### 3. Lancer un client (autre terminal)

```powershell
cd C:\Users\Frede\Documents\dev\Projets\Projet-TWEB-2021-2022
npm run client
```

Équivalent : `node src/client/client+.js`

Au premier lancement :

1. Attendre le message de connexion sécurisée, puis **Entrée**
2. Saisir un **nom**
3. Saisir un **mot de passe** (≥ 8 caractères) — il n’est **pas chiffré** (visible à l’écran, et visible dans les logs serveur après déchiffrement AES)

Un compte inexistant est créé automatiquement. Un compte existant est authentifié. Ouvre autant de terminaux que d’utilisateurs.

Exemple une fois connecté : `s;alice;salut` pour un message privé.

### Debug

Toujours à la racine :

```powershell
npm run db:show -- Users
npm run db:clear
```

Équivalent :

```powershell
node src/server/ShowTable.js Users
node src/server/DeleteAllData.js
```

## Commandes client

Saisir une commande au prompt `>`, puis Entrée.

| Commande | Description |
| --- | --- |
| `s;destinataire;message` | Message privé |
| `b;message` | Message à tous les clients connectés |
| `ls;` | Liste des utilisateurs enregistrés |
| `q;` | Déconnexion (aussi `Ctrl+C`) |
| `cg;nomGroupe` | Créer un groupe et y entrer |
| `j;nomGroupe` | Rejoindre un groupe public |
| `bg;nomGroupe;message` | Message dans un groupe |
| `members;nomGroupe` | Membres du groupe |
| `messages;nomGroupe` | Historique des messages du groupe |
| `groups;` | Liste des groupes |
| `leave;nomGroupe` | Quitter un groupe |
| `invite;nomGroupe;utilisateur` | Inviter quelqu’un (groupe privé) |
| `kick;nomGroupe;utilisateur;raison` | Expulser un membre |
| `ban;nomGroupe;utilisateur;raison` | Bannir définitivement |
| `unban;nomGroupe;utilisateur` | Lever un ban |
| `states;nomGroupe` | Journal des actions du groupe |
| `getdata;` | Récupérer ses messages privés |
| `deldata;` | Supprimer ses messages privés |

Les messages reçus sont colorés : jaune (privé), cyan (broadcast), magenta (groupe), rouge (erreur).

## Protocole

Les messages sont des objets JSON. Côté client, le champ `action` indique l’intention (`client-hello-auto`, `client-send`, `cgroupe`, `join`, …). Côté serveur, la réponse reprend un `action` et un `msg` affiché dans le terminal.

Événements Socket.IO :

| Événement | Rôle |
| --- | --- |
| `secure` | Échange des clés publiques ECDH + IV |
| `data` | Auth, liste, quit, getdata / deldata |
| `PrivateMessage` | Message privé |
| `BroadcastMessage` | Message global |
| `GroupMessage` | Tout ce qui concerne les groupes |
| `authentification` | Résultat login (succès / refus) |
| `erreur` | Message d’erreur serveur |

Après l’événement `secure`, le payload est un buffer AES-256-CBC. Chaque socket a son secret dérivé (`computeSecret(...).slice(0, 32)`).

## Base de données

Fichier `Main.db`, tables :

| Table | Contenu |
| --- | --- |
| `Users` | Socket id, nom, hash du mot de passe |
| `Groups` | Appartenance (nom, groupe, public oui/non) |
| `Banned` | Liste noire par groupe |
| `Messages` | Messages privés et broadcasts |
| `Messages_group` | Messages de groupe |
| `Action_group` | Journal (création, join, kick, ban, …) |

## Autres dossiers

- **`startercode/`** — serveur / client TCP (`net`) du TD3, handshake `client-hello` / `server-hello` sur le port 8080.
- **`websocket/`** — tchat Socket.IO minimal (connexion, broadcast, liste, quit) sur le port 3636.

```bash
cd websocket/server && npm install && npm start
cd websocket/client && npm install && node client.js
```

## Auteurs

Frédéric Yassi & Auffray — projet TWEB, année 2021-2022.
