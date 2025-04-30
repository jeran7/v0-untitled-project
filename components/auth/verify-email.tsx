"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Mail } from "lucide-react"

export function VerifyEmail() {
  return (
    <div className="glass-card p-6 rounded-lg border border-border/40 backdrop-blur-[20px] bg-background/90">
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Mail className="h-12 w-12 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
          <p className="text-muted-foreground">
            We've sent you a verification link. Please check your email to verify your account.
          </p>
        </div>
        <div className="space-y-4">
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm text-left">
                <p className="font-medium">What to do next:</p>
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>Check your email inbox</li>
                  <li>Click the verification link in the email</li>
                  <li>You'll be redirected to sign in</li>
                </ol>
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Didn't receive an email? Check your spam folder or{" "}
            <Link href="/auth/register" className="text-primary hover:underline">
              try again
            </Link>
            .
          </div>
          <Button asChild className="w-full">
            <Link href="/auth/login">Return to Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
