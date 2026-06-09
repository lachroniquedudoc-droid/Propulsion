"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/utils/supabase/client";
import { HelpCircle, Ticket, Zap } from "@/components/icons";
import { AiAgent } from "@/components/ai-agent";
import { MemberLayout } from "@/components/member-layout";

// FAQ dynamique Propulsion
const MOCK_FAQ = [
  {
    question: "Comment valider mon paiement par Mobile Money ?",
    answer: "Une fois que vous avez effectué le transfert par Orange Money, MTN MoMo ou Wave via les coordonnées indiquées, prenez une capture d'écran nette de la transaction. Téléversez-la à l'étape 3 de votre onboarding. Notre équipe administrative validera votre adhésion sous 1 à 3 heures maximum."
  },
  {
    question: "Comment fonctionne le système de parrainage ?",
    answer: "Chaque membre dispose d'un code unique visible sur son espace. Lorsque vous parrainez un nouveau membre, vous touchez automatiquement 10 % de commission sur le montant de sa formule dès que son paiement d'adhésion est validé."
  },
  {
    question: "Pourquoi l'annuaire des membres m'affiche-t-il un cadenas ?",
    answer: "L'annuaire de réseautage d'affaires est un module qualifié réservé en exclusivité aux membres des formules Pro et Élite afin de préserver la qualité des connexions. Vous pouvez mettre à jour votre adhésion à tout moment depuis votre Dashboard."
  },
  {
    question: "Puis-je modifier mes informations de profil public ?",
    answer: "Oui, vous pouvez enrichir ou modifier votre biographie, votre secteur d'activité, votre entreprise et vos coordonnées WhatsApp à n'importe quel moment directement depuis l'espace 'Mon Profil'."
  }
];

// Mock des tickets initiaux
const INITIAL_TICKETS = [
  {
    id: "tick-1",
    category: "Facturation",
    subject: "Facture pour l'adhésion Élite",
    description: "Bonjour, j'aimerais recevoir une facture officielle au nom de ma structure pour comptabiliser mon investissement de 250 000 FCFA.",
    priority: "Moyen",
    status: "Résolu",
    createdAt: "Hier",
    messages: [
      { sender: "membre", text: "Bonjour, j'aimerais recevoir une facture officielle au nom de ma structure.", time: "Hier 10:00" },
      { sender: "support", text: "Bonjour ! Votre facture Propulsion est disponible en téléchargement dans l'espace Facturation de votre Dashboard. Merci pour votre engagement !", time: "Hier 14:15" }
    ]
  }
];

export default function SupportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-pulse text-brand font-semibold font-sans">Chargement du centre d&apos;aide...</div>
      </div>
    }>
      <SupportContent />
    </Suspense>
  );
}

