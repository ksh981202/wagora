import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { supabase } from "@/shared/api/supabaseClient";

const TYPE_LABEL: Record<string, string> = {
  notice: "공지사항",
  faq: "FAQ",
  terms: "이용약관",
  privacy: "개인정보처리방침",
  magazine_editor: "매거진 - 에디터 픽",
  magazine_brand: "매거진 - 브랜드 픽",
  magazine_shopping: "매거진 - 쇼핑",
};

const SHOPPING_SUB_CATEGORIES = [
  { value: "", label: "전체" },
  { value: "젤·네일팁", label: "젤·네일팁" },
  { value: "파츠·스톤", label: "파츠·스톤" },
  { value: "기기·도구", label: "기기·도구" },
  { value: "영양·리무버", label: "영양·리무버" },
  { value: "초보자 세트", label: "초보자 세트" },
];

type BoardPostRow = {
  id: string;
  post_type: string | null;
  title: string | null;
  content: string | null;
  title_en: string | null;
  content_en: string | null;
  thumbnail_url: string | null;
  external_link: string | null;
  external_link_en: string | null;
  sub_category: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

type QuillEditor = {
  getSelection: () => { index: number } | null;
  getLength: () => number;
  insertEmbed: (index: number, type: "image", value: string) => void;
  setSelection: (index: number, length?: number) => void;
};

async function fetchBoardPosts(): Promise<BoardPostRow[]> {
  const { data, error } = await supabase
    .from("wagora_lookbooks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as BoardPostRow[];
}

function formatCreatedAt(raw: string | null): string {
  if (!raw) return "-";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function AdminBoard() {
  const quillRefKR = useRef<ReactQuill>(null);
  const quillRefEN = useRef<ReactQuill>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState("notice");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [externalLinkEn, setExternalLinkEn] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [rows, setRows] = useState<BoardPostRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const nextRows = await fetchBoardPosts();
      setRows(nextRows);
    } catch (error) {
      console.error("게시글 목록 조회 실패:", error);
      setErrorMessage("게시글 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const nextRows = await fetchBoardPosts();
        if (!cancelled) setRows(nextRows);
      } catch (error) {
        console.error("게시글 목록 조회 실패:", error);
        if (!cancelled) setErrorMessage("게시글 목록을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const resetForm = () => {
    setType("notice");
    setTitle("");
    setContent("");
    setTitleEn("");
    setContentEn("");
    setThumbnailUrl("");
    setExternalLink("");
    setExternalLinkEn("");
    setSubCategory("");
    setIsActive(true);
  };

  const handleTypeChange = (nextType: string) => {
    setType(nextType);
    if (nextType !== "magazine_shopping") {
      setSubCategory("");
    }
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent) {
      setErrorMessage("제목 (KR)과 본문 (KR)을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const payload = {
      post_type: type,
      title: trimmedTitle,
      content: trimmedContent,
      title_en: titleEn.trim(),
      content_en: contentEn.trim(),
      thumbnail_url: thumbnailUrl,
      external_link: externalLink,
      external_link_en: externalLinkEn,
      sub_category: subCategory,
      is_active: isActive,
    };

    const { error } = editingId
      ? await supabase.from("wagora_lookbooks").update(payload).eq("id", editingId)
      : await supabase.from("wagora_lookbooks").insert([payload]);

    if (error) {
      console.error(editingId ? "게시글 수정 실패:" : "게시글 등록 실패:", error);
      setErrorMessage(editingId ? "게시글 수정에 실패했습니다." : "게시글 등록에 실패했습니다.");
      setIsSubmitting(false);
      return;
    }

    resetForm();
    setEditingId(null);
    await loadPosts();
    setIsSubmitting(false);
  };

  const handleEditClick = (row: BoardPostRow) => {
    setType(row.post_type || "notice");
    setTitle(row.title || "");
    setContent(row.content || "");
    setTitleEn(row.title_en || "");
    setContentEn(row.content_en || "");
    setThumbnailUrl(row.thumbnail_url || "");
    setExternalLink(row.external_link || "");
    setExternalLinkEn(row.external_link_en || "");
    setSubCategory(row.sub_category || "");
    setIsActive(Boolean(row.is_active));
    setEditingId(row.id);
    setErrorMessage("");
    window.scrollTo(0, 0);
  };

  const handleCancelEdit = () => {
    resetForm();
    setEditingId(null);
    setErrorMessage("");
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = window.confirm("정말 삭제하시겠습니까?");
    if (!isConfirmed) return;

    setErrorMessage("");
    try {
      const { error } = await supabase.from("wagora_lookbooks").delete().eq("id", id);
      if (error) throw error;
      if (editingId === id) {
        resetForm();
        setEditingId(null);
      }
      alert("삭제되었습니다.");
      await loadPosts();
    } catch (error: unknown) {
      console.error(error);
      setErrorMessage("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleThumbnailUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingThumbnail(true);
    setErrorMessage("");

    try {
      const safeFileName = file.name.replace(/\s+/g, "_");
      const filePath = `thumbnail/${Date.now()}_${safeFileName}`;
      const { data, error } = await supabase.storage
        .from("nail_images")
        .upload(filePath, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("nail_images")
        .getPublicUrl(data.path);

      setThumbnailUrl(publicUrlData.publicUrl);
    } catch (error) {
      console.error("대표 썸네일 업로드 실패:", error);
      const uploadError = error as { message?: string; toString?: () => string } | null | undefined;
      setErrorMessage("썸네일 업로드 실패: " + (uploadError?.message || uploadError?.toString?.() || "알 수 없는 오류"));
    } finally {
      setIsUploadingThumbnail(false);
      event.target.value = "";
    }
  };

  const imageHandler = useCallback(function (this: { quill?: QuillEditor }) {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setIsUploadingImage(true);
      setErrorMessage("");

      try {
        const filePath = `board/${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from("nail_images")
          .upload(filePath, file);

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from("nail_images")
          .getPublicUrl(data.path);

        const activeElement = document.activeElement;
        const krEditor = quillRefKR.current?.getEditor() as QuillEditor | undefined;
        const enEditor = quillRefEN.current?.getEditor() as QuillEditor | undefined;
        const editor =
          this.quill ??
          (activeElement && quillRefEN.current?.editor?.root?.contains(activeElement)
            ? enEditor
            : krEditor);

        if (!editor) return;

        const range = editor.getSelection();
        const index = range?.index ?? Math.max(editor.getLength() - 1, 0);
        editor.insertEmbed(index, "image", publicUrlData.publicUrl);
        editor.setSelection(index + 1, 0);
      } catch (error) {
        console.error("게시판 이미지 업로드 실패:", error);
        const uploadError = error as { message?: string; toString?: () => string } | null | undefined;
        setErrorMessage("에디터 이미지 업로드 실패: " + (uploadError?.message || uploadError?.toString?.() || "알 수 없는 오류"));
      } finally {
        setIsUploadingImage(false);
      }
    };
  }, []);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          ["image"],
        ],
        handlers: {
          image: imageHandler,
        },
      },
    }),
    [imageHandler],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 bg-slate-50 min-h-screen">
      <h2 className="text-xl font-bold text-slate-900">고객센터 글 등록</h2>
      <p className="mt-1 text-sm text-slate-500">
        공지·FAQ·약관·개인정보 처리방침을 한국어와 영어로 등록하고 관리합니다.
      </p>

      <div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-2">
          <label htmlFor="board-type" className="text-sm font-semibold text-gray-700">카테고리</label>
          <select
            id="board-type"
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="h-10 w-full max-w-md rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-slate-500 focus:outline-none"
          >
            {Object.entries(TYPE_LABEL).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {type === "magazine_shopping" ? (
          <div className="grid gap-2">
            <label htmlFor="board-sub-category" className="text-sm font-semibold text-gray-700">쇼핑 서브 카테고리</label>
            <select
              id="board-sub-category"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="h-10 w-full max-w-md rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-slate-500 focus:outline-none"
            >
              {SHOPPING_SUB_CATEGORIES.map((category) => (
                <option key={category.value || "all"} value={category.value}>{category.label}</option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="grid gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => thumbnailInputRef.current?.click()}
              disabled={isUploadingThumbnail}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {isUploadingThumbnail ? "대표 썸네일 업로드 중..." : "대표 썸네일 등록"}
            </button>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handleThumbnailUpload(event)}
            />
            {thumbnailUrl ? (
              <button
                type="button"
                onClick={() => setThumbnailUrl("")}
                className="text-sm font-medium text-rose-500 hover:text-rose-600"
              >
                썸네일 제거
              </button>
            ) : null}
          </div>
          {thumbnailUrl ? (
            <div className="flex items-center gap-3">
              <img
                src={thumbnailUrl}
                alt="대표 썸네일 미리보기"
                className="h-24 w-24 rounded-md border border-slate-200 bg-white object-cover"
              />
              <p className="break-all text-xs text-slate-500">{thumbnailUrl}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">매거진 카드 등에 노출할 대표 이미지를 등록할 수 있습니다.</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-lg border border-slate-100 bg-slate-50/60 p-4">
            <h3 className="text-sm font-bold text-slate-900">한국어 원본</h3>
            <div className="grid gap-2">
              <label htmlFor="board-title" className="text-sm font-semibold text-gray-700">제목 (KR)</label>
              <input
                id="board-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="board-external-link" className="text-sm font-semibold text-gray-700">외부 링크 (KR - 쿠팡 등)</label>
              <input
                id="board-external-link"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://..."
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="board-content" className="text-sm font-semibold text-gray-700">본문 (KR)</label>
              <ReactQuill
                ref={quillRefKR}
                value={content}
                onChange={setContent}
                modules={modules}
                placeholder="본문을 작성하세요."
                className="h-64 mb-12 bg-white"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-blue-100 bg-blue-50/40 p-4">
            <h3 className="text-sm font-bold text-slate-900">영어 번역</h3>
            <div className="grid gap-2">
              <label htmlFor="board-title-en" className="text-sm font-semibold text-gray-700">제목 (EN)</label>
              <input
                id="board-title-en"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Enter the English title"
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="board-external-link-en" className="text-sm font-semibold text-gray-700">외부 링크 (EN - 아마존 등)</label>
              <input
                id="board-external-link-en"
                value={externalLinkEn}
                onChange={(e) => setExternalLinkEn(e.target.value)}
                placeholder="https://..."
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="board-content-en" className="text-sm font-semibold text-gray-700">본문 (EN)</label>
              <ReactQuill
                ref={quillRefEN}
                value={contentEn}
                onChange={setContentEn}
                modules={modules}
                placeholder="Enter the English content."
                className="h-64 mb-12 bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" className="peer sr-only" checked={isActive} onChange={() => setIsActive(!isActive)} />
            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-slate-900 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">노출 (앱에서 보이기)</span>
          </label>
        </div>

        {errorMessage ? (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{errorMessage}</p>
        ) : null}
        {isUploadingImage ? (
          <p className="rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600">이미지를 업로드하는 중입니다.</p>
        ) : null}
        {isUploadingThumbnail ? (
          <p className="rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600">대표 썸네일을 업로드하는 중입니다.</p>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-4">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || isUploadingImage || isUploadingThumbnail}
            className="rounded-md bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? (editingId ? "수정 중..." : "등록 중...") : editingId ? "수정하기" : "등록하기"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
              className="rounded-md border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              취소
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-900">게시글 목록</h2>
        <button
          type="button"
          onClick={() => void loadPosts()}
          disabled={isLoading}
          className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {isLoading ? "불러오는 중..." : "새로고침"}
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">유형</th>
              <th className="px-4 py-3">제목</th>
              <th className="px-4 py-3">노출</th>
              <th className="px-4 py-3">등록일</th>
              <th className="px-4 py-3 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  게시글을 불러오는 중입니다.
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  등록된 게시글이 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const postType = row.post_type ?? "";
                const titleText = row.title?.trim() || "(제목 없음)";
                const hasEnglishTitle = Boolean(row.title_en?.trim());
                return (
                  <tr key={row.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-700">{TYPE_LABEL[postType] ?? postType}</td>
                    <td className="max-w-[280px] truncate px-4 py-3 text-slate-900" title={titleText}>
                      {titleText}
                      {hasEnglishTitle ? (
                        <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-600">[EN]</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${row.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {row.is_active ? "Y" : "N"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {formatCreatedAt(row.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditClick(row)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                          aria-label="수정"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(row.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          aria-label="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
