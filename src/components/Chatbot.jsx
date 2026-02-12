import React, { useState, useRef, useEffect } from 'react';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: 'สวัสดีครับ! ผมคือแชทบอทของศรเสริมติวเตอร์ มีอะไรให้ช่วยไหมครับ?', sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: 'การสนทนาวันนี้', messages: [...messages], date: new Date() }
  ]);
  const [currentChatId, setCurrentChatId] = useState(1);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user'
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    // จำลองการตอบกลับของบอท
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: generateBotResponse(inputValue),
        sender: 'bot'
      };
      setMessages(prev => [...prev, botResponse]);
      
      // อัพเดทประวัติการสนทนา
      setChatHistory(prev => 
        prev.map(chat => 
          chat.id === currentChatId 
            ? { ...chat, messages: [...messages, newMessage, botResponse] }
            : chat
        )
      );
    }, 1000);
  };

  const generateBotResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('คอร์ส') || input.includes('เรียน')) {
      return 'เรามีคอร์สเรียนหลากหลายตั้งแต่ ม.1 - ม.6 ครับ ทั้งคอร์สเพิ่มเกรด สอบเข้า และสอบแข่งขัน สนใจคอร์สไหนเป็นพิเศษครับ?';
    } else if (input.includes('ราคา') || input.includes('เท่าไร')) {
      return 'ราคาคอร์สเริ่มต้นที่ 350 บาท สำหรับ E-Quiz และมีคอร์สติวเข้มราคา 5,400 - 6,400 บาท ครับ ขึ้นอยู่กับวิชาและระดับชั้น';
    } else if (input.includes('สมัคร') || input.includes('ลงทะเบียน')) {
      return 'สามารถสมัครได้ทางหน้าเว็บไซต์ของเรา หรือติดต่อสอบถามเพิ่มเติมที่เบอร์โทรศัพท์ครับ ต้องการข้อมูลเพิ่มเติมไหมครับ?';
    } else if (input.includes('เวลา') || input.includes('วัน')) {
      return 'เราเปิดสอนทั้งวันเสาร์-อาทิตย์ และวันธรรมดาตอนเย็นครับ สามารถเลือกเวลาที่สะดวกได้เลยครับ';
    } else if (input.includes('ที่ตั้ง') || input.includes('อยู่ไหน')) {
      return 'สถาบันของเราตั้งอยู่ที่จังหวัดขอนแก่นครับ สอนโดยทีมงานที่จบจากมหาวิทยาลัยขอนแก่น คณะครุศาสตร์';
    } else if (input.includes('สอบถาม') || input.includes('ถาม') || input.includes('ติดต่อ')) {
      return 'สามารถติดต่อสอบถามเพิ่มเติมได้ตลอดเวลาครับ ยินดีให้คำปรึกษาเกี่ยวกับการเรียน การสอบ และแนะแนวการศึกษา';
    } else {
      return 'ขอบคุณที่ติดต่อครับ มีคำถามอะไรเพิ่มเติมเกี่ยวกับคอร์สเรียน การสมัคร หรือข้อมูลอื่นๆ สอบถามได้เลยนะครับ 😊';
    }
  };

  const handleNewChat = () => {
    const newChatId = chatHistory.length + 1;
    const newChat = {
      id: newChatId,
      title: `การสนทนา ${newChatId}`,
      messages: [
        { id: 1, text: 'สวัสดีครับ! ผมคือแชทบอทของศรเสริมติวเตอร์ มีอะไรให้ช่วยไหมครับ?', sender: 'bot' }
      ],
      date: new Date()
    };
    
    setChatHistory(prev => [newChat, ...prev]);
    setCurrentChatId(newChatId);
    setMessages(newChat.messages);
  };

  const loadChat = (chatId) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    
    if (isToday) {
      return 'วันนี้';
    }
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  // ปุ่มมุมขวาล่าง
  if (!isOpen && !isFullscreen) {
    return (
<button
  onClick={() => setIsOpen(true)}
  className="
    fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full
    bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-2xl
    flex items-center justify-center
    transition-transform duration-300 hover:scale-110
    animate-botFloat
  "
>
  <img
    src="/chatbot.png"
    alt="Chatbot"
    className="h-10 w-10 select-none pointer-events-none"
    draggable="false"
  />
</button>

    );
  }

  // โหมด Fullscreen
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-gray-50 z-40 pt-20">
        <div className="h-full max-w-[1400px] mx-auto px-4 pb-4">
          <div className="flex gap-4 h-full">
            {/* Sidebar - ประวัติการสนทนา */}
            <div className="w-80 bg-white rounded-3xl shadow-lg p-4 flex flex-col">
              <button
                onClick={handleNewChat}
                className="w-full bg-orange-500 text-white rounded-2xl py-3 font-semibold hover:bg-orange-600 transition-colors mb-4 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Chat
              </button>
              
              <div className="flex-1 overflow-y-auto space-y-2">
                <div className="text-xs font-semibold text-gray-400 px-3 py-2">ประวัติการสนทนา</div>
                {chatHistory.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => loadChat(chat.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                      currentChatId === chat.id 
                        ? 'bg-orange-50 border border-orange-200' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm truncate">{chat.title}</div>
                    <div className="text-xs text-gray-400 mt-1">{formatDate(chat.date)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white rounded-3xl shadow-lg flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                    ศร
                  </div>
                  <div>
                    <div className="font-semibold">ศรเสริมติวเตอร์ Bot</div>
                    <div className="text-xs text-green-500 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      ออนไลน์
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setIsFullscreen(false);
                    setIsOpen(true);
                  }}
                  className="w-10 h-10 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                        msg.sender === 'user'
                          ? 'bg-orange-500 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="พิมพ์ข้อความ..."
                    className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  <button
                    onClick={handleSend}
                    className="w-12 h-12 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // โหมดป๊อปอัพ
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Chat Window */}
      <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] bg-white rounded-3xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-3xl flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold">
              ศร
            </div>
            <div>
              <div className="font-semibold">ศรเสริมติวเตอร์</div>
              <div className="text-xs text-white/80">แชทบอท</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsFullscreen(true);
                setIsOpen(false);
              }}
              className="w-8 h-8 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
              title="ขยายหน้าจอ"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  msg.sender === 'user'
                    ? 'bg-orange-500 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="พิมพ์ข้อความ..."
              className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-orange-500 transition-colors text-sm"
            />
            <button
              onClick={handleSend}
              className="w-10 h-10 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center justify-center flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatBot;