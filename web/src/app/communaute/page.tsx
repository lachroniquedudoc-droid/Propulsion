"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";
import { MemberLayout } from "@/components/member-layout";
import { AiAgent } from "@/components/ai-agent";
import { MentionInput, MemberSuggestion, extractMentionedIds } from "@/components/mention-input";
import { Heart, MessageCircle, ArrowRight, Camera, Close, Search, Trash } from "@/components/icons";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type Author = {
  first_name: string; last_name: string; role: string; avatar_url: string | null;
  badges?: string[] | null;
};
type CommentRow = {
  id: string; content: string; created_at: string;
  author: Author; mentioned_ids?: string[];
};
type PostRow = {
  id: string; content: string; category: string; image_url: string | null;
  likes_count: number; created_at: string; author_id: string;
  author: Author; social_comments: CommentRow[];
  social_likes: { member_id: string }[];
  mentioned_ids?: string[];
};

/* ─── Constantes ─────────────────────────────────────────────────────────── */

const CATEGORIES = ["Toutes", "Business", "Opportunités", "Entraide", "Annonces"] as const;
type Category = (typeof CATEGORIES)[number];
const POST_CATS = ["Business", "Opportunités", "Entraide", "Annonces"] as const;

const CAT_COLOR: Record<string, string> = {
  Annonces: "#3871c2", Opportunités: "#ffac42", Entraide: "#766391", Business: "#ff1e58",
};
const ROLE_COLOR: Record<string, string> = {
  Élite: "#ffac42", Pro: "#3871c2", Standard: "#766391",
  Admin: "#ff1e58", Modérateur: "#22c55e",
};
function getPostSelect(hasMentions: boolean, hasBadges: boolean): string {
  const authorSelect = `first_name, last_name, role, avatar_url${hasBadges ? ", badges" : ""}`;
  return `
    id, content, category, image_url, likes_count, created_at, author_id, ${hasMentions ? "mentioned_ids," : ""}
    author:members!author_id(${authorSelect}),
    social_comments(
      id, content, created_at, ${hasMentions ? "mentioned_ids," : ""}
      author:members!author_id(${authorSelect})
    ),
    social_likes(member_id)
  `.trim();
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  return d < 7 ? `Il y a ${d}j` : new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function initials(a: Author) {
  return `${a.first_name?.[0] ?? ""}${a.last_name?.[0] ?? ""}`.toUpperCase();
}

function normalizePost(raw: Record<string, unknown>): PostRow {
  const p = raw as PostRow;
  return {
    ...p,
    social_likes:    p.social_likes    ?? [],
    social_comments: [...(p.social_comments ?? [])].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
  };
}

function RichContent({ text }: { text: string }) {
  const parts = text.split(/(@[\wÀ-ž]+(?:\s[\wÀ-ž]+)?)/g);
  return (
    <span>
      {parts.map((p, i) =>
        p.startsWith("@")
          ? <span key={i} className="font-semibold text-brand">{p}</span>
          : p
      )}
    </span>
  );
}

/* ─── BrandBar ───────────────────────────────────────────────────────────── */

function BrandBar() {
  return (
    <div className="flex h-[3px] w-full overflow-hidden rounded-full">
      {["#3871c2","#ffac42","#766391","#ff1e58","#22c55e"].map(c => (
        <span key={c} className="flex-1" style={{ background: c }}/>
      ))}
    </div>
  );
}

/* ─── Badge mapping (subset visible sur les posts) ────────────────────────── */
const BADGE_MAP: Record<string, { color: string; bg: string; icon: string }> = {
  "Certifié":         { color: "#2E6FD4", bg: "#EEF5FF",  icon: "✓" },
  "Expert":           { color: "#6C3FC5", bg: "#F3EEFF",  icon: "★" },
  "Ambassadeur":      { color: "#C9A84C", bg: "#FFF8E6",  icon: "◈" },
  "Mentor":           { color: "#1D6B45", bg: "#E8F5EE",  icon: "♦" },
  "Fondateur":        { color: "#1A1A1A", bg: "#F4F3F0",  icon: "⬡" },
  "Top Contributeur": { color: "#E8174B", bg: "#FFF0F3",  icon: "↑" },
  "Partenaire":       { color: "#F0A500", bg: "#FFFAEB",  icon: "⚡" },
};

function AuthorBadges({ badges }: { badges?: string[] | null }) {
  if (!badges?.length) return null;
  return (
    <>
      {badges.map(b => {
        const def = BADGE_MAP[b];
        if (!def) return null;
        return (
          <span key={b} title={b}
            className="inline-flex items-center gap-0.5 rounded-full font-bold font-sans"
            style={{ background: def.bg, color: def.color, fontSize: "9px", padding: "1px 6px" }}
          >
            {def.icon} {b}
          </span>
        );
      })}
    </>
  );
}

/* ─── Avatar ─────────────────────────────────────────────────────────────── */

function Avatar({ author, size = 36 }: { author: Author; size?: number }) {
  const bg = ROLE_COLOR[author.role] ?? "#3871c2";
  return author.avatar_url ? (
    <img src={author.avatar_url} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }}/>
  ) : (
    <span className="flex shrink-0 items-center justify-center rounded-full font-bold text-white select-none"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size < 32 ? 10 : 12 }}>
      {initials(author)}
    </span>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

