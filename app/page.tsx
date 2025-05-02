"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, LineChart, TrendingUp, ArrowRight, CheckCircle, Shield } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error checking auth:", error)
          setLoading(false)
          return
        }

        if (session && session.user) {
          // User is logged in, redirect to dashboard
          router.push("/dashboard")
        } else {
          // User is not logged in, show landing page
          setLoading(false)
        }
      } catch (err) {
        console.error("Auth check failed:", err)
        setLoading(false)
      }
    }

    checkAuth()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Trading Journal</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/auth/login" className="text-sm font-medium hover:underline">
              Login
            </Link>
            <Link href="/auth/register">
              <Button>Sign Up</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    Track, Analyze, Improve Your Trading
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    The all-in-one trading journal that helps you track your trades, analyze your performance, and
                    improve your strategy.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/auth/register">
                    <Button size="lg" className="gap-1.5">
                      Get Started <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button size="lg" variant="outline">
                      Login
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[350px] w-full md:h-[450px] lg:h-[550px]">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg shadow-lg overflow-hidden">
                    <div className="absolute inset-0 backdrop-blur-sm">
                      <div className="absolute inset-0 bg-white/10"></div>
                    </div>
                    <div className="relative p-6 h-full flex flex-col justify-center">
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-white/80 backdrop-blur-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <LineChart className="h-5 w-5 text-blue-500" />
                              Performance
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-32 bg-blue-100/50 rounded-md flex items-center justify-center">
                              <div className="w-full h-20 flex items-end px-2">
                                <div className="w-1/5 h-4 bg-blue-500 rounded-t"></div>
                                <div className="w-1/5 h-8 bg-blue-500 rounded-t"></div>
                                <div className="w-1/5 h-12 bg-blue-500 rounded-t"></div>
                                <div className="w-1/5 h-6 bg-blue-500 rounded-t"></div>
                                <div className="w-1/5 h-16 bg-blue-500 rounded-t"></div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-white/80 backdrop-blur-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <BarChart3 className="h-5 w-5 text-blue-500" />
                              Statistics
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Win Rate</span>
                                <span className="font-medium text-blue-500">68.5%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Profit Factor</span>
                                <span className="font-medium text-blue-500">2.34</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Total P&L</span>
                                <span className="font-medium text-blue-500">$12,458.32</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted/50 py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Features That Help You Trade Better
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our trading journal provides all the tools you need to track, analyze, and improve your trading
                  performance.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3 md:gap-8">
              <div className="flex flex-col items-center space-y-2 rounded-lg p-4 transition-all hover:bg-muted">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Advanced Analytics</h3>
                <p className="text-center text-muted-foreground">
                  Gain insights into your trading patterns with detailed performance metrics and visualizations.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg p-4 transition-all hover:bg-muted">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Trade Compliance</h3>
                <p className="text-center text-muted-foreground">
                  Ensure your trades follow your predefined rules and strategies with compliance tracking.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg p-4 transition-all hover:bg-muted">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Secure & Private</h3>
                <p className="text-center text-muted-foreground">
                  Your trading data is encrypted and securely stored. Only you have access to your information.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} Trading Journal. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-sm text-muted-foreground hover:underline">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
