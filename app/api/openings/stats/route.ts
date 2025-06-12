import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'

export async function GET() {
  try {
    console.log('🔍 Fetching category statistics...')

    // Get counts for each category
    const [categoryA, categoryB, categoryC, categoryD, categoryE, total] = await Promise.all([
      prisma.opening.count({ where: { ecoCode: { startsWith: 'A' } } }),
      prisma.opening.count({ where: { ecoCode: { startsWith: 'B' } } }),
      prisma.opening.count({ where: { ecoCode: { startsWith: 'C' } } }),
      prisma.opening.count({ where: { ecoCode: { startsWith: 'D' } } }),
      prisma.opening.count({ where: { ecoCode: { startsWith: 'E' } } }),
      prisma.opening.count()
    ])

    const stats = {
      total,
      categories: {
        A: categoryA,
        B: categoryB,
        C: categoryC,
        D: categoryD,
        E: categoryE
      }
    }

    console.log('📊 Category stats:', stats)

    return NextResponse.json(stats)

  } catch (error) {
    console.error('❌ Error fetching category stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category statistics' },
      { status: 500 }
    )
  }
}