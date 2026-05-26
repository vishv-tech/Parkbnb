import { money } from "@/lib/format";
import type { Booking, ParkingListing } from "@/lib/types";

type ReceiptProps = {
  booking: Booking;
  listing: ParkingListing;
};

export function Receipt({ booking, listing }: ReceiptProps) {
  return (
    <section className="card mx-auto max-w-md p-6 text-center">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6b7772]">Parking receipt</p>
      <div className="mx-auto mt-5 grid h-12 w-12 place-items-center rounded-lg bg-[#e9f7f2] text-2xl font-black text-[#11312c]">
        P
      </div>
      <h2 className="mt-4 text-3xl font-black text-[#1f2b3f]">Park2bnb</h2>

      <div className="mt-5 space-y-1 border-b border-t border-[#edf1ef] py-5 text-left text-sm text-[#6b7772]">
        <p>Name - {booking.seekerName}</p>
        <p>Number - {booking.seekerContact}</p>
        <p>Car - {booking.carModel}</p>
        <p>Car number - {booking.carNumber}</p>
      </div>

      <div className="mt-5 space-y-4 text-left text-sm">
        <div>
          <p className="font-black text-[#1f2b3f]">Parking Location:</p>
          <p className="mt-1 text-[#6b7772]">{listing.buildingAddress}</p>
        </div>
        <div>
          <p className="font-black text-[#1f2b3f]">Parking Spot:</p>
          <p className="mt-1 text-[#6b7772]">{listing.parkingFloor}</p>
          <p className="text-[#6b7772]">{listing.parkingAddressDetails}</p>
        </div>
        <div>
          <p className="font-black text-[#1f2b3f]">Parking Time:</p>
          <p className="mt-1 text-[#6b7772]">Duration - {booking.selectedDuration}</p>
          <p className="text-[#6b7772]">Booked - {new Date(booking.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <p className="mt-6 text-xl font-black text-[#1f2b3f]">
        Total Paid: {money(booking.selectedPrice)}
      </p>
    </section>
  );
}
