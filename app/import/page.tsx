"use client"

import { useState } from "react"
import { RobinhoodImport } from "@/components/import/robinhood-import"
import { BrokerSelector } from "@/components/import/broker-selector"
import type { BrokerImportConfig } from "@/types/import"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

const brokers: BrokerImportConfig[] = [
  {
    name: "Robinhood",
    logo: "/robinhood-logo.png",
    fileExtensions: [".csv"],
    requiredColumns: ["Activity Date", "Trans Code", "Description", "Amount"],
    description: "Import your Robinhood transaction history",
  },
  {
    name: "TD Ameritrade",
    logo: "/td-ameritrade-logo.png",
    fileExtensions: [".csv"],
    requiredColumns: [],
    description: "Coming soon",
  },
  {
    name: "E*TRADE",
    logo: "/generic-stock-market-logo.png",
    fileExtensions: [".csv"],
    requiredColumns: [],
    description: "Coming soon",
  },
  {
    name: "Interactive Brokers",
    logo: "/interactive-brokers-logo.png",
    fileExtensions: [".csv", ".xlsx"],
    requiredColumns: [],
    description: "Coming soon",
  },
  {
    name: "Webull",
    logo: "/webull-logo.png",
    fileExtensions: [".csv"],
    requiredColumns: [],
    description: "Coming soon",
  },
  {
    name: "Charles Schwab",
    logo: "/placeholder.svg?height=40&width=40&query=charles schwab logo",
    fileExtensions: [".csv"],
    requiredColumns: [],
    description: "Coming soon",
  },
]

export default function ImportPage() {
  const [selectedBroker, setSelectedBroker] = useState<string>("Robinhood")

  return (
    <div className="container py-8 max-w-7xl animate-in">
      <h1 className="text-3xl font-bold mb-6">Import Trades</h1>

      <Card className="glass-panel mb-8">
        <CardHeader>
          <CardTitle>Select Your Broker</CardTitle>
          <CardDescription>Choose your broker to import transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          <BrokerSelector brokers={brokers} selectedBroker={selectedBroker} onSelect={setSelectedBroker} />
        </CardContent>
      </Card>

      {selectedBroker === "Robinhood" && <RobinhoodImport />}

      {selectedBroker !== "Robinhood" && (
        <Card className="glass-panel p-8 text-center">
          <div className="py-12">
            <h3 className="text-xl font-medium mb-2">Coming Soon</h3>
            <p className="text-muted-foreground">
              Support for {selectedBroker} is coming soon. Please check back later.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
