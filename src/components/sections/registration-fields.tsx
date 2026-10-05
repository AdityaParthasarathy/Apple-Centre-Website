'use client'

import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/ui/select'
import { inputClass } from '@/lib/utils'
import { REGISTRATION_YEARS } from '@/lib/event-registration'

/** The details asked of anyone signing up for an event or a program: name,
 *  email, phone, college / department and year — all required, and nothing
 *  more (no résumé or skills; those are only for applying to become a member).
 *  Shared so the two sign-up forms can't drift apart. Name, email, phone and
 *  college are plain inputs read from the form at submit; the year is held by
 *  the parent. */
export function RegistrationFields({
  idPrefix,
  year,
  onYearChange,
}: {
  idPrefix: string
  year: string
  onYearChange: (year: string) => void
}) {
  const id = (name: string) => `${idPrefix}${name}`
  return (
    <>
      <div>
        <label htmlFor={id('Name')} className="mb-1.5 block text-sm font-medium text-foreground">
          Name
        </label>
        <input id={id('Name')} name="name" type="text" required maxLength={100} autoComplete="name" className={inputClass} />
      </div>
      <div>
        <label htmlFor={id('Email')} className="mb-1.5 block text-sm font-medium text-foreground">
          Email
        </label>
        <input id={id('Email')} name="email" type="email" required maxLength={200} autoComplete="email" className={inputClass} />
      </div>
      <div>
        <label htmlFor={id('Phone')} className="mb-1.5 block text-sm font-medium text-foreground">
          Phone
        </label>
        <input
          id={id('Phone')}
          name="phone"
          type="tel"
          required
          minLength={7}
          maxLength={30}
          autoComplete="tel"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor={id('College')} className="mb-1.5 block text-sm font-medium text-foreground">
          College / department
        </label>
        <input id={id('College')} name="college" type="text" required maxLength={150} className={inputClass} />
      </div>
      <div>
        <label htmlFor={id('Year')} className="mb-1.5 block text-sm font-medium text-foreground">
          Year
        </label>
        <Select value={year} onValueChange={(value) => onYearChange(value as string)} required>
          <SelectTrigger id={id('Year')}>
            <SelectValue placeholder="Select your year" />
          </SelectTrigger>
          <SelectPopup>
            {REGISTRATION_YEARS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </div>

      {/* Honeypot: off-screen and out of the tab order, so people never see
          or fill it; bots that fill every input give themselves away. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={id('Website')}>Website</label>
        <input id={id('Website')} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
    </>
  )
}
