// scripts/setup-lichess-integration.ts - Enhanced Setup with Tournament Tracking

import { chessDataJobs } from './chess-data-jobs'
import { lichessService } from '../lib/lichess-service'
import { tournamentTracker } from '../lib/tournament-tracker'

async function setupLichessIntegration() {
  console.log('🚀 Setting up Elite Chess Data Pipeline...')
  console.log('=' + '='.repeat(60))

  try {
    // 1. Test basic Lichess API connection
    console.log('\n📡 Testing Lichess API connection...')
    const testGames = await lichessService.fetchRecentGames({
      max: 3,
      minRating: 1500
    })
    
    if (testGames.length > 0) {
      console.log(`✅ Lichess API working - found ${testGames.length} games`)
      console.log(`   Sample game: ${testGames[0].id} (${testGames[0].opening?.name || 'No opening'})`)
    } else {
      console.log('⚠️  No games found - this is normal, continuing...')
    }

    // 2. 🏆 NEW: Test tournament broadcast tracking
    console.log('\n🏆 Testing tournament broadcast tracking...')
    const broadcasts = await tournamentTracker.getActiveBroadcasts()
    
    if (broadcasts.length > 0) {
      console.log(`✅ Found ${broadcasts.length} active elite tournaments:`)
      broadcasts.forEach(b => {
        const tier = tournamentTracker.classifyTournamentTier(b.tour.name)
        console.log(`   🎯 ${b.tour.name} (${tier})`)
      })
      
      // Test processing games from first tournament
      const firstTournament = broadcasts[0]
      console.log(`\n📊 Testing game processing from: ${firstTournament.tour.name}`)
      const games = await tournamentTracker.getBroadcastGames(firstTournament.round.id)
      console.log(`   Found ${games.length} games in tournament`)
      
      if (games.length > 0) {
        const sampleGame = games[0]
        console.log(`   Sample: ${sampleGame.white.name} vs ${sampleGame.black.name}`)
        if (sampleGame.opening) {
          console.log(`   Opening: ${sampleGame.opening.eco} - ${sampleGame.opening.name}`)
        }
      }
    } else {
      console.log('📭 No elite tournaments currently active')
      console.log('   ℹ️  This is normal - elite tournaments are rare events')
    }

    // 3. 👑 Test World Championship specific tracking
    console.log('\n👑 Testing World Championship tracking...')
    await tournamentTracker.trackWorldChampionship()
    console.log('✅ World Championship tracking test completed')

    // 4. Test data processing pipeline
    console.log('\n🔄 Testing data processing pipeline...')
    if (testGames.length > 0) {
      const gameStats = testGames
        .map(game => lichessService.extractGameStats(game))
        .filter(Boolean)
      
      console.log(`✅ Processed ${gameStats.length} games successfully`)
      
      if (gameStats.length > 0) {
        console.log(`   Sample stats: ${gameStats[0]?.ecoCode} - ${gameStats[0]?.result}`)
      }
    }

    // 5. Manual trigger test (small batch)
    console.log('\n🧪 Running test update with tournament monitoring...')
    await chessDataJobs.triggerManualUpdate('tournament')
    console.log('✅ Test tournament update completed')

    // 6. Start enhanced background jobs
    console.log('\n⚙️  Starting enhanced background jobs...')
    chessDataJobs.startAllJobs()
    
    const jobStatus = chessDataJobs.getJobStatus()
    console.log(`✅ Started ${jobStatus.totalJobs} background jobs:`)
    jobStatus.jobs.forEach(job => {
      console.log(`   📅 ${job.name}: ${job.running ? '🟢 running' : '🔴 stopped'}`)
    })

    // 7. Success summary with new features
    console.log('\n' + '='.repeat(62))
    console.log('🎉 ELITE CHESS DATA PIPELINE SETUP COMPLETE!')
    console.log('=' + '='.repeat(60))
    console.log('')
    console.log('📋 What happens automatically:')
    console.log('   📅 Daily updates at 2:00 AM (full batch + tournaments)')
    console.log('   ⚡ Hourly updates during peak hours (12 PM - 11 PM)')
    console.log('   👑 World Championship monitoring (every 10 minutes)')
    console.log('   🧹 Weekly cleanup on Sundays at 3:00 AM')
    console.log('')
    console.log('🏆 Tournament Features:')
    console.log('   🎯 Auto-detects elite tournaments (World Championship, Candidates, etc.)')
    console.log('   ⚖️  Weighted statistics (WC game = 15x normal game)')
    console.log('   📊 Tournament tier classification (WORLD_CHAMPIONSHIP > SUPER_ELITE > ELITE)')
    console.log('   🔄 Real-time processing during live tournaments')
    console.log('')
    console.log('🔧 Manual controls:')
    console.log('   • GET  /api/admin/data-jobs - Check status + active tournaments')
    console.log('   • POST /api/admin/data-jobs {"action": "test_tournaments"}')
    console.log('   • POST /api/admin/data-jobs {"action": "monitor_wc"}')
    console.log('   • POST /api/admin/data-jobs {"action": "trigger_update", "type": "tournament"}')
    console.log('')
    console.log('📈 Your app now has INDUSTRY-LEADING chess data:')
    console.log('   ✨ Real-time World Championship tracking')
    console.log('   ✨ Elite tournament weighted statistics') 
    console.log('   ✨ Super-GM opening preferences')
    console.log('   ✨ Tournament-tier opening analysis')
    console.log('')

  } catch (error) {
    console.error('\n❌ Setup failed:', error)
    console.log('\n🔧 Troubleshooting:')
    console.log('   • Check internet connection')
    console.log('   • Verify database is accessible')
    console.log('   • Make sure all npm packages are installed')
    console.log('   • Check that tournament-tracker.ts was created')
    console.log('   • Verify Lichess API is accessible')
    
    process.exit(1)
  }
}

