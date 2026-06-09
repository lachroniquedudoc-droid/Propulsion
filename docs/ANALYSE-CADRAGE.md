# Propulsion — Analyse & Cadrage (Phase 0)

> Document de travail interne — Prestataire : Gamaliel TANKEU · Client : Dr Claudel NOUBISSIE / CNIC
> Version 0.1 — Juin 2026 · État : analyse pré-développement (aucune ligne de code écrite)

---

## 1. Compréhension du projet

**Propulsion** est une communauté entrepreneuriale panafricaine en forte croissance (plusieurs milliers de membres répartis sur plusieurs groupes WhatsApp). Le projet consiste à faire migrer toute la gestion communautaire de **WhatsApp + outils dispersés** vers une **plateforme web + mobile centralisée, automatisée et traçable**.

La plateforme n'est **pas** une simple app de contenu : c'est le **système central de gestion, d'animation, de suivi, de monétisation et de développement** de la communauté.

### Les 5 problèmes à résoudre (le « pourquoi »)
1. Dépendance excessive à WhatsApp (perte d'info, pas d'historique, pas de niveaux).
2. Gestion manuelle des paiements (captures d'écran, erreurs, commissions non calculées).
3. Contenus dispersés (masterclass, replays, PDF éparpillés).
4. Networking non structuré (impossible de chercher par ville/secteur/niveau).
5. Absence d'agent IA (trop de questions répétitives sur l'équipe).

### Les 3 piliers de valeur
- **Membres** : compte identifié, accès par niveau, suivi paiements, contenus, networking, IA.
- **Équipe CNIC** : gestion membres/paiements/adhésions, automatisation relances, stats, commissions.
- **Dr Claudel / vision** : infrastructure scalable pour devenir la référence communautaire panafricaine.

---

## 2. Profils utilisateurs (modèle de rôles — RBAC)

7 rôles, hiérarchie d'accès cumulative pour les membres :

| Rôle | Périmètre |
|---|---|
| **Visiteur** | Landing page, offres, adhésion initiale (non authentifié / prospect) |
| **Membre Standard** | Espace perso, masterclass, replays, challenges, parrainage |
| **Membre Pro** | Standard + annuaire complet, fiches business, contenus exclusifs |
| **Membre Élite** | Pro + canal privé, badge Élite, suivi stratégique, visibilité premium |
| **Modérateur / Commercial** | Annonces, validation profils, suivi parrainage & commissions |
| **Administrateur** | Gestion complète membres, contenus, paiements, stats |
| **Super Admin** | Tous droits + finances, rôles, paramètres globaux |

> **Implication technique** : le contrôle d'accès est **central et transversal** à tous les modules. À implémenter au niveau base de données (Row-Level Security) ET interface. Le verrouillage du contenu premium par niveau est un critère d'acceptation explicite (§24).

---

## 3. Architecture fonctionnelle — Les 18 modules

(16 numérotés + 16-B + sections transverses)

