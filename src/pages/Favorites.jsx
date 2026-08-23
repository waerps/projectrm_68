import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { CourseCard } from "./Promotion";

const normalizeFavorite = (course) => {
  const price = Number(course.price || 0);
  const discount = Number(course.discount || 0);

  return {
    ...course,
    id: course.id,
    title: course.title || "คอร์สเรียน",
    price,
    discount,
    fullCost: course.fullCost != null
      ? Number(course.fullCost)
      : Math.max(0, price - discount),
    img: course.img || course.image || "/gray.jpg",
    dateRange: course.dateRange || "ยังไม่กำหนดวันเรียน",
    courseType: course.courseType || "คอร์สเรียน",
    availabilityName: course.availabilityName || "ยังไม่ระบุรูปแบบ",
  };
};

export default function Favorites() {
  const { favorites, cart, addToCart, toggleFavorite } = useShop();

  return (
    <div className="mx-auto mt-[110px] max-w-[1200px] px-4 pb-16 md:px-6">
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 to-orange-400 px-8 py-10 text-white">
        <Heart className="absolute -right-4 -top-4 h-32 w-32 fill-white/10 text-white/10" />
        <div className="relative mb-2 flex items-center gap-2">
          <Heart className="h-5 w-5 fill-white" />
          <span className="text-sm font-semibold uppercase tracking-widest text-rose-50">Favorites</span>
        </div>
        <h1 className="relative mb-2 text-3xl font-bold">คอร์สที่คุณสนใจ</h1>
        <p className="relative text-sm text-rose-50">
          {favorites.length > 0
            ? `คุณบันทึกไว้ ${favorites.length} คอร์ส กลับมาเลือกเรียนได้ทุกเมื่อ`
            : "เก็บคอร์สที่สนใจไว้ แล้วกลับมาดูภายหลังได้ง่าย ๆ"}
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-20 text-center">
          <Heart className="mx-auto mb-3 h-12 w-12 text-gray-200" />
          <p className="font-medium text-gray-500">ยังไม่มีคอร์สในรายการโปรด</p>
          <p className="mt-1 text-sm text-gray-400">กดรูปหัวใจบนคอร์สที่สนใจเพื่อบันทึกไว้ที่นี่</p>
          <Link
            to="/courses"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
          >
            <ShoppingBag className="h-4 w-4" /> ดูคอร์สทั้งหมด
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {favorites.map((course) => {
            const item = normalizeFavorite(course);
            const inCart = cart.some((cartItem) => String(cartItem.id) === String(item.id));

            return (
              <Link key={item.id} to={`/courses/${item.id}`} className="block h-full">
                <CourseCard
                  item={item}
                  isFav
                  inCart={inCart}
                  onAddToCart={() => addToCart(item)}
                  onToggleFavorite={() => toggleFavorite(item)}
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
