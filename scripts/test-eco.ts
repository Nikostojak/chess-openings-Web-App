import { ecoParser } from '../lib/eco-parser'

async function testEcoFunctionality() {
  console.log('🧪 Testing ECO functionality...\n')
  
  // Test 1: Find opening by ECO code
  console.log('TEST 1: Find opening by ECO code')
  const sicilian = ecoParser.getByEcoCode('B20')
  console.log('B20 (Sicilian):', sicilian?.name || 'Not found')
  
  const ruyLopez = ecoParser.getByEcoCode('C65')
  console.log('C65 (Ruy Lopez):', ruyLopez?.name || 'Not found')
  console.log()
  
  // Test 2: Find opening by PGN
  console.log('TEST 2: Find opening by PGN')
  const testGames = [
    {
      name: 'Sicilian Defense',
      pgn: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6'
    },
    {
      name: 'Queen\'s Gambit',
      pgn: '1. d4 d5 2. c4 e6 3. Nc3 Nf6'
    },
    {
      name: 'Italian Game',
      pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5'
    },
    {
      name: 'King\'s Indian Defense',
      pgn: '1. d4 Nf6 2. c4 g6 3. Nc3 Bg7'
    }
  ]
  
  for (const game of testGames) {
    const opening = ecoParser.findByPgn(game.pgn)
    console.log(`${game.name}:`)
    console.log(`  Expected: ${game.name}`)
    console.log(`  Found: ${opening?.name || 'Not found'}`)
    console.log(`  ECO: ${opening?.ecoCode || 'N/A'}`)
    console.log(`  Family: ${opening?.family || 'N/A'}`)
    console.log()
  }
  
  // Test 3: Search by name
  console.log('TEST 3: Search by name')
  const sicilianVariations = ecoParser.searchByName('Sicilian')
  console.log(`Found ${sicilianVariations.length} Sicilian variations:`)
  sicilianVariations.slice(0, 5).forEach(opening => {
    console.log(`  ${opening.ecoCode}: ${opening.name}`)
  })
  console.log()
  
  // Test 4: Get by category
  console.log('TEST 4: Get by category')
  const categories = ['A', 'B', 'C', 'D', 'E'] as const
  for (const category of categories) {
    const openings = ecoParser.getByCategory(category)
    console.log(`ECO ${category}: ${openings.length} openings`)
  }
  console.log()
  
  // Test 5: Get popular openings
  console.log('TEST 5: Popular openings')
  const popular = ecoParser.getPopularOpenings(10)
  console.log('Popular openings:')
  popular.forEach(opening => {
    console.log(`  ${opening.ecoCode}: ${opening.name}`)
  })
  console.log()
  
  // Test 6: Opening families
  console.log('TEST 6: Opening families')
  const families = ['Sicilian', 'Queen\'s Gambit', 'King\'s Indian']
  for (const family of families) {
    const openings = ecoParser.getOpeningFamily(family)
    console.log(`${family}: ${openings.length} variations`)
  }
  console.log()
  
  console.log('✅ ECO testing completed!')
}

if (require.main === module) {
  testEcoFunctionality().catch(console.error)
}

export { testEcoFunctionality }