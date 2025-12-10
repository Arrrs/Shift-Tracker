"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  icon: string;
  value: string | React.ReactNode;
  loading?: boolean;
  gradient: string;
  border: string;
  textColor: string;
  cardId: string; // For localStorage key
  expandedContent?: React.ReactNode;
  onClick?: () => void;
}

export function StatCard({
  title,
  icon,
  value,
  loading,
  gradient,
  border,
  textColor,
  cardId,
  expandedContent,
  onClick,
}: StatCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Load expanded state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`stat-card-${cardId}`);
    if (stored === "true") {
      setIsExpanded(true);
    }
  }, [cardId]);

  // Save expanded state to localStorage
  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem(`stat-card-${cardId}`, String(newState));
  };

  const hasExpandableContent = !!expandedContent;

  return (
    <div
      className={cn(
        "rounded-lg p-4 transition-all duration-200",
        gradient,
        border,
        hasExpandableContent && "cursor-pointer hover:shadow-md",
        onClick && "cursor-pointer hover:shadow-md"
      )}
      onClick={() => {
        if (onClick) onClick();
        else if (hasExpandableContent) toggleExpanded();
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <span>{icon}</span>
          <span>{title}</span>
        </p>
        {hasExpandableContent && (
          <button
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded();
            }}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div className="flex items-center justify-center py-2">
          <Loader2 className={cn("h-6 w-6 animate-spin", textColor)} />
        </div>
      ) : (
        <div className={cn("text-2xl font-bold", textColor)}>{value}</div>
      )}

      {/* Expanded Content */}
      {isExpanded && expandedContent && (
        <div className="mt-3 pt-3 border-t border-current/10 text-sm">
          {expandedContent}
        </div>
      )}
    </div>
  );
}

// Mobile version - more compact
export function StatCardMobile({
  title,
  icon,
  value,
  loading,
  gradient,
  border,
  textColor,
}: Omit<StatCardProps, "cardId" | "expandedContent" | "onClick">) {
  return (
    <div className={cn("rounded-lg p-2", gradient, border)}>
      <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
        <span>{icon}</span>
        <span>{title}</span>
      </p>
      {loading ? (
        <div className="flex items-center justify-center py-1">
          <Loader2 className={cn("h-4 w-4 animate-spin", textColor)} />
        </div>
      ) : (
        <div className={cn("text-base font-bold", textColor)}>{value}</div>
      )}
    </div>
  );
}
