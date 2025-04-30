"use client"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, ReferenceLine } from "recharts"
import { InfoCircledIcon } from "@radix-ui/react-icons"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PerformanceData {
  complianceLevel: string
  winRate: number
  profitFactor: number
  averageRR: number
  trades: number
}

interface PerformanceComparisonChartProps {
  data: PerformanceData[]
}

export function PerformanceComparisonChart({ data }: PerformanceComparisonChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-muted-foreground">No performance data available</p>
      </div>
    )
  }

  // Calculate statistical significance
  const hasSignificantData = data.some((item) => item.trades >= 30)

  // Sort data by compliance level (descending)
  const sortedData = [...data].sort((a, b) => {
    const complianceLevels = ["Full (100%)", "High (75-99%)", "Medium (50-74%)", "Low (1-49%)", "None (0%)"]
    return complianceLevels.indexOf(a.complianceLevel) - complianceLevels.indexOf(b.complianceLevel)
  })

  // Prepare data for the chart
  const chartData = sortedData.map((item) => ({
    name: item.complianceLevel,
    winRate: Number.parseFloat((item.winRate * 100).toFixed(1)),
    profitFactor: Number.parseFloat(item.profitFactor.toFixed(2)),
    averageRR: Number.parseFloat(item.averageRR.toFixed(2)),
    trades: item.trades,
    isSignificant: item.trades >= 30,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="h-[400px]">
        <ChartContainer
          config={{
            winRate: {
              label: "Win Rate (%)",
              color: "hsl(var(--chart-1))",
            },
            profitFactor: {
              label: "Profit Factor",
              color: "hsl(var(--chart-2))",
            },
            averageRR: {
              label: "Average R:R",
              color: "hsl(var(--chart-3))",
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    customContent={(props) => (
                      <div>
                        {props.payload && props.payload.length > 0 && (
                          <div className="flex flex-col gap-1">
                            <p className="text-sm font-medium">{props.label}</p>
                            <p className="text-xs text-muted-foreground">
                              Based on {props.payload[0].payload.trades} trades
                              {!props.payload[0].payload.isSignificant && (
                                <span className="ml-1 text-amber-400">*</span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  />
                }
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="winRate"
                fill="var(--color-winRate)"
                name="Win Rate (%)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="profitFactor"
                fill="var(--color-profitFactor)"
                name="Profit Factor"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="averageRR"
                fill="var(--color-averageRR)"
                name="Average R:R"
                radius={[4, 4, 0, 0]}
              />
              <ReferenceLine y={50} yAxisId="left" stroke="#888" strokeDasharray="3 3" />
              <ReferenceLine y={1} yAxisId="right" stroke="#888" strokeDasharray="3 3" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {!hasSignificantData && (
        <div className="flex items-center gap-2 text-sm text-amber-400">
          <span className="text-lg">*</span>
          <span>Some compliance levels have fewer than 30 trades, which may not be statistically significant.</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoCircledIcon className="h-4 w-4 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  For reliable statistical analysis, it's recommended to have at least 30 trades in each category.
                  Continue trading with these strategies to gather more data for conclusive insights.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  )
}
