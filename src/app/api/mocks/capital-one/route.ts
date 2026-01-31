import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock Capital One API
 *
 * Mimics the exact JSON response structure of Capital One DevExchange API
 * Use this when the Capital One Sandbox is unavailable or during demos
 *
 * Real endpoint: POST https://api-sandbox.capitalone.com/accounts/{accountId}/transfers
 */

export async function POST(request: NextRequest) {
  const body = await request.json();

  console.log('🎭 MOCK Capital One Transfer Request:', JSON.stringify(body, null, 2));

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Mock response matching Capital One API structure
  const mockResponse = {
    transferId: `TRF_${Date.now()}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    status: 'COMPLETED',
    sourceAccount: {
      accountId: body.sourceAccountId,
      accountType: 'CHECKING',
      availableBalance: 1542.67,
    },
    destinationAccount: {
      accountId: body.destinationAccountId,
      accountType: 'SAVINGS',
      nickname: 'Tax & Savings Vault',
      newBalance: 892.40 + (body.amount?.value || 0),
    },
    amount: body.amount || { value: 0, currency: 'USD' },
    memo: body.memo || 'Transfer',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    confirmationNumber: `CONF_${Math.random().toString(36).substr(2, 10).toUpperCase()}`,
  };

  console.log('🎭 MOCK Capital One Response:', JSON.stringify(mockResponse, null, 2));

  return NextResponse.json(mockResponse);
}

/**
 * GET - Mock account balance
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId') || 'demo_account';

  const mockAccount = {
    accountId,
    accountType: 'SAVINGS',
    nickname: 'EcoSquare Tax Vault',
    balance: {
      current: 892.40,
      available: 892.40,
      currency: 'USD',
    },
    interestRate: 4.25,
    apy: 4.35,
    lastActivityDate: new Date().toISOString(),
  };

  return NextResponse.json(mockAccount);
}
