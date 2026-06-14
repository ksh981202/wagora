import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  ImageIcon,
  Loader2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { mapV1CsvRowsToDesignRows } from "@/features/admin-upload/mapV1CsvRow";
import { useAdminUpload } from "@/features/admin-upload/useAdminUpload";

/**
 * 권장 헤더 순서 (총 22개).
 * 엑셀에서 열 이름이 조금 달라도 pickCsvField 별칭·영문 스네이크 케이스로 매칭합니다.
 */
const CSV_COLUMN_LABELS = [
  "파일명",
  "썸네일 제목",
  "썸네일 제목(EN)",
  "상세 설명",
  "상세 설명(EN)",
  "컬러",
  "컬러(EN)",
  "손톱길이",
  "손톱 길이(EN)",
  "추천 손타입",
  "추천 손타입(EN)",
  "무드/분위기",
  "무드/분위기(EN)",
  "상황",
  "상황(EN)",
  "스타일 태그(EN)",
  "디자인/기법",
  "디자인/기법(EN)",
  "디자인 요소 (또는 디자인 포인트)",
  "디자인 요소(EN)",
  "시술 가이드",
  "시술 가이드(EN)",
] as const;

type CsvRow = Record<string, string>;

type PreviewRow = {
  index: number;
  filename: string;
  title: string;
  matched: boolean;
  file: File | null;
  objectUrl: string | null;
  raw: CsvRow;
};

function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, "");
}

/**
 * Papa Parse: 엑셀보내기·따옴표·BOM·빈 줄이 섞인 CSV에서도 헤더를 안정적으로 인식합니다.
 */
function parseCsvRowsWithPapa(text: string): {
  headers: string[];
  rows: CsvRow[];
  fatalMessage: string | null;
} {
  const parsed = Papa.parse<Record<string, unknown>>(stripBom(text), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => stripBom(h).trim().replace(/\u00a0/g, " "),
    dynamicTyping: false,
  });

  const fieldsRaw = parsed.meta.fields ?? [];
  const headers = fieldsRaw
    .filter((f): f is string => f != null && String(f).trim() !== "")
    .map((f) => stripBom(String(f)).trim().replace(/\u00a0/g, " "));

  const rows: CsvRow[] = [];
  for (const rec of parsed.data) {
    if (rec == null || typeof rec !== "object") continue;
    const o: CsvRow = {};
    for (const [k, v] of Object.entries(rec)) {
      const key = stripBom(k).trim().replace(/\u00a0/g, " ");
      if (!key) continue;
      o[key] = v == null ? "" : String(v).trim();
    }
    if (Object.values(o).some((c) => c !== "")) rows.push(o);
  }

  const headerList =
    headers.length > 0 ? headers : rows[0] ? Object.keys(rows[0]) : [];

  const fatalMessage =
    parsed.errors.length > 0 && rows.length === 0
      ? parsed.errors.map((e) => e.message).join("; ")
      : null;

  return { headers: headerList, rows, fatalMessage };
}

function normalizeFilename(name: string): string {
  return name.trim();
}

function validateCsvHeaders(headers: string[]): string | null {
  const set = new Set(headers.map((h) => h.trim()));
  if (!set.has("파일명")) {
    return 'CSV에 필수 컬럼 "파일명"이 없습니다.';
  }
  return null;
}

const PREVIEW_COL_MIN = "min-w-[11rem] max-w-[22rem]";

