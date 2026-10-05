'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { OpenCartButton } from './OpenCart'
import { CartContents } from './CartContents'

export function CartModal() {
  const { cart } = useCart()
  const pathname = usePathname()
  const [openPath, setOpenPath] = useState<string | null>(null)
  const quantity = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
  return (
    <Sheet
      open={openPath === pathname}
      onOpenChange={(open) => setOpenPath(open ? pathname : null)}
    >
      <SheetTrigger asChild>
        <OpenCartButton quantity={quantity} />
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto bg-[#E8E3DD] text-[#3D393A] sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-darsha-serif text-3xl text-[#3D393A]">Tu carrito</SheetTitle>
          <SheetDescription className="text-[#4b5563]">
            Revisa los productos que elegiste para tu piel.
          </SheetDescription>
        </SheetHeader>
        <div className="px-5 pb-8">
          <CartContents drawer onNavigate={() => setOpenPath(null)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
