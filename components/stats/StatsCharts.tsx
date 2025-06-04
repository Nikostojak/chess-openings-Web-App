'use client'

import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

type StatsData = {
  totalGames: number
  openingWinRates: Array<{
    opening: string
    winRate: number
    gamesPlayed: number
  }>
  resultsCount: Record<string, number>
  gamesPerDay: Record<string, number>
}

export default function StatsCharts({ data }: { data: StatsData }) {
  // Opening Win Rates Chart
  const openingChartData = {
    labels: data.openingWinRates.map(item => item.opening),
    datasets: [
      {
        label: 'Win Rate (%)',
        data: data.openingWinRates.map(item => item.winRate),
        backgroundColor: [
          '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
          '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
        ],
        borderRadius: 6,
      },
    ],
  }

  const openingChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Win Rate by Opening',
        font: { size: 16, weight: 'bold' as const },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value: string | number) {
            return value + '%'
          },
        },
      },
    },
  }

  // Results Distribution Chart
  const resultsChartData = {
    labels: ['Wins', 'Losses', 'Draws'],
    datasets: [
      {
        data: [
          data.resultsCount.win || 0,
          data.resultsCount.loss || 0,
          data.resultsCount.draw || 0,
        ],
        backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
        borderWidth: 0,
      },
    ],
  }

  const resultsChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          font: { size: 14 },
        },
      },
      title: {
        display: true,
        text: 'Game Results',
        font: { size: 16, weight: 'bold' as const },
      },
    },
  }

  return (
    <div className="space-y-8">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">Total Games</h3>
          <p className="text-3xl font-bold text-gray-900">{data.totalGames}</p>
        </div>
        
        <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">Wins</h3>
          <p className="text-3xl font-bold text-emerald-600">{data.resultsCount.win || 0}</p>
        </div>
        
        <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">Losses</h3>
          <p className="text-3xl font-bold text-red-600">{data.resultsCount.loss || 0}</p>
        </div>
        
        <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">Win Rate</h3>
          <p className="text-3xl font-bold text-blue-600">
            {Math.round(((data.resultsCount.win || 0) / data.totalGames) * 100)}%
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Opening Win Rates */}
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
          {data.openingWinRates.length > 0 ? (
            <Bar data={openingChartData} options={openingChartOptions} />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Not enough data for opening analysis</p>
            </div>
          )}
        </div>

        {/* Results Distribution */}
        <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
          <Doughnut data={resultsChartData} options={resultsChartOptions} />
        </div>
      </div>

      {/* Opening Performance Table */}
      {data.openingWinRates.length > 0 && (
        <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Opening Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-700">Opening</th>
                  <th className="text-center py-2 font-medium text-gray-700">Games</th>
                  <th className="text-center py-2 font-medium text-gray-700">Win Rate</th>
                  <th className="text-center py-2 font-medium text-gray-700">Performance</th>
                </tr>
              </thead>
              <tbody>
                {data.openingWinRates.map((opening) => (
                  <tr key={opening.opening} className="border-b border-gray-100">
                    <td className="py-3 font-medium">{opening.opening}</td>
                    <td className="py-3 text-center text-gray-600">{opening.gamesPlayed}</td>
                    <td className="py-3 text-center font-semibold">{opening.winRate}%</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        opening.winRate >= 60 ? 'bg-emerald-100 text-emerald-700' :
                        opening.winRate >= 40 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {opening.winRate >= 60 ? 'Excellent' :
                         opening.winRate >= 40 ? 'Good' : 'Needs Work'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}