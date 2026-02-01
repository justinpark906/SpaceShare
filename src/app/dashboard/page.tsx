"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EarningsChart } from "@/components/EarningsChart";
import { AdminPanel } from "@/components/AdminPanel";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

const CO2_PER_RENTAL_LBS = 0.6;
const TAX_SAVINGS_RATE = 0.2;

export interface ListerData {
  name: string;
  totalEarningsToday: number;
  totalEarningsMonth: number;
  totalSavedForTaxes: number;
  taxVaultBalance: number;
  pendingPayouts: number;
  totalRentalsHosted: number;
  neighborsHelped: number;
  co2SavedToday: number;
  co2SavedTotal: number;
  recentTransactions: Array<{
    id: string;
    type: "earning";
    amount: number;
    description: string;
    time: string;
    status: string;
  }>;
  chartData: Array<{ date: string; earnings: number }>;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ListerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"earnings" | "impact">("earnings");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }

    async function fetchDashboardData() {
      const supabase = createClient();
      const emptyData: ListerData = {
        name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User",
        totalEarningsToday: 0,
        totalEarningsMonth: 0,
        totalSavedForTaxes: 0,
        taxVaultBalance: 0,
        pendingPayouts: 0,
        totalRentalsHosted: 0,
        neighborsHelped: 0,
        co2SavedToday: 0,
        co2SavedTotal: 0,
        recentTransactions: [],
        chartData: [],
      };

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        const displayName =
          profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

        const { data: mySpaces } = await supabase
          .from("spaces")
          .select("id")
          .eq("owner_id", user.id);

        const spaceIds = mySpaces?.map((s) => s.id) ?? [];
        if (spaceIds.length === 0) {
          setData({
            ...emptyData,
            name: displayName,
          });
          setLoading(false);
          return;
        }

        const { data: bookings } = await supabase
          .from("bookings")
          .select(
            `
            id,
            total_price,
            status,
            payment_status,
            start_time,
            created_at,
            renter_id,
            space:spaces(name, type),
            renter:profiles!renter_id(full_name)
          `
          )
          .in("space_id", spaceIds)
          .order("created_at", { ascending: false });

        const completedBookings =
          bookings?.filter((b) => b.status === "COMPLETED" || b.status === "ACTIVE") ?? [];
        const pendingBookings =
          bookings?.filter((b) => b.payment_status === "PENDING") ?? [];

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const todayEarnings = completedBookings
          .filter((b) => new Date(b.start_time) >= startOfToday)
          .reduce((sum, b) => sum + Number(b.total_price), 0);

        const monthEarnings = completedBookings
          .filter((b) => new Date(b.start_time) >= startOfMonth)
          .reduce((sum, b) => sum + Number(b.total_price), 0);

        const totalEarnings = completedBookings.reduce(
          (sum, b) => sum + Number(b.total_price),
          0
        );
        const taxVaultBalance = totalEarnings * TAX_SAVINGS_RATE;
        const todayRentals = completedBookings.filter(
          (b) => new Date(b.start_time) >= startOfToday
        ).length;
        const co2SavedToday = todayRentals * CO2_PER_RENTAL_LBS;

        const uniqueRenters = new Set(
          completedBookings.map((b) => b.renter_id).filter(Boolean)
        );

        const pendingPayouts = pendingBookings.reduce(
          (sum, b) => sum + Number(b.total_price),
          0
        );

        const recentTransactions = (bookings ?? []).slice(0, 10).map((b) => {
          const space = b.space as { name?: string; type?: string } | null;
          const renter = b.renter as { full_name?: string } | null;
          const renterName = renter?.full_name || "Guest";
          const spaceLabel = space ? `${space.type} - ${space.name}` : "Space";
          const firstName = renterName.split(" ")[0] || "Guest";
          return {
            id: b.id,
            type: "earning" as const,
            amount: Number(b.total_price),
            description: `${spaceLabel} - ${firstName}`,
            time: formatTimeAgo(new Date(b.created_at)),
            status: b.payment_status?.toLowerCase() ?? "pending",
          };
        });

        const last7Days: { date: string; earnings: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          const dayEnd = new Date(dayStart);
          dayEnd.setDate(dayEnd.getDate() + 1);
          const dayEarnings = completedBookings
            .filter(
              (b) =>
                new Date(b.start_time) >= dayStart &&
                new Date(b.start_time) < dayEnd
            )
            .reduce((sum, b) => sum + Number(b.total_price), 0);
          last7Days.push({
            date: dayStart.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            }),
            earnings: dayEarnings,
          });
        }

        setData({
          name: displayName,
          totalEarningsToday: todayEarnings,
          totalEarningsMonth: monthEarnings,
          totalSavedForTaxes: taxVaultBalance,
          taxVaultBalance,
          pendingPayouts,
          totalRentalsHosted: completedBookings.length,
          neighborsHelped: uniqueRenters.size,
          co2SavedToday,
          co2SavedTotal: completedBookings.length * CO2_PER_RENTAL_LBS,
          recentTransactions,
          chartData: last7Days,
        });
      } catch {
        setData({
          ...emptyData,
          name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user, authLoading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (authLoading || loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white font-bold">
              S
            </div>
            <span className="text-xl font-semibold text-gray-900">
              SpaceShare
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {data.name}!</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lister Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track your earnings and community impact
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "earnings" ? "default" : "outline"}
            onClick={() => setActiveTab("earnings")}
          >
            Earnings & Savings
          </Button>
          <Button
            variant={activeTab === "impact" ? "default" : "outline"}
            onClick={() => setActiveTab("impact")}
          >
            Community Impact
          </Button>
        </div>

        {activeTab === "earnings" ? (
          <EarningsTab data={data} />
        ) : (
          <ImpactTab data={data} />
        )}
      </main>

      {/* Admin Panel for Demo */}
      <AdminPanel />
    </div>
  );
}

function EarningsTab({ data }: { data: ListerData }) {
  const projectedTax = Math.max(2450, data.totalEarningsMonth * 0.3);
  const taxProgress = projectedTax > 0 ? (data.taxVaultBalance / projectedTax) * 100 : 0;

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
            <p className="text-xs text-gray-500">
              {data.totalRentalsHosted} total rentals
            </p>
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
            <p className="text-xs text-gray-500">From your spaces</p>
          </CardContent>
        </Card>

        {/* Tax Savings Vault */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-700">
              Tax Savings Vault
            </CardDescription>
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

      {/* Earnings Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Earnings Overview</CardTitle>
          <CardDescription>
            Last 7 days of earnings from your spaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EarningsChart data={data.chartData} />
        </CardContent>
      </Card>

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
          <div className="flex items-center gap-8 flex-wrap">
            <div>
              <p className="text-sm text-gray-600">Projected Q1 Tax</p>
              <p className="text-xl font-bold">${projectedTax.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Already Saved</p>
              <p className="text-xl font-bold text-green-600">
                ${data.taxVaultBalance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Progress</p>
              <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.min(taxProgress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {taxProgress.toFixed(1)}% saved
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Your latest earnings from bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentTransactions.length === 0 ? (
              <p className="text-gray-500 py-4 text-center">
                No bookings yet.{" "}
                <Link href="/list-space" className="text-green-600 hover:underline">
                  List a space
                </Link>{" "}
                to start earning!
              </p>
            ) : (
              data.recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100">
                      💰
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.description}</p>
                      <p className="text-xs text-gray-500">{tx.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +${tx.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))
            )}
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

function ImpactTab({ data }: { data: ListerData }) {
  const treesEquivalent = Math.floor(data.co2SavedTotal / 48);
  const score = Math.min(100, data.totalRentalsHosted * 2 + data.neighborsHelped * 5);

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
              <p className="text-green-100">Neighbors helped</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold">{data.co2SavedToday.toFixed(1)}</p>
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
                  <span className="font-bold">{data.co2SavedTotal.toFixed(1)} lbs</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min((data.co2SavedTotal / 100) * 100, 100)}%` /* scale: 0-100 lbs = 0-100% */,
                    }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                That&apos;s equivalent to planting{" "}
                <span className="font-bold text-green-600">
                  {treesEquivalent} tree{treesEquivalent !== 1 ? "s" : ""}
                </span>{" "}
                🌳
              </p>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-800">
                  By sharing your space, you&apos;ve helped reduce unnecessary
                  driving. Each rental saves an average of {CO2_PER_RENTAL_LBS}{" "}
                  lbs of CO2!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-2xl">🏘️</span>
              Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Rentals</span>
                <span className="font-bold text-lg">{data.totalRentalsHosted}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Unique Neighbors Helped</span>
                <span className="font-bold text-lg">{data.neighborsHelped}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">CO2 Saved (Total)</span>
                <span className="font-bold text-lg">
                  {data.co2SavedTotal.toFixed(1)} lbs
                </span>
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
                  strokeDasharray={`${(score / 100) * 351.86} 351.86`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-purple-600">
                  {score}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">
                {score >= 50 ? "Great Progress! 🎉" : "Getting Started"}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {score >= 50
                  ? "Keep sharing your space to grow your impact and reach Gold status!"
                  : "List a space and complete rentals to grow your community score."}
              </p>
              <div className="flex gap-2 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    score >= 75
                      ? "bg-yellow-100 text-yellow-700"
                      : score >= 50
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {score >= 75 ? "Gold" : score >= 50 ? "Silver" : "Bronze"} Member
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
