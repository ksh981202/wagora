import {
  Bookmark,
  Brush,
  ChevronDown,
  ChevronLeft,
  Circle,
  Droplets,
  Eye,
  Heart,
  Search,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { MouseEvent, ReactNode, TouchEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useNailDetailQuery } from "@/entities/nail-design/api/useNailDetailQuery";
import { useSimilarNailsQuery } from "@/entities/nail-design/api/useSimilarNailsQuery";
import { useCurrentUserId } from "@/features/my-page/useCurrentUserId";
import { supabase } from "@/shared/api/supabaseClient";
import { useLanguageContext } from "@/contexts/LanguageContext";

type NailPhotoDetail = {
  id: string;
  image_url: string;
  title: string;
  description: string;
  situations: string[] | null;
  styles: string[] | null;
  color: string;
  nail_length: string;
  hand_type: string;
  mood: string;
  design_technique: string;
  design_elements: string;
  procedure_guide: string;
  title_en: string | null;
  description_en: string | null;
  color_en: string | null;
  length_en: string | null;
  hand_type_en: string | null;
  mood_en: string | null;
  occasion_en: string | null;
  styles_en: string | null;
  technique_en: string | null;
  design_point_en: string | null;
  guide_en: string | null;
  popularity: number;
  saves: number;
  likes: number;
  created_at?: string;
};

type DetailLocationState = {
  sourceTag?: unknown;
  initialNailData?: unknown;
} | null;

const DESIGN_ICONS = [Brush, Droplets, Circle, Sparkles] as const;

function toStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

/** API? text[]?jsonb ?? ??? ? ?? ???? ?? (??? ????? ????) */
function apiLongTextField(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) {
    return v
      .map((item) => {
        if (item == null) return "";
        if (typeof item === "string") return item;
        if (typeof item === "number" || typeof item === "boolean") return String(item);
        return "";
      })
      .map((s) => s.trim())
      .filter(Boolean)
      .join(", ");
  }
  return "";
}

function toStringArray(v: unknown): string[] | null {
  if (v == null) return null;
  if (Array.isArray(v)) {
    return v.map((x) => toStr(x).trim()).filter(Boolean);
  }
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    try {
      const p = JSON.parse(s) as unknown;
      if (Array.isArray(p)) {
        return p.map((x) => toStr(x).trim()).filter(Boolean);
      }
    } catch {
      /* plain string, not JSON */
    }
  }
  return null;
}

function toFiniteNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

/** API ??? ??? ???? ?? (null??? ??? ??) */
function normalizeNailRow(raw: unknown): NailPhotoDetail | null {
  if (raw == null || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = toStr(r.id).trim();
  if (!id) return null;
  return {
    id,
    image_url: toStr(r.image_url),
    title: toStr(r.title),
    description: toStr(r.description),
    situations: toStringArray(r.situations),
    styles: toStringArray(r.styles),
    color: toStr(r.color),
    nail_length: toStr(r.nail_length),
    hand_type: toStr(r.hand_type),
    mood: toStr(r.mood),
    design_technique: toStr(r.design_technique),
    design_elements: apiLongTextField(r.design_elements),
    procedure_guide: apiLongTextField(r.procedure_guide),
    title_en: toStr(r.title_en) || null,
    description_en: toStr(r.description_en) || null,
    color_en: toStr(r.color_en) || null,
    length_en: toStr(r.length_en) || null,
    hand_type_en: toStr(r.hand_type_en) || null,
    mood_en: toStr(r.mood_en) || null,
    occasion_en: toStr(r.occasion_en) || null,
    styles_en: toStr(r.styles_en) || null,
    technique_en: toStr(r.technique_en) || null,
    design_point_en: apiLongTextField(r.design_point_en),
    guide_en: apiLongTextField(r.guide_en),
    popularity: toFiniteNumber(r.popularity, 0),
    saves: toFiniteNumber(r.saves, 0),
    likes: (() => {
      const fromApi = toFiniteNumber(r.likes ?? r.like_count, NaN);
      if (Number.isFinite(fromApi)) return fromApi as number;
      return 0;
    })(),
    created_at: (() => {
      const s = toStr(r.created_at).trim();
      return s || undefined;
    })(),
  };
}

function normalizeInitialNailData(nailId: string, raw: unknown): NailPhotoDetail | null {
  if (raw == null || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const id = toStr(rec.id).trim() || nailId.trim();
  if (!id) return null;
  const imageUrl = toStr(rec.image_url ?? rec.imageUrl ?? rec.image).trim();
  const title = toStr(rec.title).trim();
  if (!imageUrl && !title) return null;
  return {
    id,
    image_url: imageUrl,
    title: title || "네일 디자인",
    description: toStr(rec.description),
    situations: toStringArray(rec.situations),
    styles: toStringArray(rec.styles),
    color: toStr(rec.color),
    nail_length: toStr(rec.nail_length),
    hand_type: toStr(rec.hand_type),
    mood: toStr(rec.mood),
    design_technique: toStr(rec.design_technique),
    design_elements: apiLongTextField(rec.design_elements),
    procedure_guide: apiLongTextField(rec.procedure_guide),
    title_en: toStr(rec.title_en) || null,
    description_en: toStr(rec.description_en) || null,
    color_en: toStr(rec.color_en) || null,
    length_en: toStr(rec.length_en) || null,
    hand_type_en: toStr(rec.hand_type_en) || null,
    mood_en: toStr(rec.mood_en) || null,
    occasion_en: toStr(rec.occasion_en) || null,
    styles_en: toStr(rec.styles_en) || null,
    technique_en: toStr(rec.technique_en) || null,
    design_point_en: apiLongTextField(rec.design_point_en),
    guide_en: apiLongTextField(rec.guide_en),
    popularity: toFiniteNumber(rec.popularity, 0),
    saves: toFiniteNumber(rec.saves, 0),
    likes: toFiniteNumber(rec.likes, 0),
    created_at: undefined,
  };
}

function formatCount(n: number): string {
  const x = Number.isFinite(n) ? n : 0;
  if (x >= 1_000_000) return `${(x / 1_000_000).toFixed(1)}M`;
  if (x >= 1_000) return `${(x / 1_000).toFixed(1)}k`;
  return String(x);
}

type NailActivityAction = "detail_view" | "save" | "unsave" | "share";

async function trackNailActivity(
  nailId: string,
  action: NailActivityAction,
  userId?: string | null,
): Promise<void> {
  const nailDesignId = nailId.trim();
  if (!nailDesignId) return;

  const { error } = await supabase.from("nail_activity_events").insert({
    nail_id: nailDesignId,
    action,
    user_id: userId?.trim() || null,
  });

  if (error && import.meta.env.DEV) {
    console.warn("[Detail] activity tracking failed", { action, error });
  }
}

function buildTagChips(row: NailPhotoDetail): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (s: string | undefined | null) => {
    const t = typeof s === "string" ? s.trim() : "";
    if (!t) return;
    const key = t.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(t);
  };
  const pushCommaSeparated = (s: string | undefined | null) => {
    const raw = typeof s === "string" ? s : "";
    if (!raw.trim()) return;
    raw
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean)
      .forEach((token) => push(token));
  };
  push(row?.color);
  push(row?.nail_length);
  push(row?.mood);
  (row?.situations ?? []).forEach((s) => push(s));
  (row?.styles ?? []).forEach((s) => push(s));
  pushCommaSeparated(row?.design_technique);
  pushCommaSeparated(row?.design_elements);
  return out;
}

