import { createContext, useContext, useState, useEffect } from "react";

const ShopContext = createContext();

export function ShopProvider({ children }) {
  const [cart, setCart] = useState(() =>
    JSON.parse(localStorage.getItem("cart") || "[]")
  );
  const [favorites, setFavorites] = useState(() =>
    JSON.parse(localStorage.getItem("favorites") || "[]")
  );

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  const addToCart = (course) => {
    setCart((prev) =>
      prev.find((c) => c.id === course.id) ? prev : [...prev, course]
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((c) => String(c.id) !== String(id)));
  };

  const toggleCart = (course) => {
    setCart((prev) =>
      prev.some((c) => String(c.id) === String(course.id))
        ? prev.filter((c) => String(c.id) !== String(course.id))
        : [...prev, course]
    );
  };

  const removeManyFromCart = (ids) => {
    const removedIds = new Set(ids.map(String));
    setCart((prev) => prev.filter((c) => !removedIds.has(String(c.id))));
  };

  const toggleFavorite = (course) => {
    setFavorites((prev) =>
      prev.find((c) => c.id === course.id)
        ? prev.filter((c) => c.id !== course.id)
        : [...prev, course]
    );
  };

  return (
    <ShopContext.Provider value={{ cart, favorites, addToCart, toggleCart, removeFromCart, removeManyFromCart, toggleFavorite }}>
      {children}
    </ShopContext.Provider>
  );
}

export const useShop = () => useContext(ShopContext);
