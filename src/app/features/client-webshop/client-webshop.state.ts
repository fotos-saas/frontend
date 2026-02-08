import { signal, computed } from '@angular/core';

export interface CartItem {
  id: string;
  mediaId: number;
  photoUrl: string;
  photoFilename: string;
  productId: number;
  paperSizeName: string;
  paperTypeName: string;
  unitPrice: number;
  quantity: number;
}

const STORAGE_KEY = 'webshop_cart';

function loadCart(): CartItem[] {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const cartItems = signal<CartItem[]>(loadCart());

export const cartTotal = computed(() =>
  cartItems().reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
);

export const cartItemCount = computed(() =>
  cartItems().reduce((sum, item) => sum + item.quantity, 0)
);

export function addToCart(item: Omit<CartItem, 'id'>): void {
  const existing = cartItems().find(
    (i) => i.mediaId === item.mediaId && i.productId === item.productId
  );

  if (existing) {
    updateQuantity(existing.id, existing.quantity + item.quantity);
    return;
  }

  const newItem: CartItem = {
    ...item,
    id: crypto.randomUUID(),
  };

  const updated = [...cartItems(), newItem];
  cartItems.set(updated);
  saveCart(updated);
}

export function removeFromCart(id: string): void {
  const updated = cartItems().filter((i) => i.id !== id);
  cartItems.set(updated);
  saveCart(updated);
}

export function updateQuantity(id: string, quantity: number): void {
  if (quantity < 1) {
    removeFromCart(id);
    return;
  }

  const updated = cartItems().map((i) => (i.id === id ? { ...i, quantity } : i));
  cartItems.set(updated);
  saveCart(updated);
}

export function clearCart(): void {
  cartItems.set([]);
  sessionStorage.removeItem(STORAGE_KEY);
}
