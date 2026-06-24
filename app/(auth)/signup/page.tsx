import Link from 'next/link'
import { SignupForm } from '@/components/auth/SignupForm'
import { Zap } from 'lucide-react'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="mb-6 flex items-center gap-2 font-bold text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            Splynt
          </Link>
          <h1 className="text-2xl font-bold">Start building today</h1>
          <p className="mt-2 text-sm text-muted-foreground">Free forever. No credit card required.</p>
        </div>

        <SignupForm />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
