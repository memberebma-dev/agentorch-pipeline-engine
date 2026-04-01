/**
 * AuditRunner - Run SEO audits on leads
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Check, Clock, Play, AlertCircle, ExternalLink, BarChart3 } from 'lucide-react';

const mockLeads = [
  { id: '1', business: 'Pacific Bridge Capital', website: 'pacificbridge.com', score: 92 },
  { id: '2', business: 'Coastal Lending Group', website: 'coastallending.com', score: 87 },
  { id: '3', business: 'Sunset Financial', website: 'sunsetfinancial.com', score: 78 },
  { id: '4', business: 'Apex Commercial', website: 'apexcommercial.com', score: 71 },
];

const auditTypes = [
  { id: 'website', name: 'Website Audit', description: 'Technical issues, speed, mobile', enabled: true },
  { id: 'seo', name: 'SEO Analysis', description: 'Keywords, rankings, visibility', enabled: true },
  { id: 'gmb', name: 'Google Business', description: 'Profile optimization, reviews', enabled: false },
  { id: 'competitive', name: 'Competitive', description: 'Competitor analysis', enabled: false },
];

export function AuditRunner() {
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleRunAudit = async () => {
    if (!selectedLead) return;
    
    setIsRunning(true);
    setResults(null);
    
    // Simulate audit
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setResults({
      overallScore: 78,
      websiteScore: 82,
      seoScore: 75,
      issues: 5,
      recommendations: 12,
    });
    
    setIsRunning(false);
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">SEO Audit Runner</CardTitle>
          <Badge className="bg-teal-500/20 text-teal-400">
            <Search className="w-3 h-3 mr-1" />
            Quick Audit
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lead Selection */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Select Lead</label>
          <select 
            value={selectedLead}
            onChange={(e) => setSelectedLead(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
          >
            <option value="">Choose a lead...</option>
            {mockLeads.map(lead => (
              <option key={lead.id} value={lead.id}>
                {lead.business} ({lead.website})
              </option>
            ))}
          </select>
        </div>

        {/* Audit Types */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Audit Types</label>
          <div className="space-y-2">
            {auditTypes.map((type) => (
              <label
                key={type.id}
                className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                  type.enabled 
                    ? 'bg-teal-500/10 border-teal-500/30' 
                    : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
                }`}
              >
                <input 
                  type="checkbox" 
                  defaultChecked={type.enabled}
                  className="rounded text-teal-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{type.name}</p>
                  <p className="text-xs text-slate-500">{type.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Keywords */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Target Keywords (comma separated)</label>
          <Input 
            placeholder="commercial bridge lender, hard money loan..."
            defaultValue="commercial bridge lender, hard money loans, private money lending"
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>

        {/* Run Button */}
        <Button 
          onClick={handleRunAudit}
          disabled={isRunning || !selectedLead}
          className="w-full bg-teal-600 hover:bg-teal-500 gap-2"
        >
          {isRunning ? (
            <>
              <Clock className="w-4 h-4 animate-spin" />
              Running Audit...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Audit
            </>
          )}
        </Button>

        {/* Results */}
        {results && (
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-white">Audit Results</p>
              <Badge className="bg-amber-500/20 text-amber-400">
                {results.overallScore}/100
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2 rounded bg-slate-700/50">
                <p className="text-xs text-slate-400">Website</p>
                <p className="text-lg font-bold text-white">{results.websiteScore}</p>
              </div>
              <div className="p-2 rounded bg-slate-700/50">
                <p className="text-xs text-slate-400">SEO</p>
                <p className="text-lg font-bold text-white">{results.seoScore}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-red-400">{results.issues} issues</span>
              <span className="text-teal-400">{results.recommendations} recommendations</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
