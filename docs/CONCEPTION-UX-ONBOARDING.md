# Propulsion — Conception UX & Onboarding (V1 web mobile-first)

> Principe directeur : **léger, fluide, pensé du point de vue du membre qui arrive de WhatsApp.**
> Chaque écran a UNE action principale. On ne montre jamais les 18 modules à un nouveau venu.

---

## 0. Le constat fondateur (penser comme l'utilisateur)

Le membre Propulsion vient de **WhatsApp** : un monde instantané, conversationnel, où un humain confirme tout. En basculant sur une plateforme, il accepte de perdre cette instantanéité **uniquement si on lui rend quelque chose de mieux** : de la clarté, de l'autonomie, un sentiment d'appartenance « premium ».

Trois frictions inhérentes au cahier des charges, qu'il faut désamorcer par le design :

1. **Le formulaire d'inscription est lourd** — M1 liste 11 champs (prénom, nom, WhatsApp, email, pays, ville, secteur, entreprise, description, photo, niveau). Tout demander d'un coup = abandon massif sur mobile.
2. **Le paiement est manuel et asynchrone** — capture d'écran → attente de validation admin. C'est un **temps mort** potentiellement mortel pour la conversion.
3. **Le pavé des coordonnées de paiement (M3) est illisible** — 6 pays, ~15 moyens de paiement. Un membre camerounais n'a aucun besoin de voir les coordonnées ivoiriennes ou l'IBAN BNP Paribas.

> **La thèse de conception : découpler `créer un compte` / `payer` / `enrichir son profil`, et transformer l'attente de validation en progression productive.**

---

## 1. Les 5 lois UX qu'on applique partout

