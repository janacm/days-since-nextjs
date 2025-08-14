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
  TrendioUp,
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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <Button variant="ghost" size="sm" asChild className="w-fit hover:bg-muted transition-colors">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-bold truncate text-center sm:text-right">{event.name}</h1>
          </div>
        </div>

        {/* Event Info */}
        <Card className="shadow-lg bg-gradient-to-br from-background to-muted border-0">
          <CardHeader className="pb-5">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-full bg-primary/15 shadow-sm">
                <Calendar className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-2xl md:text-3xl truncate">{event.name}</CardTitle>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <span className="text-base text-muted-foreground">
                    Started: {formattedDate}
                  </span>
                  {event.reminderDays && (
                    <Badge variant="secondary" className="text-base px-4 py-1.5 animate-pulse">
                      Reminder every {event.reminderDays} days
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Analytics Cards */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Card className="transition-all duration-300 hover:shadow-lg border-primary/30 bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">
                Days Since Reset
              </CardTitle>
              <Target className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-primary mt-3">{currentStreak}</div>
              <p className="text-sm text-muted-foreground mt-2">
                days since last reset
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-lg border-primary/30 bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">
                Total Resets
              </CardTitle>
              <RotateCcw className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-primary mt-3">{totalResets}</div>
              <p className="text-sm text-muted-foreground mt-2">
                times reset since start
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-lg border-primary/30 bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">
                Longest Period
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-primary mt-3">{longestStreak}</div>
              <p className="text-sm text-muted-foreground mt-2">best performance</p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-lg border-primary/30 bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">
                Average Days
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-primary mt-3">
                {totalResets > 0
                  ? Math.round(averageDaysBetweenResets)
                  : currentStreak}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {totalResets > 0 ? 'days on average' : 'days total so far'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="pt-7">
          <AnalyticsCharts
            event={event}
            allResets={allResets}
            currentStreak={currentStreak}
            totalResets={totalResets}
          />
        </div>

        {/* Recent Resets */}
        {recentResets.length > 0 && (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-2xl">Recent Resets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {recentResets.map((reset, index) => (
                  <div
                    key={reset.id}
                    className="flex items-center justify-between p-5 rounded-xl bg-muted/50 hover:bg-muted transition-all duration-300 border border-muted-foreground/15 hover:border-primary/30 hover:scale-[1.02] hover:shadow-md"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-base font-bold text-primary shadow-sm">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-bold text-xl">
                          {new Date(reset.resetAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            timeZone: 'UTC'
                          })}
                        </div>
                        <div className="text-base text-muted-foreground">
                          {new Date(reset.resetAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'UTC'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-base text-muted-foreground">
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
          <Card className="shadow-lg border-0">
            <CardContent className="text-center py-20">
              <div className="p-6 rounded-full bg-primary/15 w-fit mx-auto shadow-lg">
                <RotateCcw className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-3xl font-extrabold mt-8 mb-4">No resets yet!</h3>
              <p className="text-muted-foreground max-w-lg mx-auto text-xl">
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
