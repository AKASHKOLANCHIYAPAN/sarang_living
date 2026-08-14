import Hero from '@/components/home/Hero';
import ShopByCategory from '@/components/home/ShopByCategory';
import ShopByPrice from '@/components/home/ShopByPrice';
import ProductRail from '@/components/home/ProductRail';
import TrustBar from '@/components/home/TrustBar';
import Newsletter from '@/components/home/Newsletter';
import { getNewArrivals, getBestsellers } from '@/lib/products';

export default function Home() {
  const newArrivals = getNewArrivals(8);
  const bestsellers = getBestsellers(8);

  return (
    <>
      <Hero />
      <ShopByCategory />
      <ShopByPrice />
      <ProductRail
        id="new-arrivals"
        title="New Arrivals"
        subtitle="The latest additions to our collection"
        products={newArrivals}
        viewAllHref="/products?sort=newest"
      />
      <ProductRail
        id="bestsellers"
        title="Bestsellers"
        subtitle="The pieces everyone is loving right now"
        products={bestsellers}
        viewAllHref="/products?sort=bestsellers"
      />
      <TrustBar />
      <Newsletter />
    </>
  );
}