// 🎯 ENHANCED DEVELOPMENT HELPERS
export async function testTournamentTracking() {
  console.log('🏆 Testing tournament tracking system...')
  
  try {
    const broadcasts = await tournamentTracker.getActiveBroadcasts()
    console.log(`✅ Found ${broadcasts.length} elite tournaments`)
    
    if (broadcasts.length > 0) {
      console.log('🎯 Active elite tournaments:')
      broadcasts.forEach(b => {
        const tier = tournamentTracker.classifyTournamentTier(b.tour.name)
        console.log(`   • ${b.tour.name} (${tier})`)
      })
    }
    
    return true
  } catch (error) {
    console.error('❌ Tournament tracking test failed:', error)
    return false
  }
}

export async function testWorldChampionship() {
  console.log('👑 Testing World Championship monitoring...')
  
  try {
    await tournamentTracker.trackWorldChampionship()
    console.log('✅ World Championship test completed')
  } catch (error) {
    console.error('❌ World Championship test failed:', error)
  }
}

export async function runEliteUpdate() {
  console.log('🏆 Running elite tournament update...')
  
  try {
    await tournamentTracker.monitorActiveTournaments()
    console.log('✅ Elite tournament update completed')
  } catch (error) {
    console.error('❌ Elite update failed:', error)
  }
}

export function showEnhancedJobStatus() {
  const status = chessDataJobs.getJobStatus()
  
  console.log('\n📊 Enhanced Background Jobs Status:')
  console.log('=' + '='.repeat(40))
  
  if (status.totalJobs === 0) {
    console.log('⚠️  No jobs running')
    console.log('💡 Run chessDataJobs.startAllJobs() to start')
  } else {
    status.jobs.forEach(job => {
      const indicator = job.running ? '🟢' : '🔴'
      let description = ''
      
      switch (job.name) {
        case 'daily-update':
          description = '(Daily: Regular + Tournament data)'
          break
        case 'hourly-update':
          description = '(Hourly: Quick + Tournament monitoring)'
          break
        case 'wc-monitoring':
          description = '(World Championship: Every 10 min)'
          break
        case 'weekly-cleanup':
          description = '(Weekly: Database maintenance)'
          break
      }
      
      console.log(`${indicator} ${job.name}: ${job.running ? 'running' : 'stopped'} ${description}`)
    })
  }
  console.log('')
}

// Run setup if called directly
if (require.main === module) {
  setupLichessIntegration()
    .then(() => {
      console.log('🎉 Elite chess data pipeline is live!')
      console.log('🏆 Your app now tracks World Championships in real-time!')
      
      // Keep process alive for background jobs
      console.log('⏳ Keeping process alive for background jobs...')
      console.log('   Press Ctrl+C to stop')
      
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error)
      process.exit(1)
    })
}