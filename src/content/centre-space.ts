export interface CentreSpaceImage {
  id: string
  title: string
  description: string
  image: string
  /** Larger tiles in the bento grid — sized for landscape/wide shots. */
  featured?: boolean
}

export const centreSpaceImages: CentreSpaceImage[] = [
  {
    id: 'centre-entrance',
    title: 'Centre of Excellence in Apple Technologies',
    description: 'The entrance to the Apple Centre\'s dedicated lab space at RIT.',
    image: '/centre-space/entrance-sign.jpg',
    featured: true,
  },
  {
    id: 'centre-lab-wide',
    title: 'The Innovation Lab',
    description: 'Rows of Apple iMac workstations, set up and ready for hands-on sessions.',
    image: '/centre-space/lab-wide.jpg',
    featured: true,
  },
  {
    id: 'centre-imac-back',
    title: 'Every Workstation, Tagged and Ready',
    description: 'Each iMac is inventoried and maintained for student use.',
    image: '/centre-space/imac-back.jpg',
  },
  {
    id: 'centre-mouse',
    title: 'Apple Magic Mouse',
    description: 'Every workstation is equipped with Apple\'s own peripherals.',
    image: '/centre-space/magic-mouse.jpg',
  },
  {
    id: 'centre-keyboard',
    title: 'Apple Magic Keyboard',
    description: 'Full-size keyboards at every desk.',
    image: '/centre-space/magic-keyboard.jpg',
  },
  {
    id: 'centre-lab-angle-1',
    title: 'Workstations in a Row',
    description: 'Individual, partitioned workstations for focused work.',
    image: '/centre-space/lab-angle-1.jpg',
  },
  {
    id: 'centre-lab-angle-2',
    title: 'Dedicated Desk Space',
    description: 'Each student gets their own partitioned iMac setup.',
    image: '/centre-space/lab-angle-2.jpg',
  },
  {
    id: 'centre-imac-front',
    title: 'Apple iMac Workstation',
    description: 'The Centre\'s primary development machines.',
    image: '/centre-space/imac-front.jpg',
  },
]
