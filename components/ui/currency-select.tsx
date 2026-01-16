"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCurrencyOptions } from "@/lib/utils/currency";

const CURRENCY_OPTIONS = getCurrencyOptions();

interface CurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  id?: string;
  className?: string;
}

export function CurrencySelect({ value, onValueChange, id, className }: CurrencySelectProps) {
  const selectedCurrency = CURRENCY_OPTIONS.find(c => c.value === value);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} className={className}>
        <SelectValue>
          {selectedCurrency?.shortLabel || value}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {CURRENCY_OPTIONS.map((currency) => (
          <SelectItem key={currency.value} value={currency.value}>
            {currency.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
