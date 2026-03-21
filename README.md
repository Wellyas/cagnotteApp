# 🎁 Cagnotte App (Money Pool)

Une application web moderne, légère et sécurisée pour organiser des cagnottes entre amis. Elle permet de collecter des participations via **Wero** sans intermédiaire de paiement tiers, simplifiant ainsi le processus pour le créateur et les participants.

![Cagnotte App Mockup](https://img.shields.io/badge/Status-Active-brightgreen)
![Vite](https://img.shields.io/badge/Vite-latest-blue)
![React](https://img.shields.io/badge/React-latest-blueviolet)

## 🚀 Fonctionnalités

-   **🎯 Création flexible** : Titre, description, photo et objectif de montant (optionnel).
-   **💸 Paiement Wero** : Intégration par lien profond (Deep Link) ou numéro de téléphone pour un transfert instantané.
-   **🕵️ Confidentialité** : Possibilité de participer anonymement ou de masquer son montant sur la page publique.
-   **🛡️ Administration sécurisée** :
    -   Validation manuelle des paiements (pour s'assurer que l'argent est bien arrivé sur le compte).
    -   Protection par code PIN ou lien d'accès secret.
-   **💾 Hybrid Data Layer** : Utilise **Supabase** en production et bascule automatiquement sur **localStorage** en local (mode démo).

## 🛠️ Stack Technique

-   **Frontend** : React 18+ (avec Vite.js).
-   **Design** : Vanilla CSS avec Glassmorphism et animations fluides.
-   **Store** : Custom React Store (Hook-based).
-   **Backend** : Supabase (PostgreSQL, RLS pour la sécurité).
-   **Conteneurisation** : Docker & Docker Compose.

---

## 🏗️ Déploiement

### 1. Déploiement Local (Docker)

Le moyen le plus simple de tester l'application localement :

```bash
docker compose up -d --build
```

L'application sera accessible sur `http://localhost:8080`. Par défaut, elle fonctionnera en mode **local** (stockage des données dans le navigateur).

### 2. Déploiement Production (Supabase + Vercel)

#### 📝 Étape A : Configuration Supabase
1. Créez un projet sur [Supabase](https://supabase.com/).
2. Exécutez le script SQL situé dans `supabase/schema.sql` dans l'éditeur SQL de votre dashboard Supabase.
3. Récupérez votre `SUPABASE_URL` et `SUPABASE_ANON_KEY`.

#### 🔑 Étape B : Variables d'environnement
Créez un fichier `.env.local` (ou configurez vos secrets sur Vercel/Docker) :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anonyme
VITE_ADMIN_SECRET=votre-token-admin-secret (optionnel)
```

#### 🚀 Étape C : Déploiement Vercel
L'application est configurée pour un déploiement facile sur Vercel via GitHub Actions.
1. Liez votre repo à Vercel.
2. Ajoutez les variables d'environnement ci-dessus.
3. Le projet sera automatiquement construit (`npm run build`) et déployé.

---

## 🔒 Sécurité

-   **Row Level Security (RLS)** : Les politiques Supabase empêchent la lecture du code PIN admin par les clients.
-   **Postgres RPC** : La vérification du PIN se fait côté serveur via une fonction SQL (`check_admin_pin`) pour éviter de renvoyer le PIN au navigateur.
-   **Sanitization** : Nettoyage des chaînes de caractères pour prévenir les injections XSS.

## 📄 Licence

MIT License. Open source and free to use.