export default function AdminUploadPage() {
  const {
    imageFiles,
    eligibleCount,
    progress,
    phase,
    uploadError,
    addImageFiles,
    clearImageFiles,
    importDesignRows,
    clearCsv: clearHookCsv,
    startUpload,
    resetUpload,
  } = useAdminUpload();

  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);

  const [dragActive, setDragActive] = useState(false);
  const [csvDragActive, setCsvDragActive] = useState(false);

  const [statusMessage, setStatusMessage] = useState("");

  const csvInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  const isUploading = phase === "uploading";
  const uploadTotal = eligibleCount;
  const uploadDone =
    uploadTotal > 0 ? Math.round((progress / 100) * uploadTotal) : 0;
  const uploadErrors = uploadError ? [uploadError] : [];

  const imageMap = useMemo(() => {
    const m = new Map<string, File>();
    for (const f of imageFiles) {
      m.set(normalizeFilename(f.name), f);
    }
    return m;
  }, [imageFiles]);

  const previewRows: PreviewRow[] = useMemo(() => {
    if (!csvRows.length) return [];
    return csvRows.map((raw, index) => {
      const filename = normalizeFilename(raw["파일명"] ?? "");
      const file = filename ? imageMap.get(filename) ?? null : null;
      const matched = Boolean(filename && file);
      const objectUrl = file ? URL.createObjectURL(file) : null;
      return {
        index,
        filename,
        title: (raw["썸네일 제목"] ?? "").trim() || "(제목 없음)",
        matched,
        file,
        objectUrl,
        raw,
      };
    });
  }, [csvRows, imageMap]);

  useEffect(() => {
    const urls = previewRows.map((p) => p.objectUrl).filter(Boolean) as string[];
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previewRows]);

  const matchedCount = useMemo(
    () => previewRows.filter((p) => p.matched).length,
    [previewRows],
  );
  const unmatchedCount = previewRows.length - matchedCount;

  const handleCsvFile = useCallback(async (file: File | null) => {
    setCsvError(null);
    setCsvRows([]);
    setCsvHeaders([]);
    setCsvFileName(null);
    clearHookCsv();
    if (!file) return;

    try {
      const text = await file.text();
      const { headers, rows, fatalMessage } = parseCsvRowsWithPapa(text);
      if (fatalMessage) {
        setCsvError(`CSV 파싱 오류: ${fatalMessage}`);
        return;
      }
      if (rows.length === 0) {
        setCsvError("CSV에 데이터 행이 없습니다.");
        return;
      }
      const err = validateCsvHeaders(headers);
      if (err) {
        setCsvError(err);
        return;
      }
      setCsvHeaders(headers);
      setCsvRows(rows);
      setCsvFileName(file.name);
      importDesignRows(mapV1CsvRowsToDesignRows(rows));
    } catch (e) {
      setCsvError(e instanceof Error ? e.message : "CSV를 읽지 못했습니다.");
    }
  }, [clearHookCsv, importDesignRows]);

  const onCsvInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    void handleCsvFile(f);
    e.target.value = "";
  };

  const onCsvDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCsvDragActive(true);
  };

  const onCsvDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCsvDragActive(false);
  };

  const onCsvDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCsvDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const lower = f.name.toLowerCase();
    const isCsv =
      lower.endsWith(".csv") || f.type === "text/csv" || f.type === "application/csv";
    if (!isCsv) {
      toast.error("CSV 파일만 업로드할 수 있습니다.");
      return;
    }
    void handleCsvFile(f);
  };

  const onImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) addImageFiles(files);
    e.target.value = "";
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files;
    if (dropped?.length) addImageFiles(dropped);
  };

  const clearImages = () => clearImageFiles();

  const canBulkUpload =
    csvRows.length > 0 &&
    imageFiles.length > 0 &&
    matchedCount > 0 &&
    !isUploading;

  const runBulkUpload = async () => {
    if (isUploading) return;
    if (csvRows.length === 0 || imageFiles.length === 0) {
      toast.error("CSV와 이미지를 모두 선택해 주세요.");
      return;
    }
    if (eligibleCount === 0) {
      toast.error("파일명이 일치하는 이미지가 있는 행이 없습니다.");
      return;
    }

    setStatusMessage("");
    const completed = await startUpload();
    if (!completed) return;

    toast.success(`${eligibleCount}건 업로드 완료`);
    setCsvRows([]);
    setCsvHeaders([]);
    setCsvFileName(null);
    setCsvError(null);
    setStatusMessage("");
    clearImageFiles();
    clearHookCsv();
    resetUpload();
  };

  useEffect(() => {
    if (phase === "error" && uploadError) {
      toast.error(uploadError);
    }
  }, [phase, uploadError]);

  const progressPercent = isUploading ? progress : uploadTotal > 0 ? 100 : 0;

  return (
    <div className="text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-10">
        <header className="mb-8 border-b border-slate-200 pb-6">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">대량 자동 업로드</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            CSV의 <code className="rounded bg-slate-200 px-1">파일명</code> 과 동일한 이름의
            이미지를 매칭·미리보기한 뒤 일괄 업로드하는 UI 템플릿입니다. 서버 연동은 비활성화되어
            있습니다.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* CSV */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-800">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold">CSV 파일</h2>
            </div>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              컬럼 (총 {CSV_COLUMN_LABELS.length}개): {CSV_COLUMN_LABELS.join(", ")}
            </p>
            <div
              role="presentation"
              onDragOver={onCsvDragOver}
              onDragLeave={onCsvDragLeave}
              onDrop={onCsvDrop}
              onClick={() => csvInputRef.current?.click()}
              className={cn(
                "mt-4 flex min-h-[140px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition",
                csvDragActive
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-300 bg-slate-50 hover:border-slate-400",
              )}
            >
              <UploadCloud className="h-8 w-8 text-slate-400" />
              <span className="mt-2 text-sm font-medium text-slate-700">
                CSV 파일을 여기에 놓거나 클릭
              </span>
            </div>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={onCsvInputChange}
            />
            {csvFileName && (
              <p className="mt-3 text-sm text-slate-600">
                선택됨: <span className="font-medium">{csvFileName}</span> ·{" "}
                <span className="text-emerald-600">{csvRows.length}행</span>
              </p>
            )}
            {csvError && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {csvError}
              </div>
            )}
            {csvHeaders.length > 0 && !csvError && (
              <div className="mt-3 max-h-24 overflow-auto rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
                감지된 헤더: {csvHeaders.join(" · ")}
              </div>
            )}
          </section>

          {/* Images */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-800">
              <ImageIcon className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold">다중 이미지</h2>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              드래그 앤 드롭 또는 클릭으로 추가 ·{" "}
              <button
                type="button"
                onClick={clearImages}
                className="text-blue-600 underline underline-offset-2"
              >
                전체 비우기
              </button>
            </p>
            <div
              role="presentation"
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => imagesInputRef.current?.click()}
              className={cn(
                "mt-4 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 transition",
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-300 bg-slate-50 hover:border-slate-400",
              )}
            >
              <UploadCloud className="h-8 w-8 text-slate-400" />
              <span className="mt-2 text-sm font-medium text-slate-700">
                이미지를 여기에 놓거나 클릭
              </span>
              <span className="mt-1 text-xs text-slate-500">여러 장 선택 가능</span>
            </div>
            <input
              ref={imagesInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onImagesChange}
            />
            <p className="mt-3 text-sm text-slate-600">
              등록된 이미지:{" "}
              <span className="font-semibold text-slate-900">{imageFiles.length}</span>장
            </p>
          </section>
        </div>

        {/* Preview */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">미리보기 · 매칭 결과</h2>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                매칭 {matchedCount}
              </span>
              {unmatchedCount > 0 && (
                <span className="flex items-center gap-1 font-medium text-red-600">
                  <XCircle className="h-4 w-4" />
                  미매칭 {unmatchedCount}
                </span>
              )}
            </div>
          </div>

          {!csvRows.length ? (
            <p className="px-5 py-12 text-center text-sm text-slate-500">
              CSV를 먼저 업로드하면 표가 표시됩니다.
            </p>
          ) : (
            <div className="max-h-[520px] overflow-y-auto overflow-x-auto [scrollbar-width:thin]">
              <table className="min-w-max w-max border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="sticky left-0 z-20 min-w-[6.5rem] whitespace-nowrap bg-slate-50/95 px-4 py-3 backdrop-blur-sm">
                      상태
                    </th>
                    <th className="sticky left-[6.5rem] z-20 min-w-[5.75rem] whitespace-nowrap border-r border-slate-200/80 bg-slate-50/95 px-4 py-3 backdrop-blur-sm">
                      썸네일
                    </th>
                    {(csvHeaders.length ? csvHeaders : [...CSV_COLUMN_LABELS]).map((h) => (
                      <th key={h} className={cn("whitespace-nowrap px-4 py-3", PREVIEW_COL_MIN)}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr
                      key={row.index}
                      className={cn(
                        "border-b border-slate-50",
                        !row.matched && "bg-red-50/60",
                      )}
                    >
                      <td
                        className={cn(
                          "sticky left-0 z-10 min-w-[6.5rem] whitespace-nowrap px-4 py-3 backdrop-blur-sm",
                          row.matched ? "bg-white/95" : "bg-red-50/95",
                        )}
                      >
                        {row.matched ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                            <CheckCircle2 className="h-3.5 w-3.5" /> 성공
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                            <AlertTriangle className="h-3.5 w-3.5" /> 미매칭
                          </span>
                        )}
                      </td>
                      <td
                        className={cn(
                          "sticky left-[6.5rem] z-10 min-w-[5.75rem] border-r border-slate-100 px-4 py-3 backdrop-blur-sm",
                          row.matched ? "bg-white/95" : "bg-red-50/95",
                        )}
                      >
                        {row.objectUrl ? (
                          <img
                            src={row.objectUrl}
                            alt=""
                            className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-cover object-center"
                          />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-100 text-xs text-slate-400">
                            없음
                          </div>
                        )}
                      </td>
                      {(csvHeaders.length ? csvHeaders : [...CSV_COLUMN_LABELS]).map((h) => {
                        const val = row.raw[h] ?? "";
                        return (
                          <td
                            key={h}
                            className={cn(
                              "align-top text-xs leading-relaxed text-slate-700",
                              PREVIEW_COL_MIN,
                              h === "파일명" && "font-mono",
                              h === "파일명" && !row.matched && "font-semibold text-red-700",
                            )}
                            title={val}
                          >
                            <span className="line-clamp-6 break-words">{val || "—"}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Progress & action */}
        <section className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                업로드 중… {uploadDone} / {uploadTotal}
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {statusMessage && !isUploading && (
            <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-800">
              {statusMessage}
            </p>
          )}

          {uploadErrors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-semibold text-red-800">실패 목록</p>
              <ul className="mt-2 max-h-40 list-inside list-disc overflow-auto text-xs text-red-900">
                {uploadErrors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            disabled={!canBulkUpload}
            onClick={() => void runBulkUpload()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                처리 중…
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" />
                일괄 업로드 실행 ({matchedCount}건)
              </>
            )}
          </button>
          {!canBulkUpload && !isUploading && csvRows.length > 0 && (
            <p className="text-center text-xs text-slate-500">
              매칭된 행이 있어야 실행할 수 있습니다. 미매칭 행은 빨간색으로 표시됩니다.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
