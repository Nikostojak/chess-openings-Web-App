// app/api/admin/data-jobs/route.ts - Enhanced with Tournament Management

import { NextRequest, NextResponse } from 'next/server'
import { chessDataJobs } from '../../../../scripts/chess-data-jobs'
import { lichessService } from '../../../../lib/lichess-service'
import { tournamentTracker } from '../../../../lib/tournament-tracker'

// 📊 GET JOB STATUS + TOURNAMENT INFO
export async function GET() {
  try {
    const status = chessDataJobs.getJobStatus()
    
    // Add system info
    const systemInfo = {
      nodeEnv: process.env.NODE_ENV,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    }

    // Get tournament info
    let tournamentInfo = null
    try {
      const broadcasts = await tournamentTracker.getActiveBroadcasts()
      tournamentInfo = {
        activeTournaments: broadcasts.length,
        tournaments: broadcasts.map(b => ({
          name: b.tour.name,
          ongoing: b.round.ongoing,
          tier: tournamentTracker.classifyTournamentTier(b.tour.name)
        }))
      }
    } catch (error) {
      console.warn('Could not fetch tournament info:', error)
    }

    return NextResponse.json({
      success: true,
      data: {
        jobs: status,
        system: systemInfo,
        tournaments: tournamentInfo
      }
    })

  } catch (error) {
    console.error('❌ Error getting job status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get job status' },
      { status: 500 }
    )
  }
}

// 🚀 ENHANCED MANUAL ACTIONS
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, type = 'daily' } = body

    console.log(`🔧 Admin action: ${action}`)

    switch (action) {
      case 'trigger_update':
        await chessDataJobs.triggerManualUpdate(type)
        return NextResponse.json({
          success: true,
          message: `${type} update completed successfully`
        })

      case 'start_jobs':
        chessDataJobs.startAllJobs()
        return NextResponse.json({
          success: true,
          message: 'All background jobs started'
        })

      case 'stop_jobs':
        chessDataJobs.stopAllJobs()
        return NextResponse.json({
          success: true,
          message: 'All background jobs stopped'
        })

      case 'test_lichess':
        const testGames = await lichessService.fetchRecentGames({
          max: 5,
          minRating: 1600
        })
        
        return NextResponse.json({
          success: true,
          message: `Lichess API test successful`,
          data: {
            gamesFound: testGames.length,
            sampleGame: testGames[0] ? {
              id: testGames[0].id,
              opening: testGames[0].opening?.name,
              eco: testGames[0].opening?.eco
            } : null
          }
        })

      case 'test_tournaments':
        // 🏆 NEW: Test tournament tracking
        const broadcasts = await tournamentTracker.getActiveBroadcasts()
        
        let sampleTournament = null
        if (broadcasts.length > 0) {
          const tournament = broadcasts[0]
          const games = await tournamentTracker.getBroadcastGames(tournament.round.id)
          
          sampleTournament = {
            name: tournament.tour.name,
            tier: tournamentTracker.classifyTournamentTier(tournament.tour.name),
            gamesFound: games.length,
            ongoing: tournament.round.ongoing
          }
        }
        
        return NextResponse.json({
          success: true,
          message: 'Tournament tracking test completed',
          data: {
            activeBroadcasts: broadcasts.length,
            sampleTournament
          }
        })

      case 'monitor_wc':
        // 👑 NEW: World Championship check
        await tournamentTracker.trackWorldChampionship()
        return NextResponse.json({
          success: true,
          message: 'World Championship monitoring completed'
        })

      case 'monitor_tournaments':
        // 🏆 NEW: Full tournament monitoring
        await tournamentTracker.monitorActiveTournaments()
        return NextResponse.json({
          success: true,
          message: 'Tournament monitoring completed'
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Error executing admin action:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}