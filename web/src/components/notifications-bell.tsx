"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Bell, Wallet, Trophy, Calendar, Check, Spark } from "@/components/icons";

interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  category: "Finance" | "Social" | "Système" | "Événement";
  is_read: boolean;
  link: string | null;
  created_at: string;
}

const CATEGORY_CONFIG: Record<
  NotificationItem["category"],
  { Icon: React.FC<{ width?: number; height?: number; className?: string }>; color: string; bg: string }
> = {
  Finance:   { Icon: Wallet,   color: "#3871c2", bg: "#eef4ff" },
  Social:    { Icon: Trophy,   color: "#766391", bg: "#f5f0ff" },
  Événement: { Icon: Calendar, color: "#ffac42", bg: "#fff8ed" },
  Système:   { Icon: Spark,    color: "#ff1e58", bg: "#fff0f4" },
};

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)    return "À l'instant";
  if (diff < 3_600_000) return `Il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000)return `Il y a ${Math.floor(diff / 3_600_000)}h`;
  const d = Math.floor(diff / 86_400_000);
  return d < 30 ? `Il y a ${d}j` : new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function NotificationsBell({ variant = "light" }: { variant?: "light" | "dark" }) {
  const router = useRouter();
  const [isOpen, setIsOpen]             = useState(false);
  const [items, setItems]               = useState<NotificationItem[]>([]);
  const [userId, setUserId]             = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);
  const popoverRef                      = useRef<HTMLDivElement>(null);

  const unreadCount = items.filter(n => !n.is_read).length;

  /* ── Chargement initial ──────────────────────────────────────── */
  const load = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("member_notifications")
      .select("id,title,body,category,is_read,link,created_at")
      .eq("member_id", uid)
      .order("created_at", { ascending: false })
      .limit(40);
    if (data) setItems(data as NotificationItem[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      load(user.id);
    });
  }, [load]);

  /* ── Realtime — nouvelles notifications ─────────────────────── */
  useEffect(() => {
    if (!userId) return;
    // Unique channel name per effect invocation: avoids reusing an already-subscribed
    // channel when React 18 Strict Mode double-invokes effects and removeChannel is async.
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(`notifs-${userId}-${uniqueId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "member_notifications", filter: `member_id=eq.${userId}` },
        payload => setItems(prev => [payload.new as NotificationItem, ...prev])
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  /* ── Fermer au clic extérieur ───────────────────────────────── */
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  /* ── Tout marquer lu ────────────────────────────────────────── */
  async function markAllRead() {
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    if (userId) await supabase.from("member_notifications").update({ is_read: true }).eq("member_id", userId).eq("is_read", false);
  }

  /* ── Clic sur une notification ──────────────────────────────── */
  async function handleClick(item: NotificationItem) {
    if (!item.is_read) {
      setItems(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
      await supabase.from("member_notifications").update({ is_read: true }).eq("id", item.id);
    }
    setIsOpen(false);
    if (item.link) {
      if (item.link.startsWith("http")) {
        window.location.assign(item.link);
      } else {
        router.push(item.link);
      }
    }
  }

  return (
    <div className="relative" ref={popoverRef}>

      {/* ── Bouton cloche ──────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-label="Notifications"
        className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-all active:scale-[0.95] ${
          variant === "dark"
            ? "border-white/10 bg-white/8 text-white/60 hover:bg-white/12 hover:text-white"
            : "border-line bg-white text-muted hover:border-brand/30 hover:text-brand"
        }`}
      >
        <Bell width={17} height={17}/>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-[#ff1e58] text-[8px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Popover ────────────────────────────────────────────── */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_8px_40px_rgba(0,0,0,0.12)] sm:w-96">

          {/* En-tête */}
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell width={14} height={14} className="text-ink"/>
              <span className="text-[13px] font-bold text-ink">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[9px] font-bold text-brand">
                  {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline">
                <Check width={11} height={11}/> Tout lire
              </button>
            )}
          </div>

          {/* Liste */}
          <div className="max-h-[380px] divide-y divide-line/50 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent"/>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-faint">
                <Bell width={28} height={28}/>
                <p className="text-[13px]">Aucune notification</p>
              </div>
            ) : (
              items.map(item => {
                const cfg = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.Système;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleClick(item)}
                    className={`flex w-full gap-3 px-4 py-3.5 text-left transition-colors ${item.is_read ? "opacity-55 hover:opacity-80 hover:bg-[#f8f9fc]" : "hover:bg-[#f8f9fc]"}`}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: cfg.bg, color: cfg.color }}>
                      <cfg.Icon width={15} height={15}/>
                    </span>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[12.5px] font-bold text-ink leading-snug">{item.title}</span>
                        <span className="shrink-0 text-[9.5px] text-faint">{relTime(item.created_at)}</span>
                      </div>
                      {item.body && <p className="text-[11px] text-muted leading-relaxed line-clamp-2">{item.body}</p>}
                    </div>
                    {!item.is_read && <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"/>}
                  </button>
                );
              })
            )}
          </div>

          {/* Pied */}
          <div className="border-t border-line bg-[#f8f9fc]/50 px-4 py-2 text-center text-[10px] text-faint">
            Mise à jour en temps réel · Propulsion CNIC
          </div>
        </div>
      )}
    </div>
  );
}
