import { prisma } from '../lib/db'
import * as fs from 'fs'
import * as path from 'path'

async function seedEcoData() {
  console.log('🌱 Starting ECO data seeding...')
  
  const categories = ['a', 'b', 'c', 'd', 'e']
  let totalImported = 0
  
  // 🔍 PRVO PROVJERI DA LI SVI FAJLOVI POSTOJE
  console.log('🔍 Checking file existence...')
  for (const category of categories) {
    const filePath = path.join(process.cwd(), 'data', 'eco', `${category}.tsv`)
    const exists = fs.existsSync(filePath)
    console.log(`📂 ${category.toUpperCase()}.tsv: ${exists ? '✅ EXISTS' : '❌ MISSING'} - ${filePath}`)
    
    if (exists) {
      const stats = fs.statSync(filePath)
      console.log(`   📊 Size: ${stats.size} bytes`)
      
      // Provjeri prvih par linija
      try {
        const data = fs.readFileSync(filePath, 'utf-8')
        const lines = data.split('\n').filter(line => line.trim())
        console.log(`   📋 Lines: ${lines.length}`)
        console.log(`   📝 First line: ${lines[0]?.substring(0, 100)}...`)
        console.log(`   📝 Second line: ${lines[1]?.substring(0, 100)}...`)
      } catch (readError) {
        console.error(`   ❌ Error reading ${category}.tsv:`, readError)
      }
    }
  }
  
  console.log('\n🚀 Starting import process...')
  
  for (const category of categories) {
    const filePath = path.join(process.cwd(), 'data', 'eco', `${category}.tsv`)
    
    console.log(`\n📂 Processing ${category.toUpperCase()} category: ${filePath}`)
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`)
      continue
    }
    
    try {
      const data = fs.readFileSync(filePath, 'utf-8')
      const lines = data.split('\n').filter(line => line.trim())
      
      console.log(`📋 Found ${lines.length} lines in ${category}.tsv`)
      
      if (lines.length === 0) {
        console.log(`⚠️  File ${category}.tsv is empty!`)
        continue
      }
      
      // Skip header line if exists
      const dataLines = lines[0].includes('ECO') || lines[0].includes('eco') || lines[0].includes('Name') || lines[0].includes('name') ? lines.slice(1) : lines
      console.log(`📋 After header check: ${dataLines.length} data lines`)
      
      if (dataLines.length === 0) {
        console.log(`⚠️  No data lines found in ${category}.tsv after header check!`)
        continue
      }
      
      let categoryCount = 0
      let errorCount = 0
      const ecoCounter: Record<string, number> = {}
      
      for (const [index, line] of dataLines.entries()) {
        if (line.trim()) {
          // Parse TSV format: eco	name	pgn
          const fields = line.split('\t')
          
          if (fields.length >= 3) {
            const [ecoCode, fullName, pgn] = fields
            
            // Validate data
            if (!ecoCode?.trim() || !fullName?.trim() || !pgn?.trim()) {
              console.log(`⚠️  Skipping line with empty fields: ${line.substring(0, 50)}...`)
              errorCount++
              continue
            }
            
            // Extract family from name (part before ":")
            const nameParts = fullName.split(':')
            const family = nameParts[0].trim()
            const variation = nameParts.length > 1 ? nameParts[1].trim() : null
            
            // Use PGN as moves
            const moves = pgn.trim()
            
            // Generate unique ECO code
            const baseEcoCode = ecoCode.trim()
            ecoCounter[baseEcoCode] = (ecoCounter[baseEcoCode] || 0) + 1
            
            const uniqueEcoCode = ecoCounter[baseEcoCode] === 1 
              ? baseEcoCode 
              : `${baseEcoCode}-${ecoCounter[baseEcoCode]}`
            
            // Show progress for first few entries
            if (index < 5) {
              console.log(`   🔄 Processing: ${uniqueEcoCode} - ${fullName.substring(0, 50)}...`)
            }
            
            try {
              await prisma.opening.upsert({
                where: { ecoCode: uniqueEcoCode },
                update: {
                  name: fullName.trim(),
                  family: family,
                  variation: variation,
                  moves: moves
                },
                create: {
                  ecoCode: uniqueEcoCode,
                  name: fullName.trim(),
                  family: family,
                  variation: variation,
                  subvariation: null,
                  moves: moves,
                  popularity: Math.floor(Math.random() * 1000),
                  whiteWins: Math.floor(Math.random() * 100),
                  blackWins: Math.floor(Math.random() * 100),
                  draws: Math.floor(Math.random() * 50)
                }
              })
              
              categoryCount++
              totalImported++
              
              // Progress indicator every 50 entries
              if (categoryCount % 50 === 0) {
                console.log(`⏳ Progress: ${categoryCount}/${dataLines.length} in category ${category.toUpperCase()}`)
              }
              
            } catch (dbError) {
              console.error(`❌ Database error for ${uniqueEcoCode}:`, dbError)
              errorCount++
            }
          } else {
            console.log(`⚠️  Skipping malformed line (expected 3+ fields, got ${fields.length}): ${line.substring(0, 50)}...`)
            errorCount++
          }
        }
      }
      
      console.log(`✅ Category ${category.toUpperCase()} completed:`)
      console.log(`   📈 Imported: ${categoryCount}`)
      console.log(`   ❌ Errors: ${errorCount}`)
      console.log(`   📊 Total processed: ${dataLines.length}`)
      
    } catch (error) {
      console.error(`❌ Error processing ${category}.tsv:`, error)
    }
  }
  
  console.log(`\n🎉 Import summary:`)
  console.log(`   📈 Total imported: ${totalImported} openings`)
  
  // Verify import by category
  console.log('\n📊 Database verification:')
  const totalCount = await prisma.opening.count()
  console.log(`   📊 Total openings in database: ${totalCount}`)
  
  // Count by category
  const categoryPrefixes = ['A', 'B', 'C', 'D', 'E']
  for (const cat of categoryPrefixes) {
    const count = await prisma.opening.count({
      where: { ecoCode: { startsWith: cat } }
    })
    console.log(`   ${cat}: ${count} openings`)
    
    if (count > 0) {
      const sample = await prisma.opening.findFirst({
        where: { ecoCode: { startsWith: cat } }
      })
      console.log(`      Sample: ${sample?.ecoCode} - ${sample?.name?.substring(0, 50)}...`)
    }
  }
}

async function main() {
  try {
    console.log('🔍 Working directory:', process.cwd())
    console.log('🔍 Looking for files in:', path.join(process.cwd(), 'data', 'eco'))
    
    // Check if data directory exists
    const dataDir = path.join(process.cwd(), 'data', 'eco')
    if (!fs.existsSync(dataDir)) {
      console.error(`❌ Data directory not found: ${dataDir}`)
      console.log('📁 Available directories:')
      const currentDir = fs.readdirSync(process.cwd())
      currentDir.forEach(item => {
        const itemPath = path.join(process.cwd(), item)
        if (fs.statSync(itemPath).isDirectory()) {
          console.log(`   📁 ${item}`)
        }
      })
      return
    }
    
    // Reset database first
    console.log('🗑️  Clearing existing openings...')
    const deletedCount = await prisma.opening.deleteMany({})
    console.log(`🗑️  Deleted ${deletedCount.count} existing openings`)
    
    // Import from TSV files
    await seedEcoData()
    
    console.log('🎉 ECO seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()