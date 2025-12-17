"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateFinancialCategory } from "./actions";
import type { FinancialCategory } from "./actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Common emoji suggestions
const INCOME_EMOJIS = ["💰", "💵", "💸", "🎁", "💼", "🎉", "📈", "🏆", "⭐", "✨"];
const EXPENSE_EMOJIS = ["💸", "⛽", "🛠️", "📱", "🏠", "🍔", "🚗", "🎮", "👕", "💊"];

// Emoji validation function - checks if string contains only emojis
const isValidEmoji = (str: string): boolean => {
  if (!str || str.trim() === "") return true; // Allow empty
  // Regex to match emoji characters (including combinations and skin tones)
  const emojiRegex = /^[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Presentation}\uFE0F\u200D]+$/u;
  return emojiRegex.test(str.trim());
};

// Common color suggestions
const COLORS = [
  "#10b981", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#6366f1", // indigo
  "#ef4444", // red
  "#f97316", // orange
  "#ec4899", // pink
  "#64748b", // slate
  "#14b8a6", // teal
  "#f59e0b", // amber
];

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: FinancialCategory;
  onSuccess: () => void;
}

export function EditCategoryDialog({ open, onOpenChange, category, onSuccess }: EditCategoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: category.name,
    icon: category.icon || "",
    color: category.color || "#10b981",
    default_amount: category.default_amount ? String(category.default_amount) : "",
    default_currency: category.default_currency || "USD",
    default_description: category.default_description || "",
  });

  // Update form data when category changes
  useEffect(() => {
    setFormData({
      name: category.name,
      icon: category.icon || "",
      color: category.color || "#10b981",
      default_amount: category.default_amount ? String(category.default_amount) : "",
      default_currency: category.default_currency || "USD",
      default_description: category.default_description || "",
    });
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await updateFinancialCategory(category.id, {
      name: formData.name,
      type: category.type,
      icon: formData.icon,
      color: formData.color,
      default_amount: formData.default_amount ? parseFloat(formData.default_amount) : undefined,
      default_currency: formData.default_amount ? formData.default_currency : undefined,
      default_description: formData.default_description || undefined,
    });

    setLoading(false);

    if (result.error) {
      toast.error("Error", {
        description: result.error,
      });
    } else {
      toast.success(`Category "${formData.name}" updated successfully`);
      onSuccess();
      onOpenChange(false);
    }
  };

  const emojiSuggestions = category.type === "income" ? INCOME_EMOJIS : EXPENSE_EMOJIS;
  const isMandatory = category.name === "Other Income" || category.name === "Other Expense";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit {category.type === "income" ? "Income" : "Expense"} Category</DialogTitle>
            <DialogDescription>
              Update the details of "{category.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Category Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={category.type === "income" ? "e.g., Freelance" : "e.g., Gas"}
                required
                disabled={isMandatory}
              />
              {isMandatory && (
                <p className="text-xs text-muted-foreground">
                  This is a required category and cannot be renamed
                </p>
              )}
            </div>

            {/* Icon Selector */}
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <p className="text-xs text-muted-foreground">
                Type any emoji or select from suggestions
              </p>
              <div className="flex items-center gap-2">
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only update if it's a valid emoji or empty
                    if (isValidEmoji(value)) {
                      setFormData({ ...formData, icon: value });
                    }
                  }}
                  placeholder="Any emoji"
                  className="w-24 text-center text-lg"
                />
                <div className="flex-1 flex flex-wrap gap-1">
                  {emojiSuggestions.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: emoji })}
                      className={`w-8 h-8 rounded border hover:bg-muted transition-colors ${
                        formData.icon === emoji ? "bg-muted ring-2 ring-primary" : ""
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10 p-1 cursor-pointer"
                />
                <div className="flex-1 flex flex-wrap gap-1">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded border hover:scale-110 transition-transform ${
                        formData.color === color ? "ring-2 ring-primary ring-offset-2" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Default Amount (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="default_amount">Default Amount (Optional)</Label>
              <p className="text-xs text-muted-foreground">
                Auto-fill this amount when creating records with this category
              </p>
              <div className="flex gap-2">
                <Input
                  id="default_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.default_amount}
                  onChange={(e) => setFormData({ ...formData, default_amount: e.target.value })}
                  placeholder="0.00"
                  className="flex-1"
                />
                <Input
                  id="default_currency"
                  value={formData.default_currency}
                  onChange={(e) => setFormData({ ...formData, default_currency: e.target.value.toUpperCase() })}
                  placeholder="USD"
                  className="w-24"
                  maxLength={3}
                />
              </div>
            </div>

            {/* Default Description (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="default_description">Default Description (Optional)</Label>
              <p className="text-xs text-muted-foreground">
                Auto-fill this description when creating records with this category
              </p>
              <Input
                id="default_description"
                value={formData.default_description}
                onChange={(e) => setFormData({ ...formData, default_description: e.target.value })}
                placeholder={category.type === "income" ? "e.g., Monthly freelance payment" : "e.g., Monthly Netflix subscription"}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
