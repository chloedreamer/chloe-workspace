"use client";

import { getTodayQuote } from "@/lib/quotes";

export default function QuoteCard() {
  const quote = getTodayQuote();

  return (
    <div className="card p-6 mb-8">
      <p className="text-[15px] text-rose-dark leading-relaxed italic font-light">
        &ldquo;{quote.text}&rdquo;
      </p>
      {quote.vi && (
        <p className="text-sm text-rose-muted leading-relaxed mt-2">
          {quote.vi}
        </p>
      )}
      <p className="text-xs text-rose-deep mt-4">
        <span className="font-medium">{quote.author}</span>
        <span className="text-rose-muted"> — {quote.source}</span>
      </p>
    </div>
  );
}
