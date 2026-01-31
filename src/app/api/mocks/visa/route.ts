import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock Visa Direct API
 *
 * Mimics the exact JSON response structure of Visa Direct PushFunds API
 * Use this when the Visa Sandbox is unavailable or during demos
 *
 * Real endpoint: POST https://sandbox.api.visa.com/visadirect/fundstransfer/v1/pushfundstransactions
 */

export async function POST(request: NextRequest) {
  const body = await request.json();

  console.log('🎭 MOCK Visa Direct PushFunds Request:', JSON.stringify(body, null, 2));

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock response matching Visa Direct API structure
  const mockResponse = {
    transactionIdentifier: body.transactionIdentifier || Date.now().toString(),
    actionCode: '00', // 00 = Approved
    approvalCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
    responseCode: '5', // 5 = Success
    transmissionDateTime: new Date().toISOString().replace(/[-:]/g, '').slice(0, 14),
    retrievalReferenceNumber: body.retrievalReferenceNumber || `${Date.now()}`.slice(-12),
    systemsTraceAuditNumber: body.systemsTraceAuditNumber || '123456',
    network: {
      networkId: '0002', // Visa network
      networkRefNumber: Math.random().toString().substr(2, 12),
    },
    purchaseIdentifier: {
      type: 'transactionId',
      id: body.transactionIdentifier,
    },
    merchantVerificationValue: 'Y',
    cardTypeCode: 'D', // Debit
    feeProgramIndicator: 'FPI123',
    merchantCategoryCode: body.merchantCategoryCode || '6012',
  };

  console.log('🎭 MOCK Visa Direct Response:', JSON.stringify(mockResponse, null, 2));

  return NextResponse.json(mockResponse);
}
