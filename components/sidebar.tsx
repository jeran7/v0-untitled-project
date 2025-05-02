"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  BookOpen,
  Calendar,
  ChevronDown,
  ClipboardCheck,
  Home,
  LineChart,
  LogOut,
  Settings,
  TrendingUp,
  User,
  FileCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"

export default function Sidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user data
  useEffect(() => {
    async function getUser() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user || null)
      } catch (error) {
        console.error("Error fetching user in sidebar:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()
  }, [])

  // Safe sign out function
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = "/auth/login"
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const routes = [
    {
      label: "Dashboard",
      icon: Home,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Trades",
      icon: TrendingUp,
      href: "/trades",
      active: pathname === "/trades" || pathname?.startsWith("/trades/"),
    },
    {
      label: "Import Trades",
      icon: FileCheck,
      href: "/import",
      active: pathname === "/import" || pathname?.startsWith("/import/"),
    },
    {
      label: "Analytics",
      icon: BarChart3,
      href: "/analytics",
      active: pathname === "/analytics",
    },
    {
      label: "Compliance",
      icon: ClipboardCheck,
      subItems: [
        {
          label: "Overview",
          href: "/compliance",
          active: pathname === "/compliance",
        },
        {
          label: "Dashboard",
          href: "/compliance/dashboard",
          active: pathname === "/compliance/dashboard",
        },
      ],
      active: pathname?.startsWith("/compliance"),
    },
    {
      label: "Strategy Playbook",
      icon: BookOpen,
      href: "/playbook",
      active: pathname === "/playbook" || pathname?.startsWith("/playbook/"),
    },
    {
      label: "Calendar",
      icon: Calendar,
      href: "/calendar",
      active: pathname === "/calendar",
    },
    {
      label: "Profile",
      icon: User,
      href: "/profile",
      active: pathname === "/profile",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
      active: pathname === "/settings",
    },
  ]

  return (
    <div className="flex h-full flex-col border-r bg-background/50 backdrop-blur-lg">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <LineChart className="h-6 w-6" />
          <span className="text-xl">TradePro</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-4">
          {routes.map((route) =>
            route.subItems ? (
              <Collapsible key={route.label} defaultOpen={route.active}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn("flex w-full justify-between px-4", route.active && "bg-muted hover:bg-muted")}
                  >
                    <div className="flex items-center gap-3">
                      <route.icon className="h-4 w-4" />
                      {route.label}
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-8 flex flex-col gap-1 pt-1">
                    {route.subItems.map((subItem) => (
                      <Link key={subItem.href} href={subItem.href}>
                        <Button
                          variant="ghost"
                          className={cn("w-full justify-start pl-4", subItem.active && "bg-muted hover:bg-muted")}
                        >
                          {subItem.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <Link key={route.href} href={route.href}>
                <Button
                  variant="ghost"
                  className={cn("w-full justify-start px-4", route.active && "bg-muted hover:bg-muted")}
                >
                  <route.icon className="mr-3 h-4 w-4" />
                  {route.label}
                </Button>
              </Link>
            ),
          )}
        </nav>
      </ScrollArea>
      {user && (
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{user.email}</p>
                <p className="text-xs text-muted-foreground">Pro Plan</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
