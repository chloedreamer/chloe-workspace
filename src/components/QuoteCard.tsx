"use client";

import { getTodayQuote } from "@/lib/quotes";
import { Quote } from "lucide-react";

export default function QuoteCard() {
  const quote = getTodayQuote();

  return (
    <div className="card p-6 mb-8 relative overflow-hidden">
      <Quote className="absolute top-4 right-4 w-6 h-6 text-rose-light" />
      <p className="text-[15px] text-rose-dark leading-relaxed italic pr-8 font-light">
        &ldquo;{quote.text}&rdquo;
      </p>
      {quote.vi && (
        <p className="text-sm text-rose-muted leading-relaxed mt-2 pr-8">
          {quote.vi}
        </p>
      )}
      <p className="text-xs text-rose-deep mt-3">
        <span className="font-medium">{quote.author}</span>
        <span className="text-rose-muted"> — {quote.source}</span>
      </p>
    </div>
  );
}
