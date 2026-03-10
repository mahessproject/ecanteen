"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { Menu } from "@/lib/supabase";

export interface CartItem {
  menu: Menu;
  jumlah: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (menu: Menu) => void;
  removeItem: (menuId: number) => void;
  updateQuantity: (menuId: number, jumlah: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalHarga: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((menu: Menu) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menu.id === menu.id);
      if (existing) {
        return prev.map((i) => (i.menu.id === menu.id ? { ...i, jumlah: i.jumlah + 1 } : i));
      }
      return [...prev, { menu, jumlah: 1 }];
    });
  }, []);

  const removeItem = useCallback((menuId: number) => {
    setItems((prev) => prev.filter((i) => i.menu.id !== menuId));
  }, []);

  const updateQuantity = useCallback((menuId: number, jumlah: number) => {
    if (jumlah <= 0) {
      setItems((prev) => prev.filter((i) => i.menu.id !== menuId));
      return;
    }
    setItems((prev) => prev.map((i) => (i.menu.id === menuId ? { ...i, jumlah } : i)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.jumlah, 0);
  const totalHarga = items.reduce((sum, i) => sum + i.menu.harga * i.jumlah, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalHarga }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
