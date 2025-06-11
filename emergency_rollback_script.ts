
import { db } from './db/index.js';

async function emergencyRollback() {
  console.log('🚨 Starting emergency rollback - removing source_app columns...');
  
  try {
    // Drop source_app column from all modified tables
    const tables = [
      'users',
      'user_subscriptions', 
      'credit_transactions',
      'vouchers',
      'voucher_redemptions',
      'referral_relationships',
      'payments',
      'user_essays',
      'cloned_content',
      'user_writing_styles',
      'global_settings',
      'feature_flags',
      'ai_detection_shield_runs',
      'api_usage_logs',
      'cost_tracking',
      'performance_metrics',
      'admin_announcements',
      'announcement_recipients',
      'announcement_responses',
      'subscription_plans',
      'plan_features',
      'features',
      'crypto_wallets',
      'crypto_transactions',
      'crypto_exchange_rates',
      'user_referral_codes',
      'activity_logs',
      'error_logs',
      'messages'
    ];

    for (const table of tables) {
      try {
        await db.execute(`ALTER TABLE ${table} DROP COLUMN IF EXISTS source_app`);
        console.log(`✅ Removed source_app from ${table}`);
      } catch (error) {
        console.log(`⚠️  ${table} - ${error.message}`);
      }
    }

    // Verify cleanup
    const result = await db.execute(`
      SELECT COUNT(*) as remaining_columns
      FROM information_schema.columns 
      WHERE column_name = 'source_app' 
      AND table_schema = 'public'
    `);
    
    console.log('🔍 Verification complete');
    console.log(`Remaining source_app columns: ${result.rows[0]?.remaining_columns || 0}`);
    
    if (result.rows[0]?.remaining_columns === 0 || result.rows[0]?.remaining_columns === '0') {
      console.log('✅ Emergency rollback complete: ALL source_app columns removed');
      console.log('🔄 Omega login and shared functionality should now be restored');
    } else {
      console.log('⚠️  Some source_app columns may still exist');
    }

  } catch (error) {
    console.error('❌ Emergency rollback failed:', error);
    throw error;
  }
}

// Execute the rollback
emergencyRollback()
  .then(() => {
    console.log('🎉 Emergency rollback operation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Emergency rollback operation failed:', error);
    process.exit(1);
  });
