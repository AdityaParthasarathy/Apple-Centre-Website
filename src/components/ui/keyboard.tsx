'use client'
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import {
  SunDim,
  Sun,
  LayoutGrid,
  Search,
  Mic,
  Moon,
  SkipBack,
  Play,
  SkipForward,
  VolumeX,
  Volume1,
  Volume2,
  Globe,
  Command,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
} from 'lucide-react'

// Adapted from the Aceternity keyboard demo, with the sound layer removed
// (no click sample shipped with this repo — see the plan) and icons
// swapped from @tabler/icons-react to lucide-react, already this site's
// only icon dependency.

const KEY_DISPLAY_LABELS: Record<string, string> = {
  Escape: 'esc',
  Backspace: 'delete',
  Tab: 'tab',
  Enter: 'return',
  ShiftLeft: 'shift',
  ShiftRight: 'shift',
  ControlLeft: 'control',
  ControlRight: 'control',
  AltLeft: 'option',
  AltRight: 'option',
  MetaLeft: 'command',
  MetaRight: 'command',
  Space: 'space',
  CapsLock: 'caps',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
}

const getKeyDisplayLabel = (keyCode: string): string => {
  if (KEY_DISPLAY_LABELS[keyCode]) return KEY_DISPLAY_LABELS[keyCode]
  if (keyCode.startsWith('Key')) return keyCode.slice(3)
  if (keyCode.startsWith('Digit')) return keyCode.slice(5)
  if (keyCode.startsWith('F') && keyCode.length <= 3) return keyCode
  return keyCode
}

interface KeyboardContextType {
  pressedKeys: Set<string>
  setPressed: (keyCode: string) => void
  setReleased: (keyCode: string) => void
  lastPressedKey: string | null
}

const KeyboardContext = createContext<KeyboardContextType | null>(null)

const useKeyboardState = () => {
  const context = useContext(KeyboardContext)
  if (!context) {
    throw new Error('useKeyboardState must be used within KeyboardProvider')
  }
  return context
}

const KeyboardProvider = ({
  children,
  containerRef,
}: {
  children: React.ReactNode
  containerRef: React.RefObject<HTMLDivElement | null>
}) => {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())
  const [lastPressedKey, setLastPressedKey] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const setPressed = useCallback((keyCode: string) => {
    setPressedKeys((prev) => new Set(prev).add(keyCode))
    setLastPressedKey(keyCode)
  }, [])

  const setReleased = useCallback((keyCode: string) => {
    setPressedKeys((prev) => {
      const next = new Set(prev)
      next.delete(keyCode)
      return next
    })
  }, [])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: 0.1,
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [containerRef])

  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      setPressed(e.code)
    }
    const handleKeyUp = (e: KeyboardEvent) => setReleased(e.code)

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [isVisible, setPressed, setReleased])

  return (
    <KeyboardContext.Provider value={{ pressedKeys, setPressed, setReleased, lastPressedKey }}>
      {children}
    </KeyboardContext.Provider>
  )
}

