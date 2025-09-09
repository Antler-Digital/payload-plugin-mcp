declare module 'next/link' {
  import { ComponentProps } from 'react'

  interface LinkProps extends ComponentProps<'a'> {
    href: string
    replace?: boolean
    scroll?: boolean
    shallow?: boolean
    passHref?: boolean
    prefetch?: boolean
    locale?: string | false
    legacyBehavior?: boolean
    onMouseEnter?: (e: React.MouseEvent<HTMLAnchorElement>) => void
    onTouchStart?: (e: React.TouchEvent<HTMLAnchorElement>) => void
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  }

  const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>
  export default Link
}
