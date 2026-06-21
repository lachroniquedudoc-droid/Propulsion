import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `Tu es l'Agent IA Propulsion, un assistant officiel de la communauté Propulsion (dirigée par le Dr Claudel Noubissie et l'équipe CNIC).
Ta mission est d'aider les membres avec leurs questions administratives, tarifaires, et fonctionnelles.

CONTEXTE DE LA PLATEFORME PROPULSION :
- La communauté Propulsion propose trois niveaux :
  1. Standard (25 000 FCFA / an) : Accès communauté, masterclass, replays.
  2. Pro (75 000 FCFA / an) : Standard + Annuaire complet, fiches business.
  3. Élite (250 000 FCFA / an) : Pro + canal privé, accompagnement Dr Claudel, badge Élite.
- Validation des paiements : Le membre doit payer via Mobile Money (selon son pays), puis uploader une capture d'écran sur la plateforme. L'équipe CNIC valide manuellement (sous 24h).
- Parrainage : Les membres gagnent des commissions sur chaque filleul converti : 10% (Standard), 15% (Pro), 20% (Élite). Les vendeurs officiels peuvent avoir des taux personnalisés. Les paiements de commissions sont traités via Mobile Money.
- Discipline : La plateforme a une fonctionnalité de discipline stricte. Au bout de 3 avertissements, le compte est automatiquement suspendu.

RÈGLES IMPORTANTES :
1. Sois poli, professionnel et concis.
2. Si un membre demande d'activer son compte, de modifier ses informations ou de valider un paiement, explique que seul un humain (Admin CNIC) peut faire cela, et donne le lien du support WhatsApp : https://wa.me/237677889900.
3. Formate tes réponses en Markdown. Utilise des listes à puces pour que ce soit facile à lire.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Fallback response if no API key is set
      return NextResponse.json({
        reply: "Désolé, la connexion au cerveau IA n'est pas encore configurée (Clé API manquante). Veuillez contacter le support sur WhatsApp : https://wa.me/237677889900",
        isLink: true,
        linkUrl: "https://wa.me/237677889900"
      });
    }

    // Try Gemini API format first (assuming GEMINI_API_KEY is prioritized if both or if it's set)
    if (process.env.GEMINI_API_KEY) {
      const geminiMessages = messages.map((m: any) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));
      // Add system prompt as the first message or use system_instruction
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: geminiMessages,
          generationConfig: { temperature: 0.3 }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Erreur API Gemini");

      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Je n'ai pas pu générer de réponse.";
      return NextResponse.json({ reply: replyText });
    } else {
      // Fallback to OpenAI API format
      const openaiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }))
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: openaiMessages,
          temperature: 0.3
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Erreur API OpenAI");

      const replyText = data.choices?.[0]?.message?.content || "Je n'ai pas pu générer de réponse.";
      return NextResponse.json({ reply: replyText });
    }

  } catch (error: any) {
    console.error("Erreur Agent IA:", error);
    return NextResponse.json(
      { reply: "Une erreur s'est produite lors de la connexion à l'IA. Veuillez réessayer plus tard ou contacter le support." },
      { status: 500 }
    );
  }
}