### Bloc A — Identité & cycle de vie membre
- **M1 — Inscription, identification, espace membre** : profil complet, **identifiant unique** `PROP-{STD|PRO|ELT}-2026-XXXX` (persistant même en cas de renouvellement/changement d'offre), **9 statuts** (Actif, En attente de paiement, Paiement à valider, Expiré, Suspendu, Renouvellement en attente, Gratuit exceptionnel, Invité, Ancien membre), message de bienvenue automatique multi-canal (WhatsApp + email + push), intégration native des formulaires (remplacer Google Forms/Drive par des espaces intégrés).
- **M2 — Adhésions Standard / Pro / Élite** : offres annuelles, ponctuelles, accompagnements courts (10 jours), accès événementiels, prolongations manuelles, renouvellements automatiques.

### Bloc B — Monétisation
- **M3 — Paiements, facturation, renouvellements** : double mode (**manuel assisté** = téléversement capture + n° payeur + montant + offre → validation admin ; **automatique** = passerelle). Multi-pays / multi-devises (RDC, Cameroun, Côte d'Ivoire, Burkina, international). Rappels J-30/J-15/J-7/J-3/J/post-expiration multi-canal. Passerelles à évaluer : **CinetPay, Monetbil, FedaPay, Campay, PayDunya, Flutterwave, Wave, Stripe (international)**.
- **M9 — Parrainage & commissions** : code + lien parrain uniques, suivi filleuls temps réel, règles configurables (Standard/Pro/Élite, national/international, fixe/%, désactivable sur promos), paiement déclenché après validation, outils admin (taux, anomalies, top parrains).

### Bloc C — Contenu & exécution
- **M5 — Masterclass, lives, replays** : live (thème/date/intervenant/lien/niveau requis/rappel/calendrier — Meet/Zoom/YouTube Live/Vimeo) ; bibliothèque replays (titre, miniature, vidéo, audio, résumé PDF, catégorie, niveau, progression) ; 6 catégories ; suivi de progression. **Hébergement vidéo : YouTube non répertorié** (choix client §26).
- **M6 — Challenges & sprints** : logique d'exécution hebdomadaire, statuts (non commencé → en cours → soumis → validé/rejeté), livrables, notes, classement exportable.
- **M15 (partiel) — Ressources & bibliothèque** : centralisation PDF/guides/templates classés par catégorie/niveau/date.

### Bloc D — Communauté & networking
- **M7 — Annuaire & networking** : fiche membre, recherche avancée (nom/ville/pays/secteur/compétence/niveau/mot-clé), mise en relation (contact, WhatsApp direct, reco, favoris, signalement), contrôle de confidentialité par membre.
- **M8 — Offres, services, marché interne** : fiches offres (Pro/Élite), validation admin, mise en avant (offre/membre du jour).
- **M10 — Événements physiques & en ligne** : création (date/lieu/programme/pass/prix/places), inscription + paiement + QR code/ticket, accès différencié par niveau, post-événement (photos/replays/comptes rendus).
- **M14 — Réseau social interne** : publications (texte/photo/vidéo/lien, 5 catégories, visibilité par niveau), interactions (réactions, commentaires, partage, mentions, signalement), fil personnalisé, tendances, modération, notifications sociales temps réel.

### Bloc E — Automatisation & intelligence
- **M11 — Notifications & messages automatiques** : multi-canal (push iOS/Android, email, WhatsApp/SMS) sur ~9 déclencheurs (bienvenue, paiement, rappel masterclass, nouveau replay/challenge, expiration, renouvellement, commission, nouvel événement/offre, message du Dr Claudel).
- **M12 — Agent IA Propulsion** : RAG entraîné sur données Propulsion (offres, règles paiement/parrainage, calendrier/replays, FAQ, docs validés). **Limites strictes** : ne pas inventer, ne pas modifier paiements, pas d'accès non autorisé, pas de données privées, pas de validation sensible, escalade humaine hors périmètre.

### Bloc F — Pilotage & gouvernance
- **M13 — Back-office administrateur** : stats générales, gestion membres (recherche/modif/changement niveau/suspension/prolongation/validation paiement/notes), gestion contenus (ajout, limitation par niveau, programmation), gestion messages (envoi ciblé, programmation).
- **M15 — Fonctionnalités complémentaires (8, dès le départ)** : gamification (points/badges), messagerie privée membre↔membre, ressources/bibliothèque, témoignages/avis, dashboard analytique avancé (rétention, conversion, revenus/niveau), support & tickets, landing page publique SEO, intégration calendrier (Google/Outlook) + rappels.
- **M16 — Classement, réputation, sécurité** : classements (engagement, réputation 1-5★, top parrains), anti-arnaque/anti-harcèlement (signalement, suspension auto, badge « profil vérifié », blocage, sanctions graduelles, anti-spam), protection des coordonnées.
- **M16-B — Membres dormants & réactivation** : scoring d'engagement hebdomadaire, 3 niveaux de dormance (léger 14j / confirmé 30j / critique 60j), actions auto (J+14/J+21/J+30/J+45/J+60) + manuelles, dashboard « Santé de la communauté », pause volontaire.

### Sections transverses
- **§17 Mobile Android + iOS** : natif ou hybride, optimisé réalités africaines (connexions instables, téléphones courants, data optimisée, app légère). → **prestation additionnelle / devis spécifique (§26)**.
- **§18 Migration des données** : import Excel/Google Forms/WhatsApp, nettoyage (doublons/harmonisation/catégorisation), **sauvegarde complète avant toute import de masse**.
- **§19 Sécurité** : auth sécurisée + mots de passe cryptés, RBAC, traçabilité/audit (journal admin), hébergement fiable + sauvegardes, verrouillage contenu premium, confidentialité/consentement.
- **§20 Design** : professionnel/premium, épuré, simple, panafricain, cohérent avec la marque Propulsion/CNIC.
- **§21 Exigences techniques** : scalabilité milliers → dizaines de milliers de membres.

---

## 4. Architecture technique recommandée

> Justifiée par : contexte africain (data/connexion), multi-pays/multi-devises, scalabilité, RBAC fort, temps réel (social/notifications), IA, budget maîtrisé.

| Couche | Recommandation | Pourquoi |
|---|---|---|
| **Backend / BDD** | **Supabase (PostgreSQL)** | Auth + RLS (RBAC natif, critère §24), Storage (PDF/photos), Realtime (social/notifs), Edge Functions, pgvector (IA), scalable, coûts maîtrisés |
| **Web** | **Next.js (React) + TypeScript** | SSR/SSG pour landing SEO (§15), perf, écosystème, partage de logique |
| **Mobile** | **React Native / Expo (hybride)** | Code partagé web↔mobile, OTA updates, léger, FCM push, adapté Android+iOS, devices courants |
| **Paiements** | Agrégateur mobile money (**CinetPay / FedaPay / Flutterwave**) + mode manuel assisté en fallback | Couverture Afrique centrale/ouest + international, transition douce depuis le manuel |
| **Vidéo** | **YouTube non répertorié** embarqué | Choix client (§26), fluidité, coût nul d'hébergement |
| **Agent IA** | **RAG** : embeddings + pgvector + **API Claude** | Réponses ancrées (anti-hallucination), garde-fous, escalade humaine |
| **Notifications** | Push (FCM/Expo) · Email (Resend/SendGrid) · WhatsApp Business API / Twilio · SMS | Multi-canal §11 |
| **Hébergement** | Supabase + Vercel (web) + CDN | Sauvegardes, scalabilité, CDN pour la bande passante |

**Note** : Supabase est déjà disponible dans l'environnement de travail (MCP) — confirme la pertinence du choix et accélère le démarrage.

---

## 5. Modèle de données central (entités principales à concevoir)

`users/members` · `roles/permissions` · `membership_tiers` (Standard/Pro/Élite) · `subscriptions` (adhésions, dates, statut, renouvellement) · `payments` (mode, preuve, pays, devise, validation) · `referrals` & `commissions` · `masterclasses` & `replays` & `content_progress` · `challenges` & `submissions` · `directory_profiles` & `connections` · `offers` (marché interne) & `reviews` · `events` & `registrations` (QR/tickets) · `social_posts` & `reactions` & `comments` · `messages` (messagerie privée) · `notifications` · `tickets` (support) · `reports` (signalements) & `moderation_actions` · `engagement_scores` & `dormancy_states` · `points` & `badges` (gamification) · `resources` (bibliothèque) · `ai_knowledge_base` (embeddings) · `audit_logs`.

> **Identifiant Propulsion** : `PROP-{STD|PRO|ELT}-{ANNÉE}-{SÉQUENCE}` — généré à la validation du paiement, **immuable** au fil des renouvellements/changements d'offre (à découpler de la clé technique).

---

## 6. Points critiques & risques identifiés

1. **⚠ Délai vs périmètre (risque majeur).** §26 mentionne un engagement « plateforme complète en 1 mois ». Les 18 modules + web + mobile + IA + migration représentent plusieurs **mois-personnes**. → Recommandation forte : appliquer le **plan en 6 phases du §23**, livrer un **MVP réel** (M1, M2, M3 manuel, M4, M5, M7, M13) d'abord, puis itérer. À formaliser dans la proposition écrite (le §26 lui-même note que tout doit être contractualisé).
2. **Paiements multi-pays/multi-devises** : complexité réglementaire et technique. Démarrer en **manuel assisté** (déjà décrit), brancher les passerelles progressivement.
3. **WhatsApp Business API** : coûteux et soumis à validation Meta (templates, numéro vérifié). Prévoir un fallback (email + push prioritaires) si l'intégration tarde.
4. **Agent IA — garde-fous** : RAG strict, jamais d'invention, escalade. Critère d'acceptation = répond correctement aux questions **basiques** (ne pas sur-promettre).
5. **Mobile = prestation additionnelle** (§26) : cadrer le devis séparément ; Expo permet de mutualiser le code pour limiter le surcoût.
6. **Migration de données** : qualité variable (Excel/Forms/WhatsApp). Prévoir nettoyage + **sauvegarde obligatoire avant import de masse** (§18).
7. **Scalabilité** : architecture pensée pour 10k+ dès le départ (index, pagination, RLS performante, CDN, cache).
8. **Conformité données personnelles** : consentement, confidentialité des numéros, droit à la désactivation (§19) — multi-juridictions africaines + UE (IBAN BNP Paribas → RGPD potentiel).

---

## 7. Découpage proposé (aligné §23)

- **Phase 1 — Diagnostic & cadrage** *(en cours)* : ce document, MVP défini, stack validée, maquettes.
- **Phase 2 — MVP prioritaire** : inscription/profil/identifiant, paiement **manuel assisté**, tableau de bord, replays, annuaire, back-office.
- **Phase 3 — Automatisation avancée** : renouvellements, commissions, parrainage, événements, challenges, statistiques.
- **Phase 4 — Application mobile** : Android + iOS, push, replays/annuaire mobile.
- **Phase 5 — Agent IA** : base de connaissances, RAG, tests, intégration web + mobile.
- **Phase 6 — Déploiement officiel** : tests, correction bugs, import membres, formation admins, lancement.

---

## 8. Questions à clarifier avec le client (avant Phase 2)

1. **Périmètre exact du MVP** à livrer en premier (proposition : Bloc A + M3 manuel + M4 + M5 + M7 + M13).
2. **Passerelle(s) de paiement** prioritaire(s) par pays + qui gère les comptes marchands.
3. **WhatsApp Business API** : numéro officiel, budget templates, ou démarrage email/push d'abord ?
4. **Charte graphique** : logo, couleurs, typographies, icônes Propulsion/CNIC disponibles ?
5. **Sources de données à migrer** : fichiers Excel/exports réels + volumétrie.
6. **Règles de commission** précises (taux par niveau/pays, conditions).
7. **Contenu de l'agent IA** : corpus documentaire validé à fournir.
8. **Contractualisation** délais/coûts par phase (formaliser le §26).

---

## 9. Prochaines étapes recommandées

1. Valider ce cadrage avec le Dr Claudel.
2. Finaliser le **périmètre MVP** + maquettes (wireframes des écrans clés).
3. Rédiger la **proposition technique & financière par phase** (livrable §22).
4. Initialiser le projet (repo, Supabase, schéma BDD du MVP, RBAC/RLS).
5. Démarrer la Phase 2.