function SupportContent() {
  const [currentUserRole, setCurrentUserRole] = useState("Pro");
  const [userId, setUserId] = useState<string | null>(null);
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  
  // États FAQ accordéon
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Formulaire de ticket
  const [category, setCategory] = useState("Technique");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Moyen");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Discussion interactive ticket actif
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "INITIAL_SESSION") return;
      if (!session?.user) return;
      setUserId(session.user.id);
      const { data } = await supabase.from("members").select("role").eq("id", session.user.id).single();
      if (data?.role) setCurrentUserRole(data.role);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleCreateTicket = (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      alert("Veuillez remplir le sujet et la description de votre ticket.");
      return;
    }

    setIsSubmitting(true);

    const newTicketId = `tick-${Date.now()}`;
    const newTicket = {
      id: newTicketId,
      category,
      subject,
      description,
      priority,
      status: "Nouveau",
      createdAt: "À l'instant",
      messages: [
        { sender: "membre" as const, text: description, time: "À l'instant" }
      ]
    };

    // Simulation de l'insertion dans Supabase
    async function insertTicketInBdd() {
      try {
        if (userId) {
          await supabase.from("support_tickets").insert({
            member_id: userId,
            category,
            subject,
            description,
            priority
          });
        }
      } catch (err) {
        console.warn("Ticket insertion simulated locally:", err);
      }
    }
    insertTicketInBdd();

    setTimeout(() => {
      setTickets(prev => [newTicket, ...prev]);
      setIsSubmitting(false);
      setSubject("");
      setDescription("");
      setSuccessMessage("Votre ticket a été créé avec succès ! Notre équipe y répondra dans les plus brefs délais.");
      setActiveTicketId(newTicketId);
      setTimeout(() => setSuccessMessage(""), 5000);

      // Simulation d'une réponse de l'équipe de support après 4s
      setTimeout(() => {
        setTickets(prev => prev.map(t => {
          if (t.id === newTicketId) {
            return {
              ...t,
              status: "En cours",
              messages: [
                ...t.messages,
                {
                  sender: "support" as const,
                  text: "Bonjour ! Nous avons pris en charge votre requête. Nos techniciens étudient la situation pour vous apporter la meilleure solution sous peu. Ensemble pour la propulsion !",
                  time: "Il y a quelques secondes"
                }
              ]
            };
          }
          return t;
        }));
      }, 4000);

    }, 1000);
  };

  const handleSendReply = (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!replyInput.trim() || !activeTicketId) return;

    const timeString = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const newMsg = { sender: "membre" as const, text: replyInput, time: timeString };

    setTickets(prev => prev.map(t => {
      if (t.id === activeTicketId) {
        return {
          ...t,
          messages: [...t.messages, newMsg]
        };
      }
      return t;
    }));

    // Simuler insertion message dans Supabase
    async function insertMessage() {
      try {
        await supabase.from("support_messages").insert({
          ticket_id: activeTicketId,
          sender_type: "membre",
          content: replyInput
        });
      } catch (err) {
        console.warn("Message simulated locally:", err);
      }
    }
    insertMessage();

    setReplyInput("");
  };

  const activeTicket = tickets.find(t => t.id === activeTicketId);

  return (
    <MemberLayout role={currentUserRole}>
      <main className="flex-1 mx-auto max-w-6xl w-full px-5 py-8 sm:py-12 flex flex-col space-y-12 relative overflow-hidden">
        {/* Background radial gradient */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(45%_45%_at_15%_0%,var(--color-brand-soft)_0%,transparent_75%),radial-gradient(45%_45%_at_85%_0%,var(--color-gold-soft)_0%,transparent_75%)]"
        />
        
        {/* PAGE TITLE */}
        <div>
          <span className="text-[11px] font-bold text-brand uppercase tracking-wider bg-brand-soft px-3 py-1 rounded-full">
            Support &amp; Tickets d&apos;Entraide
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl mt-3">
            Helpdesk &amp; Assistance
          </h1>
          <p className="text-sm text-muted mt-1 leading-relaxed max-w-2xl">
            Une question ou un problème d&apos;accès ? Consultez notre FAQ ou ouvrez un ticket d&apos;entraide. Notre équipe se charge de vous répondre au plus vite.
          </p>
        </div>

        {/* CLARIFICATION DU SUPPORT : STANDARD VS URGENT */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-line bg-white p-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <HelpCircle width={16} height={16} />
              </span>
              <h3 className="text-[14px] font-bold text-ink">Assistance Standard</h3>
            </div>
            <p className="text-[12.5px] text-muted leading-relaxed">
              Pour toutes vos questions administratives, demandes de facturation, suggestions ou modifications de profil public. Votre demande est traitée par notre équipe sous 24h.
            </p>
          </div>
          
          <div className="rounded-3xl border border-[#ff1e58]/15 bg-[#ff1e58]/5 p-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff1e58]/10 text-[#ff1e58]">
                <Zap width={16} height={16} />
              </span>
              <h3 className="text-[14px] font-bold text-ink">Assistance Urgente &amp; Bloquante</h3>
            </div>
            <p className="text-[12.5px] text-muted leading-relaxed">
              Réservée aux problèmes de connexion, bugs d&apos;accès aux masterclasses ou aux validations urgentes de paiement. Si votre ticket est critique, l&apos;option d&apos;accélération WhatsApp directe est à votre disposition ci-dessous.
            </p>
          </div>
        </div>

        {/* DOUBLE SECTIONS: FAQ & TICKET CREATION */}
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* SEC 1: FAQ INTERACTIVE (2 cols) */}
          <section className="lg:col-span-2 space-y-6">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              Questions Fréquentes
            </h2>
            <div className="space-y-3">
              {MOCK_FAQ.map((faq, index) => (
                <div 
                  key={index} 
                  className="bg-surface border border-line rounded-2xl overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left text-xs font-bold text-ink hover:bg-line/40 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <span className="text-brand text-xs font-bold transition-transform duration-200">
                      {openFaqIndex === index ? "–" : "+"}
                    </span>
                  </button>
                  
                  {openFaqIndex === index && (
                    <div className="px-5 pb-5 pt-1 text-xs text-muted leading-relaxed border-t border-line/40 animate-fade-down">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* DIRECT WHATSAPP ACCELERATION */}
            <div className="bg-[#0c1322] border border-white/5 rounded-[2rem] p-6 sm:p-8 relative overflow-hidden text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div aria-hidden className="absolute -right-16 -bottom-16 h-48 w-48 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
              <div className="space-y-2 relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/30 uppercase tracking-wider">
                  Accélération Prioritaire
                </span>
                <h3 className="text-sm font-bold">Ligne Directe WhatsApp</h3>
                <p className="text-xs text-white/50 leading-relaxed max-w-md">
                  En cas de problème bloquant d&apos;accès à votre espace Propulsion ou pour l&apos;activation immédiate de votre compte après paiement.
                </p>
              </div>
              <a
                href="https://wa.me/237677889900?text=Bonjour%20Support%20Propulsion,%20j'ai%20besoin%20d'une%20aide%20urgente%20sur%20mon%20espace%20membre."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-[#00e676] hover:bg-[#00c853] text-[#0c1322] font-bold text-xs px-6 py-3 transition-all relative z-10 shadow-lg shadow-[#00e676]/20"
              >
                Ouvrir WhatsApp Support
              </a>
            </div>
          </section>

          {/* SEC 2: CREATION DE TICKET (1 col) */}
          <section className="space-y-6">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              Créer un Ticket
            </h2>

            {successMessage && (
              <div className="bg-[#00b074]/10 border border-[#00b074]/20 rounded-2xl p-4 text-[11px] text-[#00b074] font-semibold leading-relaxed animate-fade-in">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="bg-surface border border-line p-6 rounded-[2.5rem] shadow-sm space-y-4">
              {/* Category selector */}
              <div>
                <label className="block text-[10px] font-bold text-brand uppercase tracking-wider mb-1.5">
                  Catégorie du problème
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-minimal text-xs appearance-none bg-transparent"
                >
                  <option value="Facturation">Facturation &amp; Adhésion</option>
                  <option value="Technique">Bug Technique &amp; Accès</option>
                  <option value="Affaires">Opportunités &amp; Partenariats</option>
                  <option value="Autre">Autre Demande</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[10px] font-bold text-brand uppercase tracking-wider mb-1.5">
                  Niveau d&apos;urgence
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Faible", "Moyen", "Urgent"].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        priority === p
                          ? "bg-brand/10 text-brand border-brand/50"
                          : "bg-surface text-muted border-line hover:border-muted"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[10px] font-bold text-brand uppercase tracking-wider mb-1.5">
                  Sujet / Intitulé
                </label>
                <input
                  type="text"
                  placeholder="Ex : Problème d'accès Masterclass Élite"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input-minimal text-xs"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-brand uppercase tracking-wider mb-1.5">
                  Description détaillée
                </label>
                <textarea
                  rows={4}
                  placeholder="Décrivez précisément votre situation, avec des détails sur l'offre choisie ou le message d'erreur..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-minimal text-xs resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-xs font-bold text-white transition-all hover:bg-brand-dark shadow-md shadow-brand/10 hover:shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? "Création en cours..." : "Envoyer le Ticket"}
              </button>
            </form>
          </section>

        </div>

        {/* TICKETS TRACKING SECTION */}
        <section className="space-y-6 pt-6 border-t border-line">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            Historique de mes Tickets
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {/* TICKET LIST SIDEBAR */}
            <div className="md:col-span-1 bg-surface border border-line rounded-[2.5rem] p-5 shadow-sm space-y-3 max-h-[400px] overflow-y-auto">
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Historique</h3>
              {tickets.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTicketId(t.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    activeTicketId === t.id
                      ? "bg-brand/5 border-brand/40 shadow-sm"
                      : "bg-surface hover:bg-line border-line"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-brand uppercase bg-brand-soft px-2 py-0.5 rounded">
                      {t.category}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      t.status === "Résolu" 
                        ? "bg-[#00b074]/10 text-[#00b074]" 
                        : t.status === "En cours" 
                        ? "bg-gold/10 text-gold" 
                        : "bg-brand/10 text-brand"
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-ink mt-2 line-clamp-1">{t.subject}</h4>
                  <span className="text-[10px] text-muted block mt-1">{t.createdAt}</span>
                </button>
              ))}

              {tickets.length === 0 && (
                <div className="text-center py-8 text-xs text-muted leading-relaxed">
                  Aucun ticket soumis pour le moment.
                </div>
              )}
            </div>

            {/* CHAT/MESSAGES BOX CONTAINER */}
            <div className="md:col-span-2 bg-surface border border-line rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm h-[400px]">
              {activeTicket ? (
                <div className="flex-1 flex flex-col h-full">
                  {/* Header Chat Box */}
                  <div className="p-5 border-b border-line bg-paper/40 flex items-center justify-between shrink-0">
                    <div>
                      <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
                        {activeTicket.subject}
                      </h4>
                      <span className="text-[10px] text-muted mt-0.5 block">
                        Priorité : <strong className="text-brand">{activeTicket.priority}</strong> • Statut : <strong className="text-brand">{activeTicket.status}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Messages list */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-paper/10">
                    {activeTicket.messages.map((m, idx) => (
                      <div 
                        key={idx}
                        className={`flex flex-col ${
                          m.sender === "membre" ? "items-end" : "items-start"
                        }`}
                      >
                        <span className="text-[9px] text-muted mb-1 block px-2">{m.time}</span>
                        <div className={`rounded-3xl px-4 py-3.5 text-xs max-w-sm leading-relaxed ${
                          m.sender === "membre"
                            ? "bg-brand text-white rounded-tr-none shadow-md shadow-brand/10"
                            : "bg-surface border border-line text-ink rounded-tl-none"
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input reply form */}
                  <form onSubmit={handleSendReply} className="p-3 border-t border-line bg-surface flex gap-2 shrink-0">
                    <input
                      type="text"
                      placeholder="Saisissez votre réponse..."
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      className="flex-1 bg-surface border border-line rounded-full px-5 py-2.5 text-xs text-ink focus:outline-none focus:border-brand"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-full bg-brand hover:bg-brand-dark text-white font-semibold text-xs px-5 py-2.5 transition-all shadow-md shadow-brand/10"
                    >
                      Envoyer
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-2">
                   <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                     <Ticket width={20} height={20} />
                   </span>
                   <h4 className="text-xs font-bold text-ink">Sélectionnez un ticket</h4>
                   <p className="text-[11px] text-muted leading-relaxed max-w-xs">
                     Cliquez sur un ticket de l&apos;historique sur la gauche pour afficher la discussion en direct avec notre équipe support et apporter des précisions.
                   </p>
                 </div>
              )}
            </div>
          </div>
        </section>

      </main>

      {/* FLOAT ASSISTANT IA WIDGET */}
      <AiAgent />
    </MemberLayout>
  );
}
