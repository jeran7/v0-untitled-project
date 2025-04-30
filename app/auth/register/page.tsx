"use client"

import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-auth-pattern bg-cover bg-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold">TradePro Journal</h1>
          <p className="text-muted-foreground">Create your trading journal account</p>
        </div>

        <RegisterForm />
      </div>
    </div>
  )
}
