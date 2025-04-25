import prisma from './prisma.js'
import bcryptjs from 'bcryptjs'

async function seedUsers(){
	// Hash the password before storing it
	const hashedPassword = await bcryptjs.hash('42', 10)
	
	// Insert test users into the 'User' model
	try{
		await prisma.user.createMany({
		data: [
		{ username: 'casi', password: hashedPassword, email: 'casi@gmail.com' },
		{ username: 'emmi', password: hashedPassword, email: 'emmi@hive.fi' },
		{ username: 'armin', password: hashedPassword, email: 'armin@hive.fi' },
		{ username: 'sahra', password: hashedPassword, email: 'sahra@hive.fi' },
		{ username: 'ryan', password: hashedPassword, email: 'ryan@hive.fi' },
		],
		})
	} catch (err) {
		console.log('database already seeded')
	}
}

export default seedUsers