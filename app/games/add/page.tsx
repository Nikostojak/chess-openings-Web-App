import GameForm from '@/components/forms/GameForm'
import LichessImport from '@/components/import/LichessImport'
import PGNImport from '@/components/import/PGNImport'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AddGame() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Manual Game Form */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Manually</h2>
            <GameForm />
          </div>

          {/* Import from PGN */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Import from PGN</h2>
            <PGNImport />
          </div>

          {/* Import from Lichess */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Import from Lichess</h2>
            <LichessImport />
          </div>
        </div>
      </div>
    </div>
  )
}