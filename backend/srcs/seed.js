import prisma from './prisma.js'
import bcryptjs from 'bcryptjs'
import recalculateUserStats from './seed_utils.js'

async function seedUsers(){
	// Hash the password before storing it
	const hashedPassword = await bcryptjs.hash('42', 10)
	
	// Insert test users into the 'User' model
	try{
		await prisma.user.createMany({
			data: [
				{ username: 'casi', password: hashedPassword, email: 'casi@hive.fi' },
				{ username: 'emmi', password: hashedPassword, email: 'emmi@hive.fi' },
				{ username: 'armin', password: hashedPassword, email: 'armin@hive.fi' },
				{ username: 'sahra', password: hashedPassword, email: 'sahra@hive.fi' },
				{ username: 'ryan', password: hashedPassword, email: 'ryan@hive.fi' },
			],
		})
		console.log('Users seeded');
	} catch (err) {
		console.log('User seeding error:', err.message)
	}
}

// seed fake match data
async function seedMatches() {
	// clean up existing matches first
	await prisma.match.deleteMany({});

	const users = await prisma.user.findMany({
		where: {
			username: {
				in: ['casi', 'emmi'],
			},
		}
	});

	const casi = users.find((u) => u.username === 'casi');
	const emmi = users.find((u) => u.username === 'emmi');

	if (!casi || !emmi) {
		console.log('Users not found, skipping match seeding.');
		return;
	}

	const matchesData = [
		{
			playerId: casi.id,
			opponentId: emmi.id,
			result: 'win',
			date: new Date('2025-01-01'),
		},
		{
			playerId: casi.id,
			opponentId: emmi.id,
			result: 'loss',
			date: new Date('2025-01-02'),
		},
		{
			playerId: casi.id,
			opponentId: emmi.id,
			result: 'win',
			date: new Date('2025-01-03'),
		},
	];

	try {
		for (const match of matchesData) {
			await prisma.match.create({ data: match });
		}
		console.log('Match data seeded');
	} catch (error) {
		console.log('Match seeding error:', error.message);
	}
}

async function main() {
	await seedUsers();
	await seedMatches();
	await recalculateUserStats();
	await prisma.$disconnect();
}

main().catch((e) => {
	console.error(e);
	prisma.$disconnect();
	process.exit(1);
});

export default seedUsers