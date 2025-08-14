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
          <h1 className="text-2xl font-bold truncate">{event.name}</h1>
        </div>

        {/* Event Info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{event.name}</CardTitle>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <span>Started: {formattedDate}</span>
                  {event.reminderDays && (
                    <Badge variant="secondary">
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
          <Card className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Days Since Reset
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{currentStreak}</div>
              <p className="text-xs text-muted-foreground mt-1">
                days since last reset
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Resets
              </CardTitle>
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalResets}</div>
              <p className="text-xs text-muted-foreground mt-1">
                times reset since start
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Longest Period
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{longestStreak}</div>
              <p className="text-xs text-muted-foreground mt-1">best performance</p>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Days
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {totalResets > 0
                  ? Math.round(averageDaysBetweenResets)
                  : currentStreak}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalResets > 0 ? 'days on average' : 'days total so far'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <AnalyticsCharts
          event={event}
          allResets={allResets}
          currentStreak={currentStreak}
          totalResets={totalResets}
        />

        {/* Recent Resets */}
        {recentResets.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Recent Resets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentResets.map((reset, index) => (
                  <div
                    key={reset.id}
                    className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">
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
            <CardContent className="text-center py-12">
              <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
                <RotateCcw className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mt-4 mb-2">No resets yet!</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
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
