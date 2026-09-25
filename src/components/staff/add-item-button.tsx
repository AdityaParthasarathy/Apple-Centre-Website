import { cn } from '@/lib/utils'

/** The portal's "add something" button: the label slides away and the plus
 *  icon spreads across the whole button on hover. (Sized for labels up to
 *  about 12 characters — "New Folder", "Add Photos".) */
export function AddItemButton({
  label,
  onClick,
  disabled,
  className,
  'aria-label': ariaLabel,
}: {
  label: string
  onClick?: () => void
  disabled?: boolean
  className?: string
  'aria-label'?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? label}
      className={cn(
        'group relative flex h-10 w-[170px] shrink-0 cursor-pointer items-center overflow-hidden border border-[#34974d] bg-[#3aa856] transition-all duration-300 hover:bg-[#34974d] active:border-[#2e8644] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34974d]',
        className
      )}
    >
      <span className="translate-x-[30px] font-semibold text-white transition-all duration-300 group-hover:text-transparent">
        {label}
      </span>
      <span className="absolute flex h-full w-[39px] translate-x-[129px] items-center justify-center bg-[#34974d] transition-all duration-300 group-hover:w-[168px] group-hover:translate-x-0 group-active:bg-[#2e8644]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          stroke="currentColor"
          fill="none"
          className="w-[30px] stroke-white"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </span>
    </button>
  )
}
