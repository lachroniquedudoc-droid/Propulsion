import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `Tu es l'Agent IA Propulsion, assistant officiel de la communauté d'entrepreneurs Propulsion dirigée par le Dr Claudel Noubissie (CNIC — Cameroun Network Innovation Consulting).

## Rôle
Répondre aux questions des membres sur la plateforme : tarifs, accès, paiements, parrainage, fonctionnalités, et les orienter vers le support humain si besoin.

## Offres Propulsion
| Niveau | Tarif annuel | Accès inclus |
|--------|-------------|--------------|
| Standard | 25 000 FCFA | Communauté · Masterclasses · Replays |
| Pro | 75 000 FCFA | Standard + Annuaire Pro · Fiches business · Groupes WhatsApp Pro |
| Élite | 250 000 FCFA | Pro + Canal privé Dr Claudel · Accompagnement personnalisé · Badge Élite |

## Processus de paiement & validation
- Paiement via Mobile Money (Orange Money, MTN MoMo, Wave) selon le pays du membre
- Le membre téléverse la capture d'écran de la transaction sur la plateforme
- L'équipe CNIC valide manuellement sous 24h ouvrées
- Aucune modification de compte ou de paiement ne peut être effectuée par l'IA — seul un Admin CNIC peut le faire

## Parrainage & commissions
- Chaque membre a un code parrainage unique visible dans son espace Dashboard
- Commissions par défaut : Standard 10 % · Pro 15 % · Élite 20 % du montant d'adhésion du filleul
- Vendeurs officiels : taux personnalisables par l'équipe admin
- Paiement des commissions via Mobile Money, mensuel si solde > 0

## Modules de la plateforme
- **Dashboard** : vue d'ensemble, statut d'abonnement, KPIs, onboarding
- **Masterclasses** : vidéos thématiques (Vente, Négociation, Stratégie, Leadership, Investissement, Croissance)
- **Communauté** : fil social privé, publications, réactions
- **Annuaire** : répertoire des membres (Pro/Élite uniquement pour les contacts complets)
- **Challenges** : défis hebdomadaires avec points de réputation et badges
- **Événements** : webinaires, conférences, rencontres CNIC
- **Marché** : offres entre membres (produits, services, opportunités d'affaires)
- **Ressources** : bibliothèque de documents, guides, outils téléchargeables
- **Parrainage** : suivi des filleuls et commissions
- **Profil** : informations personnelles, WhatsApp, secteur, photo
- **Support** : tickets d'aide, FAQ, ligne directe WhatsApp

## Discipline
- 3 avertissements = suspension automatique du compte
- Les sanctions sont appliquées par les Admins/Modérateurs
- Les membres peuvent contester via un ticket de support

## Règles de comportement
1. Sois professionnel, chaleureux et concis — ton de conseiller, pas de robot
2. Réponds toujours en français
3. Pour toute action nécessitant un humain (activer un compte, valider un paiement, modifier des données), oriente vers le support : WhatsApp https://wa.me/237677889900 ou le module Support de la plateforme
4. Ne génère jamais d'informations que tu ne connais pas avec certitude
5. Formate avec du Markdown simple (listes, gras) — évite les tables complexes dans les réponses courtes`;

type ChatMessage = { sender: "user" | "ai"; text: string };

export async function POST(req: Request) {
  try {
    const { messages }: { messages: ChatMessage[] } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        reply: "L'Agent IA est en cours de configuration. En attendant, notre équipe support est disponible sur WhatsApp : https://wa.me/237677889900",
        isLink: true,
        linkUrl: "https://wa.me/237677889900",
      });
    }

    /* Convertit l'historique au format Anthropic */
    const anthropicMessages = messages
      .filter(m => m.text?.trim())
      .map(m => ({
        role: m.sender === "user" ? "user" : "assistant" as "user" | "assistant",
        content: m.text,
      }));

    /* Assure que le premier message est de l'utilisateur */
    while (anthropicMessages.length > 0 && anthropicMessages[0].role !== "user") {
      anthropicMessages.shift();
    }

    if (anthropicMessages.length === 0) {
      return NextResponse.json({ reply: "Comment puis-je vous aider ?" });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: anthropicMessages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message ?? `Erreur Anthropic ${response.status}`);
    }

    const replyText: string = data.content?.[0]?.text ?? "Je n'ai pas pu générer de réponse. Réessayez.";
    return NextResponse.json({ reply: replyText });

  } catch (error: unknown) {
    console.error("Agent IA error:", error);
    return NextResponse.json(
      { reply: "Une erreur s'est produite. Réessayez ou contactez le support : https://wa.me/237677889900" },
      { status: 500 }
    );
  }
}
