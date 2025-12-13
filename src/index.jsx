import { useEffect, useState } from "react";
import Aos from "aos";
import "aos/dist/aos.css";
import Swal from "sweetalert2";
import { Link } from "react-router";

export default function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    Aos.init({ duration: 500, once: false });
  }, []);

  const showAlert = () => {
    Swal.fire({
      title: "แจ้งเตือน",
      text: "คุณกดปุ่มแล้ว!",
      icon: "success",
      confirmButtonText: "ตกลง"
    });
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl text-blue-600" data-aos="fade-up">
        Hello Tailwind + AOS + Sweetalert2
      </h1>

      <div className="mt-5">
        <p className="text-red-500">Count : {count}</p>
        <button
          onClick={() => { setCount(count + 1); showAlert(); }}
          className="mt-3 px-5 py-2 bg-green-500 text-white rounded-lg"
        >
          Click Me
        </button>
      </div>
    </div>
  );
}