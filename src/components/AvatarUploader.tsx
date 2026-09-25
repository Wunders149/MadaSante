import { useRef, useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { Avatar } from './Avatar'
import { useApp } from '../stores/AppStore'
import { fileToResizedDataUrl } from '../lib/image'

interface AvatarUploaderProps {
  src?: string
  name: string
  size?: 'lg' | 'xl'
  onChange: (dataUrl: string | null) => Promise<void>
}

export function AvatarUploader({ src, name, size = 'xl', onChange }: AvatarUploaderProps) {
  const { t, toast } = useApp()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const dataUrl = await fileToResizedDataUrl(file)
      await onChange(dataUrl)
      toast(t('profile.photoUpdated'), '', 'success')
    } catch (err) {
      toast(t('common.error'), err instanceof Error ? err.message : undefined, 'error')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (busy) return
    setBusy(true)
    try {
      await onChange(null)
      toast(t('profile.photoUpdated'), '', 'success')
    } catch (err) {
      toast(t('common.error'), err instanceof Error ? err.message : undefined, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="group relative block"
        aria-label={t('profile.changePhoto')}
      >
        <Avatar src={src} name={name} size={size} />
        <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-white shadow-md transition group-hover:bg-brand-700">
          <Camera className="h-4 w-4" />
        </span>
      </button>
      {src && (
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-ink text-white shadow-md transition hover:bg-red-600"
          aria-label={t('profile.removePhoto')}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={pick} />
    </div>
  )
}