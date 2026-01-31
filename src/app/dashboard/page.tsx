'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Mock data for demo
const MOCK_LISTER_DATA = {
  name: 'Sarah',
  totalEarningsToday: 47.20,
  totalEarningsMonth: 892.40,
  totalSavedForTaxes: 178.48,
  taxVaultBalance: 892.40,
  pendingPayouts: 12.50,

  // Impact metrics
  totalRentalsHosted: 156,
  neighborsHelped: 4,
  co2SavedToday: 2.4, // pounds
  co2SavedTotal: 312.8, // pounds

  // Recent transactions
  recentTransactions: [
    { id: 1, type: 'earning', amount: 12.50, description: 'Parking - Marcus R.', time: '2 hours ago', status: 'pending' },
    { id: 2, type: 'earning', amount: 8.00, description: 'Storage - Alex T.', time: '5 hours ago', status: 'disbursed' },
    { id: 3, type: 'sweep', amount: 1.60, description: 'Tax Sweep (20%)', time: '5 hours ago', status: 'swept' },
    { id: 4, type: 'earning', amount: 15.00, description: 'Garden - Jamie L.', time: 'Yesterday', status: 'disbursed' },
    { id: 5, type: 'sweep', amount: 3.00, description: 'Tax Sweep (20%)', time: 'Yesterday', status: 'swept' },
  ],
};

export default function Dashboard() {
  const [data, setData] = useState(MOCK_LISTER_DATA);
  const [activeTab, setActiveTab] = useState<'earnings' | 'impact'>('earnings');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white font-bold">
              E
            </div>
            <span className="text-xl font-semibold text-gray-900">EcoSquare</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {data.name}!</span>
            <Button variant="outline" size="sm">Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lister Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your earnings and community impact</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'earnings' ? 'default' : 'outline'}
            onClick={() => setActiveTab('earnings')}
          >
            Earnings & Savings
          </Button>
          <Button
            variant={activeTab === 'impact' ? 'default' : 'outline'}
            onClick={() => setActiveTab('impact')}
          >
            Community Impact
          </Button>
        </div>

        {activeTab === 'earnings' ? (
          <EarningsTab data={data} />
        ) : (
          <ImpactTab data={data} />
        )}
      </main>
    </div>
  );
}

function EarningsTab({ data }: { data: typeof MOCK_LISTER_DATA }) {
  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Earnings */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today's Earnings</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              ${data.totalEarningsToday.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">+12% from yesterday</p>
          </CardContent>
        </Card>

        {/* Monthly Earnings */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-3xl">
              ${data.totalEarningsMonth.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">156 total rentals</p>
          </CardContent>
        </Card>

        {/* Tax Savings Vault */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-700">Tax Savings Vault</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              ${data.taxVaultBalance.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-blue-600">20% auto-sweep enabled</p>
          </CardContent>
        </Card>

        {/* Pending Payouts */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Payouts</CardDescription>
            <CardTitle className="text-3xl text-orange-500">
              ${data.pendingPayouts.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">Processing via Visa Direct</p>
          </CardContent>
        </Card>
      </div>

      {/* Savings Sweep Explanation */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-2xl">🏦</span>
            Automatic Tax Savings (Capital One Integration)
          </CardTitle>
          <CardDescription className="text-green-700">
            20% of every payout is automatically swept to your tax savings vault
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-sm text-gray-600">Projected Q1 Tax</p>
              <p className="text-xl font-bold">$2,450.00</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Already Saved</p>
              <p className="text-xl font-bold text-green-600">${data.taxVaultBalance.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Progress</p>
              <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${(data.taxVaultBalance / 2450) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{((data.taxVaultBalance / 2450) * 100).toFixed(1)}% saved</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Your latest earnings and tax sweeps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'earning' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {tx.type === 'earning' ? '💰' : '🏦'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tx.description}</p>
                    <p className="text-xs text-gray-500">{tx.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    tx.type === 'earning' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {tx.type === 'earning' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fee Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fee Structure</CardTitle>
          <CardDescription>How your earnings are distributed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold">98%</p>
              <p className="text-sm text-gray-600">To You</p>
            </div>
            <div className="text-2xl text-gray-300">→</div>
            <div className="flex-1 text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">78%</p>
              <p className="text-sm text-gray-600">Direct Payout</p>
            </div>
            <div className="text-2xl text-gray-300">+</div>
            <div className="flex-1 text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">20%</p>
              <p className="text-sm text-gray-600">Tax Savings</p>
            </div>
            <div className="text-2xl text-gray-300">+</div>
            <div className="flex-1 text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">2%</p>
              <p className="text-sm text-gray-600">City Fee</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ImpactTab({ data }: { data: typeof MOCK_LISTER_DATA }) {
  return (
    <div className="space-y-6">
      {/* Impact Hero */}
      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Your Community Impact</CardTitle>
          <CardDescription className="text-green-100">
            Thank you for making your city more sustainable!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-8 mt-4">
            <div className="text-center">
              <p className="text-5xl font-bold">{data.neighborsHelped}</p>
              <p className="text-green-100">Neighbors helped today</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold">{data.co2SavedToday}</p>
              <p className="text-green-100">lbs CO2 saved today</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold">{data.totalRentalsHosted}</p>
              <p className="text-green-100">Total rentals hosted</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environmental Impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-2xl">🌱</span>
              Carbon Footprint Reduction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Total CO2 Saved</span>
                  <span className="font-bold">{data.co2SavedTotal} lbs</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: '62%' }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                That's equivalent to planting <span className="font-bold text-green-600">5 trees</span>! 🌳
              </p>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-800">
                  By sharing your parking space, you've helped reduce unnecessary driving
                  as people search for parking. Each rental saves an average of 0.6 lbs of CO2!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-2xl">🏘️</span>
              Neighborhood Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Your Rank</span>
                <span className="font-bold text-lg">#3 in your area</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Active Listers Nearby</span>
                <span className="font-bold text-lg">12</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Spaces Rented This Week</span>
                <span className="font-bold text-lg">47</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Community Growth Score */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            Community Growth Score
          </CardTitle>
          <CardDescription>
            Your contribution to building a more sustainable city
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#8b5cf6"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${0.78 * 351.86} 351.86`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-purple-600">78</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Great Progress! 🎉</h3>
              <p className="text-gray-600 text-sm mb-4">
                You're in the top 15% of community contributors in San Francisco.
                Keep sharing to reach Gold status!
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">Silver Member</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">22 points to Gold</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
