import { prisma } from '../lib/db'
import { ecoParser } from '../lib/eco-parser'

async function seedEcoDatabase() {
  console.log('🌱 Starting ECO database seeding...')
  
  try {
    // Clear existing opening data
    console.log('🗑️  Clearing existing opening data...')
    try {
      await prisma.opening.deleteMany({})
    } catch (error) {
      console.log('Note: No existing opening data to clear (this is normal on first run)')
    }
    
    // Get all ECO openings
    const allOpenings = ecoParser.getAllOpenings()
    console.log(`📚 Found ${allOpenings.length} openings to import`)
    
    // Insert openings in batches
    const batchSize = 50  // Smanio batch size za SQLite
    let imported = 0
    
    for (let i = 0; i < allOpenings.length; i += batchSize) {
      const batch = allOpenings.slice(i, i + batchSize)
      
      // Use individual upserts instead of createMany for SQLite compatibility
      for (const opening of batch) {
        try {
          await prisma.opening.upsert({
            where: { ecoCode: opening.ecoCode },
            update: {
              name: opening.name,
              moves: opening.moves,
              fen: opening.fen,
              family: opening.family,
              variation: opening.variation,
              subvariation: opening.subvariation,
              popularity: opening.popularity,
              whiteWins: opening.whiteWins,
              blackWins: opening.blackWins,
              draws: opening.draws
            },
            create: {
              ecoCode: opening.ecoCode,
              name: opening.name,
              moves: opening.moves,
              fen: opening.fen,
              family: opening.family,
              variation: opening.variation,
              subvariation: opening.subvariation,
              popularity: opening.popularity,
              whiteWins: opening.whiteWins,
              blackWins: opening.blackWins,
              draws: opening.draws
            }
          })
          imported++
        } catch (error) {
          console.warn(`⚠️  Skipping opening ${opening.ecoCode}: ${error}`)
        }
      }
      
      if (imported % 100 === 0) {
        console.log(`✅ Imported ${imported}/${allOpenings.length} openings`)
      }
    }
    
    // Update existing games with ECO codes
    console.log('🔄 Updating existing games with ECO codes...')
    await updateExistingGamesWithEcoCodes()
    
    console.log('🎉 ECO database seeding completed!')
    
    // Print some statistics
    const openingCount = await prisma.opening.count()
    const gamesWithEco = await prisma.game.count({
      where: { ecoCode: { not: null } }
    })
    
    console.log(`📊 Statistics:`)
    console.log(`   - Total openings: ${openingCount}`)
    console.log(`   - Games with ECO codes: ${gamesWithEco}`)
    
  } catch (error) {
    console.error('❌ Error seeding ECO database:', error)
    throw error
  }
}

async function updateExistingGamesWithEcoCodes() {
  // Get all games that don't have ECO codes yet
  const gamesWithoutEco = await prisma.game.findMany({
    where: { 
      ecoCode: null,
      pgn: { not: null }
    }
  })
  
  console.log(`🔍 Found ${gamesWithoutEco.length} games without ECO codes`)
  
  let updated = 0
  
  for (const game of gamesWithoutEco) {
    if (!game.pgn) continue
    
    try {
      // Find ECO code for this game
      const opening = ecoParser.findByPgn(game.pgn)
      
      if (opening) {
        await prisma.game.update({
          where: { id: game.id },
          data: { 
            ecoCode: opening.ecoCode,
            opening: opening.name  // Also update opening name to be more precise
          }
        })
        updated++
        
        if (updated % 10 === 0) {
          console.log(`   Updated ${updated}/${gamesWithoutEco.length} games`)
        }
      }
    } catch (error) {
      console.warn(`   Warning: Could not classify game ${game.id}:`, error)
    }
  }
  
  console.log(`✅ Updated ${updated} games with ECO codes`)
}

// Add some sample master game statistics (placeholder data)
async function addSampleStatistics() {
  console.log('📈 Adding sample popularity statistics...')
  
  const popularOpenings = [
    { ecoCode: 'B20', popularity: 15420, whiteWins: 6250, blackWins: 5890, draws: 3280 },
    { ecoCode: 'C50', popularity: 12150, whiteWins: 5200, blackWins: 4100, draws: 2850 },
    { ecoCode: 'C65', popularity: 11800, whiteWins: 5100, blackWins: 3950, draws: 2750 },
    { ecoCode: 'D30', popularity: 9850, whiteWins: 4200, blackWins: 3100, draws: 2550 },
    { ecoCode: 'E20', popularity: 8750, whiteWins: 3800, blackWins: 3200, draws: 1750 },
    { ecoCode: 'B22', popularity: 7200, whiteWins: 3100, blackWins: 2800, draws: 1300 },
    { ecoCode: 'C42', popularity: 6800, whiteWins: 2950, blackWins: 2400, draws: 1450 },
    { ecoCode: 'D85', popularity: 5900, whiteWins: 2500, blackWins: 2100, draws: 1300 }
  ]
  
  for (const stats of popularOpenings) {
    await prisma.opening.updateMany({
      where: { ecoCode: stats.ecoCode },
      data: {
        popularity: stats.popularity,
        whiteWins: stats.whiteWins,
        blackWins: stats.blackWins,
        draws: stats.draws
      }
    })
  }
  
  console.log('✅ Added sample statistics')
}

// Main execution
async function main() {
  await seedEcoDatabase()
  await addSampleStatistics()
  await prisma.$disconnect()
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

export { seedEcoDatabase, updateExistingGamesWithEcoCodes }