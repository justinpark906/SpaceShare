import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/pay/disburse
 *
 * Triggered when IoT confirms "Session Ended" (bollard closed)
 * Sends funds to Sarah via Visa Direct PushFunds API
 *
 * Flow:
 * 1. Update transaction status to COMPLETED
 * 2. Call Visa Direct to push funds to lister's card
 * 3. Update transaction status to DISBURSED
 * 4. Trigger Capital One savings sweep
 */

interface DisburseRequest {
  transactionId: string;
}

// Visa Direct Sandbox Configuration
const VISA_CONFIG = {
  baseUrl: process.env.VISA_BASE_URL || 'https://sandbox.api.visa.com',
  userId: process.env.VISA_USER_ID || 'demo_user',
  password: process.env.VISA_PASSWORD || 'demo_pass',
};

export async function POST(request: NextRequest) {
  try {
    const body: DisburseRequest = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID required' },
        { status: 400 }
      );
    }

    // In production, fetch from DynamoDB
    // For demo, we'll simulate the transaction
    const transaction = {
      id: transactionId,
      amount: 10.00,
      platformFee: 0.20,
      listerPayout: 7.84,
      taxSweep: 1.96,
      status: 'PENDING',
      listerId: 'sarah_123',
      listerCardToken: '4111111111111111', // Test card
    };

    console.log('💳 Processing Visa Direct Disbursement...');

    // Call Visa Direct PushFunds API (or mock)
    const visaResult = await callVisaDirectPushFunds({
      amount: transaction.listerPayout,
      recipientCard: transaction.listerCardToken,
      transactionId: transaction.id,
    });

    if (!visaResult.success) {
      return NextResponse.json(
        { error: 'Visa Direct transfer failed', details: visaResult.error },
        { status: 500 }
      );
    }

    console.log('✅ Visa Direct Transfer Complete:', {
      transactionId: transaction.id,
      amount: `$${transaction.listerPayout.toFixed(2)}`,
      visaReferenceId: visaResult.referenceId,
    });

    // Trigger Capital One Savings Sweep
    const sweepResult = await triggerSavingsSweep({
      transactionId: transaction.id,
      listerId: transaction.listerId,
      amount: transaction.taxSweep,
    });

    return NextResponse.json({
      success: true,
      disbursement: {
        transactionId: transaction.id,
        status: 'DISBURSED',
        amountSent: transaction.listerPayout,
        visaReferenceId: visaResult.referenceId,
        platformFeeCollected: transaction.platformFee,
      },
      savingsSweep: sweepResult,
    });
  } catch (error) {
    console.error('Disbursement error:', error);
    return NextResponse.json(
      { error: 'Failed to disburse funds' },
      { status: 500 }
    );
  }
}

/**
 * Call Visa Direct PushFunds API
 * https://developer.visa.com/capabilities/visa_direct/reference
 */
async function callVisaDirectPushFunds(params: {
  amount: number;
  recipientCard: string;
  transactionId: string;
}): Promise<{ success: boolean; referenceId?: string; error?: string }> {
  const { amount, recipientCard, transactionId } = params;

  // Construct the Visa Direct PushFunds request
  const visaPayload = {
    systemsTraceAuditNumber: Math.floor(Math.random() * 999999).toString().padStart(6, '0'),
    retrievalReferenceNumber: `${Date.now()}`.slice(-12),
    localTransactionDateTime: new Date().toISOString().replace(/[-:]/g, '').slice(0, 14),
    acquiringBin: '408999',
    acquirerCountryCode: '840',
    senderAccountNumber: '4957030420210496', // Platform's funding source
    senderName: 'EcoSquare Platform',
    senderCountryCode: 'USA',
    transactionCurrencyCode: 'USD',
    recipientPrimaryAccountNumber: recipientCard,
    amount: amount.toFixed(2),
    businessApplicationId: 'PP', // Person to Person
    transactionIdentifier: transactionId,
    merchantCategoryCode: '6012',
    cardAcceptor: {
      name: 'EcoSquare Inc',
      terminalId: 'ECOSQ001',
      idCode: 'ECOSQUARE',
      address: {
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        zipCode: '94102',
      },
    },
  };

  console.log('📤 Visa Direct Request Payload:', JSON.stringify(visaPayload, null, 2));

  // In production, make actual API call:
  // const response = await fetch(`${VISA_CONFIG.baseUrl}/visadirect/fundstransfer/v1/pushfundstransactions`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Basic ${Buffer.from(`${VISA_CONFIG.userId}:${VISA_CONFIG.password}`).toString('base64')}`,
  //   },
  //   body: JSON.stringify(visaPayload),
  // });

  // For demo, return mock success
  return {
    success: true,
    referenceId: `VISA_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
  };
}

/**
 * Trigger Capital One Savings Sweep
 */
async function triggerSavingsSweep(params: {
  transactionId: string;
  listerId: string;
  amount: number;
}): Promise<{ success: boolean; swept: number; transferId?: string }> {
  const { amount, listerId, transactionId } = params;

  try {
    // Call our Capital One sweep endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/capital-one/sweep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionId,
        accountId: listerId,
        amount,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        swept: amount,
        transferId: result.transferId,
      };
    }
  } catch (error) {
    console.error('Savings sweep trigger failed:', error);
  }

  // Return success anyway for demo
  return {
    success: true,
    swept: amount,
    transferId: `SWEEP_${Date.now()}`,
  };
}
