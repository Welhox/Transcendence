import prisma from "./prisma.js";
import bcryptjs from "bcryptjs";
import recalculateUserStats from "./seed_utils.js";

async function seedUsers() {
  // Hash the password before storing it
  const hashedPassword = await bcryptjs.hash("42", 10);

  // Check if users already exist
  const existingUsers = await prisma.user.findMany({
    where: {
      username: {
        in: ["casi", "emmi", "armin", "sahra", "ryan"]
      }
    }
  });

  const existingUsernames = existingUsers.map(u => u.username);

  // Insert test users into the 'User' model if they don't exist
  try {
    const usersToCreate = [
      {
        username: "casi",
        password: hashedPassword,
        email: "casi.lehtovuori@gmail.com",
      },
      { username: "emmi", password: hashedPassword, email: "emmi@hive.fi" },
      { username: "armin", password: hashedPassword, email: "armin@hive.fi" },
      { username: "sahra", password: hashedPassword, email: "sahra@hive.fi" },
      { username: "ryan", password: hashedPassword, email: "ryan@hive.fi" },
      { username: "mike", password: hashedPassword, email: "mike@hive.fi" },
      { username: "alex", password: hashedPassword, email: "alex@hive.fi" },
      { username: "sophie", password: hashedPassword, email: "sophie@hive.fi" },
      { username: "jake", password: hashedPassword, email: "jake@hive.fi" },
      { username: "lisa", password: hashedPassword, email: "lisa@hive.fi" },
      { username: "leon", password: hashedPassword, email: "leon@hive.fi" },
      { username: "claire", password: hashedPassword, email: "claire@hive.fi" },
    ].filter(user => !existingUsernames.includes(user.username));

    if (usersToCreate.length > 0) {
      // Create users individually instead of using createMany with skipDuplicates
      for (const user of usersToCreate) {
        await prisma.user.create({
          data: user
        });
      }
      console.log(`${usersToCreate.length} new users seeded`);
    } else {
      console.log("No new users to seed");
    }
  } catch (err) {
    console.log("User seeding error:", err.message);
  }
}

// Seed extensive match history data between multiple users
async function seedExtensiveMatches() {
  // Get all users
  const users = await prisma.user.findMany();
  const userMap = {};
  users.forEach(user => {
    userMap[user.username] = user.id;
  });

  // Create a function to generate random match data between two users
  function generateMatchData(player1, player2, count = 5) {
    const matches = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      // Generate random result (60% wins for player1)
      const isPlayer1Win = Math.random() < 0.6;
      
      // Create match 
      matches.push({
        playerId: userMap[player1],
        opponentId: userMap[player2],
        result: isPlayer1Win ? "win" : "loss",
        date: new Date(now.getTime() - (i * 86400000 * Math.random() * 30)) // Random date within the last 30 days
      });
    }
    
    return matches;
  }

  // Define pairs of users who will have match history
  const matchPairs = [
    ["casi", "emmi", 8],  // 8 matches between casi and emmi
    ["casi", "armin", 5], // 5 matches between casi and armin
    ["casi", "mike", 3],
    ["casi", "alex", 6],
    ["casi", "jake", 2],
    ["emmi", "armin", 4],
    ["emmi", "sahra", 7],
    ["emmi", "ryan", 3],
    ["emmi", "sophie", 5],
    ["armin", "sahra", 6],
    ["armin", "mike", 4],
    ["sahra", "ryan", 9],
    ["sahra", "lisa", 3],
    ["ryan", "mike", 2],
    ["ryan", "leon", 4],
    ["mike", "alex", 7],
    ["sophie", "jake", 5],
    ["sophie", "leon", 3],
    ["jake", "lisa", 6],
    ["jake", "claire", 4],
    ["lisa", "claire", 8],
    ["leon", "claire", 5],
  ];

  try {
    // Clear existing matches if needed
    // Uncomment if you want to replace all existing match data
    // await prisma.match.deleteMany({});

    let allMatches = [];
    matchPairs.forEach(([player1, player2, count]) => {
      if (userMap[player1] && userMap[player2]) {
        const matches = generateMatchData(player1, player2, count);
        allMatches = [...allMatches, ...matches];
      }
    });

    // Create matches individually instead of using createMany with skipDuplicates
    for (const match of allMatches) {
      try {
        await prisma.match.create({
          data: match
        });
      } catch (error) {
        console.log(`Error creating match: ${error.message}`);
      }
    }

    console.log(`${allMatches.length} matches seeded`);
  } catch (error) {
    console.log("Match seeding error:", error.message);
  }
}

