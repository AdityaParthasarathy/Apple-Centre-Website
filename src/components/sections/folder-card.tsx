'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn, cardImage, isExternalImage } from '@/lib/utils'
import { GALLERY_FROM_KEY, GALLERY_SCROLL_KEY } from '@/components/ui/go-back-button'

export interface FolderCardData {
  slug: string
  name: string
  description: string
  count: number
  /** Up to three pictures to peek out of the folder; the first is its cover. */
  previews: string[]
}

// Where each peeking photo sits at rest and where it swings to when the folder
// is hovered or focused: fanned out like photos pulled from a folder.
const FAN = [
  'rotate-[-5deg] group-hover:-translate-x-4 group-hover:-translate-y-7 group-hover:rotate-[-11deg] group-focus-visible:-translate-x-4 group-focus-visible:-translate-y-7 group-focus-visible:rotate-[-11deg]',
  'group-hover:-translate-y-9 group-focus-visible:-translate-y-9',
  'rotate-[5deg] group-hover:translate-x-4 group-hover:-translate-y-7 group-hover:rotate-[11deg] group-focus-visible:translate-x-4 group-focus-visible:-translate-y-7 group-focus-visible:rotate-[11deg]',
]

/** A photo folder on the gallery page: a folder whose flap swings open and
 *  whose photos fan out when it is hovered or focused. */
export function FolderCard({ folder }: { folder: FolderCardData }) {
  // The cover sits in the middle of the fan, the others either side of it.
  // Painted last-to-first so the cover ends up in front.
  const slots = [1, 0, 2]
  const shown = folder.previews.slice(0, 3).map((src, i) => ({ src, slot: slots[i] }))
  shown.reverse()

  const rememberPlace = () => {
    try {
      sessionStorage.setItem(GALLERY_FROM_KEY, '1')
      sessionStorage.setItem(GALLERY_SCROLL_KEY, String(Math.round(window.scrollY)))
    } catch {
      // Not being able to remember where they were is not worth blocking a click.
    }
  }

  return (
    <Link
      href={`/gallery/${folder.slug}`}
      onClick={rememberPlace}
      aria-label={`Open the folder ${folder.name}, ${folder.count} ${folder.count === 1 ? 'photo' : 'photos'}`}
      className="group block rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4"
    >
      <div className="relative aspect-[5/4] transition-transform duration-500 ease-out group-hover:-translate-y-1 motion-reduce:transition-none [perspective:900px]">
        {/* The back of the folder, with its tab. */}
        <div className="absolute left-0 top-0 h-8 w-2/5 rounded-t-2xl bg-accent/70" />
        <div className="absolute inset-x-0 bottom-0 top-5 rounded-2xl rounded-tl-none bg-accent/70 shadow-md" />

        {/* The photos, tucked in at rest. */}
        {shown.map(({ src, slot }) => (
          <div
            key={`${slot}-${src}`}
            className={cn(
              'absolute inset-x-[12%] bottom-[26%] top-[14%] overflow-hidden rounded-lg border-[5px] border-white bg-muted shadow-lg transition-transform duration-500 ease-out motion-reduce:transition-none',
              FAN[slot]
            )}
          >
            <Image
              src={cardImage(src, 480)}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 80vw, 300px"
              unoptimized={isExternalImage(src)}
            />
          </div>
        ))}

        {/* The front flap: swings open on hover. */}
        <div
          className="absolute inset-x-0 bottom-0 top-[34%] flex origin-bottom flex-col justify-end rounded-2xl bg-gradient-to-b from-accent to-[#4a3fe0] p-5 text-accent-foreground shadow-xl transition-transform duration-500 ease-out group-hover:[transform:rotateX(-24deg)] group-focus-visible:[transform:rotateX(-24deg)] motion-reduce:transition-none"
        >
          <p className="line-clamp-2 text-lg font-bold leading-snug">{folder.name}</p>
          <p className="mt-1 text-sm text-white/80">
            {folder.count} {folder.count === 1 ? 'photo' : 'photos'}
          </p>
        </div>
      </div>
    </Link>
  )
}
