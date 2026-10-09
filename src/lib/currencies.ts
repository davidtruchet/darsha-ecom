import type { CurrenciesConfig } from '@payloadcms/plugin-ecommerce/types'

export const currenciesConfig: CurrenciesConfig = {
  defaultCurrency: 'UYU',
  supportedCurrencies: [
    { code: 'UYU', decimals: 2, label: 'Peso uruguayo', symbol: '$' },
    // Keep existing USD fields and historical orders intact.
    { code: 'USD', decimals: 2, label: 'US Dollar', symbol: '$' },
  ],
}

export const formatUYU = (amount: number) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount / 100)
