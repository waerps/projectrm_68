"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Heart, ShoppingCart, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex justify-center pt-6">
      <nav className="mx-12 flex h-[83px] w-full max-w-[1384px] items-center justify-between gap-6 rounded-2xl bg-white px-8 shadow-lg">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center">
              <img
                src="/logo.png" // 👉 เปลี่ยนเป็น path รูปจริงของคุณ
                alt="ศรเสริมติวเตอร์"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="hidden flex-col md:flex">
              <span className="font-sans font-bold text-sm leading-tight text-foreground">SORNSERM</span>
              <span className="font-sans font-bold text-sm leading-tight text-foreground">TUTOR</span>
            </div>
          </div>
        </Link>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="ค้นหาคอร์สเรียน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-125 rounded-lg border-border bg-secondary pl-10 pr-4 text-sm focus-visible:ring-primary"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Favorites Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-lg hover:bg-primary/10 hover:text-primary"
            aria-label="รายการโปรด"
          >
            <Heart className="h-5 w-5" />
          </Button>

          {/* Cart Button */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-11 w-11 rounded-lg hover:bg-primary/10 hover:text-primary mr-5"
            aria-label="ตะกร้า"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              0
            </span>
          </Button>

          {/* Login Button */}
          <Button
            variant="outline"
            className="hidden h-11 rounded-lg border-primary px-6 text-primary hover:bg-primary hover:text-white md:inline-flex bg-transparent"
          >
            <User className="mr-2 h-4 w-4" />
            เข้าสู่ระบบ
          </Button>

          {/* Register Button */}
          <Button className="hidden h-11 rounded-lg bg-primary px-6 text-white hover:bg-primary/90 md:inline-flex">
            ลงทะเบียน
          </Button>
        </div>
      </nav>
    </div>
  )
}
