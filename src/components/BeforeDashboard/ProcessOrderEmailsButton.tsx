'use client'
import { useState } from 'react'
export function ProcessOrderEmailsButton() {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function process() {
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/order-emails/process', {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('No se pudieron procesar los correos. Intenta nuevamente.')
      const result = await response.json()
      setMessage(
        `Enviados: ${result.sent}. Fallidos: ${result.failed}. Los reintentos respetan su tiempo de espera.`,
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron procesar los correos.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div>
      <button
        type="button"
        onClick={process}
        disabled={busy}
        aria-busy={busy}
        style={{ padding: '8px 12px', cursor: busy ? 'wait' : 'pointer' }}
      >
        {busy ? 'Procesando…' : 'Procesar correos pendientes'}
      </button>
      <p role="status">{message}</p>
    </div>
  )
}
