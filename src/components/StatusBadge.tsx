type StatusBadgeProps = {
  value: string;
};

export function StatusBadge({ value }: StatusBadgeProps) {
  const normalized = value.toUpperCase();
  const tone =
    normalized === "LIVE" || normalized === "VACANT" || normalized === "PAID" || normalized === "ACTIVE"
      ? "bg-[#e9f7f2] text-[#11614f]"
      : normalized === "PENDING"
        ? "bg-[#fff8df] text-[#836300]"
        : "bg-[#fff0ec] text-[#a93c22]";

  return <span className={`badge ${tone}`}>{value.replaceAll("_", " ")}</span>;
}
