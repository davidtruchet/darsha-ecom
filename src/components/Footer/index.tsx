import { getCachedGlobal } from '@/utilities/getGlobals'
import { Instagram } from 'lucide-react'

export async function Footer() {
  const footer = await getCachedGlobal('footer', 1)()
  const instagram =
    footer.navItems?.find((item) => item.link.url?.includes('instagram.com'))?.link.url ||
    'https://www.instagram.com/espaciodarsha/'
  return (
    <footer className="bg-[#3D393A] py-8 text-center text-[#fafaf9]">
      <div className="darsha-container">
        <a
          href={instagram}
          aria-label="Instagram"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 inline-flex hover:text-[#D1C7C0]"
        >
          <Instagram />
        </a>
        <p>© {new Date().getFullYear()} Espacio Darsha. All rights reserved.</p>
      </div>
    </footer>
  )
}
