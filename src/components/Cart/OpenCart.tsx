import { ShoppingCart } from 'lucide-react'
import type { ComponentProps } from 'react'

export function OpenCartButton({
  quantity = 0,
  ...props
}: ComponentProps<'button'> & { quantity?: number }) {
  return (
    <button
      type="button"
      {...props}
      aria-label={`Carrito, ${quantity} productos`}
      className="relative flex items-center gap-2 text-[#3D393A] hover:opacity-60"
    >
      <ShoppingCart className="size-5" />
      <span className="hidden sm:inline">Carrito</span>
      {quantity > 0 && <span className="rounded-full bg-[#CEC3BA] px-2 text-sm">{quantity}</span>}
    </button>
  )
}
