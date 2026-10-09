'use client'
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { EcommerceProvider } from '@payloadcms/plugin-ecommerce/client/react'
import { ShippingProvider } from '@/providers/Shipping'
import { currenciesConfig } from '@/lib/currencies'

const CartSyncContext = createContext<(reference: string) => void>(() => {})
export const useSynchronizePaidCart = () => useContext(CartSyncContext)

export function CartSessionProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0)
  const synchronized = useRef(new Set<string>())
  const synchronize = useCallback((reference: string) => {
    if (synchronized.current.has(reference)) return
    synchronized.current.add(reference)
    // Restore authoritative cart contents through the provider's guest-secret-aware initialization.
    // Its public refreshCart currently omits the guest secret; clearCart would erase new additions.
    setVersion((value) => value + 1)
  }, [])
  return (
    <CartSyncContext.Provider value={synchronize}>
      <EcommerceProvider
        key={version}
        currenciesConfig={currenciesConfig}
        enableVariants={true}
        syncLocalStorage={true}
        api={{
          cartsFetchQuery: {
            depth: 2,
            populate: {
              products: {
                slug: true,
                title: true,
                gallery: true,
                brand: true,
                size: true,
                _status: true,
                enableVariants: true,
                priceInUYU: true,
                priceInUYUEnabled: true,
                inventory: true,
              },
              variants: {
                title: true,
                options: true,
                priceInUYU: true,
                priceInUYUEnabled: true,
                inventory: true,
              },
            },
          },
        }}
        paymentMethods={[]}
      >
        <ShippingProvider>{children}</ShippingProvider>
      </EcommerceProvider>
    </CartSyncContext.Provider>
  )
}