const PAGE_SIZE = 20;

export default function CommunautePage() {
  const [currentUser, setCurrentUser] = useState<{ id: string; author: Author } | null>(null);
  const [role, setRole]               = useState("Pro");
  const [hasMentions, setHasMentions] = useState(true);
  const [hasBadges, setHasBadges]     = useState(true);
  const [members, setMembers]         = useState<MemberSuggestion[]>([]);
  const [posts, setPosts]             = useState<PostRow[]>([]);
  const [postsOffset, setPostsOffset] = useState(PAGE_SIZE);
  const [hasMore, setHasMore]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef                   = useRef<HTMLDivElement>(null);
  const loadMoreRef                   = useRef<() => Promise<void>>(async () => {});
  const [loading, setLoading]         = useState(true);
  const [catFilter, setCatFilter]     = useState<Category>("Toutes");
  const [authorSearch, setAuthorSearch] = useState("");
  const [draft, setDraft]             = useState({ content: "", category: "Business" });
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const fileRef                       = useRef<HTMLInputElement>(null);
  const [openComments, setOpenComments]   = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [sendingComment, setSendingComment] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
  } | null>(null);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const { data } = await supabase
      .from("social_posts")
      .select(getPostSelect(hasMentions, hasBadges))
      .order("created_at", { ascending: false })
      .range(postsOffset, postsOffset + PAGE_SIZE - 1);
    if (data?.length) {
      setPosts(prev => [...prev, ...(data as unknown as Record<string, unknown>[]).map(normalizePost)]);
      setPostsOffset(o => o + data.length);
      if (data.length < PAGE_SIZE) setHasMore(false);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  }, [hasMore, loadingMore, postsOffset, hasMentions, hasBadges]);

  useEffect(() => { loadMoreRef.current = loadMore; }, [loadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreRef.current(); },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;

    async function initPage() {
      const { data: { user } } = await supabase.auth.getUser();
      if (active && user) {
        const uid = user.id;
        const { data: member } = await supabase
          .from("members").select("first_name, last_name, role, avatar_url").eq("id", uid).single();
        if (active && member) {
          setCurrentUser({ id: uid, author: member as Author });
          setRole(member.role);
        }
      }

      // Try with both enabled first
      let currentMentions = true;
      let currentBadges = true;
      let postsResult = await supabase.from("social_posts").select(getPostSelect(true, true)).order("created_at", { ascending: false }).range(0, PAGE_SIZE - 1);

      if (postsResult.error && postsResult.error.code === "42703") {
        const errMsg = postsResult.error.message || "";
        if (errMsg.includes("mentioned_ids")) currentMentions = false;
        if (errMsg.includes("badges"))        currentBadges   = false;
        postsResult = await supabase.from("social_posts").select(getPostSelect(currentMentions, currentBadges)).order("created_at", { ascending: false }).range(0, PAGE_SIZE - 1);
        if (postsResult.error && postsResult.error.code === "42703") {
          const errMsg2 = postsResult.error.message || "";
          if (errMsg2.includes("mentioned_ids")) currentMentions = false;
          if (errMsg2.includes("badges"))        currentBadges   = false;
          postsResult = await supabase.from("social_posts").select(getPostSelect(currentMentions, currentBadges)).order("created_at", { ascending: false }).range(0, PAGE_SIZE - 1);
        }
      }

      if ((postsResult.data?.length ?? 0) < PAGE_SIZE && active) setHasMore(false);

      const membersResult = await supabase.from("members").select("id,first_name,last_name,role,avatar_url").eq("status", "Actif").order("first_name");

      if (active) {
        setHasMentions(currentMentions);
        setHasBadges(currentBadges);
        if (postsResult.data) setPosts((postsResult.data as unknown as Record<string, unknown>[]).map(normalizePost));
        if (membersResult.data) setMembers(membersResult.data as MemberSuggestion[]);
        setLoading(false);
      }
    }

    initPage();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (session?.user) {
        const uid = session.user.id;
        const { data: member } = await supabase
          .from("members").select("first_name, last_name, role, avatar_url").eq("id", uid).single();
        if (active && member) {
          setCurrentUser({ id: uid, author: member as Author });
          setRole(member.role);
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase
      .channel("kpaka-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "social_posts" }, async payload => {
        if (payload.new.author_id === currentUser.id) return;
        const { data } = await supabase.from("social_posts").select(getPostSelect(hasMentions, hasBadges)).eq("id", payload.new.id).single();
        if (data) {
          setPosts(prev => {
            if (prev.some(p => p.id === (data as unknown as PostRow).id)) return prev;
            return [normalizePost(data as unknown as Record<string, unknown>), ...prev];
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser, hasMentions, hasBadges]);

  async function toggleLike(postId: string) {
    if (!currentUser) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const isLiked = post.social_likes.some(l => l.member_id === currentUser.id);
    setPosts(prev => prev.map(p => p.id !== postId ? p : {
      ...p,
      likes_count:  p.likes_count + (isLiked ? -1 : 1),
      social_likes: isLiked
        ? p.social_likes.filter(l => l.member_id !== currentUser.id)
        : [...p.social_likes, { member_id: currentUser.id }],
    }));
    if (isLiked) {
      await supabase.from("social_likes").delete().eq("post_id", postId).eq("member_id", currentUser.id);
    } else {
      await supabase.from("social_likes").insert({ post_id: postId, member_id: currentUser.id });
    }
  }

  async function submitComment(postId: string) {
    if (!currentUser) return;
    const text = commentInputs[postId]?.trim();
    if (!text || sendingComment) return;
    setSendingComment(postId);
    setCommentInputs(prev => ({ ...prev, [postId]: "" }));
    const mentionedIds = extractMentionedIds(text, members);
    const insertPayload: Record<string, unknown> = { post_id: postId, author_id: currentUser.id, content: text };
    if (hasMentions) insertPayload.mentioned_ids = mentionedIds;
    const authorSelect = `first_name, last_name, role, avatar_url${hasBadges ? ", badges" : ""}`;
    const selectFields = `id, content, created_at, ${hasMentions ? "mentioned_ids, " : ""}author:members!author_id(${authorSelect})`;
    const { data } = await supabase.from("social_comments").insert(insertPayload).select(selectFields).single();
    if (data) {
      setPosts(prev => prev.map(p => p.id !== postId ? p : {
        ...p, social_comments: [...p.social_comments, data as unknown as CommentRow],
      }));
    }
    setSendingComment(null);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setNotification({
        type: "error",
        title: "Fichier trop volumineux",
        message: "L'image sélectionnée dépasse la taille limite de 8 Mo."
      });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  }
  function removeImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null); setImagePreview(null);
  }

  async function submitPost(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!currentUser) {
      setNotification({
        type: "error",
        title: "Connexion requise",
        message: "Vous devez être connecté pour publier sur le fil de la communauté."
      });
      return;
    }
    if (!draft.content.trim() || submitting) return;
    setSubmitting(true);
    try {
      let image_url: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${currentUser.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("post-images").upload(path, imageFile);
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from("post-images").getPublicUrl(path);
          image_url = publicUrl;
        } else {
          setNotification({
            type: "error",
            title: "Erreur de stockage",
            message: `Erreur lors de l'envoi de l'image : ${upErr.message}`
          });
        }
      }
      const mentionedIds = extractMentionedIds(draft.content, members);
      const insertPayload: Record<string, unknown> = {
        author_id: currentUser.id, content: draft.content.trim(), category: draft.category, image_url,
      };
      if (hasMentions) insertPayload.mentioned_ids = mentionedIds;
      const { data: newPost, error: insertError } = await supabase
        .from("social_posts").insert(insertPayload).select(getPostSelect(hasMentions, hasBadges)).single();
      if (insertError) {
        setNotification({
          type: "error",
          title: "Erreur de publication",
          message: `Erreur lors de la publication : [Code ${insertError.code}] ${insertError.message}`
        });
      } else if (newPost) {
        setPosts(prev => [normalizePost(newPost as unknown as Record<string, unknown>), ...prev]);
        removeImage();
        setDraft({ content: "", category: "Business" });
      }
    } catch (err: unknown) {
      const e = err as Error;
      setNotification({
        type: "error",
        title: "Erreur système",
        message: `Exception lors de la publication : ${e.name} - ${e.message}`
      });
    }
    setSubmitting(false);
  }

  const filtered = posts
    .filter(p => catFilter === "Toutes" || p.category === catFilter)
    .filter(p => {
      if (!authorSearch.trim()) return true;
      const name = `${p.author.first_name} ${p.author.last_name}`.toLowerCase();
      return name.includes(authorSearch.toLowerCase());
    });

  function toggleComments(id: string) {
    setOpenComments(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function deletePost(postId: string) {
    setConfirmDialog({
      title: "Supprimer la publication",
      message: "Êtes-vous sûr de vouloir supprimer cette publication définitivement ? Cette action est irréversible.",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      isDanger: true,
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("social_posts").delete().eq("id", postId);
          if (error) throw error;
          setPosts(prev => prev.filter(p => p.id !== postId));
          setNotification({
            type: "success",
            title: "Publication supprimée",
            message: "La publication a été supprimée de la communauté avec succès."
          });
        } catch (err: unknown) {
          setNotification({
            type: "error",
            title: "Erreur de suppression",
            message: `Erreur lors de la suppression : ${(err as Error).message}`
          });
        }
      }
    });
  }

  return (
    <MemberLayout role={role}>
      <div className="min-h-full bg-[#F4F3F0]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

          {/* Brand bar */}
          <BrandBar />

          {/* Header */}
          <div className="mt-7 mb-7">
            <h1 className="font-serif text-3xl font-bold text-ink">Fil de la Communauté</h1>
            <p className="mt-1 text-[13.5px] text-muted">Partagez vos actualités, opportunités et questions avec les membres Propulsion.</p>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_292px] gap-6 items-start">

            {/* ── Left: feed ── */}
            <div className="space-y-4">

              {/* Mobile category scroller */}
              <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setCatFilter(cat)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${catFilter === cat ? "bg-brand text-white" : "border border-[#E0DDD8] bg-white text-muted hover:text-ink"}`}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* Mobile search */}
              <div className="lg:hidden relative">
                <Search width={14} height={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint"/>
                <input type="search" placeholder="Rechercher un membre…" value={authorSearch} onChange={e => setAuthorSearch(e.target.value)}
                  className="w-full rounded-full border border-[#E0DDD8] bg-white py-2 pl-9 pr-4 text-[13px] text-ink placeholder:text-faint outline-none focus:border-brand"/>
                {authorSearch && (
                  <button onClick={() => setAuthorSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-ink">
                    <Close width={13} height={13}/>
                  </button>
                )}
              </div>

              {/* Composer */}
              {currentUser && (
                <div className="rounded-2xl border border-[#E0DDD8] bg-white overflow-hidden">
                  <form onSubmit={submitPost}>
                    {/* Top: avatar + textarea */}
                    <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                      <Avatar author={currentUser.author} size={38}/>
                      <MentionInput
                        value={draft.content}
                        onChange={content => setDraft(d => ({ ...d, content }))}
                        members={members}
                        rows={3}
                        placeholder="Partagez une opportunité, une actualité, une question…"
                        className="flex-1 resize-none bg-transparent text-[14px] text-ink outline-none placeholder:text-faint leading-relaxed pt-1"
                      />
                    </div>

                    {/* Image preview */}
                    {imagePreview && (
                      <div className="relative mx-4 mb-3 overflow-hidden rounded-xl border border-[#E0DDD8] bg-[#F4F3F0]/20 flex justify-center items-center">
                        <img src={imagePreview} alt="Aperçu" className="w-full h-auto max-h-72 object-contain"/>
                        <button type="button" onClick={removeImage}
                          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-all cursor-pointer">
                          <Close width={13} height={13}/>
                        </button>
                      </div>
                    )}

                    {/* Bottom toolbar */}
                    <div className="flex items-center justify-between gap-2 border-t border-[#E0DDD8] bg-[#F4F3F0]/50 px-4 py-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {POST_CATS.map(c => (
                          <button key={c} type="button" onClick={() => setDraft(d => ({ ...d, category: c }))}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${draft.category === c ? "text-white" : "bg-white border border-[#E0DDD8] text-faint hover:text-ink"}`}
                            style={draft.category === c ? { background: CAT_COLOR[c] } : undefined}>
                            {c}
                          </button>
                        ))}
                        <button type="button" title="Ajouter une photo" onClick={() => fileRef.current?.click()}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white border border-[#E0DDD8] text-muted hover:border-brand/40 hover:text-brand transition-colors">
                          <Camera width={13} height={13}/>
                        </button>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect}/>
                      </div>
                      <button type="submit" disabled={submitting || !draft.content.trim()}
                        className="rounded-full bg-brand px-4 py-1.5 text-[12.5px] font-bold text-white hover:bg-brand/90 transition-all active:scale-[0.97] disabled:opacity-40 shrink-0">
                        {submitting ? "Publication…" : "Publier"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Author search result info */}
              {authorSearch && (
                <p className="text-[12px] text-muted px-1">
                  <span className="font-bold text-ink">{filtered.length}</span> publication{filtered.length !== 1 ? "s" : ""} · «&nbsp;{authorSearch}&nbsp;»
                  <button onClick={() => setAuthorSearch("")} className="ml-2 text-brand hover:underline">Effacer</button>
                </p>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex justify-center py-16">
                  <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"/>
                </div>
              )}

              {/* Feed */}
              {!loading && (
                <div className="space-y-3">
                  {filtered.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#E0DDD8] bg-white py-16 text-center">
                      <p className="text-[14px] font-semibold text-muted">
                        {authorSearch ? `Aucune publication de « ${authorSearch} »` : "Soyez le premier à publier aujourd’hui."}
                      </p>
                      {!authorSearch && <p className="mt-1 text-[12px] text-faint">Partagez une opportunité, une expérience ou une question.</p>}
                    </div>
                  ) : (
                    filtered.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={currentUser?.id ?? null}
                        members={members}
                        commentInput={commentInputs[post.id] ?? ""}
                        isCommentsOpen={openComments.has(post.id)}
                        isSendingComment={sendingComment === post.id}
                        onLike={() => toggleLike(post.id)}
                        onToggleComments={() => toggleComments(post.id)}
                        onCommentChange={v => setCommentInputs(prev => ({ ...prev, [post.id]: v }))}
                        onComment={() => submitComment(post.id)}
                        onDelete={(currentUser?.id === post.author_id || role === "Admin" || role === "Modérateur") ? () => deletePost(post.id) : undefined}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-1" />
              {loadingMore && (
                <div className="flex justify-center py-4">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                </div>
              )}
              {!hasMore && posts.length > 0 && (
                <p className="py-4 text-center text-[12px] text-faint">Toutes les publications ont été chargées.</p>
              )}
            </div>

            {/* ── Right sidebar (desktop) ── */}
            <aside className="hidden lg:flex flex-col gap-4 sticky top-6">

              {/* Member mini card */}
              {currentUser && (
                <div className="rounded-2xl border border-[#E0DDD8] bg-white p-4">
                  <div className="flex items-center gap-3">
                    <Avatar author={currentUser.author} size={44}/>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-ink truncate">{currentUser.author.first_name} {currentUser.author.last_name}</p>
                      <span className="inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: `${ROLE_COLOR[currentUser.author.role]||"#3871c2"}18`, color: ROLE_COLOR[currentUser.author.role]||"#3871c2" }}>
                        {currentUser.author.role}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="rounded-2xl border border-[#E0DDD8] bg-white p-4">
                <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-faint">Rechercher</p>
                <div className="relative">
                  <Search width={13} height={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint"/>
                  <input type="search" placeholder="Nom d'un membre…" value={authorSearch} onChange={e => setAuthorSearch(e.target.value)}
                    className="w-full rounded-full border border-[#E0DDD8] bg-[#F4F3F0] py-2 pl-8 pr-4 text-[13px] text-ink placeholder:text-faint outline-none focus:border-brand focus:bg-white transition-colors"/>
                  {authorSearch && (
                    <button onClick={() => setAuthorSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-ink">
                      <Close width={12} height={12}/>
                    </button>
                  )}
                </div>
              </div>

              {/* Categories */}
              <div className="rounded-2xl border border-[#E0DDD8] bg-white p-4">
                <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-faint">Catégories</p>
                <div className="flex flex-col gap-0.5">
                  {CATEGORIES.map(cat => {
                    const isActive = catFilter === cat;
                    const catColor = CAT_COLOR[cat] ?? "#C0BDB8";
                    return (
                      <button key={cat} onClick={() => setCatFilter(cat)}
                        className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-all ${isActive ? "font-semibold text-brand bg-brand/5" : "font-medium text-muted hover:bg-[#F4F3F0] hover:text-ink"}`}>
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat === "Toutes" ? "#C0BDB8" : catColor }}/>
                        <span className="flex-1 text-left">{cat}</span>
                        {isActive && <span className="h-1.5 w-1.5 rounded-full bg-brand"/>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Spirit card */}
              <div className="rounded-2xl border border-[#E0DDD8] bg-white p-4">
                <p className="text-[13px] font-bold text-ink mb-1.5">La règle d&apos;or</p>
                <p className="text-[12px] text-muted leading-relaxed">
                  Ce fil est un espace professionnel. Partagez avec intention — opportunités, retours d&apos;expérience, questions. La qualité prime sur la quantité.
                </p>
              </div>

            </aside>
          </div>
        </div>
      </div>
      <AiAgent/>

      {/* Custom Notification Modal */}
      {notification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-md scale-100 transform overflow-hidden rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                notification.type === 'error' ? 'bg-[#ff1e58]/10 text-[#ff1e58]' :
                notification.type === 'success' ? 'bg-[#22c55e]/10 text-[#22c55e]' :
                'bg-[#3871c2]/10 text-[#3871c2]'
              }`}>
                {notification.type === 'error' && (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {notification.type === 'success' && (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {notification.type === 'info' && (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <h3 className="font-serif text-lg font-bold text-ink">{notification.title}</h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{notification.message}</p>
              </div>
            </div>
            
            {/* Action button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setNotification(null)}
                className="rounded-full bg-brand px-5 py-2 text-[13px] font-bold text-white transition-all hover:bg-brand/90 active:scale-95 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-md scale-100 transform overflow-hidden rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                confirmDialog.isDanger ? 'bg-[#ff1e58]/10 text-[#ff1e58]' : 'bg-[#ffac42]/10 text-[#ffac42]'
              }`}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <h3 className="font-serif text-lg font-bold text-ink">{confirmDialog.title}</h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{confirmDialog.message}</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="rounded-full border border-[#E0DDD8] bg-white px-5 py-2 text-[13px] font-bold text-muted transition-all hover:bg-[#F4F3F0] hover:text-ink active:scale-95 cursor-pointer"
              >
                {confirmDialog.cancelText || "Annuler"}
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className={`rounded-full px-5 py-2 text-[13px] font-bold text-white transition-all active:scale-95 cursor-pointer ${
                  confirmDialog.isDanger ? 'bg-[#ff1e58] hover:bg-[#ff1e58]/90' : 'bg-brand hover:bg-brand/90'
                }`}
              >
                {confirmDialog.confirmText || "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MemberLayout>
  );
}

/* ─── PostCard ────────────────────────────────────────────────────────────── */

interface PostCardProps {
  post:             PostRow;
  currentUserId:    string | null;
  members:          MemberSuggestion[];
  commentInput:     string;
  isCommentsOpen:   boolean;
  isSendingComment: boolean;
  onLike:           () => void;
  onToggleComments: () => void;
  onCommentChange:  (v: string) => void;
  onComment:        () => void;
  onDelete?:        () => void;
}

function PostCard({
  post, currentUserId, members, commentInput, isCommentsOpen,
  isSendingComment, onLike, onToggleComments, onCommentChange, onComment, onDelete,
}: PostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isLiked    = !!currentUserId && post.social_likes.some(l => l.member_id === currentUserId);
  const catColor   = CAT_COLOR[post.category] ?? "#3871c2";
  const roleColor  = ROLE_COLOR[post.author.role] ?? "#3871c2";
  const shouldTruncate = post.content.length > 300 || post.content.split("\n").length > 4;

  return (
    <article
      className="overflow-hidden rounded-2xl border border-[#E0DDD8] bg-white"
      style={{ borderLeft: `3px solid ${catColor}` }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <Avatar author={post.author} size={38}/>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] font-bold text-ink">{post.author.first_name} {post.author.last_name}</span>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: `${roleColor}18`, color: roleColor }}>{post.author.role}</span>
            <AuthorBadges badges={post.author.badges}/>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] text-faint">{relativeTime(post.created_at)}</span>
            <span className="text-faint text-[10px]">·</span>
            <span className="h-1.5 w-1.5 rounded-full inline-block shrink-0" style={{ backgroundColor: catColor }}/>
            <span className="text-[11px] text-faint">{post.category}</span>
          </div>
        </div>
        {onDelete && (
          <button onClick={onDelete} title="Supprimer la publication"
            className="text-faint hover:text-[#ff1e58] transition-colors p-1.5 rounded-full hover:bg-[#ff1e58]/5 shrink-0 cursor-pointer">
            <Trash width={14} height={14}/>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4">
        <p className={`text-[14px] leading-[1.75] text-ink whitespace-pre-line ${!expanded && shouldTruncate ? "line-clamp-4" : ""}`}>
          <RichContent text={post.content}/>
        </p>
        {shouldTruncate && (
          <button onClick={() => setExpanded(v => !v)} className="mt-1 text-[12px] font-semibold text-brand hover:underline">
            {expanded ? "Réduire" : "Lire la suite"}
          </button>
        )}
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="mx-4 mt-3 overflow-hidden rounded-xl border border-[#E0DDD8] bg-[#F4F3F0]/30 flex justify-center items-center">
          <img src={post.image_url} alt="" className="w-full h-auto max-h-[512px] object-contain" loading="lazy"/>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center gap-5 border-t border-[#E0DDD8] px-4 py-3">
        <button onClick={onLike}
          className={`group inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors ${isLiked ? "text-[#ff1e58]" : "text-faint hover:text-[#ff1e58]"}`}>
          <Heart width={16} height={16} className={`transition-transform group-active:scale-110 ${isLiked ? "fill-current" : ""}`}/>
          {post.likes_count}
        </button>
        <button onClick={onToggleComments}
          className={`inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors ${isCommentsOpen ? "text-brand" : "text-faint hover:text-ink"}`}>
          <MessageCircle width={16} height={16}/>
          {post.social_comments.length}
        </button>
      </div>

      {/* Comments */}
      {isCommentsOpen && (
        <div className="border-t border-[#E0DDD8] px-4 pb-4 pt-3 space-y-3">
          {post.social_comments.length === 0 && (
            <p className="text-center text-[12px] text-faint py-2">Soyez le premier à commenter.</p>
          )}
          {post.social_comments.map(c => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar author={c.author} size={28}/>
              <div className="rounded-2xl rounded-tl-sm bg-[#F4F3F0] px-3 py-2 flex-1 min-w-0">
                <p className="text-[12px] font-bold text-ink">{c.author.first_name} {c.author.last_name}</p>
                <p className="mt-0.5 text-[12.5px] text-muted leading-snug whitespace-pre-line">
                  <RichContent text={c.content}/>
                </p>
                <p className="mt-1 text-[10px] text-faint">{relativeTime(c.created_at)}</p>
              </div>
            </div>
          ))}

          <div className="flex gap-2 pt-1 items-end">
            <MentionInput
              value={commentInput}
              onChange={onCommentChange}
              members={members}
              rows={1}
              placeholder="Votre commentaire… @ pour mentionner"
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onComment(); } }}
              className="flex-1 resize-none rounded-2xl border border-[#E0DDD8] bg-[#F4F3F0] px-3.5 py-2 text-[13px] text-ink placeholder:text-faint outline-none focus:border-brand"
            />
            <button onClick={onComment} disabled={isSendingComment || !commentInput.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white hover:bg-brand/90 transition-all disabled:opacity-50">
              {isSendingComment
                ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"/>
                : <ArrowRight width={14} height={14}/>
              }
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
