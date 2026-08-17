import { supabase } from '@/lib/supabase';
import { products as fallbackProducts, Product } from '@/lib/products';

export async function getProductsFromDB(): Promise<Product[]> {
  try {
    const { data, error } = await supabase.from('products').select('*');

    if (error || !data || data.length === 0) {
      return fallbackProducts;
    }

    return data.map((item: any) => ({
      sku: item.slug || item.id,
      name: item.title,
      slug: item.slug,
      price: Number(item.price),
      compareAtPrice: item.original_price ? Number(item.original_price) : undefined,
      category: item.category,
      parentCategory: 'Hair Accessories',
      description: item.description || '',
      images: Array.isArray(item.images) && item.images.length > 0 ? item.images : ['/products/SL001.png'],
      stockQuantity: item.stock_quantity ?? 20,
      isActive: item.in_stock ?? true,
    }));
  } catch (err) {
    console.error('Error fetching products from Supabase:', err);
    return fallbackProducts;
  }
}

export async function getProductBySlugFromDB(slug: string): Promise<Product | undefined> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return fallbackProducts.find((p) => p.slug === slug);
    }

    return {
      sku: data.slug || data.id,
      name: data.title,
      slug: data.slug,
      price: Number(data.price),
      compareAtPrice: data.original_price ? Number(data.original_price) : undefined,
      category: data.category,
      parentCategory: 'Hair Accessories',
      description: data.description || '',
      images: Array.isArray(data.images) && data.images.length > 0 ? data.images : ['/products/SL001.png'],
      stockQuantity: data.stock_quantity ?? 20,
      isActive: data.in_stock ?? true,
    };
  } catch (err) {
    console.error('Error fetching product by slug from Supabase:', err);
    return fallbackProducts.find((p) => p.slug === slug);
  }
}
