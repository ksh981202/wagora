import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  mapNailDesignToAdminListRow,
  type AdminNailListRow,
} from "@/features/admin-dashboard/mapNailDesignToAdminListRow";
import { resolveSourceFilename } from "@/features/admin-dashboard/resolveSourceFilename";
import { useAdminDashboard } from "@/features/admin-dashboard/useAdminDashboard";
import { RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatTextArrayForDisplay } from "@/shared/lib/formatTextArrayField";
import { toast } from "sonner";

const PAGE_SIZE = 12;

function listRowToEditForm(row: AdminNailListRow): AdminEditFormState {
  return {
    title: row.title?.trim() ?? "",
    color: row.color?.trim() ?? "",
    nail_length: row.nail_length?.trim() ?? "",
    hand_type: row.hand_type?.trim() ?? "",
    mood: row.mood?.trim() ?? "",
    situationsCsv: formatTextArrayForDisplay(row.situations),
    stylesCsv: formatTextArrayForDisplay(row.styles),
    design_technique: row.design_technique?.trim() ?? "",
    design_elements: row.design_elements?.trim() ?? "",
    description: row.description?.trim() ?? "",
    procedure_guide: row.procedure_guide?.trim() ?? "",
    title_en: row.title_en?.trim() ?? "",
    description_en: row.description_en?.trim() ?? "",
    color_en: row.color_en?.trim() ?? "",
    length_en: row.length_en?.trim() ?? "",
    hand_type_en: row.hand_type_en?.trim() ?? "",
    mood_en: row.mood_en?.trim() ?? "",
    occasion_en: formatTextArrayForDisplay(row.occasion_en),
    stylesEnCsv: formatTextArrayForDisplay(row.styles_en),
    technique_en: row.technique_en?.trim() ?? "",
    design_point_en: row.design_point_en?.trim() ?? "",
    guide_en: row.guide_en?.trim() ?? "",
  };
}

type AdminEditFormState = {
  title: string;
  color: string;
  nail_length: string;
  hand_type: string;
  mood: string;
  situationsCsv: string;
  stylesCsv: string;
  design_technique: string;
  design_elements: string;
  description: string;
  procedure_guide: string;
  title_en: string;
  description_en: string;
  color_en: string;
  length_en: string;
  hand_type_en: string;
  mood_en: string;
  occasion_en: string;
  stylesEnCsv: string;
  technique_en: string;
  design_point_en: string;
  guide_en: string;
};

function emptyEditForm(): AdminEditFormState {
  return {
    title: "",
    color: "",
    nail_length: "",
    hand_type: "",
    mood: "",
    situationsCsv: "",
    stylesCsv: "",
    design_technique: "",
    design_elements: "",
    description: "",
    procedure_guide: "",
    title_en: "",
    description_en: "",
    color_en: "",
    length_en: "",
    hand_type_en: "",
    mood_en: "",
    occasion_en: "",
    stylesEnCsv: "",
    technique_en: "",
    design_point_en: "",
    guide_en: "",
  };
}

function displayFilename(row: AdminNailListRow): string {
  const resolved =
    resolveSourceFilename(row.source_filename, row.image_r2_key) ??
    row.source_filename?.trim();
  if (resolved) return resolved;

  try {
    const u = new URL(row.image_url);
    const seg = u.pathname.split("/").filter(Boolean).pop();
    if (seg) {
      const decoded = decodeURIComponent(seg);
      const fromUrl = resolveSourceFilename(null, decoded) ?? decoded;
      if (fromUrl) return fromUrl;
    }
  } catch {
    /* ignore */
  }

  const r2Tail = row.image_r2_key?.split("/").filter(Boolean).pop()?.trim();
  return r2Tail || "—";
}

function rowStatus(row: AdminNailListRow): { label: string; tone: "ok" | "warn" } {
  if (!row.image_url?.trim()) return { label: "이미지 URL 없음", tone: "warn" };
  if (!row.id) return { label: "ID 없음", tone: "warn" };
  const category = (row.mood ?? row.color ?? "").trim();
  return { label: category || "정상 노출", tone: "ok" };
}

