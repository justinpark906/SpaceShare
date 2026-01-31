import { NextResponse } from 'next/server';

/**
 * POST /api/simulate/departure
 *
 * Simulates Marcus leaving the parking spot (geofence EXIT event)
 * Triggers: Gate Lock → Session End → Visa Payout → Capital One Sweep
 */

export async function POST() {
  console.log('👋 SIMULATE: Marcus leaving parking spot...');

  // Simulate the departure flow
  const sessionData = {
    spaceId: 'space_01',
    duration: '2 hours',
    totalAmount: 10.00,
    platformFee: 0.20,
    listerPayout: 7.84,
    taxSweep: 1.57,
  };

  console.log('📍 Geofence EXIT detected');
  console.log('🔒 Bollard_01 LOCKED');
  console.log('💳 Initiating Visa Direct payout...');
  console.log(`   → Sending $${sessionData.listerPayout} to Sarah's card`);
  console.log('🏦 Triggering Capital One savings sweep...');
  console.log(`   → Moving $${sessionData.taxSweep} to Tax Savings Vault`);
  console.log('✅ Session complete!');

  return NextResponse.json({
    success: true,
    event: 'DEPARTURE',
    session: {
      duration: sessionData.duration,
      totalCharged: sessionData.totalAmount,
    },
    payments: {
      visaDirect: {
        status: 'COMPLETED',
        amount: sessionData.listerPayout,
        recipient: 'Sarah',
        referenceId: `VISA_${Date.now()}`,
      },
      capitalOneSweep: {
        status: 'COMPLETED',
        amount: sessionData.taxSweep,
        destination: 'Tax Savings Vault',
        transferId: `CO_${Date.now()}`,
      },
      platformFee: {
        amount: sessionData.platformFee,
        description: 'City Improvement Fee (2%)',
      },
    },
    flow: [
      'Geofence EXIT detected',
      'Gate LOCKED',
      'Session ended',
      'Visa Direct payout sent',
      'Capital One sweep completed',
    ],
  });
}
