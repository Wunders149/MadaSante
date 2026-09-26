import { useMemo, useState } from 'react'
import { UserRound } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { SearchBar } from '../../components/SearchBar'
import { NurseCard } from '../../components/NurseCard'
import { EmptyState } from '../../components/ui/States'
import { useApp } from '../../stores/AppStore'
import { useNurses } from '../../lib/hooks'
import { ApiError } from '../../lib/api'

export function NursesPage() {
  const { t, requestNurse, toast } = useApp()
  const { data: nurses = [] } = useNurses()
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const needle = query.trim().toLowerCase()
  const list = useMemo(
    () =>
      nurses.filter(
        (n) =>
          !needle ||
          n.name.toLowerCase().includes(needle) ||
          n.city.toLowerCase().includes(needle) ||
          n.services.some((s) => s.toLowerCase().includes(needle)),
      ),
    [nurses, needle],
  )

  // The card's request button used to be inert because no handler was passed.
  // A request is a pending appointment with no fixed slot: the nurse proposes
  // a time when they accept.
  const request = async (nurse: (typeof nurses)[number]) => {
    setBusyId(nurse.id)
    try {
      const created = await requestNurse({
        providerId: nurse.id,
        providerType: 'nurse',
        providerName: nurse.name,
        providerPhoto: nurse.photo,
        type: t('nurse.request'),
        date: '',
        time: '',
        location: nurse.location,
      })
      toast(t('toast.nurse'), t('nurse.requestSent', { ref: created.reference }), 'success')
    } catch (err) {
      toast(t('common.error'), err instanceof ApiError ? err.message : undefined, 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page-container max-w-3xl py-5 sm:py-7">
      <PageHeader title={t('nav.nurses')} subtitle={t('nurse.subtitle')} />
      <SearchBar value={query} onChange={setQuery} placeholder={t('common.search')} />

      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<UserRound className="h-6 w-6" />}
            title={t('common.noResults')}
            description={t('common.noResultsDesc')}
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {list.map((n) => (
            <NurseCard
              key={n.id}
              nurse={n}
              onRequest={busyId === n.id ? undefined : () => void request(n)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
