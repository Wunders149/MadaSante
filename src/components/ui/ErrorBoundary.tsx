import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './Button'

interface Props {
  children: ReactNode
  /** Shown instead of the default panel; useful for scoping a boundary. */
  label?: string
}

interface State {
  error: Error | null
}

/**
 * Catches render-time crashes so one broken page cannot white-screen the app.
 *
 * Without this any thrown error unmounts the whole React tree and leaves a
 * blank page, which is indistinguishable from a dead server to the person
 * using it. Route-level boundaries are attached per area so a failure in, say,
 * the admin queue does not take the patient side down with it.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', this.props.label ?? 'app', error, info.componentStack)
  }

  private reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="grid min-h-[60vh] place-items-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-line bg-card p-6 text-center shadow-card">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-lg font-bold text-ink">
            {this.props.label ? `Erreur — ${this.props.label}` : 'Une erreur est survenue'}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Cette page n’a pas pu s’afficher. Rechargez pour réessayer.
          </p>
          {import.meta.env.DEV && (
            <pre className="mt-3 max-h-32 overflow-auto rounded-xl bg-gray-50 p-3 text-left text-[11px] text-ink-soft">
              {error.message}
            </pre>
          )}
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="outline" onClick={this.reset}>
              Réessayer
            </Button>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" /> Recharger
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
