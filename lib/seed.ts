import { prisma } from './db'

export async function createTempUser() {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: 'temp-user-123' }
    })

    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: 'temp-user-123',
          email: 'temp@example.com',
          name: 'Temp User'
        }
      })
      console.log('Temp user created')
    }
  } catch (error) {
    console.error('Error creating temp user:', error)
  }
}