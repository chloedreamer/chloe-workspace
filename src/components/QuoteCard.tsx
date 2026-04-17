"use client";

import { getTodayQuote } from "@/lib/quotes";
import { Quote, BookOpen } from "lucide-react";

export default function QuoteCard() {
  const quote = getTodayQuote();

  return (
    <div className="bg-white rounded-xl border border-rose-border shadow-sm p-5 mb-6 relative overflow-hidden">
      <Quote className="absolute top-3 right-3 w-8 h-8 text-rose-border/50" />
      <p className="text-sm text-rose-dark leading-relaxed italic pr-8">
        &ldquo;{quote.text}&rdquo;
      </p>
      {quote.vi && (
        <p className="text-sm text-rose-muted leading-relaxed mt-2 pr-8">
          {quote.vi}
        </p>
      )}
      <div className="flex items-center gap-2 mt-3">
        <BookOpen className="w-3.5 h-3.5 text-rose-muted" />
        <span className="text-xs text-rose-deep font-medium">{quote.author}</span>
        <span className="text-xs text-rose-muted">— {quote.source}</span>
      </div>
    </div>
  );
}
