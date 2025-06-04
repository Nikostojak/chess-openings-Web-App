import GameForm from '@/components/forms/GameForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AddGame() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to dashboard
          </Link>
        </div>

        <GameForm />
      </div>
    </div>
  )
}