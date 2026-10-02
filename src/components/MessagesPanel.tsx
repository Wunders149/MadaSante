import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { apiRoutes } from '../lib/api'
import { useAuth } from '../stores/AuthStore'
import { useApp } from '../stores/AppStore'
import { PageHeader } from './ui/Headers'
import { EmptyState } from './ui/States'
import { Button } from './ui/Button'
import { cn } from '../lib/cn'
import type { Conversation, Message } from '../types'

/**
 * Simple inbox-style messaging between a patient and a professional. Both the
 * patient and provider areas render this panel over the same endpoints; the
 * server scopes the list to the caller's role.
 */
export function MessagesPanel() {
  const { t, toast } = useApp()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)

  const { data: conversations = [] } = useQuery({ queryKey: ['conversations'], queryFn: apiRoutes.conversations })
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedId],
    queryFn: () => apiRoutes.messages(selectedId as string),
    enabled: Boolean(selectedId),
    refetchInterval: 5_000,
  })

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const selected = conversations.find((c) => c.id === selectedId) as Conversation | undefined

  const send = async () => {
    const text = draft.trim()
    if (!text || !selectedId) return
    setSending(true)
    try {
      await apiRoutes.sendMessage(selectedId, text)
      setDraft('')
      await queryClient.invalidateQueries({ queryKey: ['messages', selectedId] })
      await queryClient.invalidateQueries({ queryKey: ['conversations'] })
    } catch (err) {
      toast(t('common.error'), err instanceof Error ? err.message : undefined, 'error')
    } finally {
      setSending(false)
    }
  }

  if (!user) return null

  return (
    <div className="page-container py-5 sm:py-7">
      <PageHeader title={t('msg.title')} subtitle={t('msg.subtitle')} />
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
        <div className="card p-3">
          {conversations.length === 0 ? (
            <EmptyState title={t('msg.empty')} description={t('msg.emptyDesc')} />
          ) : (
            <div className="space-y-1">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    'w-full rounded-xl px-3 py-2.5 text-left text-sm transition',
                    c.id === selectedId ? 'bg-brand-50 font-semibold text-brand-800' : 'text-ink-soft hover:bg-gray-50',
                  )}
                >
                  <p className="truncate">{user.role === 'patient' ? c.providerName : c.patientName}</p>
                  {c.lastMessage && <p className="truncate text-xs text-ink-faint">{c.lastMessage}</p>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card flex h-[60vh] flex-col p-4">
          {!selected ? (
            <EmptyState title={t('msg.select')} description={t('msg.selectDesc')} />
          ) : (
            <>
              <p className="border-b border-line pb-2 text-sm font-bold text-ink">
                {user.role === 'patient' ? selected.providerName : selected.patientName}
              </p>
              <div className="flex-1 space-y-2 overflow-y-auto py-3">
                {messages.map((m: Message) => (
                  <div key={m.id} className={cn('flex', m.senderId === user.id ? 'justify-end' : 'justify-start')}>
                    <p
                      className={cn(
                        'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
                        m.senderId === user.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-ink',
                      )}
                    >
                      {m.text}
                    </p>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div className="flex items-center gap-2 border-t border-line pt-3">
                <input
                  className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm text-ink focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  placeholder={t('msg.placeholder')}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') send() }}
                />
                <Button size="lg" loading={sending} onClick={send} aria-label={t('msg.send')}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
