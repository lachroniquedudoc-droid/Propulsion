"use client";

import { useState, useRef, useEffect } from "react";
import { Spark } from "./icons";

interface Message {
  sender: "user" | "ai";
  text: string;
  isLink?: boolean;
  linkUrl?: string;
}

const QUICK_QUESTIONS = [
  "Quels sont les tarifs ?",
  "Comment valider mon paiement ?",
  "Comment fonctionne le parrainage ?",
  "Contacter un humain 💬"
];

export function AiAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Bonjour ! Je suis l'Agent IA Propulsion. Je suis à votre service pour répondre à toutes vos questions administratives (tarifs, validation de paiement, parrainage, etc.)."
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("toggle-ai-agent", handler);
    return () => window.removeEventListener("toggle-ai-agent", handler);
  }, []);

  // Moteur RAG Strict local - Analyse sémantique des questions
  const getAiResponse = (query: string): Message => {
    const q = query.toLowerCase();

    // 1. Thème Tarifs & Offres
    if (q.includes("tarif") || q.includes("prix") || q.includes("offre") || q.includes("cout") || q.includes("coût") || q.includes("standard") || q.includes("pro") || q.includes("elite") || q.includes("élite")) {
      return {
        sender: "ai",
        text: "La communauté Propulsion propose trois formules d'adhésion annuelles :\n\n• **Standard** : 25 000 FCFA / an — Accès à la communauté, masterclass hebdo & replays.\n• **Pro** : 75 000 FCFA / an — Standard + annuaire complet & fiches business.\n• **Élite** : 250 000 FCFA / an — Pro + canal Élite privé, accompagnement rapproché du Dr Claudel, badge Élite & Apéro Business inclus."
      };
    }

    // 2. Thème Paiement & Validation
    if (q.includes("paiement") || q.includes("payer") || q.includes("valider") || q.includes("validation") || q.includes("momo") || q.includes("orange") || q.includes("capture") || q.includes("preuve")) {
      return {
        sender: "ai",
        text: "Pour valider votre paiement :\n\n1. Rendez-vous sur la page d'adhésion.\n2. Sélectionnez votre pays pour afficher les coordonnées Mobile Money locales (MTN, Orange, Wave).\n3. Effectuez le transfert, puis téléversez la capture d'écran de preuve de paiement.\n\nNotre équipe administrative CNIC vérifiera et activera votre compte sous 24h. Vous recevrez une notification d'activation par SMS et WhatsApp."
      };
    }

    // 3. Thème Parrainage & Commissions
    if (q.includes("parrainage") || q.includes("commission") || q.includes("filleul") || q.includes("gain") || q.includes("affiliation") || q.includes("gagner")) {
      return {
        sender: "ai",
        text: "Avec notre programme de parrainage (M9), vous gagnez des commissions sur chaque adhésion de filleul converti :\n\n• **10 %** sur le niveau Standard (2 500 FCFA)\n• **15 %** sur le niveau Pro (11 250 FCFA)\n• **20 %** sur le niveau Élite (50 000 FCFA)\n\nRetrouvez votre lien d'affiliation unique dans votre espace '/parrainage'. Les commissions acquises sont versées sous 24h par Mobile Money."
      };
    }

    // 4. Thème Actions Sensibles (Garde-fous / Interdiction d'accès ou modification)
    if (q.includes("active mon") || q.includes("peux-tu activer") || q.includes("valide mon") || q.includes("change mon") || q.includes("modifier") || q.includes("solde") || q.includes("argent")) {
      return {
        sender: "ai",
        text: "En tant qu'Agent IA Propulsion, je n'ai pas l'autorisation de modifier vos informations confidentielles, de valider des transactions financières ou d'activer votre compte directement. Ces actions sensibles requièrent la validation manuelle d'un administrateur humain de l'équipe CNIC pour des raisons de sécurité. Je vous invite à contacter notre support."
      };
    }

    // 5. Thème Qui est le Dr Claudel / CNIC
    if (q.includes("claudel") || q.includes("dr claudel") || q.includes("noubissie") || q.includes("qui est") || q.includes("cnic")) {
      return {
        sender: "ai",
        text: "Le **Dr Claudel Noubissie** est le promoteur de CNIC et le leader spirituel de la communauté **Propulsion**. Propulsion est notre maison digitale unifiée, conçue pour rassembler les entrepreneurs africains dynamiques et les guider vers la réussite à travers des masterclasses, des sprints d'exécution et du networking de haut niveau."
      };
    }

    // 6. Thème Support Humain
    if (q.includes("humain") || q.includes("support") || q.includes("contact") || q.includes("whatsapp") || q.includes("aide")) {
      return {
        sender: "ai",
        text: "Pour discuter directement avec un membre humain de notre service d'assistance de l'équipe CNIC, cliquez sur le lien ci-dessous pour ouvrir une conversation WhatsApp officielle :",
        isLink: true,
        linkUrl: "https://wa.me/237677889900"
      };
    }

    // 7. Fallback standard
    return {
      sender: "ai",
      text: "Je n'ai pas trouvé d'information exacte à ce sujet dans ma base de connaissances administrative Propulsion. Souhaitez-vous discuter directement avec notre service d'assistance humaine sur WhatsApp ?",
      isLink: true,
      linkUrl: "https://wa.me/237677889900"
    };
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    // Ajouter le message de l'utilisateur
    const newUserMessage: Message = { sender: "user", text };
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simuler le temps de réflexion de l'IA (RAG local)
    setTimeout(() => {
      const response = getAiResponse(text);
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* 1. CHAT WINDOW BUBBLE (EXPANDED) */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[480px] bg-paper/90 backdrop-blur-xl border border-line rounded-[2rem] shadow-2xl flex flex-col overflow-hidden mb-4 animate-fade-up text-xs text-ink">
          
          {/* HEADER DE LA FENÊTRE */}
          <div className="bg-[#0f172a] p-4 text-white flex items-center justify-between border-b border-white/5 relative">
            <div aria-hidden className="absolute inset-0 bg-dot-grid opacity-10 pointer-events-none" />
            <div className="flex items-center gap-2.5 relative z-10">
              <span className="h-8 w-8 rounded-xl bg-brand flex items-center justify-center text-white shrink-0 pulse-ring">
                <Spark width={16} height={16} />
              </span>
              <div>
                <h4 className="font-bold tracking-tight text-xs leading-none">Agent IA Propulsion</h4>
                <span className="text-[9px] text-brand font-semibold block pt-1">● En ligne</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white text-md font-bold h-7 w-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* LISTE DES MESSAGES */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`flex ${m.sender === "user" ? "justify-end animate-fade-up" : "justify-start animate-fade-up"}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 leading-relaxed ${
                  m.sender === "user" 
                    ? "bg-brand text-white rounded-tr-none shadow-sm" 
                    : "bg-surface border border-line text-ink rounded-tl-none shadow-sm"
                }`}>
                  <p className="whitespace-pre-line">{m.text}</p>
                  
                  {/* Bouton de lien direct si nécessaire */}
                  {m.isLink && m.linkUrl && (
                    <a
                      href={m.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand py-2 text-[10px] font-bold text-white hover:bg-brand-dark transition-all active:scale-[0.98]"
                    >
                      Ouvrir le support WhatsApp 💬
                    </a>
                  )}
                </div>
              </div>
            ))}

            {/* Indicateur de saisie "Typing..." */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-surface border border-line rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* QUESTIONS RAPIDES SUGGÉRÉES */}
          {messages.length < 5 && !isTyping && (
            <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-line bg-paper/40">
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => handleSendMessage(q)}
                  className="px-2.5 py-1.5 rounded-full border border-line bg-surface hover:border-brand/40 hover:text-brand transition-all text-[10px] font-semibold"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* FORMULAIRE DE SAISIE */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="p-3 border-t border-line bg-surface flex gap-2 items-center"
          >
            <input
              type="text"
              placeholder="Posez votre question administrative..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 rounded-xl border border-line bg-paper px-3 py-2.5 outline-none text-xs focus:border-brand focus:bg-surface transition-all"
            />
            <button
              type="submit"
              className="h-9 w-9 shrink-0 rounded-xl bg-brand hover:bg-brand-dark text-white flex items-center justify-center transition-all active:scale-[0.98]"
            >
              ➔
            </button>
          </form>

        </div>
      )}

      {/* 2. TRIGGER (STATE RETRACTED) */}
      {!isOpen && (
        <div className="flex items-center gap-2.5">
          {/* Bubble question */}
          <div className="flex flex-col items-end gap-1">
            <div className="rounded-2xl rounded-br-sm bg-white border border-[#E0DDD8] shadow-md px-3.5 py-2 max-w-[180px]">
              <p className="text-[12px] font-semibold text-[#1A1A1A] leading-snug">Une préoccupation ?</p>
              <p className="text-[10.5px] text-[#6B6B6B] mt-0.5 leading-snug">Notre assistant répond 24h/24.</p>
            </div>
            {/* small tail */}
            <div className="mr-[26px] h-2 w-2 overflow-hidden">
              <div className="h-3 w-3 rotate-45 bg-white border-r border-b border-[#E0DDD8] -translate-y-1.5 translate-x-0.5 shadow-sm"/>
            </div>
          </div>

          {/* Logo button */}
          <button
            onClick={() => setIsOpen(v => !v)}
            className="h-14 w-14 rounded-full bg-white border border-[#E0DDD8] shadow-xl flex items-center justify-center pulse-ring hover:scale-105 active:scale-[0.95] transition-all overflow-hidden"
            aria-label="Assistant IA Propulsion"
          >
            <img src="/branding/logo.jpg" alt="Propulsion" className="h-10 w-10 rounded-full object-cover"/>
          </button>
        </div>
      )}

      {/* When open, show just the logo button (no bubble) */}
      {isOpen && (
        <button
          onClick={() => setIsOpen(v => !v)}
          className="h-14 w-14 rounded-full bg-white border border-brand/30 shadow-xl flex items-center justify-center hover:scale-105 active:scale-[0.95] transition-all overflow-hidden"
          aria-label="Fermer l'assistant"
        >
          <img src="/branding/logo.jpg" alt="Propulsion" className="h-10 w-10 rounded-full object-cover"/>
        </button>
      )}
    </div>
  );
}