function filterRowsBySearch(rows: AdminNailListRow[], searchQuery: string): AdminNailListRow[] {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    const title = (row.title ?? "").toLowerCase();
    const titleEn = (row.title_en ?? "").toLowerCase();
    const fname = displayFilename(row).toLowerCase();
    const category = (row.mood ?? row.color ?? "").toLowerCase();
    return (
      title.includes(q) ||
      titleEn.includes(q) ||
      fname.includes(q) ||
      category.includes(q)
    );
  });
}

/** 1 … 중간 … 마지막 형태 (총 페이지가 많을 때) */
function paginationItems(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const s = new Set<number>();
  s.add(1);
  s.add(total);
  for (let p = current - 2; p <= current + 2; p++) {
    if (p >= 1 && p <= total) s.add(p);
  }
  const sorted = [...s].sort((a, b) => a - b);
  const out: Array<number | "ellipsis"> = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) out.push("ellipsis");
    out.push(sorted[i]!);
  }
  return out;
}

const AdminManagePage = () => {
  const {
    data: nailDesigns,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    handleDelete: deleteNailDesign,
    deletingId,
    deleteError,
    clearDeleteError,
  } = useAdminDashboard();

  const rows = useMemo(
    () => (nailDesigns ?? []).map(mapNailDesignToAdminListRow),
    [nailDesigns],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [requestedPage, setRequestedPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingListRow, setEditingListRow] = useState<AdminNailListRow | null>(null);
  const [editForm, setEditForm] = useState<AdminEditFormState>(() => emptyEditForm());
  const selectAllRef = useRef<HTMLInputElement>(null);

  const filteredRows = useMemo(() => filterRowsBySearch(rows, searchQuery), [rows, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage]);

  const pageIds = useMemo(() => paginatedRows.map((r) => r.id), [paginatedRows]);
  const selectedOnPageCount = useMemo(
    () => pageIds.filter((id) => selectedIds.has(id)).length,
    [pageIds, selectedIds],
  );
  const allOnPageSelected = pageIds.length > 0 && selectedOnPageCount === pageIds.length;

  useEffect(() => {
    const el = selectAllRef.current;
    if (!el) return;
    el.indeterminate = selectedOnPageCount > 0 && selectedOnPageCount < pageIds.length;
  }, [selectedOnPageCount, pageIds.length]);

  const closeEditSheet = useCallback(() => {
    setEditingId(null);
    setEditingListRow(null);
    setEditForm(emptyEditForm());
  }, []);

  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = pageIds.length > 0 && pageIds.every((id) => next.has(id));
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [pageIds]);

  const toggleRowSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDelete = async (row: AdminNailListRow) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    const r2Key = row.image_r2_key?.trim();
    if (!r2Key) {
      toast.error("R2 저장 키가 없어 삭제할 수 없습니다.");
      return;
    }
    clearDeleteError();
    try {
      await deleteNailDesign(row.id, r2Key);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
      toast.success("삭제되었습니다");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!window.confirm(`선택한 ${ids.length}건을 삭제하시겠습니까?`)) return;
    clearDeleteError();
    let deleted = 0;
    let failed = 0;
    const deletedIds = new Set<string>();

    for (const id of ids) {
      const row = rows.find((r) => r.id === id);
      if (!row?.image_r2_key?.trim()) {
        failed += 1;
        continue;
      }

      try {
        await deleteNailDesign(row.id, row.image_r2_key.trim(), { invalidate: false });
        deleted += 1;
        deletedIds.add(row.id);
      } catch {
        failed += 1;
      }
    }

    if (deletedIds.size > 0) {
      setSelectedIds((prev) => new Set([...prev].filter((id) => !deletedIds.has(id))));
      await refetch();
    }

    toast.success(`성공 ${deleted}건, 실패 ${failed}건`);
  };

  const openEdit = (row: AdminNailListRow) => {
    setEditingListRow(row);
    setEditingId(row.id);
    setEditForm(listRowToEditForm(row));
  };

  const saveEdit = () => {
    if (!editingId) return;
    alert("저장되었습니다");
    closeEditSheet();
  };

  const readonlyFilename = editingListRow ? displayFilename(editingListRow) : "—";

  const previewImageUrl = editingListRow?.image_url?.trim() ?? "";

  const pageList = useMemo(
    () => paginationItems(currentPage, totalPages),
    [currentPage, totalPages],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">등록 네일 관리</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Supabase wagora_lookbooks 테이블에 등록된 룩북을 검색·페이지 단위로 확인하고 수정·삭제할 수 있습니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {selectedIds.size > 0 && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="shrink-0"
            >
              <>선택 삭제 ({selectedIds.size})</>
            </Button>
          )}
          <div className="relative min-w-[10rem] max-w-xs flex-1 sm:min-w-[14rem]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="제목·영문 제목·파일명 검색"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setRequestedPage(1);
              }}
              className="h-10 border-slate-200 pl-9"
              aria-label="검색"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-slate-200"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            새로고침
          </Button>
        </div>
      </div>

      {deleteError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {deleteError}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-slate-500">목록을 불러오는 중…</p>
        ) : isError ? (
          <p className="py-16 text-center text-sm text-red-600">
            {error instanceof Error ? error.message : "목록을 불러오지 못했습니다."}
          </p>
        ) : rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">등록된 네일이 없습니다.</p>
        ) : (
          <>
            {filteredRows.length === 0 ? (
              <p className="py-16 text-center text-sm text-slate-500">검색 결과가 없습니다.</p>
            ) : (
              <>
                <div className="overflow-x-hidden">
                  <table className="w-full table-fixed border-collapse text-left text-sm">
                    <colgroup>
                      <col className="w-12" />
                      <col className="w-20" />
                      <col className="w-1/4" />
                      <col />
                      <col className="w-24" />
                      <col className="w-32" />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-1 py-2.5 text-center sm:px-2">
                          <input
                            ref={selectAllRef}
                            type="checkbox"
                            checked={allOnPageSelected}
                            onChange={toggleSelectAllOnPage}
                            disabled={pageIds.length === 0}
                            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                            aria-label="현재 페이지 전체 선택"
                          />
                        </th>
                        <th className="whitespace-nowrap px-2 py-2.5 text-left">썸네일</th>
                        <th className="whitespace-nowrap px-2 py-2.5 text-left">파일명</th>
                        <th className="min-w-0 px-2 py-2.5 text-left">썸네일 제목</th>
                        <th className="min-w-0 px-2 py-2.5 text-left">상태</th>
                        <th className="whitespace-nowrap px-2 py-2.5 text-right">작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.map((row) => {
                        const status = rowStatus(row);
                        const checked = selectedIds.has(row.id);
                        return (
                          <tr key={row.id} className="border-b border-slate-50 last:border-0">
                            <td className="px-1 py-2.5 text-center align-middle sm:px-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleRowSelected(row.id)}
                                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                                aria-label={`선택: ${row.title || row.id}`}
                              />
                            </td>
                            <td className="px-2 py-2.5 align-middle">
                              <div
                                className="mx-auto block h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:h-14 sm:w-14"
                                aria-hidden={!row.image_url?.trim()}
                              >
                                {row.image_url?.trim() ? (
                                  <a
                                    href={row.image_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block h-full w-full"
                                    title="원본 이미지 새 창에서 보기"
                                  >
                                    <img
                                      src={row.image_url}
                                      alt=""
                                      className="h-full w-full object-cover object-center"
                                      loading="lazy"
                                    />
                                  </a>
                                ) : null}
                              </div>
                            </td>
                            <td className="max-w-[120px] min-w-0 truncate px-2 py-2.5 align-middle font-mono text-xs text-slate-700 sm:max-w-[150px]">
                              <span className="block truncate" title={displayFilename(row)}>
                                {displayFilename(row)}
                              </span>
                            </td>
                            <td className="max-w-[150px] min-w-0 px-2 py-2.5 align-middle text-slate-900 md:max-w-[220px]">
                              <span
                                className="block truncate font-medium"
                                title={row.title?.trim() || "(제목 없음)"}
                              >
                                {row.title?.trim() || "(제목 없음)"}
                              </span>
                              {row.title_en != null && String(row.title_en).trim() !== "" ? (
                                <div
                                  className="mt-0.5 truncate text-sm text-gray-400"
                                  title={String(row.title_en).trim()}
                                >
                                  {String(row.title_en).trim()}
                                </div>
                              ) : null}
                            </td>
                            <td className="min-w-0 px-2 py-2.5 align-middle">
                              <div className="flex min-w-0 flex-wrap items-center">
                                <span
                                  title={status.label}
                                  className={
                                    status.tone === "ok"
                                      ? "inline-block max-w-full truncate rounded-full bg-emerald-50 px-2 py-0.5 text-left text-xs font-medium text-emerald-800"
                                      : "inline-block max-w-full truncate rounded-full bg-amber-50 px-2 py-0.5 text-left text-xs font-medium text-amber-900"
                                  }
                                >
                                  {status.label}
                                </span>
                                {row.title_en != null && String(row.title_en).trim() !== "" ? (
                                  <span
                                    className="ml-2 shrink-0 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-600"
                                    title="영문 제목 있음"
                                  >
                                    EN
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-1 py-2.5 align-middle text-right sm:px-2">
                              <div className="flex flex-nowrap items-center justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 shrink-0 border-slate-200 px-2 text-xs"
                                  onClick={() => openEdit(row)}
                                >
                                  수정
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="h-8 shrink-0 px-2 text-xs"
                                  disabled={deletingId === row.id}
                                  onClick={() => void handleDelete(row)}
                                >
                                  삭제
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-1 border-t border-slate-100 px-4 py-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-w-[4rem] border-slate-200"
                      disabled={currentPage <= 1}
                      onClick={() => setRequestedPage((p) => Math.max(1, p - 1))}
                    >
                      이전
                    </Button>
                    <div className="flex flex-wrap items-center justify-center gap-1 px-2">
                      {pageList.map((item, idx) =>
                        item === "ellipsis" ? (
                          <span
                            key={`e-${idx}`}
                            className="px-2 text-sm text-slate-400"
                            aria-hidden
                          >
                            …
                          </span>
                        ) : (
                          <Button
                            key={item}
                            type="button"
                            variant={item === currentPage ? "default" : "outline"}
                            size="sm"
                            className={
                              item === currentPage
                                ? "h-9 min-w-9 px-2"
                                : "h-9 min-w-9 border-slate-200 px-2"
                            }
                            onClick={() => setRequestedPage(item)}
                          >
                            {item}
                          </Button>
                        ),
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-w-[4rem] border-slate-200"
                      disabled={currentPage >= totalPages}
                      onClick={() => setRequestedPage((p) => Math.min(totalPages, p + 1))}
                    >
                      다음
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {rows.length > 0 && (
        <p className="mt-4 text-center text-xs text-slate-500">
          {searchQuery.trim()
            ? `검색 결과 ${filteredRows.length}건 (전체 ${rows.length}건)`
            : `총 ${rows.length}건`}
          {filteredRows.length > 0 && (
            <span className="text-slate-400"> · {PAGE_SIZE}건씩</span>
          )}
        </p>
      )}

      <Sheet
        open={editingId !== null}
        onOpenChange={(open) => {
          if (!open) closeEditSheet();
        }}
      >
        <SheetContent
          side="right"
          className="flex h-full !w-[90vw] !max-w-6xl flex-col gap-0 overflow-hidden border-l p-0 sm:!max-w-6xl"
        >
          <SheetHeader className="shrink-0 space-y-1 border-b border-slate-200 px-6 py-4 text-left">
            <SheetTitle>네일 전체 상세 수정</SheetTitle>
            <SheetDescription>
              사용자 앱은 기본 한글 노출을 유지하고, 관리자에서만 한글·영문 메타를 함께 편집합니다. 파일명은 읽기 전용이며, 저장 시 한글·영문 필드가 한 번에 반영됩니다.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {editingListRow && (
              <div className="space-y-5">
                <div className="flex justify-center border-b border-slate-100 pb-4">
                  <a
                    href={previewImageUrl || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="block h-28 w-28 overflow-hidden rounded-xl border border-slate-200 bg-slate-200 shadow-sm sm:h-32 sm:w-32"
                  >
                    {previewImageUrl ? (
                      <img
                        src={previewImageUrl}
                        alt=""
                        className="h-full w-full object-cover object-center"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500">
                        이미지 없음
                      </div>
                    )}
                  </a>
                </div>

                {/* 좌·우 두 덩어리만: 항상 2열 (좁은 화면은 가로 스크롤) */}
                <div className="min-w-0 overflow-x-auto pb-1">
                  <div className="grid min-w-[720px] grid-cols-2 gap-8">
                    {/* 🇰🇷 한국어 전용 */}
                    <div className="min-w-0 space-y-5">
                      <h3 className="border-b border-slate-200 pb-2 text-base font-semibold text-slate-900">
                        🇰🇷 한국어 (원본)
                      </h3>
                      <div className="space-y-1.5">
                        <Label className="text-slate-700">파일명</Label>
                        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600 break-all">
                          {readonlyFilename}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-title" className="text-slate-700">
                          썸네일 제목
                        </Label>
                        <Input
                          id="admin-edit-title"
                          value={editForm.title}
                          onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-color" className="text-slate-700">
                          컬러
                        </Label>
                        <Input
                          id="admin-edit-color"
                          value={editForm.color}
                          onChange={(e) => setEditForm((f) => ({ ...f, color: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-nail-length" className="text-slate-700">
                          손톱 길이
                        </Label>
                        <Input
                          id="admin-edit-nail-length"
                          value={editForm.nail_length}
                          onChange={(e) => setEditForm((f) => ({ ...f, nail_length: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-hand-type" className="text-slate-700">
                          추천 손타입
                        </Label>
                        <Input
                          id="admin-edit-hand-type"
                          value={editForm.hand_type}
                          onChange={(e) => setEditForm((f) => ({ ...f, hand_type: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-mood" className="text-slate-700">
                          무드 / 분위기
                        </Label>
                        <Input
                          id="admin-edit-mood"
                          value={editForm.mood}
                          onChange={(e) => setEditForm((f) => ({ ...f, mood: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-situations" className="text-slate-700">
                          상황
                        </Label>
                        <Input
                          id="admin-edit-situations"
                          value={editForm.situationsCsv}
                          onChange={(e) => setEditForm((f) => ({ ...f, situationsCsv: e.target.value }))}
                          placeholder="쉼표로 구분 (예: 데이트, 오피스)"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-styles" className="text-slate-700">
                          스타일 태그 (한글 · DB styles)
                        </Label>
                        <Input
                          id="admin-edit-styles"
                          value={editForm.stylesCsv}
                          onChange={(e) => setEditForm((f) => ({ ...f, stylesCsv: e.target.value }))}
                          placeholder="쉼표로 구분 (예: 글리터, 프렌치)"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-technique" className="text-slate-700">
                          디자인 / 기법
                        </Label>
                        <Input
                          id="admin-edit-technique"
                          value={editForm.design_technique}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, design_technique: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-elements" className="text-slate-700">
                          디자인 요소
                        </Label>
                        <Input
                          id="admin-edit-elements"
                          value={editForm.design_elements}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, design_elements: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-description" className="text-slate-700">
                          상세 설명
                        </Label>
                        <Textarea
                          id="admin-edit-description"
                          value={editForm.description}
                          onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                          className="min-h-[240px] h-[240px] w-full resize-y text-sm leading-relaxed"
                          rows={12}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-procedure" className="text-slate-700">
                          시술 가이드
                        </Label>
                        <Textarea
                          id="admin-edit-procedure"
                          value={editForm.procedure_guide}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, procedure_guide: e.target.value }))
                          }
                          className="min-h-[240px] h-[240px] w-full resize-y text-sm leading-relaxed"
                          rows={12}
                        />
                      </div>
                    </div>

                    {/* 🇺🇸 English 전용 */}
                    <div className="min-w-0 space-y-5">
                      <h3 className="border-b border-blue-100 pb-2 text-base font-semibold text-blue-900">
                        🇺🇸 English
                      </h3>
                      {/* 왼쪽 «파일명» 블록 높이에 맞춤 (영문 컬럼 없음) */}
                      <div className="space-y-1.5" aria-hidden>
                        <Label className="pointer-events-none select-none text-transparent">파일명</Label>
                        <div className="min-h-[2.75rem] rounded-md border border-transparent bg-transparent px-3 py-2" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-title-en" className="text-slate-600">
                          Thumbnail title · title_en
                        </Label>
                        <Input
                          id="admin-edit-title-en"
                          value={editForm.title_en}
                          onChange={(e) => setEditForm((f) => ({ ...f, title_en: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-color-en" className="text-slate-600">
                          Color · color_en
                        </Label>
                        <Input
                          id="admin-edit-color-en"
                          value={editForm.color_en}
                          onChange={(e) => setEditForm((f) => ({ ...f, color_en: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-length-en" className="text-slate-600">
                          Nail length · length_en
                        </Label>
                        <Input
                          id="admin-edit-length-en"
                          value={editForm.length_en}
                          onChange={(e) => setEditForm((f) => ({ ...f, length_en: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-hand-type-en" className="text-slate-600">
                          Hand type · hand_type_en
                        </Label>
                        <Input
                          id="admin-edit-hand-type-en"
                          value={editForm.hand_type_en}
                          onChange={(e) => setEditForm((f) => ({ ...f, hand_type_en: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-mood-en" className="text-slate-600">
                          Mood · mood_en
                        </Label>
                        <Input
                          id="admin-edit-mood-en"
                          value={editForm.mood_en}
                          onChange={(e) => setEditForm((f) => ({ ...f, mood_en: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-occasion-en" className="text-slate-600">
                          Occasion · occasion_en
                        </Label>
                        <Input
                          id="admin-edit-occasion-en"
                          value={editForm.occasion_en}
                          onChange={(e) => setEditForm((f) => ({ ...f, occasion_en: e.target.value }))}
                          placeholder="e.g. Wedding, Office (free text)"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-styles-en" className="text-slate-600">
                          Style tags · styles_en
                        </Label>
                        <Input
                          id="admin-edit-styles-en"
                          value={editForm.stylesEnCsv}
                          onChange={(e) => setEditForm((f) => ({ ...f, stylesEnCsv: e.target.value }))}
                          placeholder="e.g. Black, Short oval, Chic, Date"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-technique-en" className="text-slate-600">
                          Design technique · technique_en
                        </Label>
                        <Input
                          id="admin-edit-technique-en"
                          value={editForm.technique_en}
                          onChange={(e) => setEditForm((f) => ({ ...f, technique_en: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-design-point-en" className="text-slate-600">
                          Design point · design_point_en
                        </Label>
                        <Input
                          id="admin-edit-design-point-en"
                          value={editForm.design_point_en}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, design_point_en: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-description-en" className="text-slate-600">
                          Description · description_en
                        </Label>
                        <Textarea
                          id="admin-edit-description-en"
                          value={editForm.description_en}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, description_en: e.target.value }))
                          }
                          className="min-h-[240px] h-[240px] w-full resize-y text-sm leading-relaxed"
                          rows={12}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-guide-en" className="text-slate-600">
                          Procedure guide · guide_en
                        </Label>
                        <Textarea
                          id="admin-edit-guide-en"
                          value={editForm.guide_en}
                          onChange={(e) => setEditForm((f) => ({ ...f, guide_en: e.target.value }))}
                          className="min-h-[240px] h-[240px] w-full resize-y text-sm leading-relaxed"
                          rows={12}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="shrink-0 gap-2 border-t border-slate-200 bg-background px-6 py-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={closeEditSheet}
            >
              취소
            </Button>
            <Button type="button" onClick={saveEdit}>
              저장
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminManagePage;
