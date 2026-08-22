'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ShieldCheck,
  MapPin,
  Plus,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowRight,
  ShoppingBag,
  CreditCard,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { formatPrice, getAssetPath } from '@/lib/utils';
import type { UserAddress, ShippingAddressInput } from '@/lib/orders-db';
import Button from '@/components/ui/Button';

function CheckoutContent() {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized, isLoading: authLoading, checkAuth } = useAuthStore();
  const { items, subtotal, clearCart } = useCartStore();

  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // New Address form state
  const [newAddress, setNewAddress] = useState<ShippingAddressInput>({
    recipient_name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    is_default: true,
  });
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState<'cod'>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check auth
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated && !authLoading) {
      router.push('/login?redirect=/checkout');
    }
  }, [isInitialized, isAuthenticated, authLoading, router]);

  // Load saved addresses when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      async function loadAddresses() {
        setLoadingAddresses(true);
        try {
          const res = await fetch('/api/addresses');
          const data = await res.json();
          if (data.success && Array.isArray(data.addresses)) {
            setSavedAddresses(data.addresses);
            if (data.addresses.length > 0) {
              const defaultAddr = data.addresses.find((a: UserAddress) => a.is_default) || data.addresses[0];
              setSelectedAddressId(defaultAddr.id);
            } else {
              setSelectedAddressId('new');
              if (user?.name) {
                setNewAddress((prev) => ({
                  ...prev,
                  recipient_name: user.name || '',
                  phone: user.phone || '',
                }));
              }
            }
          }
        } catch (err) {
          console.error('Failed to load addresses:', err);
        } finally {
          setLoadingAddresses(false);
        }
      }
      loadAddresses();
    }
  }, [isAuthenticated, user]);

  const rawSubtotal = subtotal();
  const shippingFee = rawSubtotal >= 999 ? 0 : items.length > 0 ? 49 : 0;
  const orderTotal = rawSubtotal + shippingFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (items.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        items: items.map((item) => ({
          sku: item.product.sku,
          quantity: item.quantity,
        })),
        paymentMethod,
      };

      if (selectedAddressId !== 'new') {
        payload.addressId = selectedAddressId;
      } else {
        payload.address = newAddress;
        payload.saveAddress = saveAddressForFuture;
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to place order. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Successful order creation
      clearCart();
      router.push(`/checkout/success?orderId=${data.orderId}`);
    } catch (err: any) {
      console.error('Order submission error:', err);
      setErrorMessage(err.message || 'Network error occurred while creating order.');
      setIsSubmitting(false);
    }
  };

  if (!isInitialized || authLoading) {
    return (
      <div className="catalog-page">
        <div className="container-sarang">
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#6B7280' }}>
            <div className="login-spinner" style={{ margin: '0 auto 16px' }} />
            <p>Initializing secure checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="catalog-page">
        <div className="container-sarang">
          <div className="catalog-empty" style={{ maxWidth: '500px', margin: '60px auto' }}>
            <ShoppingBag size={64} strokeWidth={1} className="catalog-empty-icon" />
            <h2 className="catalog-empty-title">Your cart is empty</h2>
            <p className="catalog-empty-text">
              Add some of our beautiful Korean hair accessories to your bag before checking out.
            </p>
            <Link href="/products" className="account-btn-primary" style={{ display: 'inline-block', marginTop: '16px' }}>
              Explore Collection
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page-container container-sarang">
      {/* Checkout Title */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="checkout-header"
      >
        <h1 className="checkout-title">Secure Checkout</h1>
        <div className="checkout-badge">
          <ShieldCheck size={16} />
          <span>Encrypted Order Processing</span>
        </div>
      </motion.div>

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="login-alert login-alert-error"
          style={{ marginBottom: '24px' }}
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </motion.div>
      )}

      <form onSubmit={handlePlaceOrder} className="checkout-grid">
        {/* Left Column: Address & Payment */}
        <div className="checkout-left">
          {/* Delivery Address Card */}
          <div className="checkout-card">
            <div className="checkout-card-header">
              <div className="checkout-step-number">1</div>
              <h2 className="checkout-card-title">Delivery Address</h2>
            </div>

            {loadingAddresses ? (
              <p className="text-sm text-gray-500">Loading saved addresses...</p>
            ) : (
              <div className="address-selection-list">
                {savedAddresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`address-radio-card ${selectedAddressId === addr.id ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="selectedAddress"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                    />
                    <div className="address-radio-info">
                      <div className="address-radio-top">
                        <span className="address-radio-name">{addr.recipient_name}</span>
                        {addr.is_default && <span className="address-default-pill">Default</span>}
                      </div>
                      <p className="address-radio-text">
                        {addr.street}, {addr.city}, {addr.state} — {addr.postal_code}
                      </p>
                      <span className="address-radio-phone">📞 {addr.phone}</span>
                    </div>
                  </label>
                ))}

                {/* Option to enter a new address */}
                <label className={`address-radio-card ${selectedAddressId === 'new' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="selectedAddress"
                    value="new"
                    checked={selectedAddressId === 'new'}
                    onChange={() => setSelectedAddressId('new')}
                  />
                  <div className="address-radio-info">
                    <span className="address-radio-name">
                      {savedAddresses.length > 0 ? '+ Add & Use New Address' : 'Enter Delivery Address'}
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* New Address Fields (Rendered if 'new' is selected) */}
            {selectedAddressId === 'new' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="new-address-fields"
              >
                <div className="checkout-form-row">
                  <div className="login-field">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Receiver's full name"
                      value={newAddress.recipient_name}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, recipient_name: e.target.value })
                      }
                      className="checkout-input"
                    />
                  </div>
                  <div className="login-field">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={newAddress.phone}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, phone: e.target.value })
                      }
                      className="checkout-input"
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label>Street Address / Flat / Landmark *</label>
                  <input
                    type="text"
                    required
                    placeholder="House/Flat No., Building, Street Area"
                    value={newAddress.street}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, street: e.target.value })
                    }
                    className="checkout-input"
                  />
                </div>

                <div className="checkout-form-row-3">
                  <div className="login-field">
                    <label>City *</label>
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, city: e.target.value })
                      }
                      className="checkout-input"
                    />
                  </div>
                  <div className="login-field">
                    <label>State *</label>
                    <input
                      type="text"
                      required
                      placeholder="State"
                      value={newAddress.state}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, state: e.target.value })
                      }
                      className="checkout-input"
                    />
                  </div>
                  <div className="login-field">
                    <label>PIN Code *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="600001"
                      value={newAddress.postal_code}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, postal_code: e.target.value })
                      }
                      className="checkout-input"
                    />
                  </div>
                </div>

                <label className="checkbox-label" style={{ marginTop: '12px' }}>
                  <input
                    type="checkbox"
                    checked={saveAddressForFuture}
                    onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                  />
                  <span>Save this address for future purchases</span>
                </label>
              </motion.div>
            )}
          </div>

          {/* Payment Method Card */}
          <div className="checkout-card" style={{ marginTop: '24px' }}>
            <div className="checkout-card-header">
              <div className="checkout-step-number">2</div>
              <h2 className="checkout-card-title">Payment Method</h2>
            </div>

            <div className="payment-options-list">
              <label className="payment-radio-card selected">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <div className="payment-radio-info">
                  <div className="payment-radio-title">
                    <Truck size={18} />
                    <span>Pay on Delivery / Cash on Delivery (COD)</span>
                  </div>
                  <p className="payment-radio-desc">
                    Pay securely with cash or UPI at the time of package delivery at your doorstep.
                  </p>
                </div>
              </label>
            </div>

            <div className="payment-notice-box">
              <Lock size={14} />
              <span>
                Online Gateways (Cards, NetBanking &amp; UPI) are being prepared for Phase 5.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="checkout-right">
          <div className="checkout-summary-card">
            <h2 className="checkout-summary-title">Order Summary</h2>

            <div className="checkout-items-list">
              {items.map((item) => (
                <div key={item.product.sku} className="checkout-item-row">
                  <div className="checkout-item-thumb">
                    {item.product.images.length > 0 ? (
                      <img
                        src={getAssetPath(item.product.images[0])}
                        alt={item.product.name}
                        className="checkout-item-img"
                      />
                    ) : (
                      <div className="checkout-item-placeholder" />
                    )}
                    <span className="checkout-item-qty-badge">{item.quantity}</span>
                  </div>
                  <div className="checkout-item-info">
                    <h4 className="checkout-item-name">{item.product.name}</h4>
                    <span className="checkout-item-sku">SKU: {item.product.sku}</span>
                  </div>
                  <span className="checkout-item-price">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="checkout-totals">
              <div className="checkout-totals-row">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>{formatPrice(rawSubtotal)}</span>
              </div>
              <div className="checkout-totals-row">
                <span>Shipping</span>
                <span>{shippingFee === 0 ? <strong className="text-green">FREE</strong> : formatPrice(shippingFee)}</span>
              </div>
              {shippingFee === 0 && (
                <p className="checkout-shipping-perk">🎉 Free shipping threshold applied (Orders &gt; ₹999)</p>
              )}

              <div className="checkout-divider" />

              <div className="checkout-totals-row checkout-grand-total">
                <span>Total Amount</span>
                <span>{formatPrice(orderTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="checkout-place-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="login-spinner" />
                  Verifying &amp; Placing Order...
                </>
              ) : (
                <>
                  Place Order — {formatPrice(orderTotal)}
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="checkout-security-guarantee">
              <ShieldCheck size={16} />
              <span>Authentic products &amp; Pan-India tracked shipping</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="catalog-page">
          <div className="container-sarang">
            <div style={{ padding: '80px 0', textAlign: 'center', color: '#6B7280' }}>
              <div className="login-spinner" style={{ margin: '0 auto 16px' }} />
              <p>Loading checkout...</p>
            </div>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
