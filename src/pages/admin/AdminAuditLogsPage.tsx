import React, { useEffect, useState } from 'react';
import { History, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import { AuditLog } from '../../types/database';
import { getAuditLogsAdmin } from '../../services/api';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getAuditLogsAdmin();
        setLogs(data);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Audit Trail & Compliance Logs</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable ledger of inventory status transitions, pricing changes, and administrative actions.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 mx-auto mb-2" />
            Loading audit records...
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-4">Entity Type</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-6">State Transition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-800 capitalize">
                      {log.entity_type}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {log.actor?.full_name || 'Staff User'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {log.previous_data ? JSON.stringify(log.previous_data) : 'initial'}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                          {log.new_data ? JSON.stringify(log.new_data) : 'updated'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            No audit log entries recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};
