'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Event } from '@/lib/db';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  ModuleRegistry,
  ValueGetterParams,
  AllCommunityModule
} from 'ag-grid-community';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { formatDistanceToNow } from 'date-fns';
import { EventActionsCell, EventNameCell } from './event-actions-cell';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

// Helper function to calculate days since
const calculateDaysSince = (dateString: string): number => {
  return Math.floor(
    (new Date().getTime() - new Date(dateString).getTime()) / (1000 * 3600 * 24)
  );
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export function EventsTable({ events }: { events: Event[] }) {
  // Column Definitions: Defines the columns to be displayed.
  const [colDefs] = useState<ColDef<Event>[]>([
    {
      field: 'name',
      headerName: 'Event',
      cellRenderer: EventNameCell,
      flex: 1,
      minWidth: 200,
      suppressHeaderMenuButton: true,
      sortable: true
    },
    {
      field: 'date',
      headerName: 'Date',
      valueGetter: (params: ValueGetterParams<Event>) =>
        params.data && formatDate(params.data.date),
      width: 150,
      suppressHeaderMenuButton: true,
      sortable: true
    },
    {
      headerName: 'Days Since',
      valueGetter: (params: ValueGetterParams<Event>) =>
        params.data && calculateDaysSince(params.data.date),
      width: 120,
      suppressHeaderMenuButton: true,
      sortable: true,
      cellStyle: {
        textAlign: 'center',
        fontSize: '18px',
        fontWeight: 'bold'
      }
    },
    {
      headerName: 'Relative',
      valueGetter: (params: ValueGetterParams<Event>) =>
        params.data &&
        formatDistanceToNow(new Date(params.data.date), { addSuffix: true }),
      width: 150,
      suppressHeaderMenuButton: true,
      sortable: true,
      cellClass: 'text-muted-foreground',
      hide: false // We'll handle responsive hiding with CSS
    },
    {
      headerName: '',
      cellRenderer: EventActionsCell,
      width: 100,
      suppressHeaderMenuButton: true,
      sortable: false,
      resizable: false,
      pinned: 'right'
    }
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Events</CardTitle>
        <CardDescription>
          Track how many days have passed since important events.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No events yet. Add your first event to get started!
          </div>
        ) : (
          <div
            className="ag-theme-quartz events-table-custom"
            style={
              {
                width: '100%',
                '--ag-header-height': '48px',
                '--ag-row-height': '64px',
                '--ag-border-color': 'transparent',
                '--ag-wrapper-border': 'none',
                '--ag-wrapper-border-radius': '0px',
                '--ag-row-border': 'none',
                '--ag-header-row-border': 'none',
                '--ag-column-border': 'none',
                '--ag-header-column-border': 'none',
                '--ag-header-background-color': 'transparent',
                '--ag-odd-row-background-color': 'transparent',
                '--ag-row-hover-color': 'hsl(var(--muted) / 0.5)',
                '--ag-header-foreground-color': 'hsl(var(--muted-foreground))',
                '--ag-foreground-color': 'hsl(var(--foreground))',
                '--ag-font-size': '14px',
                '--ag-font-family': 'inherit'
              } as React.CSSProperties
            }
          >
            <style jsx>{`
              .events-table-custom {
                border: none !important;
              }
              .events-table-custom .ag-header {
                border-bottom: none !important;
                border-top: none !important;
              }
              .events-table-custom .ag-header-cell {
                padding: 0 16px;
                font-weight: 500;
                font-size: 14px;
                border-right: none !important;
                border-left: none !important;
                border-top: none !important;
                border-bottom: none !important;
              }
              .events-table-custom .ag-cell {
                padding: 0 16px;
                border-right: none !important;
                border-bottom: none !important;
                border-left: none !important;
                border-top: none !important;
                display: flex;
                align-items: center;
              }
              .events-table-custom .ag-row {
                border-bottom: none !important;
                border-top: none !important;
                border-left: none !important;
                border-right: none !important;
              }
              .events-table-custom .ag-row:hover {
                background-color: hsl(var(--muted) / 0.3);
              }
              .events-table-custom .ag-root-wrapper {
                border: none !important;
              }
              .events-table-custom .ag-root {
                border: none !important;
              }
              .events-table-custom .ag-header-row {
                border-bottom: none !important;
                border-top: none !important;
              }
              .events-table-custom .ag-body-viewport {
                border: none !important;
              }
              .events-table-custom .ag-body-horizontal-scroll {
                border: none !important;
              }
              .events-table-custom .ag-body {
                border: none !important;
              }
              .events-table-custom .ag-center-cols-container {
                border: none !important;
              }
              .events-table-custom .ag-center-cols-viewport {
                border: none !important;
              }
              @media (max-width: 768px) {
                .events-table-custom .ag-header-cell:nth-child(4),
                .events-table-custom .ag-cell:nth-child(4) {
                  display: none;
                }
              }
            `}</style>
            <AgGridReact<Event>
              rowData={events}
              columnDefs={colDefs}
              domLayout="autoHeight"
              suppressHorizontalScroll={false}
              suppressRowClickSelection={true}
              headerHeight={48}
              rowHeight={64}
              animateRows={true}
              suppressMenuHide={true}
              suppressColumnVirtualisation={true}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
