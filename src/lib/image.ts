const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

export const MEDIA_BASE = (import.meta.env.VITE_MEDIA_BASE_URL ?? '').replace(/\/$/, '')

export function resolveMediaUrl(src?: string | null): string | undefined {
  if (!src) return undefined
  if (/^(data:|blob:|https?:\/\/)/i.test(src)) return src
  if (src.startsWith('/')) return `${MEDIA_BASE}${src}`
  return `${MEDIA_BASE}/${src}`.replace(/\/+/g, '/')
}

export function validateImageFile(file: File, maxBytes = MAX_UPLOAD_BYTES): void {
  if (!file.type.startsWith('image/')) {
    throw new Error('Veuillez choisir une image')
  }
  if (file.size > maxBytes) {
    throw new Error(`Image trop volumineuse (max ${Math.round(maxBytes / (1024 * 1024))} Mo)`) 
  }
}

export function fileToResizedDataUrl(file: File, maxSize = 512, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      validateImageFile(file)
    } catch (error) {
      reject(error)
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Image invalide'))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Conversion d’image impossible'))
          return
        }
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        try {
          resolve(canvas.toDataURL('image/jpeg', quality))
        } catch {
          reject(new Error('Conversion d’image impossible'))
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}