const KeystrokePreview = () => {
  const { lastPressedKey, pressedKeys } = useKeyboardState()
  const [displayKey, setDisplayKey] = useState<string | null>(null)
  const [animationKey, setAnimationKey] = useState(0)

  useEffect(() => {
    if (lastPressedKey) {
      if (['Space', 'ShiftLeft', 'ShiftRight'].includes(lastPressedKey)) {
        setDisplayKey(null)
        return
      }
      setDisplayKey(getKeyDisplayLabel(lastPressedKey))
      setAnimationKey((prev) => prev + 1)
    }
  }, [lastPressedKey])

  const isPressed = pressedKeys.size > 0

  return (
    <div className="relative flex h-12 w-full items-center justify-center">
      <AnimatePresence mode="popLayout">
        {displayKey && (
          <motion.div
            key={animationKey}
            layout
            initial={{ opacity: 0, scale: 0.5, y: 5 }}
            animate={{ opacity: 1, scale: isPressed ? 0.95 : 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -5 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.5 }}
            className="absolute flex items-center justify-center rounded-lg px-4 py-2 font-mono text-2xl font-black text-neutral-700"
          >
            {displayKey}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const Keyboard = ({
  className,
  showPreview = false,
}: {
  className?: string
  showPreview?: boolean
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <KeyboardProvider containerRef={containerRef}>
      <div
        ref={containerRef}
        className={cn(
          'mx-auto w-fit [zoom:0.8] sm:[zoom:1.25] md:[zoom:1.5] lg:[zoom:1.75] xl:[zoom:2]',
          className
        )}
      >
        {showPreview && <KeystrokePreview />}
        <Keypad />
      </div>
    </KeyboardProvider>
  )
}

export const Keypad = () => {
  return (
    <div className="h-full w-fit rounded-xl bg-neutral-200 p-1 shadow-sm ring-1 shadow-black/5 ring-black/5">
      <Row>
        <Key keyCode="Escape" containerClassName="rounded-tl-xl" className="w-10 rounded-tl-lg" childrenClassName="items-start justify-end pb-[2px] pl-[4px]">
          <span>esc</span>
        </Key>
        <Key keyCode="F1"><SunDim className="h-[6px] w-[6px]" /><span className="mt-1">F1</span></Key>
        <Key keyCode="F2"><Sun className="h-[6px] w-[6px]" /><span className="mt-1">F2</span></Key>
        <Key keyCode="F3"><LayoutGrid className="h-[6px] w-[6px]" /><span className="mt-1">F3</span></Key>
        <Key keyCode="F4"><Search className="h-[6px] w-[6px]" /><span className="mt-1">F4</span></Key>
        <Key keyCode="F5"><Mic className="h-[6px] w-[6px]" /><span className="mt-1">F5</span></Key>
        <Key keyCode="F6"><Moon className="h-[6px] w-[6px]" /><span className="mt-1">F6</span></Key>
        <Key keyCode="F7"><SkipBack className="h-[6px] w-[6px]" /><span className="mt-1">F7</span></Key>
        <Key keyCode="F8"><Play className="h-[6px] w-[6px]" /><span className="mt-1">F8</span></Key>
        <Key keyCode="F9"><SkipForward className="h-[6px] w-[6px]" /><span className="mt-1">F9</span></Key>
        <Key keyCode="F10"><VolumeX className="h-[6px] w-[6px]" /><span className="mt-1">F10</span></Key>
        <Key keyCode="F11"><Volume1 className="h-[6px] w-[6px]" /><span className="mt-1">F11</span></Key>
        <Key keyCode="F12"><Volume2 className="h-[6px] w-[6px]" /><span className="mt-1">F12</span></Key>
        <Key containerClassName="rounded-tr-xl" className="rounded-tr-lg">
          <div className="h-4 w-4 rounded-full bg-gradient-to-b from-neutral-300 via-neutral-200 to-neutral-300 p-px">
            <div className="h-full w-full rounded-full bg-neutral-100" />
          </div>
        </Key>
      </Row>

      <Row>
        <Key keyCode="Backquote"><span>~</span><span>`</span></Key>
        <Key keyCode="Digit1"><span>!</span><span>1</span></Key>
        <Key keyCode="Digit2"><span>@</span><span>2</span></Key>
        <Key keyCode="Digit3"><span>#</span><span>3</span></Key>
        <Key keyCode="Digit4"><span>$</span><span>4</span></Key>
        <Key keyCode="Digit5"><span>%</span><span>5</span></Key>
        <Key keyCode="Digit6"><span>^</span><span>6</span></Key>
        <Key keyCode="Digit7"><span>&</span><span>7</span></Key>
        <Key keyCode="Digit8"><span>*</span><span>8</span></Key>
        <Key keyCode="Digit9"><span>(</span><span>9</span></Key>
        <Key keyCode="Digit0"><span>)</span><span>0</span></Key>
        <Key keyCode="Minus"><span>—</span><span>_</span></Key>
        <Key keyCode="Equal"><span>+</span><span>=</span></Key>
        <Key keyCode="Backspace" className="w-10" childrenClassName="items-end justify-end pr-[4px] pb-[2px]">
          <span>delete</span>
        </Key>
      </Row>

      <Row>
        <Key keyCode="Tab" className="w-10" childrenClassName="items-start justify-end pb-[2px] pl-[4px]">
          <span>tab</span>
        </Key>
        {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((letter) => (
          <Key key={letter} keyCode={`Key${letter}`}>{letter}</Key>
        ))}
        <Key keyCode="BracketLeft"><span>{'{'}</span><span>{'['}</span></Key>
        <Key keyCode="BracketRight"><span>{'}'}</span><span>{']'}</span></Key>
        <Key keyCode="Backslash"><span>{'|'}</span><span>{'\\'}</span></Key>
      </Row>

      <Row>
        <Key keyCode="CapsLock" className="w-[2.8rem]" childrenClassName="items-start justify-end pb-[2px] pl-[4px]">
          <span>caps lock</span>
        </Key>
        {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map((letter) => (
          <Key key={letter} keyCode={`Key${letter}`}>{letter}</Key>
        ))}
        <Key keyCode="Semicolon"><span>:</span><span>;</span></Key>
        <Key keyCode="Quote"><span>{'"'}</span><span>{"'"}</span></Key>
        <Key keyCode="Enter" className="w-[2.85rem]" childrenClassName="items-end justify-end pr-[4px] pb-[2px]">
          <span>return</span>
        </Key>
      </Row>

      <Row>
        <Key keyCode="ShiftLeft" className="w-[3.65rem]" childrenClassName="items-start justify-end pb-[2px] pl-[4px]">
          <span>shift</span>
        </Key>
        {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map((letter) => (
          <Key key={letter} keyCode={`Key${letter}`}>{letter}</Key>
        ))}
        <Key keyCode="Comma"><span>{'<'}</span><span>,</span></Key>
        <Key keyCode="Period"><span>{'>'}</span><span>.</span></Key>
        <Key keyCode="Slash"><span>?</span><span>/</span></Key>
        <Key keyCode="ShiftRight" className="w-[3.65rem]" childrenClassName="items-end justify-end pr-[4px] pb-[2px]">
          <span>shift</span>
        </Key>
      </Row>

      <Row>
        <ModifierKey keyCode="Fn" containerClassName="rounded-bl-xl" className="rounded-bl-lg">
          <span>fn</span>
          <Globe className="h-[6px] w-[6px]" />
        </ModifierKey>
        <ModifierKey keyCode="ControlLeft">
          <ChevronUp className="h-[6px] w-[6px]" />
          <span>control</span>
        </ModifierKey>
        <ModifierKey keyCode="AltLeft">
          <OptionKey className="h-[6px] w-[6px]" />
          <span>option</span>
        </ModifierKey>
        <ModifierKey keyCode="MetaLeft" className="w-8">
          <Command className="h-[6px] w-[6px]" />
          <span>command</span>
        </ModifierKey>
        <Key keyCode="Space" className="w-[8.2rem]" />
        <ModifierKey keyCode="MetaRight" className="w-8">
          <Command className="h-[6px] w-[6px]" />
          <span>command</span>
        </ModifierKey>
        <ModifierKey keyCode="AltRight">
          <OptionKey className="h-[6px] w-[6px]" />
          <span>option</span>
        </ModifierKey>
        <div className="flex h-6 w-[4.9rem] items-center justify-end rounded-[4px] p-[0.5px]">
          <Key keyCode="ArrowLeft" className="h-6 w-6"><ChevronLeft className="h-[6px] w-[6px]" /></Key>
          <div className="flex flex-col">
            <Key keyCode="ArrowUp" className="h-3 w-6"><ChevronUp className="h-[6px] w-[6px]" /></Key>
            <Key keyCode="ArrowDown" className="h-3 w-6"><ChevronDown className="h-[6px] w-[6px]" /></Key>
          </div>
          <Key keyCode="ArrowRight" containerClassName="rounded-br-xl" className="h-6 w-6 rounded-br-lg">
            <ChevronRight className="h-[6px] w-[6px]" />
          </Key>
        </div>
      </Row>
    </div>
  )
}

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-[2px] flex w-full shrink-0 gap-[2px]">{children}</div>
)

function useKeyPress(keyCode?: string) {
  const { pressedKeys, setPressed, setReleased } = useKeyboardState()
  const isPressed = keyCode ? pressedKeys.has(keyCode) : false

  const handleMouseDown = () => keyCode && setPressed(keyCode)
  const handleMouseUp = () => keyCode && isPressed && setReleased(keyCode)
  const handleMouseLeave = () => keyCode && isPressed && setReleased(keyCode)

  return { isPressed, handleMouseDown, handleMouseUp, handleMouseLeave }
}

const keyButtonClass =
  "flex h-6 w-6 cursor-pointer items-center justify-center rounded-[3.5px] bg-gray-100 shadow-[0px_0px_1px_0px_rgba(0,0,0,0.5),0px_1px_1px_0px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(255,255,255,1)_inset] transition-transform duration-75 active:scale-[0.98]"

const Key = ({
  className,
  childrenClassName,
  containerClassName,
  children,
  keyCode,
}: {
  className?: string
  childrenClassName?: string
  containerClassName?: string
  children?: React.ReactNode
  keyCode?: string
}) => {
  const { isPressed, handleMouseDown, handleMouseUp, handleMouseLeave } = useKeyPress(keyCode)

  return (
    <div className={cn('rounded-[4px] p-[0.5px]', containerClassName)}>
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={cn(
          keyButtonClass,
          isPressed &&
            'scale-[0.98] bg-gray-100/80 shadow-[0px_0px_1px_0px_rgba(0,0,0,0.5),0px_1px_1px_0px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(255,255,255,0.5)]',
          className
        )}
      >
        <div className={cn('flex h-full w-full flex-col items-center justify-center text-[5px] text-neutral-700', childrenClassName)}>
          {children}
        </div>
      </button>
    </div>
  )
}

const ModifierKey = ({
  className,
  containerClassName,
  children,
  keyCode,
}: {
  className?: string
  containerClassName?: string
  children?: React.ReactNode
  keyCode?: string
}) => {
  const { isPressed, handleMouseDown, handleMouseUp, handleMouseLeave } = useKeyPress(keyCode)

  return (
    <div className={cn('rounded-[4px] p-[0.5px]', containerClassName)}>
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={cn(
          keyButtonClass,
          isPressed &&
            'scale-[0.98] bg-gray-100/80 shadow-[0px_0px_1px_0px_rgba(0,0,0,0.5),0px_1px_1px_0px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(255,255,255,0.5)]',
          className
        )}
      >
        <div className="flex h-full w-full flex-col items-start justify-between p-1 text-[5px] text-neutral-700">
          {children}
        </div>
      </button>
    </div>
  )
}

const OptionKey = ({ className }: { className?: string }) => (
  <svg fill="none" viewBox="0 0 32 32" className={className}>
    <rect stroke="currentColor" strokeWidth={2} x="18" y="5" width="10" height="2" />
    <polygon stroke="currentColor" strokeWidth={2} points="10.6,5 4,5 4,7 9.4,7 18.4,27 28,27 28,25 19.6,25" />
  </svg>
)
