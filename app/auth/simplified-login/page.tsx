import { SimplifiedLoginForm } from "@/components/auth/simplified-login-form"
import { SimplifiedAuthProvider } from "@/components/auth/simplified-auth-provider"

export default function SimplifiedLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-background/80 p-4">
      <div className="w-full max-w-md">
        <SimplifiedAuthProvider>
          <SimplifiedLoginForm />
        </SimplifiedAuthProvider>
      </div>
    </div>
  )
}
