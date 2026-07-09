import { useState, useEffect } from "react";
import {
  Bell,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Trash2,
  Check,
  Loader2,
  Megaphone,
} from "lucide-react";


/* ───── ICON CONFIG ───── */
const TYPE_CONFIG = {
  schedule: {
    icon: <Calendar className="h-5 w-5 text-blue-600" />,
    bg: "bg-blue-100",
    label: "ตารางเรียน",
  },
  payment: {
    icon: <DollarSign className="h-5 w-5 text-green-600" />,
    bg: "bg-green-100",
    label: "การชำระเงิน",
  },
  alert: {
    icon: <AlertCircle className="h-5 w-5 text-red-600" />,
    bg: "bg-red-100",
    label: "แจ้งเตือน",
  },
  success: {
    icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    bg: "bg-green-100",
    label: "สำเร็จ",
  },
  announcement: {
    icon: <Megaphone className="h-5 w-5 text-orange-600" />,
    bg: "bg-orange-100",
    label: "ประกาศ",
  },
};


/* ───── TYPE CONFIG SAFE ───── */
function getTypeConfig(type) {
  return TYPE_CONFIG[type] || {
    icon: <Bell className="h-5 w-5 text-neutral-600" />,
    bg: "bg-neutral-100",
    label: "ทั่วไป",
  };
}


/* ───── TIME FORMAT ───── */
function formatTime(raw) {

  if (!raw) return "";

  const d = new Date(raw);

  if (isNaN(d.getTime())) {
    return "";
  }


  const now = new Date();

  const diff = now - d;

  const mins = Math.floor(diff / 60000);


  if (mins < 60) {
    return `${mins} นาทีที่แล้ว`;
  }


  const hrs = Math.floor(mins / 60);


  if (hrs < 24) {
    return `${hrs} ชั่วโมงที่แล้ว`;
  }


  const days = Math.floor(hrs / 24);


  return `${days} วันที่แล้ว`;
}




export default function StudentNotifications() {


  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("all");



  /* ───── MOCK DATA ───── */
  useEffect(() => {


    const mockNotifications = [


      {
        id: 1,
        type: "schedule",
        title: "เตือนตารางเรียน",
        message:
          "คณิตศาสตร์ ม.6 วันที่ 25/06/2026 เวลา 10:00 - 12:00 ห้อง 301",
        time: new Date(),
        isRead: false,
      },


      {
        id: 2,
        type: "payment",
        title: "ยืนยันการชำระเงิน",
        message:
          "ชำระเงินคอร์สภาษาอังกฤษ จำนวน 1500 บาทเรียบร้อยแล้ว",
        time: new Date(),
        isRead: true,
      },


      {
        id: 3,
        type: "announcement",
        title: "ประกาศใหม่",
        message:
          "เปิดคอร์สเรียนใหม่สำหรับนักเรียน",
        time: new Date(),
        isRead: false,
      }


    ];


    setNotifications(mockNotifications);

    setLoading(false);


  }, []);





  const filteredNotifications = notifications.filter((n)=>{


    if(filter==="all") return true;


    if(filter==="unread"){
      return !n.isRead;
    }


    return n.type===filter;


  });




  const unreadCount =
    notifications.filter((n)=>!n.isRead).length;



  function markAsRead(id){


    setNotifications(prev=>

      prev.map(n=>

        n.id===id

        ? {...n,isRead:true}

        : n

      )

    );


  }




  function markAllAsRead(){


    setNotifications(prev=>

      prev.map(n=>({
        ...n,
        isRead:true
      }))

    );


  }




  function deleteNotification(id){


    setNotifications(prev=>

      prev.filter(n=>n.id!==id)

    );


  }





  const FILTER_TABS=[

    {
      key:"all",
      label:`ทั้งหมด (${notifications.length})`
    },

    {
      key:"unread",
      label:`ยังไม่ได้อ่าน (${unreadCount})`
    },

    {
      key:"schedule",
      label:"ตารางเรียน"
    },

    {
      key:"payment",
      label:"การเงิน"
    },

    {
      key:"announcement",
      label:"ประกาศ"
    }

  ];






  if(loading){

    return (

      <div className="flex min-h-screen items-center justify-center mt-[90px]">

        <Loader2 className="h-8 w-8 animate-spin text-blue-500"/>

      </div>

    );

  }





  return (

    <div className="min-h-screen mt-[90px]">


      <div className="mx-auto">



        <div className="mb-6">


          <h1 className="text-2xl font-bold flex items-center gap-2">

            <Bell className="h-7 w-7 text-blue-600"/>

            การแจ้งเตือน

          </h1>



          <p className="text-sm text-neutral-500 mt-2">

            คุณมีการแจ้งเตือนที่ยังไม่ได้อ่าน {unreadCount} รายการ

          </p>


        </div>





        <div className="bg-white rounded-2xl p-2 mb-6">


          <div className="flex gap-2">


            {FILTER_TABS.map(t=>(


              <button

              key={t.key}

              onClick={()=>setFilter(t.key)}

              className={

                `px-4 py-2 rounded-lg text-sm

                ${
                  filter===t.key

                  ?"bg-blue-600 text-white"

                  :"hover:bg-gray-100"

                }`

              }

              >

                {t.label}


              </button>


            ))}



          </div>


        </div>






        <div className="space-y-3">


        {
          filteredNotifications.map(notif=>{


            const cfg=getTypeConfig(notif.type);



            return (


              <div

              key={notif.id}

              className="bg-white rounded-2xl "

              >


                <div className="flex gap-4">


                  <div className={`p-3 rounded-xl ${cfg.bg}`}>

                    {cfg.icon}

                  </div>




                  <div className="flex-1">


                    <div className="flex justify-between">


                      <h3 className="font-bold">


                        {notif.title}


                        {!notif.isRead && (

                          <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"/>

                        )}


                      </h3>



                      <span className="text-xs text-gray-500">

                        {formatTime(notif.time)}

                      </span>


                    </div>




                    <p className="text-sm text-gray-600 mt-2">

                      {notif.message}

                    </p>




                    <div className="flex gap-2 mt-3">


                    {!notif.isRead && (

                      <button

                      onClick={()=>markAsRead(notif.id)}

                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs"

                      >

                        <Check className="inline h-3 w-3"/>

                        อ่านแล้ว

                      </button>

                    )}




                    <button

                    onClick={()=>deleteNotification(notif.id)}

                    className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-xs"

                    >

                      <Trash2 className="inline h-3 w-3"/>

                      ลบ

                    </button>



                    </div>



                  </div>


                </div>


              </div>


            )


          })

        }



        </div>




      </div>


    </div>

  );


}