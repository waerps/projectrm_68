import { useShop } from "../context/ShopContext";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Favorites() {
  const { favorites, toggleFavorite } = useShop();
  const navigate = useNavigate();

  if (favorites.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center text-neutral-500">
        ❤️ ยังไม่มีรายการโปรด
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">รายการโปรด</h1>
      <div className="space-y-4">
        {favorites.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
            <div
              className="cursor-pointer"
              onClick={() => navigate(`/courses/${item.id}`)}
            >
              <div className="font-medium text-neutral-900">{item.title}</div>
              <div className="text-sm text-orange-500">{item.price}</div>
            </div>
            <button onClick={() => toggleFavorite(item)} className="text-red-400 hover:text-red-600">
              <Heart className="h-5 w-5 fill-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}