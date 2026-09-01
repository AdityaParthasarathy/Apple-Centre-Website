'use client'

import { motion } from 'motion/react'
import Image from 'next/image'
import { cn, isExternalImage } from '@/lib/utils'

export const ThreeDMarquee = ({ images, className }: { images: string[]; className?: string }) => {
  const chunkSize = Math.ceil(images.length / 4)
  const chunks = Array.from({ length: 4 }, (_, colIndex) => {
    const start = colIndex * chunkSize
    return images.slice(start, start + chunkSize)
  })

  return (
    <div className={cn('mx-auto block h-[600px] overflow-hidden rounded-2xl max-sm:h-100', className)}>
      <div className="flex size-full items-center justify-center">
        <div className="size-[1720px] shrink-0 scale-50 sm:scale-75 lg:scale-100">
          <div
            style={{ transform: 'rotateX(55deg) rotateY(0deg) rotateZ(-45deg)' }}
            className="relative top-96 right-[50%] grid size-full origin-top-left grid-cols-4 gap-8 transform-3d"
          >
            {chunks.map((subarray, colIndex) => (
              <motion.div
                animate={{ y: colIndex % 2 === 0 ? 100 : -100 }}
                transition={{ duration: colIndex % 2 === 0 ? 10 : 15, repeat: Infinity, repeatType: 'reverse' }}
                key={colIndex + 'marquee'}
                className="flex flex-col items-start gap-8"
              >
                <GridLineVertical className="-left-4" offset="80px" />
                {subarray.map((image, imageIndex) => (
                  <div className="relative" key={imageIndex + image}>
                    <GridLineHorizontal className="-top-4" offset="20px" />
                    <motion.div
                      whileHover={{ y: -10 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="relative aspect-[970/700] w-[970px] overflow-hidden rounded-lg ring ring-gray-950/5 hover:shadow-2xl"
                    >
                      <Image
                        src={image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="970px"
                        unoptimized={isExternalImage(image)}
                      />
                    </motion.div>
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const GridLineHorizontal = ({ className, offset }: { className?: string; offset?: string }) => {
  return (
    <div
      style={
        {
          '--background': 'var(--background)',
          '--color': 'color-mix(in oklch, var(--foreground), transparent 80%)',
          '--height': '1px',
          '--width': '5px',
          '--fade-stop': '90%',
          '--offset': offset || '200px',
          maskComposite: 'exclude',
        } as React.CSSProperties
      }
      className={cn(
        'absolute left-[calc(var(--offset)/2*-1)] h-[var(--height)] w-[calc(100%+var(--offset))]',
        'bg-[linear-gradient(to_right,var(--color),var(--color)_50%,transparent_0,transparent)]',
        '[background-size:var(--width)_var(--height)]',
        '[mask:linear-gradient(to_left,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_right,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]',
        '[mask-composite:exclude]',
        'z-30',
        className
      )}
    ></div>
  )
}

const GridLineVertical = ({ className, offset }: { className?: string; offset?: string }) => {
  return (
    <div
      style={
        {
          '--background': 'var(--background)',
          '--color': 'color-mix(in oklch, var(--foreground), transparent 80%)',
          '--height': '5px',
          '--width': '1px',
          '--fade-stop': '90%',
          '--offset': offset || '150px',
          maskComposite: 'exclude',
        } as React.CSSProperties
      }
      className={cn(
        'absolute top-[calc(var(--offset)/2*-1)] h-[calc(100%+var(--offset))] w-[var(--width)]',
        'bg-[linear-gradient(to_bottom,var(--color),var(--color)_50%,transparent_0,transparent)]',
        '[background-size:var(--width)_var(--height)]',
        '[mask:linear-gradient(to_top,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_bottom,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]',
        '[mask-composite:exclude]',
        'z-30',
        className
      )}
    ></div>
  )
}
