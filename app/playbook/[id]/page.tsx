"use client"

import { StrategyDetail } from "@/components/playbook/strategy-detail"
import { StrategyForm } from "@/components/playbook/strategy-form"

export default function StrategyDetailPage({ params }: { params: { id: string } }) {
  // If the ID is "new", render the strategy form instead of the detail view
  if (params.id === "new") {
    return (
      <div className="flex flex-col gap-6 p-6 animate-in">
        <StrategyForm />
      </div>
    )
  }

  // Otherwise, render the strategy detail view
  return (
    <div className="flex flex-col gap-6 p-6 animate-in">
      <StrategyDetail strategyId={params.id} />
    </div>
  )
}
