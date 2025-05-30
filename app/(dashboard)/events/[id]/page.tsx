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
      day: 'numeric'
    });

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>
          </Button>
        </div>

        {/* Event Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {event.name}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Started: {formattedDate}</span>
              {event.reminderDays && (
                <Badge variant="secondary">
                  Reminder every {event.reminderDays} days
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Analytics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Days Since Reset
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentStreak}</div>
              <p className="text-xs text-muted-foreground">
                days since last reset
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Resets
              </CardTitle>
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalResets}</div>
              <p className="text-xs text-muted-foreground">
                times reset since start
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Longest Period
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{longestStreak}</div>
              <p className="text-xs text-muted-foreground">best performance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Days
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalResets > 0
                  ? Math.round(averageDaysBetweenResets)
                  : currentStreak}
              </div>
              <p className="text-xs text-muted-foreground">
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
          <Card>
            <CardHeader>
              <CardTitle>Recent Resets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentResets.map((reset, index) => (
                  <div
                    key={reset.id}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">
                          {new Date(reset.resetAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(reset.resetAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
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
          <Card>
            <CardContent className="text-center py-8">
              <RotateCcw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No resets yet!</h3>
              <p className="text-muted-foreground">
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