function normalizeTagKeyword(value: string): string {
  return value.replace(/^#+/, "").trim().toLowerCase();
}

function prioritizeTagTokens(tokens: string[], priorityTag?: string): string[] {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const norm = normalizeTagKeyword(String(token));
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    unique.push(token);
  }
  const priority = normalizeTagKeyword(priorityTag ?? "");
  if (!priority) return unique;
  const prioritized = unique.filter((t) => normalizeTagKeyword(t).includes(priority));
  const rest = unique.filter((t) => !normalizeTagKeyword(t).includes(priority));
  if (prioritized.length > 0) return [...prioritized, ...rest];
  const fallbackLabel = (priorityTag ?? "").replace(/^#+/, "").trim();
  if (!fallbackLabel) return rest;
  return [fallbackLabel, ...rest];
}

function splitDesignElements(raw: string | null | undefined): string[] {
  const s = raw != null && typeof raw === "string" ? raw : "";
  if (!s.trim()) return [];
  return s
    .split(/[,\s・;|/]+/)
    .map((x) => (x != null ? String(x).trim() : ""))
    .filter(Boolean)
    .slice(0, 4);
}

function splitLooseTokens(raw: unknown): string[] {
  const s = safeTrimText(raw);
  if (!s) return [];
  return s
    .split(/[,\n\r\t・;|/]+/)
    .map((x) => safeTrimText(x))
    .filter(Boolean);
}


function expandTagTokensFromChips(chips: string[]): string[] {
  return chips.flatMap((chip) => {
    const t = String(chip ?? "").trim();
    if (!t) return [];
    return t
      .split(/[,\s・;|/]+/)
      .map((x) => x.replace(/^#+/, "").trim())
      .filter(Boolean);
  });
}

type ProcedureSection = {
  title: string;
  content: string;
};

function safeTrimText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value).trim();
  return "";
}

function splitProcedureSteps(raw: string | null | undefined, language: "ko" | "en"): ProcedureSection[] {
  try {
    const s = raw != null && typeof raw === "string" ? raw : "";
    if (!s.trim()) return [];
    const normalized = s.replace(/\r\n/g, "\n").trim();
    // [Base], [Art], [Finishing]/[Finish], [마무리] 등 변형(대소문자/공백 포함)을 모두 인식
    const markerPattern = /\[\s*(베이스|base|아트|art|마무리|finishing|finish|final)\s*\]/gi;
    const matches = Array.from(normalized.matchAll(markerPattern));
    const stepTitles = language === "en" ? ["Base", "Art", "Finish"] : ["베이스", "아트", "마무리"];
    const stepContents = ["", "", ""];

    const markerToStepIndex = (markerRaw: string): 0 | 1 | 2 | null => {
      const m = String(markerRaw ?? "").trim().toLowerCase();
      if (m === "베이스" || m === "base") return 0;
      if (m === "아트" || m === "art") return 1;
      if (m === "마무리" || m === "finishing" || m === "finish" || m === "final") return 2;
      return null;
    };

    if (matches.length > 0) {
      // 첫 마커 전 텍스트는 Base로 흡수
      const firstStart = matches[0]?.index ?? 0;
      const preface = normalized.slice(0, firstStart).trim();
      if (preface) stepContents[0] = preface;

      for (let i = 0; i < matches.length; i += 1) {
        const current = matches[i];
        const next = matches[i + 1];
        const stepIdx = markerToStepIndex(current[1] ?? "");
        if (stepIdx == null) continue;
        const sectionStart = (current.index ?? 0) + current[0].length;
        const sectionEnd = next?.index ?? normalized.length;
        const content = normalized.slice(sectionStart, sectionEnd).trim();
        if (!content) continue;
        stepContents[stepIdx] = stepContents[stepIdx]
          ? `${stepContents[stepIdx]}\n${content}`.trim()
          : content;
      }
    } else {
      // 마커가 없는 케이스도 3단계 구조를 유지
      const fallbackByLine = normalized
        .split(/\n+/)
        .map((x) => (x != null ? String(x).trim() : ""))
        .filter(Boolean);
      stepContents[0] = fallbackByLine[0] ?? normalized;
      stepContents[1] = fallbackByLine[1] ?? "";
      stepContents[2] = fallbackByLine.slice(2).join("\n").trim();
    }

    // 항상 3단계(Base, Art, Finish) 반환 (빈 문자열 포함)
    return [
      { title: stepTitles[0], content: stepContents[0] ?? "" },
      { title: stepTitles[1], content: stepContents[1] ?? "" },
      { title: stepTitles[2], content: stepContents[2] ?? "" },
    ];
  } catch (error) {
    if (import.meta.env.DEV) console.warn("[Detail] splitProcedureSteps fallback", error);
    const fallback = safeTrimText(raw);
    if (!fallback) return [];
    const stepTitles = language === "en" ? ["Base", "Art", "Finish"] : ["베이스", "아트", "마무리"];
    return [
      { title: stepTitles[0], content: fallback },
      { title: stepTitles[1], content: "" },
      { title: stepTitles[2], content: "" },
    ];
  }
}

function upsertMetaTag(
  selector: string,
  attrName: "property" | "name",
  attrValue: string,
  content: string,
): HTMLMetaElement | null {
  const head = document.head;
  if (!head) return null;
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, attrValue);
    head.appendChild(el);
  }
  el.setAttribute("content", content);
  return el;
}

