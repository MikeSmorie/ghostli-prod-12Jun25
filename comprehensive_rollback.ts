import { db } from './db';

// List of all tables that may have been contaminated with source_app column
const tableNames = [
  'users', 'user_subscriptions', 'credit_transactions', 'vouchers',
  'voucher_redemptions', 'referrals', 'payments', 'user_profiles',
  'ai_responses', 'cloned_content', 'user_writing_styles', 'global_settings',
  'master_prompts', 'prompt_execution_logs', 'feature_flags', 'system_features',
  'activity_logs', 'error_logs', 'messages'
];

async function removeSourceAppColumns() {
  console.log('🚨 EMERGENCY ROLLBACK: Removing source_app from all contaminated tables...');
  
  let cleanedCount = 0;
  let totalTables = 0;

  for (const tableName of tableNames) {
    totalTables++;
    try {
      await db.execute(`ALTER TABLE ${tableName} DROP COLUMN IF EXISTS source_app`);
      console.log(`✅ Cleaned ${tableName}`);
      cleanedCount++;
    } catch (e) {
      console.log(`ℹ️  ${tableName} - no source_app column found`);
    }
  }

  // Additional cleanup for any tables we might have missed
  console.log('\n🔍 Scanning for any remaining source_app columns...');
  
  try {
    const result = await db.execute(`
      SELECT DISTINCT table_name 
      FROM information_schema.columns 
      WHERE column_name = 'source_app' 
      AND table_schema = 'public'
    `);
    
    if (result.length > 0) {
      console.log('⚠️  Found additional contaminated tables:');
      for (const row of result) {
        try {
          await db.execute(`ALTER TABLE ${row.table_name} DROP COLUMN IF EXISTS source_app`);
          console.log(`✅ Cleaned additional table: ${row.table_name}`);
          cleanedCount++;
        } catch (e) {
          console.error(`❌ Failed to clean ${row.table_name}:`, e);
        }
      }
    } else {
      console.log('✅ No additional contaminated tables found');
    }
  } catch (e) {
    console.error('Error scanning for remaining columns:', e);
  }

  console.log(`\n🎯 ROLLBACK COMPLETE: ${cleanedCount} tables cleaned`);
  console.log('🔄 Database restored to pre-contamination state');
  
  // Verify cleanup
  try {
    const verification = await db.execute(`
      SELECT COUNT(*) as remaining_count
      FROM information_schema.columns 
      WHERE column_name = 'source_app' 
      AND table_schema = 'public'
    `);
    
    const remainingCount = verification[0]?.remaining_count || 0;
    if (remainingCount === 0) {
      console.log('✅ VERIFICATION PASSED: All source_app columns removed');
    } else {
      console.log(`⚠️  WARNING: ${remainingCount} source_app columns still remain`);
    }
  } catch (e) {
    console.error('Verification failed:', e);
  }
}

removeSourceAppColumns().catch(console.error);