"use client"

import * as React from "react"
import { BookOpen, Brain, Flame, Target, TrendingUp, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { VocabWord } from "@/lib/types"
import { getStats } from "@/lib/spaced-repetition"

interface DashboardProps {
  words: VocabWord[]
  streak: number
  longestStreak: number
}

export function Dashboard({ words, streak, longestStreak }: DashboardProps) {
  const stats = getStats(words)
  const masteryPercentage = words.length > 0 
    ? Math.round((stats.mastered / words.length) * 100) 
    : 0

  const statCards = [
    {
      title: "Total Words",
      value: stats.total,
      icon: BookOpen,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Due Today",
      value: stats.due,
      icon: Target,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Mastered",
      value: stats.mastered,
      icon: Brain,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Current Streak",
      value: `${streak} days`,
      icon: Flame,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bgColor} shrink-0`}>
                  <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.title}</p>
                  <p className="text-xl sm:text-2xl font-bold truncate">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Overview */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <Card className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Overall Mastery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-gradient">{masteryPercentage}%</span>
                <span className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                  {stats.mastered} of {stats.total} words mastered
                </span>
              </div>
              <Progress value={masteryPercentage} className="h-2.5 sm:h-3" />
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2">
                <div className="text-center">
                  <p className="text-base sm:text-lg font-semibold text-success">{stats.mastered}</p>
                  <p className="text-xs text-muted-foreground">Mastered</p>
                </div>
                <div className="text-center">
                  <p className="text-base sm:text-lg font-semibold text-warning">{stats.learning}</p>
                  <p className="text-xs text-muted-foreground">Learning</p>
                </div>
                <div className="text-center">
                  <p className="text-base sm:text-lg font-semibold text-muted-foreground">{stats.new}</p>
                  <p className="text-xs text-muted-foreground">New</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '500ms' }}>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Learning Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full gradient-primary flex items-center justify-center mb-2 shadow-glow">
                  <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
                </div>
                <p className="text-xl sm:text-2xl font-bold">{streak}</p>
                <p className="text-xs text-muted-foreground">Current</p>
              </div>
              <div className="flex-1 space-y-2 sm:space-y-3 w-full">
                <div>
                  <div className="flex justify-between text-xs sm:text-sm mb-1">
                    <span className="text-muted-foreground">Longest streak</span>
                    <span className="font-medium">{longestStreak} days</span>
                  </div>
                  <Progress value={(streak / Math.max(longestStreak, 1)) * 100} className="h-2" />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                  {streak === 0 
                    ? "Start studying today to begin your streak!" 
                    : streak >= longestStreak 
                      ? "You're on your best streak! Keep it up!" 
                      : `${longestStreak - streak} more days to beat your record!`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
