import { db } from './db';
import bcrypt from 'bcrypt';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

// Restore authentication with properly hashed passwords for existing users
async function restoreAuthentication() {
  console.log('🔑 Restoring authentication system...');
  
  try {
    // Hash common test passwords
    const testUserHash = await bcrypt.hash('testpass', 10);
    const humanizationHash = await bcrypt.hash('humanization123', 10);
    const adminHash = await bcrypt.hash('admin123', 10);
    
    // Update testuser
    await db.update(users)
      .set({ password: testUserHash })
      .where(eq(users.username, 'testuser'));
    console.log('✅ Restored testuser authentication');
    
    // Update testuser_humanization  
    await db.update(users)
      .set({ password: humanizationHash })
      .where(eq(users.username, 'testuser_humanization'));
    console.log('✅ Restored testuser_humanization authentication');
    
    // Update admin
    await db.update(users)
      .set({ password: adminHash })
      .where(eq(users.username, 'admin'));
    console.log('✅ Restored admin authentication');
    
    console.log('\n🎯 Authentication restoration complete');
    console.log('Test credentials:');
    console.log('- testuser / testpass');
    console.log('- testuser_humanization / humanization123'); 
    console.log('- admin / admin123');
    
  } catch (error) {
    console.error('❌ Authentication restoration failed:', error);
  }
}

restoreAuthentication();