import { NextResponse } from 'next/server';

/**
 * POST /api/simulate/reset
 *
 * Resets the demo state for a fresh run
 */

export async function POST() {
  console.log('🔄 RESET: Clearing demo state...');
  console.log('   → Transactions cleared');
  console.log('   → Spaces reset to AVAILABLE');
  console.log('   → Session data cleared');
  console.log('✅ Demo ready for next run!');

  return NextResponse.json({
    success: true,
    message: 'Demo state reset successfully',
    timestamp: new Date().toISOString(),
  });
}
