'use client'

import type { Header } from '@/payload-types'
import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import { Menu } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState, Suspense } from 'react'

export function HeaderClient({ header }: { header: Header }) {
  const [open, setOpen] = useState(false)
  const configured =
    header.navItems
      ?.map((item) => ({
        label: item.link.label || '',
        url:
          item.link.url ||
          (item.link.reference?.value && typeof item.link.reference.value === 'object'
            ? `/${item.link.reference.value.slug}`
            : ''),
      }))
      .filter((item) => item.url) || []
  const menu = configured.length
    ? configured
    : [
        { label: 'Servicios', url: '/servicios' },
        { label: 'Contacto', url: '/#contact' },
        { label: 'Tienda', url: '/shop' },
      ]

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-[#fafaf9] shadow-sm">
      <div className="darsha-container flex items-center justify-between py-6">
        <Link href="/" aria-label="Espacio Darsha">
          <Image
            src="/darsha/logo.png"
            alt="Espacio Darsha"
            width={150}
            height={50}
            className="h-[50px] w-auto object-contain"
          />
        </Link>
        <nav className="ml-auto hidden md:block">
          <ul className="flex gap-8">
            {menu.map((item) => (
              <li key={item.url}>
                <Link href={item.url} className="text-lg uppercase text-[#3D393A] hover:opacity-60">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-6 flex items-center gap-3">
          <Suspense fallback={<OpenCartButton />}>
            <Cart />
          </Suspense>
          <button
            type="button"
            aria-label="Menú"
            aria-expanded={open}
            className="md:hidden"
            onClick={() => setOpen(!open)}
          >
            <Menu className="size-6 text-[#3D393A]" />
          </button>
        </div>
      </div>
      {open && (
        <nav className="bg-[#fafaf9] pb-4 md:hidden">
          <ul className="flex flex-col items-center gap-4">
            {menu.map((item) => (
              <li key={item.url}>
                <Link
                  href={item.url}
                  onClick={() => setOpen(false)}
                  className="text-lg uppercase text-[#3D393A]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
