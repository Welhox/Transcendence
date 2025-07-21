// Test script to check if the database is writable
import prisma from "./prisma.js";

async function testDbWrite() {
  try {
    console.log("Testing database write permissions...");
    
    // Check if there's at least one user
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users in the database`);
    
    console.log("Database is accessible for reading.");
    
    // Try to run a simple update query
    if (userCount > 0) {
      // Get the first user
      const firstUser = await prisma.user.findFirst();
      
      if (firstUser) {
        console.log(`Found user: ${firstUser.username}`);
        
        // Try to update the user's profile without changing anything
        const updated = await prisma.user.update({
          where: { id: firstUser.id },
          data: { 
            updatedAt: new Date() // Just update the timestamp
          }
        });
        
        console.log("Database is writable!");
      }
    }
  } catch (error) {
    console.error("Database write test failed:", error.message);
    if (error.message.includes("readonly database")) {
      console.log("\nThe database appears to be read-only. Please check permissions on the database file.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

testDbWrite();
