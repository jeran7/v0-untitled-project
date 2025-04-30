"use client"

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-auth-pattern bg-cover bg-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold">TradePro Journal</h1>
          <p className="text-muted-foreground">Reset your password</p>
        </div>

        <ForgotPasswordForm />
      </div>
    </div>
  )
}
