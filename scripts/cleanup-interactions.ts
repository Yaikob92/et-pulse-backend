import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupCorruptedInteractions() {
    try {
        console.log('Searching for corrupted interaction records...');

        // This would be the Mongoose equivalent in your actual backend
        // Since you're using Mongoose, you'll need to run this differently

        console.log('To clean up the corrupted records, run this in MongoDB shell or Compass:');
        console.log('');
        console.log('db.interactions.deleteMany({ $or: [{ user: null }, { news: null }] })');
        console.log('');
        console.log('Or use this Mongoose script in your backend:');
        console.log('');
        console.log('const result = await Interaction.deleteMany({');
        console.log('  $or: [');
        console.log('    { user: null },');
        console.log('    { news: null }');
        console.log('  ]');
        console.log('});');
        console.log('console.log(`Deleted ${result.deletedCount} corrupted records`);');

    } catch (error) {
        console.error('Error:', error);
    }
}

cleanupCorruptedInteractions();
