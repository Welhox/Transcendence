#!/bin/sh

# # Exit immediately if a command fails
# set -e

# echo "Installing dependencies..."
# npm install

echo "Installing dependencies..."
npm install --include=dev


# echo "Rebuilding sqlite3 from source (if needed)..."
# npm install --build-from-source sqlite3

echo "Installing Prisma and generating client..."
npm install prisma @prisma/client

# Generate Prisma Client depending on which environment it is in
echo "Generating Prisma client..."
npx prisma generate

# initialize Prisma, if /prisma dosent exist (also creates the .env file)
if [ ! -d "./prisma" ]; then
  echo "Initializing Prisma..."
  npx prisma init
else
  echo "Prisma already initialized, skipping..."
fi

echo "creating the database"
npx prisma db push

echo "Starting the app..."
npm run start