const Detail = () => {
  const { language, setLanguage } = useLanguageContext();
  const isEnglish = language === "en";
  const navigate = useNavigate();
  const handleTagClick = (tag: string) => {
    const bare = String(tag ?? "").replace(/^#+/, "").trim();
    const encoded = encodeURIComponent(bare || String(tag ?? "").trim());
    navigate(`/search?q=${encoded}`);
  };
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const nailId = (id ?? "").trim();
  const queryClient = useQueryClient();

  const { data: nailRow, isLoading: queryLoading, isError: queryError } = useNailDetailQuery(
    nailId || undefined,
  );
  const fetchedRow = useMemo(
    () => (nailRow ? normalizeNailRow(nailRow) : null),
    [nailRow],
  );
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const currentUserId = useCurrentUserId();
  const [reactionOverride, setReactionOverride] = useState<{
    key: string;
    isLiked: boolean;
    isSaved: boolean;
  } | null>(null);
  const [dbReactionState, setDbReactionState] = useState<{
    key: string;
    isLiked: boolean;
    isSaved: boolean;
  }>({ key: "", isLiked: false, isSaved: false });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showFloatingHeart, setShowFloatingHeart] = useState(false);
  const [optimisticViewNailId, setOptimisticViewNailId] = useState<string | null>(null);
  const [floatingHeartKey, setFloatingHeartKey] = useState(0);
  const floatingHeartHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareToastHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTouchTapRef = useRef<{ t: number; x: number; y: number } | null>(null);
  const locationState = useMemo(
    () => location.state as DetailLocationState,
    [location.state],
  );
  const initialNailData = useMemo(
    () => normalizeInitialNailData(nailId, locationState?.initialNailData),
    [nailId, locationState?.initialNailData],
  );

  /** ? ????? ??? ???? ??, URL id? ????? stale `row`? ?????. */
  const displayRow = useMemo((): NailPhotoDetail | null => {
    if (!nailId) return null;
    if (fetchedRow?.id === nailId) return fetchedRow;
    if (initialNailData?.id === nailId) return initialNailData;
    return null;
  }, [fetchedRow, initialNailData, nailId]);

  const isLoading = queryLoading && !displayRow;

  const pickLocalized = useCallback(
    (ko: unknown, en: unknown): string => {
      const koText = safeTrimText(ko);
      const enText = safeTrimText(en);
      if (!isEnglish) return koText;
      return enText || koText;
    },
    [isEnglish],
  );

  const sourceTag = useMemo(
    () => (typeof locationState?.sourceTag === "string" ? locationState.sourceTag : undefined),
    [locationState?.sourceTag],
  );
  const tagChips = useMemo(() => (displayRow ? buildTagChips(displayRow) : []), [displayRow]);
  const displayTagTokens = useMemo(
    () => prioritizeTagTokens(expandTagTokensFromChips(tagChips), sourceTag),
    [tagChips, sourceTag],
  );
  const displayTags = useMemo(() => {
    if (!displayRow) return [];
    if (!isEnglish) return displayTagTokens;

    const enChips = [
      safeTrimText(displayRow.color_en),
      safeTrimText(displayRow.length_en),
      safeTrimText(displayRow.hand_type_en),
      safeTrimText(displayRow.mood_en),
      ...splitLooseTokens(displayRow.occasion_en),
      ...splitLooseTokens(displayRow.styles_en),
      ...splitLooseTokens(displayRow.technique_en),
      ...splitLooseTokens(displayRow.design_point_en),
    ].filter(Boolean);

    if (enChips.length === 0) return displayTagTokens;
    const enTokens = prioritizeTagTokens(expandTagTokensFromChips(enChips), sourceTag);
    return enTokens.length > 0 ? enTokens : displayTagTokens;
  }, [displayRow, isEnglish, displayTagTokens, sourceTag]);
  const designPoints = useMemo(
    () => splitDesignElements(pickLocalized(displayRow?.design_elements, displayRow?.design_point_en)),
    [displayRow?.design_elements, displayRow?.design_point_en, pickLocalized],
  );
  const procedureSteps = useMemo(
    () => splitProcedureSteps(pickLocalized(displayRow?.procedure_guide, displayRow?.guide_en), language),
    [displayRow?.procedure_guide, displayRow?.guide_en, pickLocalized, language],
  );
  const formattedDescription = useMemo(() => {
    const raw = pickLocalized(displayRow?.description, displayRow?.description_en);
    if (!raw) return isEnglish ? "No description has been provided yet." : "등록된 상세 설명이 없어요.";
    // ?? ?(". ")? ???? ?? ? ??? ? ??? ???? ????.
    return raw.replace(/\. +/g, ".\n\n");
  }, [displayRow, pickLocalized, isEnglish]);

  const displayTitle = useMemo(() => {
    const localized = pickLocalized(displayRow?.title, displayRow?.title_en);
    return localized || (isEnglish ? "Nail Design" : "네일 디자인");
  }, [displayRow, pickLocalized, isEnglish]);

  const error = useMemo(() => {
    if (!nailId) return "잘못된 주소예요.";
    if (queryError) return "네일 정보를 불러오지 못했어요.";
    return null;
  }, [nailId, queryError]);

  const reactionKey = `${displayRow?.id ?? ""}:${currentUserId ?? ""}`;
  const storedIsLiked = dbReactionState.key === reactionKey ? dbReactionState.isLiked : false;
  const storedIsSaved = dbReactionState.key === reactionKey ? dbReactionState.isSaved : false;
  const isLiked = reactionOverride?.key === reactionKey ? reactionOverride.isLiked : storedIsLiked;
  const isSaved = reactionOverride?.key === reactionKey ? reactionOverride.isSaved : storedIsSaved;

  const views = (displayRow?.popularity ?? 0) + (displayRow?.id === optimisticViewNailId ? 1 : 0);
  const saveDisplayCount = (displayRow?.saves ?? 0) + (isSaved ? 1 : 0);
  const likeDisplayCount = (displayRow?.likes ?? 0) + (isLiked ? 1 : 0);
  const detailViewTrackedForIdRef = useRef<string | null>(null);

  const similarExcludeId = displayRow?.id ?? nailId;
  const { data: similarNails = [] } = useSimilarNailsQuery(similarExcludeId || undefined);
  const similarDisplay = useMemo(() => similarNails, [similarNails]);


  useEffect(() => {
    window.scrollTo(0, 0);
  }, [nailId]);

  useEffect(() => {
    const nailDesignId = displayRow?.id;
    if (!nailDesignId || !currentUserId) return;

    let cancelled = false;

    void (async () => {
      try {
        const [likeResult, saveResult] = await Promise.all([
          supabase
            .from("user_likes")
            .select("nail_id")
            .eq("user_id", currentUserId)
            .eq("nail_id", nailDesignId)
            .maybeSingle(),
          supabase
            .from("user_saves")
            .select("nail_id")
            .eq("user_id", currentUserId)
            .eq("nail_id", nailDesignId)
            .maybeSingle(),
        ]);

        if (likeResult.error) throw likeResult.error;
        if (saveResult.error) throw saveResult.error;
        if (cancelled) return;

        setDbReactionState({
          key: reactionKey,
          isLiked: Boolean(likeResult.data),
          isSaved: Boolean(saveResult.data),
        });
        setReactionOverride(null);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn("[Detail] user reaction load failed", error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [displayRow?.id, currentUserId, reactionKey]);

  useEffect(() => {
    detailViewTrackedForIdRef.current = null;
  }, [nailId]);

  useEffect(() => {
    const nailDesignId = displayRow?.id;
    if (!nailDesignId) return;
    if (!currentUserId) return;
    if (detailViewTrackedForIdRef.current === nailDesignId) return;
    detailViewTrackedForIdRef.current = nailDesignId;
    setOptimisticViewNailId(nailDesignId);

    void (async () => {
      try {
        await trackNailActivity(nailDesignId, "detail_view", currentUserId);
        const { error: recentViewError } = await supabase.from("user_recent_views").upsert({
          user_id: currentUserId,
          nail_id: nailDesignId,
          viewed_at: new Date().toISOString(),
        });
        if (recentViewError) throw recentViewError;
        queryClient.invalidateQueries({ queryKey: ['my-page-count', 'recent', currentUserId] });
        queryClient.invalidateQueries({ queryKey: ['my-page-gallery', 'recent', currentUserId] });
        queryClient.invalidateQueries({ queryKey: ['my-nail-list', 'recent', currentUserId] });
        const { error } = await supabase.rpc("increment_popularity", {
          nail_id: nailDesignId,
          increment_value: 1,
        });
        if (error) throw error;
      } catch (error) {
        setOptimisticViewNailId((current) => (current === nailDesignId ? null : current));
        if (import.meta.env.DEV) {
          console.warn("[Detail] popularity increment failed", error);
        }
      }
    })();
  }, [displayRow?.id, currentUserId, queryClient]);

  useEffect(() => {
    return () => {
      if (floatingHeartHideRef.current) clearTimeout(floatingHeartHideRef.current);
      if (shareToastHideRef.current) clearTimeout(shareToastHideRef.current);
    };
  }, []);

  useEffect(() => {
    if (!displayRow?.id) return;
    const originalTitle = document.title;
    const originalDescription =
      document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
    const title = displayTitle;
    const fallbackDescription =
      isEnglish
        ? "Found a nail style you love? Explore it in detail on GELIA. 💅"
        : "마음에 쏙 드는 네일 디자인! 젤리아에서 자세히 확인해 보세요. 💅";
    const description =
      pickLocalized(displayRow.description, displayRow.description_en) || fallbackDescription;
    const image = (displayRow.image_url ?? "").trim() || "https://gelia.app/ogimage/og-image.webp";
    const url = window.location.href;

    document.title = `${title} | 젤리아 (GELIA)`;

    upsertMetaTag('meta[name="description"]', "name", "description", description);
    upsertMetaTag('meta[property="og:type"]', "property", "og:type", "website");
    upsertMetaTag('meta[property="og:url"]', "property", "og:url", url);
    upsertMetaTag('meta[property="og:title"]', "property", "og:title", title);
    upsertMetaTag(
      'meta[property="og:description"]',
      "property",
      "og:description",
      description,
    );
    upsertMetaTag('meta[property="og:image"]', "property", "og:image", image);

    return () => {
      document.title = originalTitle;
      upsertMetaTag('meta[name="description"]', "name", "description", originalDescription);
      upsertMetaTag('meta[property="og:url"]', "property", "og:url", "https://gelia.app");
      upsertMetaTag(
        'meta[property="og:title"]',
        "property",
        "og:title",
        "젤리아 (GELIA) | 프리미엄 네일 큐레이션",
      );
      upsertMetaTag(
        'meta[property="og:description"]',
        "property",
        "og:description",
        "어떤 네일 할지 고민되나요? 핫한 트렌드부터 내 취향 맞춤 디자인까지, 젤리아에서 인생 네일을 쉽게 찾아보세요.",
      );
      upsertMetaTag(
        'meta[property="og:image"]',
        "property",
        "og:image",
        "https://gelia.app/ogimage/og-image.webp",
      );
    };
  }, [
    displayRow?.id,
    displayRow?.image_url,
    displayRow?.description,
    displayRow?.description_en,
    displayTitle,
    isEnglish,
    pickLocalized,
  ]);

  const showCopiedToast = useCallback(() => {
    setShowShareToast(true);
    if (shareToastHideRef.current) clearTimeout(shareToastHideRef.current);
    shareToastHideRef.current = setTimeout(() => {
      setShowShareToast(false);
      shareToastHideRef.current = null;
    }, 2500);
  }, []);

  const handleShareDesign = useCallback(async () => {
    const nailDesignId = displayRow?.id;
    const url = window.location.href;
    const shareTitle = displayTitle;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: shareTitle,
          text: isEnglish
            ? "Found a nail style you love? Explore it in detail on GELIA. 💅"
            : "마음에 쏙 드는 네일 디자인! 젤리아에서 자세히 확인해 보세요. 💅",
          url,
        });
        if (nailDesignId) void trackNailActivity(nailDesignId, "share", currentUserId);
        return;
      }
      await navigator.clipboard.writeText(url);
      if (nailDesignId) void trackNailActivity(nailDesignId, "share", currentUserId);
      showCopiedToast();
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        if (nailDesignId) void trackNailActivity(nailDesignId, "share", currentUserId);
        showCopiedToast();
      } catch {
        // Clipboard unavailable: keep silent to avoid noisy UX.
      }
    }
  }, [currentUserId, displayRow?.id, displayTitle, isEnglish, showCopiedToast]);

  const toggleLike = useCallback(() => {
    if (!displayRow?.id) return;
    if (!currentUserId) {
      alert("로그인이 필요한 기능입니다.");
      navigate("/login");
      return;
    }
    const nailDesignId = displayRow.id;
    const next = !isLiked;
    const previousState = { key: reactionKey, isLiked, isSaved };

    setReactionOverride({ key: reactionKey, isLiked: next, isSaved });
    setDbReactionState({ key: reactionKey, isLiked: next, isSaved });

    void (async () => {
      try {
        const query = supabase.from("user_likes");
        const { error } = next
          ? await query.insert({ user_id: currentUserId, nail_id: nailDesignId })
          : await query.delete().match({ user_id: currentUserId, nail_id: nailDesignId });
        if (error) throw error;
        const { error: likeCountError } = await supabase.rpc("increment_likes", {
          nail_id: nailDesignId,
          increment_value: next ? 1 : -1,
        });
        if (likeCountError) throw likeCountError;
        queryClient.invalidateQueries({ queryKey: ['nail-designs', 'reaction-best'] });
        queryClient.invalidateQueries({ queryKey: ['my-page-count', 'liked', currentUserId] });
        queryClient.invalidateQueries({ queryKey: ['my-page-gallery', 'liked', currentUserId] });
        queryClient.invalidateQueries({ queryKey: ['my-nail-list', 'liked', currentUserId] });
      } catch (error) {
        setReactionOverride(previousState);
        setDbReactionState(previousState);
        if (import.meta.env.DEV) {
          console.warn("[Detail] like update failed", error);
        }
      }
    })();
  }, [displayRow, currentUserId, isLiked, isSaved, navigate, queryClient, reactionKey]);

  const toggleSave = useCallback(() => {
    if (!displayRow?.id) return;
    if (!currentUserId) {
      alert("로그인이 필요한 기능입니다.");
      navigate("/login");
      return;
    }
    const nailDesignId = displayRow.id;
    const next = !isSaved;
    const previousState = { key: reactionKey, isLiked, isSaved };

    setReactionOverride({ key: reactionKey, isLiked, isSaved: next });
    setDbReactionState({ key: reactionKey, isLiked, isSaved: next });

    void (async () => {
      try {
        const query = supabase.from("user_saves");
        const { error } = next
          ? await query.insert({ user_id: currentUserId, nail_id: nailDesignId })
          : await query.delete().match({ user_id: currentUserId, nail_id: nailDesignId });
        if (error) throw error;
        const { error: saveCountError } = await supabase.rpc("increment_saves", {
          nail_id: nailDesignId,
          increment_value: next ? 1 : -1,
        });
        if (saveCountError) throw saveCountError;
        queryClient.invalidateQueries({ queryKey: ['nail-designs', 'reaction-best'] });
        queryClient.invalidateQueries({ queryKey: ['my-page-count', 'saved', currentUserId] });
        queryClient.invalidateQueries({ queryKey: ['my-page-gallery', 'saved', currentUserId] });
        queryClient.invalidateQueries({ queryKey: ['my-nail-list', 'saved', currentUserId] });
        void trackNailActivity(nailDesignId, next ? "save" : "unsave", currentUserId);
      } catch (error) {
        setReactionOverride(previousState);
        setDbReactionState(previousState);
        if (import.meta.env.DEV) {
          console.warn("[Detail] save update failed", error);
        }
      }
    })();
  }, [displayRow, currentUserId, isLiked, isSaved, navigate, queryClient, reactionKey]);

  const playFloatingHeart = useCallback(() => {
    setFloatingHeartKey((k) => k + 1);
    setShowFloatingHeart(true);
    if (floatingHeartHideRef.current) clearTimeout(floatingHeartHideRef.current);
    floatingHeartHideRef.current = setTimeout(() => {
      setShowFloatingHeart(false);
      floatingHeartHideRef.current = null;
    }, 900);
  }, []);

  const handleMainImageDoubleLike = useCallback(() => {
    if (isZoomOpen) return;
    if (!displayRow) return;
    if (!currentUserId) {
      alert("로그인이 필요한 기능입니다.");
      navigate("/login");
      return;
    }
    toggleLike();
    playFloatingHeart();
  }, [displayRow, currentUserId, navigate, toggleLike, playFloatingHeart, isZoomOpen]);

  const handleMainImageDoubleClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      e.preventDefault();
      handleMainImageDoubleLike();
    },
    [handleMainImageDoubleLike],
  );

  const handleMainImageTouchEnd = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (!displayRow) return;
      if (e.changedTouches.length !== 1) return;
      const touch = e.changedTouches[0];
      const now = Date.now();
      const prev = lastTouchTapRef.current;
      lastTouchTapRef.current = { t: now, x: touch.clientX, y: touch.clientY };
      if (!prev) return;
      const dt = now - prev.t;
      const dist = Math.hypot(touch.clientX - prev.x, touch.clientY - prev.y);
      if (dt > 35 && dt < 320 && dist < 72) {
        e.preventDefault();
        lastTouchTapRef.current = null;
        handleMainImageDoubleLike();
      }
    },
    [displayRow, handleMainImageDoubleLike],
  );

  const pageShell = (main: ReactNode) => (
    <div className="min-h-screen w-full bg-[#fdfaf7]">
      <div className="relative mx-auto min-h-screen w-full max-w-md bg-[#fdfaf7] text-slate-900">
        <nav className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-primary/10 bg-[#fdfaf7]/80 px-5 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-primary/10"
              aria-label="뒤로 가기"
            >
              <ChevronLeft className="h-5 w-5 text-slate-800" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-[22px] sm:text-[24px] font-semibold text-gray-900 tracking-widest cursor-pointer leading-none"
              style={{ fontFamily: "'Playfair Display', serif" }}
              aria-label="이미지 확대"
            >
              GELIA
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
            type="button"
            onClick={() => setLanguage(language === "ko" ? "en" : "ko")}
            className="mr-1 flex h-7 min-h-[28px] min-w-[44px] items-center justify-center gap-1 rounded-full bg-gray-100 px-2.5 text-[11px] font-bold text-gray-700"
            aria-label={isEnglish ? "Switch to Korean" : "Switch to English"}
          >
            <span aria-hidden>{isEnglish ? "KO" : "EN"}</span>
          </button>
            <button
              type="button"
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors hover:bg-primary/10"
              aria-label={isEnglish ? "Like" : "좋아요"}
              aria-pressed={isLiked}
              onClick={toggleLike}
            >
              <Heart
                className={`h-5 w-5 transition-colors ${
                  isLiked ? "fill-rose-500 text-rose-500" : "text-slate-800"
                }`}
                strokeWidth={2}
              />
            </button>
            <button
              type="button"
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors hover:bg-primary/10"
              aria-label={isEnglish ? "Share" : "공유하기"}
              onClick={() => void handleShareDesign()}
            >
              <Share2 className="h-5 w-5 text-slate-800" />
            </button>
          </div>
        </nav>

        <main className="px-4 pb-32 pt-4">{main}</main>

        <div className="fixed bottom-16 left-0 right-0 z-40 mx-auto w-full max-w-md border-t border-gray-100/80 bg-white/95 px-4 py-3 backdrop-blur-sm">
          <div className="grid grid-cols-[7fr_13fr] gap-2.5">
            <button
              type="button"
              className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl border border-orange-200/90 bg-white px-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-orange-50/40 active:scale-[0.97]"
              aria-pressed={isSaved}
              onClick={toggleSave}
            >
              <Bookmark
                className={`h-4 w-4 shrink-0 ${isSaved ? "fill-orange-500 text-orange-500" : "text-orange-500"}`}
                strokeWidth={2}
              />
              <span className="truncate">
                {isSaved ? (isEnglish ? "Saved" : "저장됨") : isEnglish ? "Save" : "저장하기"}
              </span>
            </button>
            <button
              type="button"
              className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-orange-500 px-2.5 text-sm font-bold text-white shadow-md shadow-orange-900/25 transition hover:bg-orange-600 active:scale-95"
              onClick={() => void handleShareDesign()}
            >
              <Share2 className="h-5 w-5 shrink-0 text-white" strokeWidth={2} aria-hidden />
              <span className="min-w-0 text-center leading-tight">
                {isEnglish ? "Share Design" : "네일 디자인 공유"}
              </span>
            </button>
          </div>
        </div>

        {showLoginModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
              <h3 className="text-[22px] font-bold tracking-tight text-gray-900">
                {isEnglish ? "Login required ✨" : "로그인이 필요해요 ✨"}
              </h3>
              <p className="mt-2 text-[14px] text-gray-500">
                {isEnglish ? "Would you like to save your favorite nail styles?" : "나만의 네일 스타일을 모아보시겠어요?"}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                >
                  {isEnglish ? "Cancel" : "취소"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    navigate("/login");
                  }}
                  className="rounded-xl bg-[#FF7E67] px-4 py-3 text-[14px] font-bold text-white transition-colors hover:bg-[#f2664c]"
                >
                  {isEnglish ? "Go to Login" : "로그인하러 가기"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {showShareToast ? (
          <div className="pointer-events-none fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-black/80 px-6 py-2.5 text-center text-[14px] font-medium text-white shadow-lg backdrop-blur-sm break-keep">
            {isEnglish
              ? "Link copied! Share it with your friends ✨"
              : "링크가 복사되었어요! 친구에게 공유해 보세요 ✨"}
          </div>
        ) : null}
      </div>
    </div>
  );

  if (isLoading && !displayRow) {
    return pageShell(
      <div aria-busy="true" aria-label={isEnglish ? "Loading nail details" : "네일 상세 로딩 중"}>
        <div className="aspect-[4/5] w-full animate-pulse rounded-3xl bg-gray-100 shadow-xl shadow-primary/5" />

        <div className="mt-5 flex flex-col gap-3">
          <div className="h-8 w-4/5 animate-pulse rounded bg-gray-100" />
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
            <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
            <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="rounded-2xl border border-gray-50 bg-white p-5 shadow-sm">
            <div className="h-3 w-28 animate-pulse rounded bg-gray-100" />
            <div className="mt-5 space-y-2 pl-5">
              <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={`detail-tag-skel-${index}`} className="h-8 w-20 animate-pulse rounded-full bg-gray-100" />
          ))}
        </div>

        <section className="mt-10 font-sans">
          <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-100" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={`detail-point-skel-${index}`} className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white p-4">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-gray-100" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3.5 w-full animate-pulse rounded bg-gray-100" />
                  <div className="h-3.5 w-2/3 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 w-full font-sans antialiased">
          <div className="flex w-full items-center justify-between border-b border-gray-200 py-3">
            <div className="h-6 w-44 animate-pulse rounded bg-gray-100" />
            <div className="h-5 w-5 animate-pulse rounded bg-gray-100" />
          </div>
        </div>

        <section className="mt-10 overflow-hidden">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-6 w-40 animate-pulse rounded bg-gray-100" />
            <div className="h-5 w-14 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="min-w-0 -mx-4 flex gap-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={`similar-nail-skel-${index}`} className="flex min-w-[140px] max-w-[140px] flex-col items-center gap-2">
                <div className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-gray-100" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </section>
      </div>,
    );
  }

  if (!displayRow) {
    const message = error?.trim() || "데이터를 찾을 수 없습니다.";
    return pageShell(
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
        <p className="text-sm leading-relaxed text-slate-600">{message}</p>
        <button
          type="button"
          className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
          onClick={() => navigate("/")}
        >
          {isEnglish ? "Go Home" : "홈으로 가기"}
        </button>
      </div>,
    );
  }

  const imageSrc = displayRow.image_url?.trim() || "";

  return pageShell(
    <>
      <div
        className="relative aspect-[4/5] w-full select-none overflow-hidden rounded-3xl bg-primary/5 shadow-xl shadow-primary/5 touch-manipulation"
        onTouchEnd={handleMainImageTouchEnd}
        role="presentation"
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={displayTitle}
            className="mx-auto block h-full w-full object-cover object-center"
            draggable={false}
            onDoubleClick={handleMainImageDoubleClick}
            decoding="async"
          />
        ) : (
          <div className="mx-auto block aspect-[4/5] w-full animate-pulse bg-gray-100" aria-hidden />
        )}
        {showFloatingHeart ? (
          <div
            key={floatingHeartKey}
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
            aria-hidden
          >
            <Heart
              className="h-28 w-28 animate-detail-double-tap-heart fill-rose-500 text-rose-500 drop-shadow-2xl"
              strokeWidth={1.5}
              aria-hidden
            />
          </div>
        ) : null}
        <button
          type="button"
          className="absolute bottom-3 right-3 z-10 rounded-full bg-black/45 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          onClick={() => setIsZoomOpen(true)}
          aria-label="이미지 확대"
        >
          <Search className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        </button>
      </div>
      {isZoomOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
          onClick={() => setIsZoomOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="이미지 확대 보기"
        >
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            className="absolute right-4 top-4 z-[110] flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="확대 이미지 닫기"
          >
            <X className="h-7 w-7" strokeWidth={2.5} />
          </button>
          <div
            className="h-full w-full overflow-auto [touch-action:pan-x_pan-y_pinch-zoom]"
            onClick={(e) => e.stopPropagation()}
          >
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={displayTitle}
                className="mx-auto my-auto block h-auto min-h-full w-auto max-w-none object-contain"
                draggable={false}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3">
        <h1 className="text-left text-2xl font-bold tracking-tight text-gray-900 break-keep font-sans antialiased">
          {displayTitle}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <button
            type="button"
            onClick={toggleLike}
            className="inline-flex items-center gap-1.5 rounded-lg py-0.5 pr-1 transition-colors hover:bg-gray-100/80"
            aria-pressed={isLiked}
            aria-label={isEnglish ? "Like" : "좋아요"}
          >
            <Heart
              className={`h-4 w-4 shrink-0 transition-colors ${
                isLiked ? "fill-rose-500 text-rose-500" : "text-gray-500"
              }`}
              strokeWidth={1.5}
            />
            <span>
              <span className="font-medium tabular-nums text-gray-500">{formatCount(likeDisplayCount)}</span>{" "}
              {isEnglish ? "Likes" : "좋아요"}
            </span>
          </button>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-4 w-4 shrink-0 text-indigo-400" strokeWidth={1.5} />
            <span>
              <span className="font-medium tabular-nums text-gray-500">{formatCount(views)}</span>{" "}
              {isEnglish ? "Views" : "조회"}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bookmark className="h-4 w-4 shrink-0 text-orange-500" strokeWidth={1.5} />
            <span>
              <span className="font-medium tabular-nums text-gray-500">{formatCount(saveDisplayCount)}</span>{" "}
              {isEnglish ? "Saves" : "저장"}
            </span>
          </span>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-gray-50 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Editor&apos;s Note</p>
          <div className="relative mt-3">
            <span
              className="pointer-events-none absolute -left-0.5 top-0 font-serif text-5xl leading-none text-gray-100"
              aria-hidden
            >
              &ldquo;
            </span>
            <p className="relative z-[1] break-keep whitespace-pre-line pl-5 pt-1 text-[15px] font-medium leading-loose tracking-wide text-gray-800">
              {formattedDescription}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2.5">
        {displayTags.length > 0 ? (
          displayTags.map((token, chipIdx) => {
            const bare = token.replace(/^#/, "").trim();
            const label = bare ? `#${bare}` : "#";
            return (
              <button
                key={`${token}-${chipIdx}`}
                type="button"
                onClick={() => handleTagClick(token)}
                className="cursor-pointer rounded-full bg-gray-100 px-3.5 py-1.5 text-sm font-medium tracking-tight text-gray-700 transition-colors hover:bg-gray-200"
              >
                {label}
              </button>
            );
          })
        ) : (
          <p className="text-sm text-gray-400">
            {isEnglish ? "No tags to display." : "표시할 태그가 없어요."}
          </p>
        )}
      </div>

      <section className="mt-10 font-sans">
        <h3 className="mb-4 text-lg font-bold text-slate-900">
          {isEnglish ? "Design Points" : "디자인 포인트"}
        </h3>
        {designPoints.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {designPoints.map((text, idx) => {
              const Icon = DESIGN_ICONS[idx % DESIGN_ICONS.length];
              return (
                <div
                  key={`dp-${idx}-${text.slice(0, 24)}`}
                  className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF7D66]/10 text-[#FF7D66]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-sans break-keep text-sm font-medium leading-snug tracking-tight text-gray-800">
                      {text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-6 text-center text-sm text-slate-500">
            {isEnglish ? "No design points have been added yet." : "등록된 디자인 요소가 없어요."}
          </p>
        )}
      </section>

      <div className="mt-10 w-full font-sans antialiased">
        <button
          type="button"
          onClick={() => setIsRecipeOpen(!isRecipeOpen)}
          className="flex w-full items-center justify-between border-b border-gray-200 py-3"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900">
              {isEnglish ? "Pro Styling Guide" : "네일원장님을 위한 시술 가이드"}
            </h3>
            <span className="rounded-md bg-gray-900 px-2 py-1 text-[10px] font-bold text-white">PRO</span>
          </div>
          <span
            className={`text-gray-400 transition-transform duration-300 ${isRecipeOpen ? "rotate-180" : ""}`}
          >
            <ChevronDown className="h-5 w-5" />
          </span>
        </button>

        {isRecipeOpen && (
          <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-5">
            {procedureSteps.length > 0 ? (
              <>
                <div className="space-y-5">
                  {procedureSteps.map((step, idx) => {
                    return (
                      <div key={`step-${idx}`}>
                        {idx > 0 && <div className="mb-5 h-px w-full bg-gray-200" />}
                        <div className="flex gap-3">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                            {idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-base font-bold tracking-tight text-gray-900">{step.title}</h4>
                            <p className="mt-1.5 break-keep whitespace-pre-line text-[15px] leading-relaxed tracking-tight text-gray-600">
                              {step.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 border-t border-gray-200 pt-4">
                  <div className="flex items-start gap-1.5 text-[12px] leading-relaxed text-gray-400">
                    <span className="shrink-0" aria-hidden>
                      💡
                    </span>
                    <span>
                      {isEnglish
                        ? "This guide is a design reference and may differ from actual salon procedures."
                        : "본 가이드는 참고용 디자인 레퍼런스로, 실제 시술 방식과 다를 수 있습니다."}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-sm text-gray-500">
                {isEnglish ? "No styling guide has been added yet." : "등록된 시술 가이드가 없어요."}
              </p>
            )}
          </div>
        )}
      </div>

      <section className="mt-10 overflow-hidden">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {isEnglish ? "Similar Nail Designs" : "이 디자인과 비슷한 네일"}
          </h3>
          <button
            type="button"
            className="cursor-pointer text-sm font-medium text-gray-500"
            onClick={() => navigate("/gallery")}
          >
            {isEnglish ? "See All" : "전체보기"} {">"}
          </button>
        </div>
        <div className="min-w-0 -mx-4 flex gap-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {similarDisplay.map((item) => {
            const simSrc = item.image_url?.trim() || "";
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/detail/${item.id}`)}
                className="flex min-w-[140px] max-w-[140px] flex-col items-center gap-2"
              >
                {simSrc ? (
                  <img
                    src={simSrc}
                    alt={pickLocalized(item.title, item.title_en) || (isEnglish ? "Nail" : "네일")}
                    className="aspect-[3/4] h-full w-full rounded-2xl object-cover object-center"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-gray-100" aria-hidden />
                )}
                <div className="flex w-full min-w-0 max-w-full shrink-0 justify-center">
                  <p className="w-full min-w-0 max-w-full truncate text-center text-sm font-medium tracking-tight text-gray-800 font-sans">
                    {pickLocalized(item.title, item.title_en) || (isEnglish ? "Nail Design" : "네일 디자인")}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </>,
  );
};

export default Detail;
