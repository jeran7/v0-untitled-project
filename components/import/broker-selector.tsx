"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"
import type { BrokerImportConfig } from "@/types/import"

interface BrokerSelectorProps {
  brokers: BrokerImportConfig[]
  selectedBroker: string
  onSelect: (broker: string) => void
}

export function BrokerSelector({ brokers, selectedBroker, onSelect }: BrokerSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {brokers.map((broker) => {
        const isSelected = broker.name === selectedBroker
        const isDisabled = broker.name !== "Robinhood"

        return (
          <motion.div
            key={broker.name}
            whileHover={{ scale: isDisabled ? 1 : 1.05 }}
            whileTap={{ scale: isDisabled ? 1 : 0.95 }}
            className={`
              relative rounded-lg border p-4 flex flex-col items-center justify-center text-center gap-2
              transition-all duration-200 ease-in-out
              ${isSelected ? "border-primary glow-blue" : "border-border"}
              ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"}
              backdrop-blur-md bg-background/80
            `}
            onClick={() => !isDisabled && onSelect(broker.name)}
          >
            {isSelected && (
              <div className="absolute top-2 right-2">
                <div className="bg-primary rounded-full p-0.5">
                  <Check size={12} className="text-primary-foreground" />
                </div>
              </div>
            )}
            <div className="w-10 h-10 mb-2">
              <img
                src={broker.logo || "/placeholder.svg"}
                alt={`${broker.name} logo`}
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="font-medium text-sm">{broker.name}</h3>
            <p className="text-xs text-muted-foreground">{broker.description}</p>
          </motion.div>
        )
      })}
    </div>
  )
}
