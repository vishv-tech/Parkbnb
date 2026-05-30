import Link from "next/link";

export default function Home() {
  return (
    <main className="safe-bottom">
      <section className="bg-[#11312c] text-white">
        <div className="app-shell grid min-h-[calc(100svh-64px)] items-center gap-10 py-10 lg:grid-cols-[1fr_0.9fr]">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#9be0d0]">Parkbnb</p>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">
              Find or List Parking Near You
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#d8e8e3]">
              Book vacant private parking spots nearby, or turn an empty slot into income with a few taps.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link className="btn-secondary h-16 text-base" href="/signup?type=OWNER&intent=list">
                List Parking Spot
              </Link>
              <Link className="btn-inverse h-16 text-base" href="/signup?type=SEEKER&intent=find">
                Find Parking Spot Near Me
              </Link>
            </div>
            <p className="mt-5 text-sm font-bold text-[#b9d8cf]">
              Already registered? <Link className="text-white underline" href="/login">Login here</Link>
            </p>
          </div>

          <div className="card overflow-hidden bg-white text-[#14231f]">
            <img
              alt="Marked parking space"
              className="h-56 w-full object-cover"
              src="/parking-placeholder.svg"
            />
            <div className="grid gap-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6b7772]">Live nearby</p>
                  <h2 className="mt-1 text-2xl font-black">Verified parking slots</h2>
                </div>
                <span className="badge bg-[#e9f7f2] text-[#11614f]">VACANT</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-[#f6f7f9] p-3">
                  <p className="text-xl font-black">5</p>
                  <p className="text-xs font-bold text-[#6b7772]">min</p>
                </div>
                <div className="rounded-lg bg-[#f6f7f9] p-3">
                  <p className="text-xl font-black">Rs 40</p>
                  <p className="text-xs font-bold text-[#6b7772]">hour</p>
                </div>
                <div className="rounded-lg bg-[#f6f7f9] p-3">
                  <p className="text-xl font-black">24h</p>
                  <p className="text-xs font-bold text-[#6b7772]">access</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
