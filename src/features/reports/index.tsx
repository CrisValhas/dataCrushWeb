import { PageHeader } from '../../components/layout/PageHeader';

export function Reports() {
  return (
    <div>
      <PageHeader title="Reports Dashboard" description="Visualize key metrics from your events and funnels." />
      <div className="flex items-center gap-2 mb-4">
        <button className="bg-white text-slate-900 border">Export to CSV</button>
        <button>Export to PDF</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[{t:'Total Clicks',v:12345},{t:'Total Views',v:25678},{t:'Conversion Rate',v:'5.2%'}].map((c) => (
          <div key={c.t} className="bg-white rounded border p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded" />
            <div>
              <div className="text-slate-600 text-sm">{c.t}</div>
              <div className="text-2xl font-semibold">{c.v}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded border p-4 md:col-span-2">
          <div className="font-semibold mb-2">User Acquisition Funnel</div>
          <div className="h-64 grid place-items-center text-slate-400">Funnel Chart (stub)</div>
        </div>
        <div className="bg-white rounded border p-4">
          <div className="text-slate-600 mb-1">Overall Conversion Rate</div>
          <div className="text-3xl font-semibold">15%</div>
        </div>
      </div>
      <div className="bg-white rounded border p-4 mt-6">
        <div className="font-semibold mb-2">Advanced Reporting</div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">Looker Studio Integration — For in‑depth analysis.</p>
          <button>Abrir Looker Studio</button>
        </div>
      </div>
    </div>
  );
}
