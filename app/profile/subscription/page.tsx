import type { Metadata } from "next"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { SubscriptionStatus } from "@/components/subscription/subscription-status"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Subscription Management",
  description: "Manage your trading journal subscription",
}

export default async function SubscriptionPage() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  // Get the current user
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user?.id

  if (!userId) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to view your subscription details.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Subscription Management</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <SubscriptionStatus userId={userId} />
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Upgrade Your Plan</CardTitle>
              <CardDescription>Get access to more features and increase your trading limits</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Choose a plan that fits your trading needs. All plans include core features with different limits and
                additional capabilities.
              </p>

              {/* Placeholder for subscription plans */}
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="font-medium">Pro Plan</div>
                  <div className="text-2xl font-bold mt-1">
                    $29.99<span className="text-sm font-normal">/month</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">Up to 1,000 trades</div>
                </div>

                <div className="p-4 border rounded-lg border-primary bg-primary/5">
                  <div className="font-medium">Premium Plan</div>
                  <div className="text-2xl font-bold mt-1">
                    $49.99<span className="text-sm font-normal">/month</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">Unlimited trades</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