// Seed friend relationships between users
async function seedFriendships() {
  // Define friendship pairs (bidirectional)
  const friendshipPairs = [
    ["casi", "emmi"],
    ["casi", "armin"],
    ["casi", "mike"],
    ["emmi", "sahra"],
    ["emmi", "ryan"],
    ["armin", "sahra"],
    ["sahra", "ryan"],
    ["mike", "alex"],
    ["mike", "sophie"],
    ["alex", "sophie"],
    ["jake", "lisa"],
    ["jake", "leon"],
    ["lisa", "claire"],
    ["leon", "claire"],
  ];

  try {
    const users = await prisma.user.findMany();
    const userMap = {};
    users.forEach(user => {
      userMap[user.username] = user;
    });

    for (const [user1Name, user2Name] of friendshipPairs) {
      const user1 = userMap[user1Name];
      const user2 = userMap[user2Name];

      if (user1 && user2) {
        // Check if they are already friends
        const existingFriendship = await prisma.user.findFirst({
          where: {
            id: user1.id,
            friends: {
              some: {
                id: user2.id
              }
            }
          }
        });

        if (!existingFriendship) {
          // Create friendship connection both ways
          await prisma.user.update({
            where: { id: user1.id },
            data: {
              friends: {
                connect: { id: user2.id }
              }
            }
          });

          await prisma.user.update({
            where: { id: user2.id },
            data: {
              friends: {
                connect: { id: user1.id }
              }
            }
          });

          console.log(`Created friendship between ${user1Name} and ${user2Name}`);
        } else {
          console.log(`${user1Name} and ${user2Name} are already friends`);
        }
      }
    }

    console.log("Friendships seeded");
  } catch (error) {
    console.log("Friendship seeding error:", error.message);
  }
}

// Seed pending friend requests
async function seedFriendRequests() {
  // Define pending friend requests (from -> to)
  const pendingRequests = [
    ["casi", "jake"],
    ["casi", "lisa"],
    ["emmi", "alex"],
    ["armin", "claire"],
    ["ryan", "sophie"],
  ];

  try {
    const users = await prisma.user.findMany();
    const userMap = {};
    users.forEach(user => {
      userMap[user.username] = user;
    });

    for (const [senderName, receiverName] of pendingRequests) {
      const sender = userMap[senderName];
      const receiver = userMap[receiverName];

      if (sender && receiver) {
        // Check if a request already exists
        const existingRequest = await prisma.friendRequest.findFirst({
          where: {
            senderId: sender.id,
            receiverId: receiver.id,
          }
        });

        if (!existingRequest) {
          await prisma.friendRequest.create({
            data: {
              senderId: sender.id,
              receiverId: receiver.id,
              status: "pending",
              createdAt: new Date()
            }
          });
          console.log(`Created friend request from ${senderName} to ${receiverName}`);
        } else {
          console.log(`Friend request from ${senderName} to ${receiverName} already exists`);
        }
      }
    }

    console.log("Friend requests seeded");
  } catch (error) {
    console.log("Friend request seeding error:", error.message);
  }
}

async function main() {
  // First seed users
  await seedUsers();
  
  // Then seed matches
  await seedExtensiveMatches();
  
  // Update stats based on matches
  await recalculateUserStats();
  
  // Then seed friendships
  await seedFriendships();
  
  // Finally seed friend requests
  await seedFriendRequests();
  
  await prisma.$disconnect();
  console.log("Extended seeding complete!");
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
