"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minus, Plus, RotateCcw } from "lucide-react";

interface BreakCounterProps {
  defaultValue?: number;
  onValueChange?: (value: number) => void;
}

export function BreakCounter({ defaultValue = 3, onValueChange }: BreakCounterProps) {
  const [value, setValue] = useState(defaultValue);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('countdown_counter');
    if (stored) {
      setValue(parseInt(stored, 10));
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('countdown_counter', value.toString());
    onValueChange?.(value);
  }, [value, onValueChange]);

  const handleIncrement = () => {
    setValue(v => v + 1);
  };

  const handleDecrement = () => {
    if (value > 0) {
      setValue(v => v - 1);
    }
  };

  const handleReset = () => {
    setValue(defaultValue);
  };

  return (
    <Card className="p-6">
      <div className="relative flex items-center justify-center mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Counter</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReset}
          className="h-8 w-8 absolute right-0"
          title="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={value === 0}
          className="h-14 w-14 rounded-full"
        >
          <Minus className="h-6 w-6" />
        </Button>

        <div className="text-6xl font-bold tabular-nums text-primary min-w-[100px] text-center">
          {value}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          className="h-14 w-14 rounded-full"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </Card>
  );
}
