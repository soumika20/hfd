import React from 'react';
import { IncidentAnalysis, InjuryDetail } from '../types';
import { 
  AlertTriangle, 
  Activity, 
  Zap, 
  Droplets, 
  Home, 
  Flame, 
  Stethoscope, 
  Waves,
  Timer
} from 'lucide-react';

interface AnalysisDisplayProps {
  data: IncidentAnalysis;
}

const SeverityBadge = ({ severity }: { severity: string }) => {
  const colors = {
    Minor: 'bg-green-100 text-green-800 border-green-200',
    Moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Severe: 'bg-orange-100 text-orange-800 border-orange-200',
    Critical: 'bg-red-100 text-red-800 border-red-200',
    Unknown: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  
  const colorClass = colors[severity as keyof typeof colors] || colors.Unknown;

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {severity}
    </span>
  );
};

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ data }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{data.incidentType}</h2>
            <p className="text-sm text-slate-500">Visual Incident Assessment</p>
          </div>
        </div>
        <p className="text-slate-700 leading-relaxed">{data.briefSummary}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-semibold">Injured / Affected</p>
                <p className="text-xl font-bold text-slate-900">{data.estimatedAffectedCount}</p>
            </div>
            
            <div className="p-3 bg-red-50 rounded-lg border border-red-100 col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-1">
                    <Timer className="w-4 h-4 text-red-600" />
                    <p className="text-xs text-red-800 uppercase font-bold">Critical Response Window</p>
                </div>
                <p className="text-lg font-bold text-red-900">{data.criticalResponseTime}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 col-span-2 md:col-span-1">
                <p className="text-xs text-slate-500 uppercase font-semibold">Likely Cause</p>
                <p className="text-base font-medium text-slate-900 truncate" title={data.likelyCause}>{data.likelyCause}</p>
            </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Injuries Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Injury Assessment</h3>
            </div>
            
            {data.injuries.length === 0 ? (
            <p className="text-slate-500 italic">No visible injuries detected.</p>
            ) : (
            <div className="grid md:grid-cols-2 gap-3">
                {data.injuries.map((injury: InjuryDetail, idx: number) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="p-2 bg-white rounded-md shadow-sm border border-slate-100 shrink-0">
                        <Stethoscope className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-800">{injury.bodyPart}</span>
                            <SeverityBadge severity={injury.severity} />
                        </div>
                        <p className="text-sm text-slate-600">{injury.description}</p>
                    </div>
                </div>
                ))}
            </div>
            )}
        </div>

        {/* Hazards & Environment Grid */}
        
        {/* Immediate Hazards - Always Visible */}
        <div className={`space-y-6 ${!data.isEnvironmentalContextRelevant ? 'md:col-span-2' : ''}`}>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full">
                <h3 className="text-sm font-bold uppercase tracking-wider text-red-600 mb-3">Immediate Hazards</h3>
                <ul className="space-y-2">
                    {data.immediateHazards.map((hazard, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                            {hazard}
                        </li>
                    ))}
                    {data.immediateHazards.length === 0 && <li className="text-sm text-slate-500">No immediate hazards identified.</li>}
                </ul>
            </div>
        </div>

        {/* Environment Status - Conditionally Visible */}
        {data.isEnvironmentalContextRelevant && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Home className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Disaster Context</h3>
                </div>
                
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-slate-700">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            <span>Electricity</span>
                        </div>
                        <span className={`text-sm font-medium ${data.environment.electricityAvailable === 'Likely' ? 'text-green-600' : 'text-red-600'}`}>
                            {data.environment.electricityAvailable}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-slate-700">
                            <Droplets className="w-4 h-4 text-blue-500" />
                            <span>Water Access</span>
                        </div>
                        <span className={`text-sm font-medium ${data.environment.waterAvailable === 'Likely' ? 'text-green-600' : 'text-red-600'}`}>
                            {data.environment.waterAvailable}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-slate-700">
                            <Home className="w-4 h-4 text-gray-500" />
                            <span>Damage Level</span>
                        </div>
                        <span className="text-sm font-medium text-slate-800">
                            {data.environment.infrastructureDamage}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className={`flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-medium ${data.environment.firePresence ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-400'}`}>
                            <Flame className="w-4 h-4" />
                            {data.environment.firePresence ? 'Fire Detected' : 'No Fire'}
                        </div>
                        <div className={`flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-medium ${data.environment.floodPresence ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-400'}`}>
                            <Waves className="w-4 h-4" />
                            {data.environment.floodPresence ? 'Flood Detected' : 'No Flood'}
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisDisplay;
