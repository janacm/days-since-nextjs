import { auth } from '@/lib/auth';
import { getEventAnalytics } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Calendar,
  RotateCcw,
  TrendingUp,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { AnalyticsCharts } from './analytics-charts';

interface EventAnalyticsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventAnalyticsPage({
  params
}: EventAnalyticsPageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const { id } = await params;
  const eventId = parseInt(id);
  if (isNaN(eventId)) {
    redirect('/');
  }

  try {
    const analytics = await getEventAnalytics(eventId, session.user.email);
    const {
      event,
      totalResets,
      currentStreak,
      longestStreak,
      averageDaysBetweenResets,
      recentResets,
      allResets
    } = analytics;

    // Format the event date
    const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button variant="ghost" size="sm" asChild className="w-fit">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold truncate text-center sm:text-right">{event.name}</h1>
          </div>
        </div>

        {/* Event Info */}
        <Card className="shadow-sm bg-gradient-to-br from-background to-muted">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-2xl truncate">{event.name}</CardTitle>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <span className="text-sm text-muted-foreground">
                    Started: {formattedDate}
                  </span>
                  {event.reminderDays && (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      Reminder every {event.reminderDays} days
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Analytics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="transition-all duration-300 hover:shadow-md border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Days Since Reset
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mt-2">{currentStreak}</div>
              <p className="text-xs text-muted-foreground mt-2">
                days since last reset
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-md border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Resets
              </CardTitle>
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mt-2">{totalResets}</div>
              <p className="text-xs text-muted-foreground mt-2">
                times reset since start
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-md border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Longest Period
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mt-2">{longestStreak}</div>
              <p className="text-xs text-muted-foreground mt-2">best performance</p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-md border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Days
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mt-2">
                {totalResets > 0
                  ? Math.round(averageDaysBetweenResets)
                  : currentStreak}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {totalResets > 0 ? 'days on average' : 'days total so far'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="pt-6">
          <AnalyticsCharts
            event={event}
            allResets={allResets}
            currentStreak={currentStreak}
            totalResets={totalResets}
          />
        </div>

        {/* Recent Resets */}
        {recentResets.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Recent Resets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentResets.map((reset, index) => (
                  <div
                    key={reset.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-300 border border-muted-foreground/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-lg">
                          {new Date(reset.resetAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            timeZone: 'UTC'
                          })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(reset.resetAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'UTC'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(reset.resetAt), {
                        addSuffix: true
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Resets Message */}
        {totalResets === 0 && (
          <Card className="shadow-sm">
            <CardContent className="text-center py-16">
              <div className="p-5 rounded-full bg-primary/10 w-fit mx-auto">
                <RotateCcw className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mt-6 mb-3">No resets yet!</h3>
              <p className="text-muted-foreground max-w-md mx-auto text-lg">
                You&apos;ve been tracking for {currentStreak} days. Keep it up!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error loading event analytics:', error);
    redirect('/');
  }
}
