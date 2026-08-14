// ═══════════════════════════════════════════════════════════════
// SARANG LIVING — Utility Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Format price in Indian Rupees
 */
export function formatPrice(price: number): string {
  return `₹${price.toLocaleString('en-IN')}`;
}

/**
 * Generate a CSS class string from conditional classes
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate placeholder image gradient based on category
 */
export function getCategoryGradient(category: string): string {
  const gradients: Record<string, string> = {
    'Claw Clips': 'linear-gradient(135deg, #FBF3EC 0%, #F2D4D5 50%, #E3A9AC 100%)',
    'Scrunchies': 'linear-gradient(135deg, #FBF3EC 0%, #D4BA8A 50%, #B08D57 100%)',
    'Snap & Barrette Clips': 'linear-gradient(135deg, #F5EDE4 0%, #E3A9AC 50%, #C97B7E 100%)',
    'Bows': 'linear-gradient(135deg, #FBF3EC 0%, #F2D4D5 100%)',
    'Headbands': 'linear-gradient(135deg, #F5EDE4 0%, #D4BA8A 100%)',
    'Kids & Novelty Sets': 'linear-gradient(135deg, #FBF3EC 0%, #E3A9AC 50%, #F2D4D5 100%)',
    'Ties & Elastics': 'linear-gradient(135deg, #F5EDE4 0%, #B5ADA5 100%)',
    'Duck & Alligator Clips': 'linear-gradient(135deg, #FBF3EC 0%, #D4C8BC 100%)',
    'Pins & Forks': 'linear-gradient(135deg, #F5EDE4 0%, #B08D57 100%)',
    'Nails': 'linear-gradient(135deg, #F2D4D5 0%, #E3A9AC 50%, #C97B7E 100%)',
  };
  return gradients[category] || 'linear-gradient(135deg, #FBF3EC 0%, #F2D4D5 100%)';
}

/**
 * Price bucket definitions for "Shop by Price"
 */
export const priceBuckets = [
  { label: 'Under ₹50', slug: 'under-50', min: 0, max: 49 },
  { label: 'Under ₹100', slug: 'under-100', min: 50, max: 99 },
  { label: 'Under ₹150', slug: 'under-150', min: 100, max: 149 },
  { label: 'Under ₹250', slug: 'under-250', min: 150, max: 249 },
  { label: '₹250 & Above', slug: '250-above', min: 250, max: 9999 },
] as const;

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}
