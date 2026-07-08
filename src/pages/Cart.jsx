import { useShop } from "../components/context/ShopContext";
import { Trash2 } from "lucide-react";

export default function Cart() {
  const { cart, removeFromCart } = useShop();

  if (cart.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center text-neutral-500">
        ตะกร้าสินค้าว่างเปล่า
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">ตะกร้าสินค้า</h1>
      <div className="space-y-4">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
            <div>
              <div className="font-medium text-neutral-900">{item.title}</div>
              <div className="text-sm text-orange-500">{item.price}</div>
            </div>
            <button onClick={() => removeFromCart(item.id)} className="text-neutral-400 hover:text-red-500">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}