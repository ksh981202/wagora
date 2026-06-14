import imageCompression from 'browser-image-compression' // WebP 업로드 최적화 (V1 동일)

const WEBP_PASSTHROUGH_MAX_BYTES = 1.5 * 1024 * 1024

const WEBP_COMPRESS_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1500,
  fileType: 'image/webp',
  initialQuality: 0.85,
} as const

/** `GL-0000401.jpg` → `GL-0000401.webp` */
export function toWebpFilename(filename: string): string {
  const base = filename.replace(/^.*[/\\]/, '').trim()
  if (!base) return 'image.webp'
  const dot = base.lastIndexOf('.')
  const stem = dot > 0 ? base.slice(0, dot) : base
  return `${stem}.webp`
}

/** R2 업로드 직전: WebP 압축 + 확장자 `.webp` */
export async function compressImageForUpload(file: File): Promise<File> {
  if (file.type === 'image/webp' && file.size <= WEBP_PASSTHROUGH_MAX_BYTES) {
    return file
  }

  const compressed = await imageCompression(file, WEBP_COMPRESS_OPTIONS)
  const webpName = toWebpFilename(file.name)
  return new File([compressed], webpName, {
    type: 'image/webp',
    lastModified: Date.now(),
  })
}
