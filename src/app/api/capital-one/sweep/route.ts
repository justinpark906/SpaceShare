import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/capital-one/sweep
 *
 * The "Savings Sweep" Hack - Best Financial Hack submission
 *
 * Automatically transfers 20% of earnings to a tax/savings vault
 * using Capital One's Account Transfer API.
 *
 * This helps gig workers like Sarah automatically save for:
 * - Quarterly tax payments
 * - Emergency fund
 * - Retirement contributions
 */

interface SweepRequest {
  transactionId: string;
  accountId: string; // Lister's Capital One account ID
  amount: number; // Amount to sweep (20% of payout)
}

// Capital One DevExchange Configuration
const CAPITAL_ONE_CONFIG = {
  baseUrl:
    process.env.CAPITAL_ONE_BASE_URL || "https://api-sandbox.capitalone.com",
  clientId: process.env.CAPITAL_ONE_CLIENT_ID || "demo_client",
  clientSecret: process.env.CAPITAL_ONE_CLIENT_SECRET || "demo_secret",
};

export async function POST(request: NextRequest) {
  try {
    const body: SweepRequest = await request.json();
    const { transactionId, accountId, amount } = body;

    if (!accountId || !amount) {
      return NextResponse.json(
        { error: "Account ID and amount required" },
        { status: 400 },
      );
    }

    console.log("🏦 Capital One Savings Sweep Initiated:", {
      transactionId,
      accountId,
      sweepAmount: `$${amount.toFixed(2)}`,
    });

    // Construct Capital One Transfer Request
    const transferPayload = {
      sourceAccountId: accountId,
      destinationAccountId: `${accountId}_SAVINGS_VAULT`,
      amount: {
        value: amount,
        currency: "USD",
      },
      memo: "SpaceShare Automatic Tax Sweep",
      metadata: {
        source: "spaceshare",
        transactionId,
        type: "tax_savings",
        percentage: "20%",
      },
    };

    console.log(
      "📤 Capital One Transfer Payload:",
      JSON.stringify(transferPayload, null, 2),
    );

    // In production, make actual API call:
    // const response = await fetch(`${CAPITAL_ONE_CONFIG.baseUrl}/accounts/${accountId}/transfers`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${await getCapitalOneToken()}`,
    //   },
    //   body: JSON.stringify(transferPayload),
    // });

    // Mock response for demo
    const transferId = `CO_SWEEP_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    console.log("✅ Capital One Savings Sweep Complete:", {
      transferId,
      swept: `$${amount.toFixed(2)}`,
      destination: "Tax/Savings Vault",
    });

    return NextResponse.json({
      success: true,
      transferId,
      swept: amount,
      message: `Successfully swept $${amount.toFixed(2)} to savings vault`,
      breakdown: {
        originalPayout: amount / 0.2, // Calculate original payout
        taxSweepRate: "20%",
        amountSwept: amount,
        remainingPayout: amount / 0.2 - amount,
      },
    });
  } catch (error) {
    console.error("Savings sweep error:", error);
    return NextResponse.json(
      { error: "Failed to process savings sweep" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/capital-one/sweep
 *
 * Get savings summary for a user
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");

  // Mock savings data for demo
  const savingsData = {
    accountId: accountId || "sarah_123",
    totalSwept: 156.8, // Total swept this month
    taxVaultBalance: 892.4, // Total in tax savings
    sweepHistory: [
      { date: "2024-01-30", amount: 1.96, transactionId: "txn_001" },
      { date: "2024-01-29", amount: 2.45, transactionId: "txn_002" },
      { date: "2024-01-28", amount: 3.12, transactionId: "txn_003" },
    ],
    projectedQuarterlyTax: 2450.0,
    percentageSaved: 36.4, // 36.4% of projected tax already saved
  };

  return NextResponse.json(savingsData);
}
