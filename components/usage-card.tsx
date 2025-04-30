"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"

interface UsageCardProps {
  title: string
  description?: string
  current: number
  max: number
  unit?: string
  ctaText?: string
  ctaHref?: string
  className?: string
}

export function UsageCard({
  title,
  description,
  current,
  max,
  unit = "",
  ctaText = "Upgrade",
  ctaHref = "#",
  className,
}: UsageCardProps) {
  const percentage = Math.min(Math.round((current / max) * 100), 100)
  const isNearLimit = percentage >= 80
  const isAtLimit = percentage >= 100

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {current.toLocaleString()} / {max.toLocaleString()} {unit}
            </span>
            <span
              className={`text-sm font-medium ${
                isAtLimit ? "text-destructive" : isNearLimit ? "text-warning" : "text-muted-foreground"
              }`}
            >
              {percentage}%
            </span>
          </div>
          <Progress value={percentage} className={isAtLimit ? "text-destructive" : isNearLimit ? "text-warning" : ""} />
        </div>
      </CardContent>
      {(isNearLimit || isAtLimit) && (
        <CardFooter>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a href={ctaHref}>
              {ctaText}
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
