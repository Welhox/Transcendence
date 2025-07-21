#!/bin/bash

# Navigate to backend directory
cd /home/akuburas/Transcendence/backend

# Make the database file writable (these commands need sudo)
echo "Making database writable..."
sudo chmod 666 prisma/mydb.sqlite
sudo chown akuburas:akuburas prisma/mydb.sqlite

# Run the script as normal user
echo "Running seed script..."
node srcs/extended_seed.js

# Display success message
echo "✅ Extended seeding completed! Your database now has sample users, match history and friend relationships."
