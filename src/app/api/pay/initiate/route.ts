import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/pay/initiate
 *
 * Creates a PENDING transaction (escrow) when Marcus clicks "Book"
 * Money is held until the session completes.
 *
 * Fee Structure:
 * - Platform Fee: 2% (City Improvement Fee)
 * - Lister Payout: 78% (after platform fee)
 * - Tax Sweep: 20% of lister payout (auto-saved)
 */

interface InitiatePaymentRequest {
  spaceId: string;
  renterId: string;
  listerId: string;
  amount: number; // Total amount from renter
  hours: number;
}

interface Transaction {
  id: string;
  amount: number;
  platformFee: number;
  listerPayout: number;
  taxSweep: number;
  status: 'PENDING' | 'COMPLETED' | 'DISBURSED' | 'SWEPT';
  renterId: string;
  listerId: string;
  spaceId: string;
  initiatedAt: string;
}

// In-memory store for demo (replace with DynamoDB in production)
const transactions: Map<string, Transaction> = new Map();

export async function POST(request: NextRequest) {
  try {
    const body: InitiatePaymentRequest = await request.json();
    const { spaceId, renterId, listerId, amount } = body;

    // Validate required fields
    if (!spaceId || !renterId || !listerId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate fee breakdown
    const platformFee = amount * 0.02; // 2% City Improvement Fee
    const afterPlatformFee = amount - platformFee;
    const listerPayout = afterPlatformFee * 0.80; // 80% to lister
    const taxSweep = listerPayout * 0.20; // 20% of payout goes to tax savings

    // Create transaction record
    const transaction: Transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      platformFee,
      listerPayout,
      taxSweep,
      status: 'PENDING',
      renterId,
      listerId,
      spaceId,
      initiatedAt: new Date().toISOString(),
    };

    // Store transaction (in production, save to DynamoDB)
    transactions.set(transaction.id, transaction);

    console.log('💰 Payment Initiated:', {
      transactionId: transaction.id,
      total: `$${amount.toFixed(2)}`,
      platformFee: `$${platformFee.toFixed(2)} (2%)`,
      listerPayout: `$${listerPayout.toFixed(2)} (80%)`,
      taxSweep: `$${taxSweep.toFixed(2)} (20% of payout)`,
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        status: transaction.status,
        breakdown: {
          total: amount,
          platformFee,
          listerPayout,
          taxSweep,
          listerNet: listerPayout - taxSweep, // What lister actually receives
        },
      },
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}

// Export transactions for other routes to access
export { transactions };
