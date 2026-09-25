const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

export function fileToResizedDataUrl(file: File, maxSize = 512, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Veuillez choisir une image'))
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error('Image trop volumineuse (max 8 Mo)'))
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