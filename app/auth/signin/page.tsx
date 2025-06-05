'use client'

import { signIn, getProviders } from "next-auth/react"
import { useState, useEffect } from "react"
import { Github, Chrome } from "lucide-react"

export default function SignIn() {
  const [providers, setProviders] = useState<any>(null)

  useEffect(() => {
    const setUpProviders = async () => {
      const response = await getProviders()
      setProviders(response)
    }
    setUpProviders()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to OpeningForge</h1>
          <p className="text-gray-600">Sign in to forge your chess mastery</p>
          </div>

          <div className="space-y-4">
            {providers &&
              Object.values(providers).map((provider: any) => (
                <button
                  key={provider.name}
                  onClick={() => signIn(provider.id)}
                  className="w-full flex items-center justify-center space-x-3 bg-gray-900 text-white py-3 px-4 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  {provider.name === 'Google' && <Chrome className="h-5 w-5" />}
                  {provider.name === 'GitHub' && <Github className="h-5 w-5" />}
                  <span>Continue with {provider.name}</span>
                </button>
              ))}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              By signing in, you agree to our terms and privacy policy
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}