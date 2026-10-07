import { AuthProvider } from '@/providers/Auth'
import { CartSessionProvider } from '@/providers/CartSession'
import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { SonnerProvider } from '@/providers/Sonner'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HeaderThemeProvider>
          <SonnerProvider />
          <CartSessionProvider>{children}</CartSessionProvider>
        </HeaderThemeProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
