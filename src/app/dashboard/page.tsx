"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Plus,
  Package,
  Car,
  Flower2,
  User,
  Unlock,
  Navigation,
  AlertTriangle,
  Download,
  RefreshCw,
  Power,
  TrendingUp,
  Leaf,
  CreditCard,
  FileText,
  SquareUser,
  Wallet,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Loader2,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface Booking {
  id: string;
  space_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  total_price: number;
  status: string;
  created_at: string;
  space: {
    id: string;
    name: string;
    type: string;
    address: string;
    city: string;
    price_per_day: number;
    latitude: number;
    longitude: number;
    owner_id: string;
  } | null;
}

interface SpaceBooking {
  id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  total_price: number;
  status: string;
  created_at: string;
  renter: {
    full_name: string | null;
    email: string;
  } | null;
}

interface Space {
  id: string;
  name: string;
  type: string;
  price_per_day: number;
  address: string;
  city: string;
  status: string;
  max_rental_days: number;
  created_at: string;
  latitude: number;
  longitude: number;
  bookings: SpaceBooking[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const typeIcons: Record<string, React.ReactNode> = {
  PARKING: <Car className="h-5 w-5" />,
  STORAGE: <Package className="h-5 w-5" />,
  GARDEN: <Flower2 className="h-5 w-5" />,
};

const typeColors: Record<string, string> = {
  PARKING: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  STORAGE:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  GARDEN:
    "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getTimeRemaining(endDate: string): {
  days: number;
  hours: number;
  minutes: number;
  total: number;
} {
  const end = new Date(endDate + "T23:59:59");
  const now = new Date();
  const total = end.getTime() - now.getTime();

  if (total <= 0) return { days: 0, hours: 0, minutes: 0, total: 0 };

  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, total };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function openDirections(lat: number, lng: number, address: string) {
  // Try Google Maps first, falls back to Apple Maps on iOS
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(googleMapsUrl, "_blank");
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [myListings, setMyListings] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "bookings" | "listings" | "financials"
  >("bookings");

  // Handle tab query parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam === "bookings" ||
      tabParam === "listings" ||
      tabParam === "financials"
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();

    try {
      // Fetch bookings where I am the renter
      const { data: bookings } = await supabase
        .from("bookings")
        .select(
          `
          id,
          space_id,
          start_date,
          end_date,
          total_days,
          total_price,
          status,
          created_at,
          space:spaces (
            id,
            name,
            type,
            address,
            city,
            price_per_day,
            latitude,
            longitude,
            owner_id
          )
        `,
        )
        .eq("renter_id", user.id)
        .order("created_at", { ascending: false });

      const mappedBookings: Booking[] = (bookings || []).map((b: any) => ({
        ...b,
        space: Array.isArray(b.space) ? b.space[0] : b.space,
      }));
      setMyBookings(mappedBookings);

      // Fetch spaces I own with their bookings
      const { data: spaces } = await supabase
        .from("spaces")
        .select(
          `
          id,
          name,
          type,
          price_per_day,
          address,
          city,
          status,
          max_rental_days,
          created_at,
          latitude,
          longitude,
          bookings (
            id,
            start_date,
            end_date,
            total_days,
            total_price,
            status,
            created_at,
            renter:profiles!renter_id (
              full_name,
              email
            )
          )
        `,
        )
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      const mappedSpaces: Space[] = (spaces || []).map((s: any) => ({
        ...s,
        bookings: (s.bookings || []).map((b: any) => ({
          ...b,
          renter: Array.isArray(b.renter) ? b.renter[0] : b.renter,
        })),
      }));
      setMyListings(mappedSpaces);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    fetchData();
  }, [user, authLoading, router, fetchData]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  // Calculate stats
  const activeBookings = myBookings.filter(
    (b) => b.status === "ACTIVE" || b.status === "CONFIRMED",
  );

  const totalEarnings = myListings.reduce((sum, listing) => {
    return (
      sum +
      listing.bookings
        .filter((b) => b.status === "COMPLETED" || b.status === "ACTIVE")
        .reduce((s, b) => s + b.total_price, 0)
    );
  }, 0);

  const totalSpent = myBookings
    .filter((b) => b.status === "COMPLETED" || b.status === "ACTIVE")
    .reduce((sum, b) => sum + b.total_price, 0);

  const activeRenters = myListings.reduce(
    (sum, l) => sum + l.bookings.filter((b) => b.status === "ACTIVE").length,
    0,
  );

  // Eco calculations (simplified - could be based on actual data)
  const co2Saved = myListings.length * 12.5; // kg CO2 saved per shared space
  const capitalOneSweep = totalEarnings * 0.2; // 20% goes to savings

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-green-950">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/spaceshare-removebg-preview.png"
              alt="SpaceShare"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-xl font-semibold text-white">SpaceShare</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden sm:block">
              {user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">My Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Manage your bookings, listings, and earnings
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Calendar className="h-4 w-4" />
                <span>Active Bookings</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {activeBookings.length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <SquareUser className="h-4 w-4" />
                <span>My Listings</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {myListings.length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <TrendingUp className="h-4 w-4" />
                <span>Total Earned</span>
              </div>
              <p className="text-2xl font-bold text-green-500">
                ${totalEarnings.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Leaf className="h-4 w-4" />
                <span>CO₂ Saved</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">
                {co2Saved.toFixed(1)} kg
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-800 pb-4">
          <Button
            variant={activeTab === "bookings" ? "default" : "ghost"}
            onClick={() => setActiveTab("bookings")}
            className={
              activeTab === "bookings"
                ? "bg-green-600 hover:bg-green-700"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }
          >
            <MapPin className="h-4 w-4 mr-2" />
            My Bookings ({myBookings.length})
          </Button>
          <Button
            variant={activeTab === "listings" ? "default" : "ghost"}
            onClick={() => setActiveTab("listings")}
            className={
              activeTab === "listings"
                ? "bg-green-600 hover:bg-green-700"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }
          >
            <SquareUser className="h-4 w-4 mr-2" />
            My Listings ({myListings.length})
          </Button>
          <Button
            variant={activeTab === "financials" ? "default" : "ghost"}
            onClick={() => setActiveTab("financials")}
            className={
              activeTab === "financials"
                ? "bg-green-600 hover:bg-green-700"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }
          >
            <Wallet className="h-4 w-4 mr-2" />
            Financials
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === "bookings" && (
          <BookingsSection bookings={myBookings} onRefresh={fetchData} />
        )}
        {activeTab === "listings" && (
          <ListingsSection listings={myListings} onRefresh={fetchData} />
        )}
        {activeTab === "financials" && (
          <FinancialsSection
            totalEarnings={totalEarnings}
            totalSpent={totalSpent}
            capitalOneSweep={capitalOneSweep}
            co2Saved={co2Saved}
            listings={myListings}
          />
        )}
      </main>
    </div>
  );
}

// ============================================================================
// MY BOOKINGS SECTION (Renter View)
// ============================================================================

function BookingsSection({
  bookings,
  onRefresh,
}: {
  bookings: Booking[];
  onRefresh: () => void;
}) {
  if (bookings.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No bookings yet
          </h3>
          <p className="text-gray-400 mb-6">
            Find a space on the map and make your first booking!
          </p>
          <Link href="/">
            <Button className="bg-green-600 hover:bg-green-700">
              Explore Spaces
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const activeBookings = bookings.filter(
    (b) =>
      b.status === "ACTIVE" ||
      b.status === "CONFIRMED" ||
      b.status === "PENDING",
  );
  const pastBookings = bookings.filter(
    (b) => b.status === "COMPLETED" || b.status === "CANCELLED",
  );

  return (
    <div className="space-y-6">
      {/* Active Bookings */}
      {activeBookings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Active Bookings
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
          <div className="space-y-4">
            {activeBookings.map((booking) => (
              <ActiveBookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </div>
      )}

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-400 mb-4">
            Booking History
          </h2>
          <div className="space-y-3">
            {pastBookings.map((booking) => (
              <PastBookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActiveBookingCard({ booking }: { booking: Booking }) {
  const [unlocking, setUnlocking] = useState(false);
  const [unlockSuccess, setUnlockSuccess] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(
    getTimeRemaining(booking.end_date),
  );

  const space = booking.space;

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(booking.end_date));
    }, 60000);
    return () => clearInterval(interval);
  }, [booking.end_date]);

  const handleUnlock = async () => {
    if (!space) return;
    setUnlocking(true);
    try {
      const response = await fetch("/api/iot/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          spaceId: space.id,
          userId: booking.space?.owner_id,
        }),
      });
      if (response.ok) {
        setUnlockSuccess(true);
        setTimeout(() => setUnlockSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Unlock failed:", error);
    } finally {
      setUnlocking(false);
    }
  };

  const handleGetDirections = () => {
    if (space?.latitude && space?.longitude) {
      openDirections(space.latitude, space.longitude, space.address);
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-r from-gray-800/80 to-gray-800/50 border-gray-700 border-l-4 border-l-green-500">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-4">
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center ${typeColors[space?.type || "PARKING"]}`}
              >
                {typeIcons[space?.type || "PARKING"]}
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">
                  {space?.name || "Space"}
                </h3>
                <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                  <MapPin className="h-3 w-3" />
                  <span>
                    {space?.address}, {space?.city}
                  </span>
                </div>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}
            >
              {booking.status}
            </span>
          </div>

          {/* Time Remaining Counter */}
          <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
            <p className="text-gray-400 text-sm mb-2">Time Remaining</p>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">
                  {timeRemaining.days}
                </p>
                <p className="text-xs text-gray-500">days</p>
              </div>
              <span className="text-2xl text-gray-600">:</span>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">
                  {timeRemaining.hours}
                </p>
                <p className="text-xs text-gray-500">hours</p>
              </div>
              <span className="text-2xl text-gray-600">:</span>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">
                  {timeRemaining.minutes}
                </p>
                <p className="text-xs text-gray-500">min</p>
              </div>
              {timeRemaining.total < 86400000 && timeRemaining.total > 0 && (
                <span className="ml-4 px-2 py-1 bg-yellow-900/50 text-yellow-400 text-xs rounded">
                  Ending soon
                </span>
              )}
            </div>
          </div>

          {/* Booking Details */}
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
            <span>
              <Calendar className="h-3 w-3 inline mr-1" />
              {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
            </span>
            <span>
              <Clock className="h-3 w-3 inline mr-1" />
              {booking.total_days} days
            </span>
            <span className="text-white font-medium">
              <DollarSign className="h-3 w-3 inline" />
              {booking.total_price.toFixed(2)} total
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleUnlock}
              disabled={unlocking || unlockSuccess}
              className={`flex-1 sm:flex-none ${
                unlockSuccess
                  ? "bg-green-600 hover:bg-green-600"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {unlocking ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : unlockSuccess ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Unlock className="h-4 w-4 mr-2" />
              )}
              {unlockSuccess ? "Unlocked!" : "Unlock / Open Gate"}
            </Button>

            <Button
              variant="outline"
              onClick={handleGetDirections}
              className="flex-1 sm:flex-none border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Get Directions
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowReportModal(true)}
              className="flex-1 sm:flex-none border-red-900/50 text-red-400 hover:bg-red-900/20"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Issue Modal */}
      {showReportModal && (
        <ReportIssueModal
          bookingId={booking.id}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  );
}

function PastBookingCard({ booking }: { booking: Booking }) {
  const [downloading, setDownloading] = useState(false);
  const space = booking.space;

  const handleDownloadReceipt = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}/receipt`);
      if (response.ok) {
        const receipt = await response.json();
        // Create downloadable text file
        const content = `
SpaceShare Receipt
==================
Receipt #: ${receipt.receiptNumber}
Date: ${new Date(receipt.generatedAt).toLocaleDateString()}

Space: ${receipt.space.name}
Type: ${receipt.space.type}
Address: ${receipt.space.address}, ${receipt.space.city}

Rental Period: ${receipt.booking.startDate} to ${receipt.booking.endDate}
Total Days: ${receipt.booking.totalDays}

Pricing:
- Rate: $${receipt.pricing.pricePerDay}/day
- Subtotal: $${receipt.pricing.subtotal.toFixed(2)}
- Platform Fee: $${receipt.pricing.platformFee.toFixed(2)}
- Total Paid: $${receipt.pricing.total.toFixed(2)}

Status: ${receipt.booking.status}
Payment: ${receipt.booking.paymentStatus}

Thank you for using SpaceShare!
        `.trim();

        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `receipt-${receipt.receiptNumber}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setDownloading(false);
    }
  };

  const handleBookAgain = () => {
    // Navigate to home with space pre-selected (could be enhanced)
    window.location.href = "/";
  };

  return (
    <Card className="bg-gray-800/30 border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColors[space?.type || "PARKING"]}`}
            >
              {typeIcons[space?.type || "PARKING"]}
            </div>
            <div>
              <h3 className="font-medium text-white">
                {space?.name || "Space"}
              </h3>
              <p className="text-sm text-gray-500">
                {formatDate(booking.start_date)} -{" "}
                {formatDate(booking.end_date)} · $
                {booking.total_price.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded-full text-xs ${statusColors[booking.status]}`}
            >
              {booking.status}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookAgain}
              className="text-green-500 hover:text-green-400 hover:bg-green-900/20"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Book Again
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadReceipt}
              disabled={downloading}
              className="text-gray-400 hover:text-white"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportIssueModal({
  bookingId,
  onClose,
}: {
  bookingId: string;
  onClose: () => void;
}) {
  const [issueType, setIssueType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!issueType || !description) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, issueType, description }),
      });
      if (response.ok) {
        setSubmitted(true);
        setTimeout(onClose, 2000);
      }
    } catch (error) {
      console.error("Report submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Report an Issue</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {submitted ? (
            <div className="text-center py-8">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-white font-medium">Report Submitted</p>
              <p className="text-gray-400 text-sm">
                We'll review your issue shortly.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Issue Type
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Select an issue...</option>
                  <option value="OCCUPIED">Someone is in my spot</option>
                  <option value="ACCESS_ISSUE">Can't access the space</option>
                  <option value="SAFETY">Safety concern</option>
                  <option value="OTHER">Other issue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the issue..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white h-24 resize-none"
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!issueType || !description || submitting}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Submit Report
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// MY LISTINGS SECTION (Owner View)
// ============================================================================

function ListingsSection({
  listings,
  onRefresh,
}: {
  listings: Space[];
  onRefresh: () => void;
}) {
  if (listings.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No listings yet
          </h3>
          <p className="text-gray-400 mb-6">
            Start earning by listing your unused space!
          </p>
          <Link href="/list-space">
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              List Your Space
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totalEarned = listings.reduce(
    (sum, l) =>
      sum +
      l.bookings
        .filter((b) => b.status === "COMPLETED" || b.status === "ACTIVE")
        .reduce((s, b) => s + b.total_price, 0),
    0,
  );

  const pendingBookings = listings.reduce(
    (sum, l) => sum + l.bookings.filter((b) => b.status === "PENDING").length,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Revenue Summary */}
      <Card className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-800/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">
                Total Revenue
              </p>
              <p className="text-4xl font-bold text-white">
                ${totalEarned.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">
                {listings.length} active listing
                {listings.length !== 1 ? "s" : ""}
              </p>
              {pendingBookings > 0 && (
                <p className="text-yellow-400 text-sm">
                  {pendingBookings} pending request
                  {pendingBookings !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Listing */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Your Spaces</h2>
        <Link href="/list-space">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Add New Listing
          </Button>
        </Link>
      </div>

      {/* Listings */}
      <div className="space-y-4">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  );
}

function ListingCard({
  listing,
  onRefresh,
}: {
  listing: Space;
  onRefresh: () => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const activeBookings = listing.bookings.filter(
    (b) => b.status === "ACTIVE" || b.status === "CONFIRMED",
  );
  const pendingBookings = listing.bookings.filter(
    (b) => b.status === "PENDING",
  );
  const totalEarned = listing.bookings
    .filter((b) => b.status === "COMPLETED" || b.status === "ACTIVE")
    .reduce((sum, b) => sum + b.total_price, 0);

  const isLive = listing.status === "AVAILABLE";
  const isOccupied = activeBookings.length > 0;

  const handleToggle = async () => {
    setToggling(true);
    try {
      const response = await fetch(`/api/spaces/${listing.id}/toggle`, {
        method: "POST",
      });
      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Toggle failed:", error);
    } finally {
      setToggling(false);
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            {/* Type Icon with Occupancy Indicator */}
            <div className="relative">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${typeColors[listing.type]}`}
              >
                {typeIcons[listing.type]}
              </div>
              {/* Live Occupancy Dot */}
              <div
                className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800 ${
                  isOccupied
                    ? "bg-red-500"
                    : isLive
                      ? "bg-green-500"
                      : "bg-gray-500"
                }`}
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-white">{listing.name}</h3>
                {isOccupied && (
                  <span className="px-2 py-0.5 bg-red-900/50 text-red-400 text-xs rounded-full">
                    Occupied
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                <MapPin className="h-3 w-3" />
                <span>
                  {listing.address}, {listing.city}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-gray-400">
                  <DollarSign className="h-3 w-3 inline" />
                  {listing.price_per_day}/day
                </span>
                <span className="text-gray-400">
                  Max {listing.max_rental_days} days
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Toggle & Earnings */}
          <div className="text-right space-y-2">
            {/* Live/Offline Toggle */}
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isLive
                  ? "bg-green-900/50 text-green-400 hover:bg-green-900/70"
                  : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}
            >
              {toggling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Power className="h-4 w-4" />
              )}
              {isLive ? "Live" : "Offline"}
            </button>

            {/* Earnings */}
            <div>
              <p className="text-xs text-gray-500">Total Earned</p>
              <p className="text-lg font-bold text-green-500">
                ${totalEarned.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Requests Alert */}
        {pendingBookings.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800/50 rounded-lg">
            <p className="text-yellow-400 text-sm font-medium">
              {pendingBookings.length} pending booking request
              {pendingBookings.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Current Occupant */}
        {activeBookings.length > 0 && (
          <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">
              Current Renter{activeBookings.length > 1 ? "s" : ""}
            </p>
            {activeBookings.map((booking) => {
              const timeLeft = getTimeRemaining(booking.end_date);
              return (
                <div
                  key={booking.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {booking.renter?.full_name ||
                          booking.renter?.email ||
                          "Renter"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(booking.start_date)} -{" "}
                        {formatDate(booking.end_date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      ${booking.total_price.toFixed(2)}
                    </p>
                    <p className="text-xs text-green-500">
                      {timeLeft.days}d {timeLeft.hours}h left
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Expand for more bookings */}
        {listing.bookings.length > activeBookings.length && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-sm text-gray-400 hover:text-white"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {expanded ? "Hide" : "Show"} booking history (
            {listing.bookings.length - activeBookings.length})
          </button>
        )}

        {expanded && (
          <div className="mt-3 space-y-2">
            {listing.bookings
              .filter((b) => b.status !== "ACTIVE" && b.status !== "CONFIRMED")
              .map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-900/30 rounded"
                >
                  <div className="text-sm">
                    <span className="text-gray-400">
                      {booking.renter?.full_name || booking.renter?.email}
                    </span>
                    <span className="text-gray-600 mx-2">·</span>
                    <span className="text-gray-500">
                      {formatDate(booking.start_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${statusColors[booking.status]}`}
                    >
                      {booking.status}
                    </span>
                    <span className="text-gray-400 text-sm">
                      ${booking.total_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// FINANCIALS SECTION
// ============================================================================

function FinancialsSection({
  totalEarnings,
  totalSpent,
  capitalOneSweep,
  co2Saved,
  listings,
}: {
  totalEarnings: number;
  totalSpent: number;
  capitalOneSweep: number;
  co2Saved: number;
  listings: Space[];
}) {
  const [exporting, setExporting] = useState(false);
  const currentYear = new Date().getFullYear();
  const netIncome = totalEarnings - totalSpent;

  const handleExportTax = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/earnings/export?year=${currentYear}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `spaceshare-earnings-${currentYear}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-800/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-medium">Total Earned</span>
            </div>
            <p className="text-3xl font-bold text-white">
              ${totalEarnings.toFixed(2)}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              From {listings.length} listing{listings.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-800/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Wallet className="h-5 w-5" />
              <span className="text-sm font-medium">Total Spent</span>
            </div>
            <p className="text-3xl font-bold text-white">
              ${totalSpent.toFixed(2)}
            </p>
            <p className="text-sm text-gray-400 mt-1">On bookings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-800/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <DollarSign className="h-5 w-5" />
              <span className="text-sm font-medium">Net Income</span>
            </div>
            <p
              className={`text-3xl font-bold ${netIncome >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              {netIncome >= 0 ? "+" : "-"}${Math.abs(netIncome).toFixed(2)}
            </p>
            <p className="text-sm text-gray-400 mt-1">This period</p>
          </CardContent>
        </Card>
      </div>

      {/* Capital One Sweep Widget */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-900/30 rounded-lg flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">
                Capital One Auto-Sweep
              </CardTitle>
              <CardDescription className="text-gray-400">
                20% of earnings automatically saved for taxes & debt reduction
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Amount swept this month</span>
                <span className="text-white font-medium">
                  ${capitalOneSweep.toFixed(2)}
                </span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all"
                  style={{
                    width: `${Math.min((capitalOneSweep / (totalEarnings || 1)) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Your driveway earnings have contributed $
              {capitalOneSweep.toFixed(2)} toward your savings goal this month.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Eco Impact Widget */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <Leaf className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">
                Environmental Impact
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your contribution to reducing urban congestion
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-4 bg-emerald-900/20 rounded-lg">
              <p className="text-4xl font-bold text-emerald-400">
                {co2Saved.toFixed(1)}
              </p>
              <p className="text-sm text-gray-400 mt-1">kg CO₂ saved</p>
            </div>
            <div className="text-center p-4 bg-blue-900/20 rounded-lg">
              <p className="text-4xl font-bold text-blue-400">
                {Math.round(co2Saved / 2.3)}
              </p>
              <p className="text-sm text-gray-400 mt-1">miles offset</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            By sharing your space, you've helped reduce traffic from drivers
            searching for parking, equivalent to taking a car off the road for{" "}
            {Math.round(co2Saved / 12)} days.
          </p>
        </CardContent>
      </Card>

      {/* Tax Export */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-900/30 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">
                  Tax Documents
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Export your earnings for tax reporting
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleExportTax}
              disabled={exporting || totalEarnings === 0}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export {currentYear} CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-900/50 rounded-lg">
              <p className="text-lg font-bold text-white">
                ${totalEarnings.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">Gross Income</p>
            </div>
            <div className="p-3 bg-gray-900/50 rounded-lg">
              <p className="text-lg font-bold text-white">
                ${(totalEarnings * 0.02).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">Platform Fees</p>
            </div>
            <div className="p-3 bg-gray-900/50 rounded-lg">
              <p className="text-lg font-bold text-green-400">
                ${(totalEarnings * 0.98).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">Net Income</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Pricing Tip */}
      {listings.length > 0 && (
        <Card className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-800/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-yellow-400 font-medium">
                  Dynamic Pricing Tip
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Demand is typically higher on weekends and during local
                  events. Consider adjusting your daily rate to maximize
                  earnings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
