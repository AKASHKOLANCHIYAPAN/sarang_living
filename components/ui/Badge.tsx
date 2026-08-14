'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'blush' | 'gold' | 'muted' | 'sale' | 'new';
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = 'blush', children, className }: BadgeProps) {
  const variants: Record<string, string> = {
    blush: 'badge-blush',
    gold: 'badge-gold',
    muted: 'badge-muted',
    sale: 'badge-sale',
    new: 'badge-new',
  };

  return (
    <span className={cn('badge', variants[variant], className)}>
      {children}
    </span>
  );
}
