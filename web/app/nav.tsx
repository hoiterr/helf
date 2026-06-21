'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/calendar', label: 'Calendar' },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="helf-nav">
      <span className="helf-nav__brand">helf</span>
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="helf-nav__link"
          data-active={pathname === l.href}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
