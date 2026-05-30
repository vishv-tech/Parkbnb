"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { StatusBadge } from "@/components/StatusBadge";
import { money } from "@/lib/format";
import { calculatePlatformFeeAmount, calculateTotalAmount } from "@/lib/platformFee";
import type { BookingWithListing, PublicListing } from "@/lib/types";

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
};

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  theme: { color: string };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

function isPublicListing(listing: BookingWithListing["listing"]): listing is PublicListing {
  return Boolean(listing && "generalArea" in listing);
}

function PaymentContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingWithListing | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const platformFee = useMemo(
    () => (booking ? booking.platformFeeAmount ?? calculatePlatformFeeAmount(booking.selectedPrice) : 0),
    [booking],
  );
  const total = useMemo(
    () => (booking ? booking.totalAmount ?? calculateTotalAmount(booking.selectedPrice) : 0),
    [booking],
  );

  useEffect(() => {
    fetch(`/api/bookings/${params.id}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { booking?: BookingWithListing; error?: string }) => {
        setLoading(false);

        if (!data.booking || data.error) {
          setError(data.error || "Booking not found");
          return;
        }

        if (data.booking.paymentStatus === "PAID") {
          router.replace(`/booking/${data.booking.id}/confirmed`);
          return;
        }

        setBooking(data.booking);
      })
      .catch(() => {
        setError("Could not load booking");
        setLoading(false);
      });
  }, [params.id, router]);

  async function loadRazorpayScript() {
    if (window.Razorpay) {
      return true;
    }

    return new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function markPaid(payload: Record<string, unknown>) {
    const response = await fetch(`/api/bookings/${params.id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Payment failed");
      setPaying(false);
      return;
    }

    router.push(`/booking/${params.id}/confirmed`);
  }

  async function payNow() {
    if (!booking) {
      return;
    }

    setPaying(true);
    setError("");
    const orderResponse = await fetch(`/api/bookings/${booking.id}/razorpay-order`, { method: "POST" });
    const orderData = (await orderResponse.json()) as {
      order?: RazorpayOrder;
      mock?: boolean;
      error?: string;
    };

    if (!orderResponse.ok) {
      setError(orderData.error || "Could not start payment");
      setPaying(false);
      return;
    }

    const configuredKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
    const key = configuredKey.startsWith("rzp_test_xxx") ? "" : configuredKey;
    const mockEnabled = process.env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS !== "false";

    if (!key || orderData.mock || mockEnabled) {
      await markPaid({ mock: true, razorpayOrderId: orderData.order?.id || `mock_${booking.id}` });
      return;
    }

    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded || !window.Razorpay || !orderData.order) {
      setError("Razorpay checkout could not load");
      setPaying(false);
      return;
    }

    const checkout = new window.Razorpay({
      key,
      amount: orderData.order.amount,
      currency: orderData.order.currency,
      name: "Park2bnb",
      description: `${booking.selectedDuration} parking booking`,
      order_id: orderData.order.id,
      handler: (response) => {
        markPaid({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      theme: { color: "#11312c" },
    });
    checkout.open();
  }

  if (loading) {
    return (
      <main className="app-shell py-6">
        <div className="card p-5 text-sm font-bold text-[#6b7772]">Loading payment...</div>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="app-shell py-6">
        <div className="card p-5 text-sm font-bold text-[#a93c22]">{error}</div>
      </main>
    );
  }

  return (
    <main className="app-shell safe-bottom grid min-h-[calc(100svh-64px)] items-center py-6">
      <section className="card mx-auto grid w-full max-w-lg gap-5 p-5 sm:p-7">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#28a58b]">Payment</p>
          <h1 className="mt-2 text-3xl font-black">Confirm Booking</h1>
        </div>

        <div className="rounded-lg bg-[#f8fbfa] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-black">
                {isPublicListing(booking.listing) ? booking.listing.ownerFullName : "Parking Spot"}
              </h2>
              <p className="mt-1 text-sm font-bold text-[#6b7772]">
                {isPublicListing(booking.listing) ? booking.listing.generalArea : "Exact address unlocks after payment"}
              </p>
            </div>
            <StatusBadge value={booking.paymentStatus} />
          </div>
        </div>

        <div className="grid gap-3 text-sm font-bold text-[#40514b]">
          <div className="flex items-center justify-between">
            <span>Selected duration</span>
            <span>{booking.selectedDuration}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Parking price</span>
            <span>{money(booking.selectedPrice)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Platform fee 5%</span>
            <span>{money(platformFee)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-[#edf1ef] pt-4 text-lg font-black text-[#14231f]">
            <span>Total amount</span>
            <span>{money(total)}</span>
          </div>
        </div>

        {error && <p className="rounded-lg bg-[#fff0ec] p-3 text-sm font-bold text-[#a93c22]">{error}</p>}

        <button className="btn-primary h-14 w-full" disabled={paying} onClick={payNow} type="button">
          {paying ? "Processing..." : "Pay Now"}
        </button>
      </section>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <ProtectedPage requiredType="SEEKER">
      {() => <PaymentContent />}
    </ProtectedPage>
  );
}
