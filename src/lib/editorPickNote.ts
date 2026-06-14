export type EditorPickRow = {
  title?: string;
  description?: string;
  styles?: string;
};

const TIP_SUFFIXES = ["#에디터픽", "#추천네일", "#퍼스널네일", "#오늘의네일"];

/** CSV 행 메타로 업로드 keyword(에디터 팁) 문자열 생성 */
export function editorPickNoteFromRow(row: EditorPickRow, index = 0): string {
  const title = row.title?.trim();
  const styles = row.styles?.trim();
  const description = row.description?.trim();

  if (title && styles) {
    return `${title} · ${styles} ${TIP_SUFFIXES[index % TIP_SUFFIXES.length]}`;
  }
  if (title) {
    return `${title} ${TIP_SUFFIXES[index % TIP_SUFFIXES.length]}`;
  }
  if (description) {
    return `${description.slice(0, 40)} ${TIP_SUFFIXES[index % TIP_SUFFIXES.length]}`;
  }
  return `에디터 추천 네일 ${TIP_SUFFIXES[index % TIP_SUFFIXES.length]}`;
}
