/**
 * BulkAuditManager - Manage and track bulk SEO audits
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, Check, Clock, Play, Pause, X, Download, Eye, BarChart3, TrendingUp } from 'lucide-react';

const mockBulkAudits = [
  { id: '1', name: 'SoCal Lenders Batch', total: 50, completed: 50, failed: 0, status: 'completed', date: '2h ago' },
  { id: '2', name: 'High Priority Leads', total: 25, completed: 18, failed: 2, status: 'running', date: 'Now' },
  { id: '3', name: 'New Discoveries', total: 100, completed: 0, failed: 0, status: 'queued', date: 'Pending' },
];

const mockRecentResults = [
  { business: 'Pacific Bridge Capital', score: 92, issues: 2, status: 'good' },
  { business: 'Coastal Lending Group', score: 78, issues: 8, status: 'warning' },
  { business: 'Sunset Financial', score: 65, issues: 12, status: 'critical' },
];

export function BulkAuditManager() {
  const [audits] = useState(mockBulkAudits);

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">Bulk Audit Manager</CardTitle>
          <Button size="sm" className="bg-teal-600 hover:bg-teal-500 gap-1">
            <Layers className="w-3 h-3" />
            New Batch
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-slate-800/50">
            <p className="text-xs text-slate-400">Total Audits</p>
            <p className="text-lg font-bold text-white">175</p>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/50">
            <p className="text-xs text-slate-400">Completed</p>
            <p className="text-lg font-bold text-emerald-400">148</p>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/50">
            <p className="text-xs text-slate-400">In Progress</p>
            <p className="text-lg font-bold text-amber-400">27</p>
          </div>
        </div>

        {/* Active/Pending Audits */}
        <div>
          <p className="text-xs text-slate-400 mb-2">Queued Audits</p>
          <div className="space-y-2">
            {audits.map((audit) => (
              <div 
                key={audit.id} 
                className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 border border-slate-700"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    audit.status === 'completed' ? 'bg-emerald-500' :
                    audit.status === 'running' ? 'bg-amber-500 animate-pulse' :
                    'bg-slate-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-white">{audit.name}</p>
                    <p className="text-xs text-slate-500">{audit.total} leads • {audit.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {audit.status === 'completed' && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                      {audit.completed}/{audit.total}
                    </Badge>
                  )}
                  {audit.status === 'running' && (
                    <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                      {Math.round((audit.completed / audit.total) * 100)}%
                    </Badge>
                  )}
                  {audit.status === 'queued' && (
                    <Badge className="bg-slate-500/20 text-slate-400 text-xs">
                      Queued
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Results Summary */}
        <div>
          <p className="text-xs text-slate-400 mb-2">Latest Results</p>
          <div className="space-y-1">
            {mockRecentResults.map((result, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-800/30">
                <div className="flex items-center gap-2">
                  <BarChart3 className={`w-4 h-4 ${
                    result.status === 'good' ? 'text-emerald-400' :
                    result.status === 'warning' ? 'text-amber-400' :
                    'text-red-400'
                  }`} />
                  <span className="text-sm text-white">{result.business}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{result.issues} issues</span>
                  <Badge className={`text-xs ${
                    result.status === 'good' ? 'bg-emerald-500/20 text-emerald-400' :
                    result.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {result.score}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1 border-slate-700 text-slate-300 hover:bg-slate-800">
            <Download className="w-3 h-3" />
            Export All
          </Button>
          <Button variant="outline" size="sm" className="flex-1 gap-1 border-slate-700 text-slate-300 hover:bg-slate-800">
            <Eye className="w-3 h-3" />
            View All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