| Loi | Traduction concrète sur Propulsion |
|---|---|
| **Time-to-value minimal** | Le membre doit toucher de la valeur (kit, aperçu communauté) **avant** la fin de la validation de paiement, pas après. |
| **Progressive disclosure** | On collecte le minimum pour franchir la porte, on enrichit ensuite. On révèle les modules au fur et à mesure du niveau et de l'usage. |
| **Une action par écran (Hick's law)** | Un seul bouton primaire par vue. Le secondaire est discret. Zéro écran « fourre-tout ». |
| **Reconnaissance > rappel** | Auto-détection du pays → on n'affiche que SES moyens de paiement, SA devise. Pré-remplissage partout où c'est possible. |
| **Performance perçue** | Squelettes de chargement, feedback instantané (optimistic UI), jamais d'écran blanc ni de spinner nu. |

---

## 2. Le parcours d'onboarding (écran par écran)

### Phase 0 — Découverte · *Visiteur, non connecté*
- **Landing mobile-first.** Au-dessus de la ligne de flottaison : promesse claire en une phrase + 1 CTA unique « Rejoindre Propulsion ». Preuve sociale (nb de membres, témoignages, logos pays).
- **Comparateur d'offres** Standard / Pro / Élite : 3 colonnes simples, différences mises en avant, pas un mur de fonctionnalités. Le membre **choisit son niveau ici** → ce choix est porté jusqu'au paiement.

### Phase 1 — Créer son compte · *cible : < 60 secondes*
- **Le minimum vital** : Prénom, Nom, **Numéro WhatsApp**, Email, mot de passe. Pays **auto-détecté** (modifiable). Niveau déjà choisi en Phase 0.
- **Vérification par OTP WhatsApp/SMS** plutôt que lien email à cliquer → adapté au contexte africain (l'email est moins fiable, le WhatsApp est leur réflexe).
- À la validation → **identifiant `PROP-{STD|PRO|ELT}-2026-XXXX` attribué** + statut `En attente de paiement`. Le membre a déjà une identité — il *existe* dans Propulsion.
- ❌ On NE demande PAS ici : ville, secteur, entreprise, description, photo. → repoussés en Phase 3.

### Phase 2 — Payer · *l'écran le plus soigné de l'app*
- Rappel clair : offre choisie + prix dans **sa devise** + « ce que ça débloque » (3 bullets max).
- **Deux chemins, présentés simplement :**
  - **Passerelle automatique** (quand dispo) → paiement en ligne instantané, validation auto.
  - **Mode manuel assisté** → on affiche **uniquement les moyens de paiement de SON pays** (ex : un Camerounais voit Orange Money + MTN MoMo, point). Puis un seul écran : *numéro payeur · montant · upload de la capture (galerie ou photo)*.
- Soumission → statut `Paiement à valider`. Confirmation immédiate et rassurante : « Bien reçu. On vérifie, généralement en moins de X h. »

### Phase 3 — L'attente productive · *l'innovation clé* 🎯
> Au lieu d'un mur « en attente de validation », on enchaîne immédiatement sur de la valeur et de la progression.

- **Stepper de statut toujours visible** : `Compte ✓ → Paiement soumis ✓ → Validation ⏳ → Accès complet`.
- **« Pendant qu'on vérifie, complète ton profil »** = c'est ICI qu'on collecte ville, secteur, entreprise, description, photo. C'est exactement l'« Étape 1 : Intégrer la base de données » du cahier (M1) — **intégrée, sans lien externe**, et ce profil alimente directement l'annuaire (M7). L'attente devient du **temps utile**.
- **Aperçu du Kit du membre** (M1, Étape 2) en lecture : présentation Propulsion, à quoi s'attendre. Le membre se projette déjà.
- Le membre peut quitter l'app : dès validation admin, **notification push + email + WhatsApp** « Bienvenue [Prénom] ! » le ramène.

### Phase 4 — Activation · *le « aha moment »*
- Bascule `Actif` → micro-célébration (badge de bienvenue), message personnalisé du Dr Claudel.
- **Tableau de bord** (M4) : identité + statut + expiration en haut, puis prochaine masterclass, challenge en cours.
- **Kit débloqué** intégralement.
- **Une première action guidée** (pas un dashboard vide) : « Regarde ta première masterclass » OU « Complète ton profil à 100 % » OU « Découvre l'annuaire ». Un seul appel à l'action.

---

## 3. Réduire la charge : navigation & révélation progressive

Un nouveau membre ne doit **jamais** voir 18 modules. Navigation mobile = **barre d'onglets basse, 4–5 items max** :

```
[ Accueil ]  [ Contenus ]  [ Communauté ]  [ + ]  [ Profil ]
  dashboard   masterclass    annuaire +     action   moi,
  + statut    + replays      réseau social  rapide   adhésion, parrainage
              + ressources
```

- Le reste (challenges, événements, marché interne, commissions, IA, support…) vit **à l'intérieur** de ces 4 piliers, révélé au bon moment.
- **Gating de niveau = aspiration, pas mur.** Une fonction Pro vue par un Standard s'affiche déverrouillable (« Passe en Pro pour accéder à l'annuaire complet »), jamais comme une porte fermée sans explication → ça sert aussi l'upsell.
- **Agent IA omniprésent mais discret** : un bouton flottant « Poser une question » qui répond aux basiques (adhésion, paiement, replays) → désamorce le réflexe « je demande sur WhatsApp ».

---

## 4. « Léger » : ce que ça veut dire techniquement

Contexte africain = connexions instables, forfaits data comptés, téléphones modestes. La légèreté n'est pas une option, c'est une exigence d'architecture :

- **Mobile-first réel** : on conçoit pour le pouce d'abord (cibles tactiles larges, contenu en colonne unique), desktop ensuite.
- **Budget data serré** : images compressées + lazy-loading + formats modernes (WebP/AVIF), miniatures avant la vidéo, vidéos déléguées à YouTube (pas d'hébergement lourd chez nous).
- **Chargement par morceaux** (code splitting par module) : on ne télécharge pas le back-office quand on est un membre.
- **Squelettes + optimistic UI** : l'interface répond instantanément, même quand le réseau rame.
- **PWA installable** : icône sur l'écran d'accueil, **push web**, fonctionnement partiel hors-ligne, **reprise automatique des uploads** (capture de paiement qui repart toute seule quand le réseau revient). → un « avant-goût d'app » avant le natif.
- **Pagination & cache** partout (annuaire, social, replays) — jamais charger 5 000 membres d'un coup.

---

## 5. Les états vides & d'attente, conçus comme des guides

La plupart des apps ratent ça. Sur Propulsion, un nouveau membre a 0 filleul, 0 progression, 0 publication. Chaque **état vide** doit guider, pas décevoir :

- Annuaire vu sans profil complété → « Complète ton profil pour apparaître ici. »
- Parrainage à 0 filleul → « Partage ton lien, voici comment. »
- Aucune masterclass commencée → « Commence par celle-ci (recommandée pour les nouveaux). »
- Paiement en validation → stepper + temps estimé + « complète ton profil en attendant ».

---

## 6. Synthèse des décisions de conception

1. **Découpler** inscription / paiement / enrichissement de profil.
2. **Inscription minimale** (5 champs) + OTP WhatsApp.
3. **Paiement contextualisé au pays** (ne montrer que ses moyens) — fini le pavé des 6 pays.
4. **Attente de validation = progression productive** (profil + kit), jamais un mur.
5. **Navigation à 4 piliers**, modules révélés progressivement.
6. **Gating de niveau = aspiration/upsell**, pas mur fermé.
7. **Léger par conception** : PWA, data-light, optimistic UI, uploads résilients.
8. **Agent IA flottant** pour tuer le réflexe « je demande sur WhatsApp ».
