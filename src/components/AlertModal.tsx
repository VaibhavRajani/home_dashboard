import { MBTAAlert } from "@/types/dashboard";
import { X, AlertTriangle, Clock, ExternalLink } from "lucide-react";

interface AlertModalProps {
  alerts: MBTAAlert[];
  isOpen: boolean;
  onClose: () => void;
}

export default function AlertModal({
  alerts,
  isOpen,
  onClose,
}: AlertModalProps) {
  if (!isOpen) return null;

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return "text-red-400";
    if (severity >= 5) return "text-orange-400";
    return "text-yellow-400";
  };

  const getSeverityIcon = (severity: number) => {
    if (severity >= 8) return "🚨";
    if (severity >= 5) return "⚠️";
    return "ℹ️";
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 via-yellow-900/20 to-slate-900 rounded-2xl shadow-2xl border border-yellow-500/30 max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">MBTA Alerts</h2>
              <p className="text-yellow-100 text-sm">Green Line C & D</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-yellow-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Active Alerts
              </h3>
              <p className="text-gray-400">
                Green Line C & D are running normally
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-xl p-4 border border-yellow-400/30"
                >
                  {/* Alert Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">
                        {getSeverityIcon(alert.severity)}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {alert.shortHeader || alert.header}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{alert.timeframe}</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`text-sm font-medium ${getSeverityColor(
                        alert.severity
                      )}`}
                    >
                      Severity {alert.severity}
                    </div>
                  </div>

                  {/* Alert Details */}
                  <div className="space-y-3">
                    {alert.serviceEffect && (
                      <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                        <div className="text-sm font-medium text-yellow-300 mb-1">
                          Service Effect
                        </div>
                        <div className="text-white">{alert.serviceEffect}</div>
                      </div>
                    )}

                    {alert.description && (
                      <div>
                        <div className="text-sm font-medium text-gray-300 mb-1">
                          Details
                        </div>
                        <div className="text-gray-400 text-sm leading-relaxed">
                          {alert.description}
                        </div>
                      </div>
                    )}

                    {alert.url && (
                      <a
                        href={alert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm">View More Information</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 px-6 py-3 border-t border-yellow-500/20">
          <p className="text-xs text-gray-400 text-center">
            Alerts are updated every 10 minutes • Last updated:{" "}
            {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}
