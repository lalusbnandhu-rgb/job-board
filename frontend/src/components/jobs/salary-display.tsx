interface SalaryDisplayProps {
  min?: number;
  max?: number;
  currency?: string;
  className?: string;
}

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AED: 'AED ',
};

const formatSalary = (amount: number, currency: string): string => {
  const symbol = currencySymbols[currency] ?? currency + ' ';
  if (amount >= 1_000) return `${symbol}${(amount / 1_000).toFixed(0)}k`;
  return `${symbol}${amount}`;
};

export function SalaryDisplay({
  min,
  max,
  currency = 'USD',
  className,
}: SalaryDisplayProps) {
  if (!min && !max) {
    return <span className={className}>Salary not disclosed</span>;
  }

  if (min && max) {
    return (
      <span className={className}>
        {formatSalary(min, currency)} – {formatSalary(max, currency)}
        <span className="text-xs ml-1 text-gray-400">/yr</span>
      </span>
    );
  }

  const value = min ?? max!;
  const prefix = min ? '' : 'Up to ';
  return (
    <span className={className}>
      {prefix}
      {formatSalary(value, currency)}
      <span className="text-xs ml-1 text-gray-400">/yr</span>
    </span>
  );
}
