'use client'

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import type { ShippingQuote } from '@/utilities/shippingQuote'

type Destination = { method: 'pickup' | 'delivery'; department: string; locality: string }
type Result = { key: string; quote: ShippingQuote } | null
type ShippingContextValue = {
  destination: Destination
  setDestination: Dispatch<SetStateAction<Destination>>
  result: Result
  setResult: Dispatch<SetStateAction<Result>>
}
const ShippingContext = createContext<ShippingContextValue | null>(null)

export function ShippingProvider({ children }: { children: ReactNode }) {
  const [destination, setDestination] = useState<Destination>({
    method: 'pickup',
    department: '',
    locality: '',
  })
  const [result, setResult] = useState<Result>(null)
  return (
    <ShippingContext.Provider value={{ destination, setDestination, result, setResult }}>
      {children}
    </ShippingContext.Provider>
  )
}

export function useShipping() {
  const context = useContext(ShippingContext)
  if (!context) throw new Error('useShipping requires ShippingProvider')
  return context
}
