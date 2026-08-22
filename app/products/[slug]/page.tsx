import { getProducts } from '@/lib/products-db';
import ProductDetailClient from './ProductDetailClient';

export async function generateStaticParams() {
  const products = await getProducts({ onlyActive: true });
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} />;
}
