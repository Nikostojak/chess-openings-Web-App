// scripts/chess-data-jobs.ts - Enhanced with Tournament Tracking

import * as cron from 'node-cron'
import { lichessService } from '../lib/lichess-service'
import { tournamentTracker } from '../lib/tournament-tracker'

export class ChessDataJobs {
  private jobs: Map<string, any> = new Map()

  // 🕐 DAILY UPDATE JOB (runs at 2 AM every day)
  startDailyUpdate() {
    const task = cron.schedule('0 2 * * *', async () => {
      console.log('🌅 Running daily chess data update...')
      
      try {
        // Regular Lichess update
        await lichessService.runDailyUpdate()
        
        // Tournament monitoring  
        await tournamentTracker.monitorActiveTournaments()
        
        console.log('✅ Daily update completed successfully')
        
      } catch (error) {
        console.error('❌ Daily update failed:', error)
      }
    }, {
      timezone: "Europe/Zagreb"
    })

    this.jobs.set('daily-update', task)
    console.log('📅 Daily update job scheduled for 2:00 AM')
  }

  // ⚡ HOURLY QUICK UPDATE (runs every hour during active hours)
  startHourlyUpdate() {
    const task = cron.schedule('0 12-23 * * *', async () => {
      console.log('⚡ Running hourly quick update...')
      
      try {
        // Quick Lichess update
        const lastHour = new Date(Date.now() - 60 * 60 * 1000)
        const now = new Date()
        
        const games = await lichessService.fetchRecentGames({
          since: lastHour,
          until: now,
          max: 100,
          minRating: 1800,
          rated: true
        })

        if (games.length > 0) {
          const gameStats = games
            .map(game => lichessService.extractGameStats(game))
            .filter(Boolean)
          
          await lichessService.updateOpeningStats(gameStats)
          console.log(`✅ Hourly update: processed ${gameStats.length} games`)
        }

        // 🏆 Elite tournament monitoring (every hour during peak)
        await tournamentTracker.monitorActiveTournaments()
        
      } catch (error) {
        console.error('❌ Hourly update failed:', error)
      }
    }, {
      timezone: "Europe/Zagreb"
    })

    this.jobs.set('hourly-update', task)
    console.log('⚡ Hourly update job scheduled for peak hours (12 PM - 11 PM)')
  }

  // 👑 WORLD CHAMPIONSHIP MONITORING (every 10 minutes during WC)
  startWorldChampionshipMonitoring() {
    const task = cron.schedule('*/10 * * * *', async () => {
      try {
        await tournamentTracker.trackWorldChampionship()
      } catch (error) {
        console.error('❌ World Championship monitoring failed:', error)
      }
    }, {
      timezone: "Europe/Zagreb"
    })

    this.jobs.set('wc-monitoring', task)
    console.log('👑 World Championship monitoring scheduled (every 10 minutes)')
  }

  // 🧹 WEEKLY CLEANUP (runs Sunday at 3 AM)
  startWeeklyCleanup() {
    const task = cron.schedule('0 3 * * 0', async () => {
      console.log('🧹 Running weekly database cleanup...')
      
      try {
        // Database maintenance
        console.log('✅ Weekly cleanup completed')
        
      } catch (error) {
        console.error('❌ Weekly cleanup failed:', error)
      }
    }, {
      timezone: "Europe/Zagreb"
    })

    this.jobs.set('weekly-cleanup', task)
    console.log('🧹 Weekly cleanup job scheduled for Sunday 3:00 AM')
  }

  // 🚀 START ALL JOBS
  startAllJobs() {
    console.log('🚀 Starting all chess data jobs...')
    
    this.startDailyUpdate()
    this.startHourlyUpdate() 
    this.startWorldChampionshipMonitoring() // 🆕 NEW
    this.startWeeklyCleanup()
    
    console.log('✅ All background jobs started successfully')
    console.log('📊 Active jobs:', Array.from(this.jobs.keys()))
  }

  // 🛑 STOP ALL JOBS
  stopAllJobs() {
    console.log('🛑 Stopping all chess data jobs...')
    
    this.jobs.forEach((task, name) => {
      if (task && typeof task.stop === 'function') {
        task.stop()
        console.log(`⏹️  Stopped job: ${name}`)
      }
    })
    
    this.jobs.clear()
    console.log('✅ All jobs stopped')
  }

  // 📊 GET JOB STATUS
  getJobStatus() {
    const status = Array.from(this.jobs.entries()).map(([name, task]) => ({
      name,
      running: task && typeof task.running !== 'undefined' ? task.running : false,
      scheduled: true
    }))

    return {
      totalJobs: this.jobs.size,
      jobs: status
    }
  }

  // 🔧 MANUAL TRIGGER (for testing)
  async triggerManualUpdate(type: 'daily' | 'hourly' | 'tournament' | 'wc' = 'daily') {
    console.log(`🔧 Manually triggering ${type} update...`)
    
    try {
      switch (type) {
        case 'daily':
          await lichessService.runDailyUpdate()
          await tournamentTracker.monitorActiveTournaments()
          break
          
        case 'hourly':
          const lastHour = new Date(Date.now() - 60 * 60 * 1000)
          const games = await lichessService.fetchRecentGames({
            since: lastHour,
            max: 50,
            minRating: 1600
          })
          
          const gameStats = games
            .map(game => lichessService.extractGameStats(game))
            .filter(Boolean)
          
          await lichessService.updateOpeningStats(gameStats)
          break
          
        case 'tournament':
          await tournamentTracker.monitorActiveTournaments()
          break
          
        case 'wc':
          await tournamentTracker.trackWorldChampionship()
          break
      }
      
      console.log(`✅ Manual ${type} update completed`)
      
    } catch (error) {
      console.error(`❌ Manual ${type} update failed:`, error)
      throw error
    }
  }
}

// Export singleton instance
export const chessDataJobs = new ChessDataJobs()

// 🚀 AUTO-START in production
if (process.env.NODE_ENV === 'production') {
  console.log('🌟 Production mode: auto-starting chess data jobs')
  chessDataJobs.startAllJobs()
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('📡 Received SIGTERM, stopping jobs...')
    chessDataJobs.stopAllJobs()
    process.exit(0)
  })
}