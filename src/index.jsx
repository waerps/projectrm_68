import Swal from "sweetalert2"
import Aos from "aos"
import { Link } from "react-router"
import Dash from "./dash"
import Nav from "./nav"

function Index(){
    return (
        <>


            {/* <div className="text-cyan-500">Hello Kai</div>
            <h1>I love you na lotus</h1>
            <Form/>
            <button onClick={showAlert}>adsjdkasd</button>
            <Link to=("/")>jdkasd</Link> */}
            {/* <Homee/>
            <Dash/> */}
            <Nav/>
        </>
    )
}

const showAlert = () =>{
    Swal.fire({
        title : "dsdcsdc",
        text : "csdcs",
        icon : "success",
        confirmButtonText : "้วววว",
        showCancelButton : true
    }).then
}

function Homee() {
  return (
    <>
      <header id="header"></header>

      <input type="checkbox" id="menu-toggle" className="menu-toggle" />
      <label htmlFor="menu-toggle" className="hamburger">☰</label>

      <nav id="nav-menu">
        <ul>
          <li className="page"><a href="#" className="pagehome">หน้าแรก</a></li>
          <li><a href="./sitemap.html" className="un-pagehome hover-page">หมวดหมู่</a></li>
          <li className="dropdown">
            <a href="#" className="un-pagehome">สถานที่ท่องเที่ยว ▾</a>
            <ul>
              <li><a href="#">แลนด์มาร์ค ▾</a>
                <ul>
                  <li><a href="./all-data1.html">วัดทำบุญ</a></li>
                  <li><a href="./all-data2.html">สวนสาธารณะ</a></li>
                  <li><a href="./all-data3.html">พิพิธภัณฑ์</a></li>
                </ul>
              </li>
              <li><a href="./all-data4.html">ร้านอาหาร</a></li>
              <li><a href="./all-data5.html">สถานบันเทิง</a></li>
              <li><a href="./all-data6.html">ที่พักแนะนำ</a></li>
            </ul>
          </li>
          <li><a href="./all-season.html" className="un-pagehome">สถานที่พิเศษตามฤดูกาล</a></li>
          <li><a href="./tavel.html" className="un-pagehome">การเดินทาง</a></li>
          <li><a href="./statis.html" className="un-pagehome">สถิติการท่องเที่ยว</a></li>
          <li><a href="./about.html" className="un-pagehome">ติดต่อเรา</a></li>
          <li><a href="./profile.html" className="un-pagehome">โปรไฟล์</a></li>
        </ul>
      </nav>

      <section className="head-section">
        <div className="head-text">
          <h3>ขอนแก่น สถานที่ท่องเที่ยวที่คุณ<span>ห้ามพลาด!!!</span></h3>
          <h6 style={{ marginBottom: 20 }}>
            เมื่อพูดถึงที่เที่ยวที่น่าสนใจในแถบภาคอีสาน จังหวัดแรกๆ ที่เราอยากจะแนะนำเลยก็คือที่เที่ยวขอนแก่น เพราะเป็นจังหวัดใจกลางภาคอีสานที่น่าสนใจมากๆ ความน่าสนใจอันดับแรกก็คือขนาดของขอนแก่น ที่ค่อนข้างใหญ่ และเป็นศูนย์กลางของทุกอย่าง มีสิ่งอำนวยความสะดวก ความเจริญครบครัน
          </h6>
          <div className="search-bar">
            <a href="./search.html">
              <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" fill="#fff" className="bi bi-search" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
              </svg>
            </a>
          </div>
        </div>
        <div className="wave-box">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" style={{ transform: "scaleY(-1)" }}>
            <path fill="#fff" fillOpacity="1" d="M0,128L48,160C96,192,192,256,288,240C384,224,480,128,576,112C672,96,768,160,864,165.3C960,171,1056,117,1152,106.7C1248,96,1344,128,1392,144L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      <section className="main-content">

        <div id="carouselExampleCaptions" className="carousel slide" data-bs-ride="carousel">
          <div className="carousel-indicators">
            <button type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
            <button type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide-to="1" aria-label="Slide 2"></button>
            <button type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide-to="2" aria-label="Slide 3"></button>
            <button type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide-to="3" aria-label="Slide 4"></button>
          </div>

          <div className="carousel-inner">
            <div className="carousel-item active" data-bs-interval="2000">
              <div className="carousel-caption d-none d-md-block">
                <h3>บึงสีฐาน</h3>
                <p>สถานที่ท่องเที่ยวที่เหมาะสำหรับการพักผ่อนและชื่นชมธรรมชาติ บรรยากาศร่มรื่นด้วยต้นไม้ใหญ่รายล้อมบึงน้ำกว้าง </p>
              </div>
            </div>
            <div className="carousel-item" data-bs-interval="2000">
              <div className="carousel-caption d-none d-md-block">
                <h3>พิพิธภัณฑ์ไดโนเสาร์ภูเวียง</h3>
                <p>จัดแสดงเรื่องราวของซากดึกดำบรรพ์ สังกัดกรมทรัพยากรธรณี กระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม</p>
              </div>
            </div>
            <div className="carousel-item" data-bs-interval="2000">
              <div className="carousel-caption d-none d-md-block">
                <h3>สถานีรถไฟ</h3>
                <p>การรถไฟแห่งประเทศไทย ระบบขนส่งทางรางที่ครอบคลุมทั่วทุกภูมิภาคของประเทศ ที่มีความปลอดภัย สะดวก สบายในการเดินทาง</p>
              </div>
            </div>
            <div className="carousel-item" data-bs-interval="2000">
              <div className="carousel-caption d-none d-md-block">
                <h3>Hidden Town</h3>
                <p>จุดเด่นคือวงดนตรีแจ๊ส ซึ่งจะมาเล่นทุกศุกร์เสาร์ ขอแนะนำให้จองโต๊ะ เพราะร้านเล็ก มีแค่ไม่กี่โต๊ะ อาหารมีนิดหน่อย เน้นเครื่องดื่ม </p>
              </div>
            </div>
          </div>

          <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide="prev">
            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Previous</span>
          </button>
          <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide="next">
            <span className="carousel-control-next-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Next</span>
          </button>
        </div>

        <h3 className="head-hl">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#ffb13bee" className="bi bi-geo-alt" viewBox="0 0 16 16">
            <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A32 32 0 0 1 8 14.58a32 32 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10" />
            <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4m0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
          </svg>
          ขอนแก่น Highlight
        </h3>

        {/* --- highlight section --- */}
        <div className="highling">
          {[
            { title: "Hidden Town", desc: "ร้านไม่ใหญ่มาก มีที่นั่งไม่กี่โต๊ะ แต่บรรยากาศดีสุด ๆ มีเล่นสดเฉพาะเสาร์อาทิตย์เท่านั้น", link: "./all-data5.html" },
            { title: "บึงสีฐาน", desc: "สัมผัสบรรยากาศสงบ วิวสวย และกิจกรรมสนุก เช่น ปั่นจักรยานรอบบึง พร้อมชมพระอาทิตย์ตกที่น่าประทับใจ", link: "./data-seethan.html" },
            { title: "พิพิธภัณฑ์วิทยาศาสตร์", desc: "สัมผัสประสบการณ์การเรียนรู้ที่สนุกสนานกับนิทรรศการต่างๆ", link: "./data-science.html" },
            { title: "วัดหนองแวง", desc: "สถาปัตยกรรมที่งดงามและบรรยากาศที่เงียบสงบ คุณจะได้สัมผัสความสงบใจ พร้อมชมวิวบึงแก่นนครที่แสนสวยงาม", link: "./data1.html" }
          ].map((card, index) => (
            <div className="card" key={index}>
              <div className="card-body">
                <h5 className="card-title">{card.title}</h5>
                <p className="card-text">{card.desc}</p>
                <a href={card.link} className="btn">อ่านเพิ่มเติม</a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- Footer --- */}
      <footer>
        <div className="footer-content">
          <div className="footer-left">
            <h5>Khon Kaen Uncovered</h5>
            <p>
              เว็บไซต์รวบรวมข้อมูลท่องเที่ยวจังหวัดขอนแก่น คาเฟ่ ร้านอาหาร ที่พัก สถานบันเทิง
            </p>
          </div>
          <div className="footer-center">
            <h6>ติดตามพวกเรา</h6>
            <div className="social-icons">
              <a href="#"><i className="bi bi-instagram"></i></a>
              <a href="#"><i className="bi bi-facebook"></i></a>
              <a href="#"><i className="bi bi-line"></i></a>
            </div>
          </div>
          <div className="footer-right">
            <h6>ติดต่อโฆษณา:</h6>
            <p>
              E-mail: natthawut.pha@kkumail.com <br />
              E-mail: gamontip.g@kkumail.com
            </p>
            <button>ขอรายละเอียดโฆษณา คลิก</button>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            Copyright © 2024-2024 บทความ รูปภาพ ที่จัดทำขึ้นโดยเว็บไซต์ Khon Kaen Uncovered
            สงวนลิขสิทธิ์ตามกฎหมาย ห้ามผู้ใดทำซ้ำหรือเผยแพร่เชิงพาณิชย์โดยไม่ได้รับอนุญาต
          </p>
        </div>
      </footer>

      <a href="#header">
        <div className="button-up">
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="#fff" className="bi bi-chevron-double-up" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M7.646 2.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 3.707 2.354 9.354a.5.5 0 1 1-.708-.708z" />
            <path fillRule="evenodd" d="M7.646 6.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 7.707l-5.646 5.647a.5.5 0 0 1-.708-.708z" />
          </svg>
        </div>
      </a>
    </>
  );
}


function Form(){
    return (
        <>
        <form>
  <div class="space-y-12">
    <div class="border-b border-gray-900/10 pb-12">
      <h2 class="text-base/7 font-semibold text-gray-900">Profile</h2>
      <p class="mt-1 text-sm/6 text-gray-600">This information will be displayed publicly so be careful what you share.</p>

      <div class="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <div class="sm:col-span-4">
          <label for="username" class="block text-sm/6 font-medium text-gray-900">Username</label>
          <div class="mt-2">
            <div class="flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
              <div class="shrink-0 text-base text-gray-500 select-none sm:text-sm/6">workcation.com/</div>
              <input id="username" type="text" name="username" placeholder="janesmith" class="block min-w-0 grow bg-white py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6" />
            </div>
          </div>
        </div>

        <div class="col-span-full">
          <label for="about" class="block text-sm/6 font-medium text-gray-900">About</label>
          <div class="mt-2">
            <textarea id="about" name="about" rows="3" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
          </div>
          <p class="mt-3 text-sm/6 text-gray-600">Write a few sentences about yourself.</p>
        </div>

        <div class="col-span-full">
          <label for="photo" class="block text-sm/6 font-medium text-gray-900">Photo</label>
          <div class="mt-2 flex items-center gap-x-3">
            <svg viewBox="0 0 24 24" fill="currentColor" data-slot="icon" aria-hidden="true" class="size-12 text-gray-300">
              <path d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clip-rule="evenodd" fill-rule="evenodd" />
            </svg>
            <button type="button" class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50">Change</button>
          </div>
        </div>

        <div class="col-span-full">
          <label for="cover-photo" class="block text-sm/6 font-medium text-gray-900">Cover photo</label>
          <div class="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
            <div class="text-center">
              <svg viewBox="0 0 24 24" fill="currentColor" data-slot="icon" aria-hidden="true" class="mx-auto size-12 text-gray-300">
                <path d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clip-rule="evenodd" fill-rule="evenodd" />
              </svg>
              <div class="mt-4 flex text-sm/6 text-gray-600">
                <label for="file-upload" class="relative cursor-pointer rounded-md bg-transparent font-semibold text-indigo-600 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-600 hover:text-indigo-500">
                  <span>Upload a file</span>
                  <input id="file-upload" type="file" name="file-upload" class="sr-only" />
                </label>
                <p class="pl-1">or drag and drop</p>
              </div>
              <p class="text-xs/5 text-gray-600">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="border-b border-gray-900/10 pb-12">
      <h2 class="text-base/7 font-semibold text-gray-900">Personal Information</h2>
      <p class="mt-1 text-sm/6 text-gray-600">Use a permanent address where you can receive mail.</p>

      <div class="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <div class="sm:col-span-3">
          <label for="first-name" class="block text-sm/6 font-medium text-gray-900">First name</label>
          <div class="mt-2">
            <input id="first-name" type="text" name="first-name" autocomplete="given-name" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>

        <div class="sm:col-span-3">
          <label for="last-name" class="block text-sm/6 font-medium text-gray-900">Last name</label>
          <div class="mt-2">
            <input id="last-name" type="text" name="last-name" autocomplete="family-name" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>

        <div class="sm:col-span-4">
          <label for="email" class="block text-sm/6 font-medium text-gray-900">Email address</label>
          <div class="mt-2">
            <input id="email" type="email" name="email" autocomplete="email" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>

        <div class="sm:col-span-3">
          <label for="country" class="block text-sm/6 font-medium text-gray-900">Country</label>
          <div class="mt-2 grid grid-cols-1">
            <select id="country" name="country" autocomplete="country-name" class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
              <option>United States</option>
              <option>Canada</option>
              <option>Mexico</option>
            </select>
            <svg viewBox="0 0 16 16" fill="currentColor" data-slot="icon" aria-hidden="true" class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4">
              <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" fill-rule="evenodd" />
            </svg>
          </div>
        </div>

        <div class="col-span-full">
          <label for="street-address" class="block text-sm/6 font-medium text-gray-900">Street address</label>
          <div class="mt-2">
            <input id="street-address" type="text" name="street-address" autocomplete="street-address" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>

        <div class="sm:col-span-2 sm:col-start-1">
          <label for="city" class="block text-sm/6 font-medium text-gray-900">City</label>
          <div class="mt-2">
            <input id="city" type="text" name="city" autocomplete="address-level2" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>

        <div class="sm:col-span-2">
          <label for="region" class="block text-sm/6 font-medium text-gray-900">State / Province</label>
          <div class="mt-2">
            <input id="region" type="text" name="region" autocomplete="address-level1" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>

        <div class="sm:col-span-2">
          <label for="postal-code" class="block text-sm/6 font-medium text-gray-900">ZIP / Postal code</label>
          <div class="mt-2">
            <input id="postal-code" type="text" name="postal-code" autocomplete="postal-code" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
      </div>
    </div>

    <div class="border-b border-gray-900/10 pb-12">
      <h2 class="text-base/7 font-semibold text-gray-900">Notifications</h2>
      <p class="mt-1 text-sm/6 text-gray-600">We'll always let you know about important changes, but you pick what else you want to hear about.</p>

      <div class="mt-10 space-y-10">
        <fieldset>
          <legend class="text-sm/6 font-semibold text-gray-900">By email</legend>
          <div class="mt-6 space-y-6">
            <div class="flex gap-3">
              <div class="flex h-6 shrink-0 items-center">
                <div class="group grid size-4 grid-cols-1">
                  <input id="comments" type="checkbox" name="comments" checked aria-describedby="comments-description" class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto" />
                  <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25">
                    <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-checked:opacity-100" />
                    <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-indeterminate:opacity-100" />
                  </svg>
                </div>
              </div>
              <div class="text-sm/6">
                <label for="comments" class="font-medium text-gray-900">Comments</label>
                <p id="comments-description" class="text-gray-500">Get notified when someones posts a comment on a posting.</p>
              </div>
            </div>
            <div class="flex gap-3">
              <div class="flex h-6 shrink-0 items-center">
                <div class="group grid size-4 grid-cols-1">
                  <input id="candidates" type="checkbox" name="candidates" aria-describedby="candidates-description" class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto" />
                  <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25">
                    <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-checked:opacity-100" />
                    <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-indeterminate:opacity-100" />
                  </svg>
                </div>
              </div>
              <div class="text-sm/6">
                <label for="candidates" class="font-medium text-gray-900">Candidates</label>
                <p id="candidates-description" class="text-gray-500">Get notified when a candidate applies for a job.</p>
              </div>
            </div>
            <div class="flex gap-3">
              <div class="flex h-6 shrink-0 items-center">
                <div class="group grid size-4 grid-cols-1">
                  <input id="offers" type="checkbox" name="offers" aria-describedby="offers-description" class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto" />
                  <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25">
                    <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-checked:opacity-100" />
                    <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-indeterminate:opacity-100" />
                  </svg>
                </div>
              </div>
              <div class="text-sm/6">
                <label for="offers" class="font-medium text-gray-900">Offers</label>
                <p id="offers-description" class="text-gray-500">Get notified when a candidate accepts or rejects an offer.</p>
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend class="text-sm/6 font-semibold text-gray-900">Push notifications</legend>
          <p class="mt-1 text-sm/6 text-gray-600">These are delivered via SMS to your mobile phone.</p>
          <div class="mt-6 space-y-6">
            <div class="flex items-center gap-x-3">
              <input id="push-everything" type="radio" name="push-notifications" checked class="relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden" />
              <label for="push-everything" class="block text-sm/6 font-medium text-gray-900">Everything</label>
            </div>
            <div class="flex items-center gap-x-3">
              <input id="push-email" type="radio" name="push-notifications" class="relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden" />
              <label for="push-email" class="block text-sm/6 font-medium text-gray-900">Same as email</label>
            </div>
            <div class="flex items-center gap-x-3">
              <input id="push-nothing" type="radio" name="push-notifications" class="relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden" />
              <label for="push-nothing" class="block text-sm/6 font-medium text-gray-900">No push notifications</label>
            </div>
          </div>
        </fieldset>
      </div>
    </div>
  </div>

  <div class="mt-6 flex items-center justify-end gap-x-6">
    <button type="button" class="text-sm/6 font-semibold text-gray-900">Cancel</button>
    <button type="submit" class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Save</button>
  </div>
</form>

        </>
    )
}


export default Index