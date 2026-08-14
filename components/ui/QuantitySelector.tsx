'use client';

import { Minus, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export default function QuantitySelector({
  quantity,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  className,
}: QuantitySelectorProps) {
  const decrease = () => {
    if (quantity > min) onChange(quantity - 1);
  };

  const increase = () => {
    if (quantity < max) onChange(quantity + 1);
  };

  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <div
      className={cn('qty-selector', size === 'sm' && 'qty-selector-sm', className)}
      role="group"
      aria-label="Quantity selector"
    >
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={decrease}
        disabled={quantity <= min}
        className="qty-btn"
        aria-label="Decrease quantity"
        type="button"
      >
        <Minus size={iconSize} />
      </motion.button>

      <span className="qty-value" aria-live="polite" aria-label={`Quantity: ${quantity}`}>
        {quantity}
      </span>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={increase}
        disabled={quantity >= max}
        className="qty-btn"
        aria-label="Increase quantity"
        type="button"
      >
        <Plus size={iconSize} />
      </motion.button>
    </div>
  );
}
