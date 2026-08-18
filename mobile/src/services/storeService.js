// FILE: mobile/src/services/storeService.js
// Purpose: NutriStore API — products, cart management, checkout, orders
// Mirrors: web's NutriStore.jsx axios calls

import api from './api';
import { ENDPOINTS } from '../constants/apiConfig';

// ── Products ──────────────────────────────────────────────────
export async function getProducts(params = {}) {
  // params: { category, search, ordering, etc. }
  const response = await api.get(ENDPOINTS.storeProducts, { params });
  return response.data;
}

export async function getProductDetail(id) {
  const response = await api.get(ENDPOINTS.storeProductDetail(id));
  return response.data;
}

// ── Cart ──────────────────────────────────────────────────────
export async function getCart() {
  const response = await api.get(ENDPOINTS.storeCart);
  return response.data;
}

export async function addToCart(productId, quantity = 1) {
  const response = await api.post(ENDPOINTS.storeCartAdd, {
    product_id: productId,
    quantity,
  });
  return response.data;
}

export async function updateCartItem(itemId, quantity) {
  const response = await api.patch(ENDPOINTS.storeCartUpdate(itemId), { quantity });
  return response.data;
}

export async function removeCartItem(itemId) {
  const response = await api.delete(ENDPOINTS.storeCartUpdate(itemId));
  return response.data;
}

// ── Checkout ──────────────────────────────────────────────────
export async function checkout() {
  const response = await api.post(ENDPOINTS.storeCheckout, {});
  return response.data;
}

// ── Order History ─────────────────────────────────────────────
export async function getOrders() {
  const response = await api.get(ENDPOINTS.storeOrders);
  return response.data;
}
