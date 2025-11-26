export interface InjuryDetail {
  bodyPart: string;
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Critical' | 'Unknown';
  description: string;
}

export interface EnvironmentalStatus {
  electricityAvailable: 'Likely' | 'Unlikely' | 'Unknown';
  waterAvailable: 'Likely' | 'Unlikely' | 'Unknown';
  infrastructureDamage: 'None' | 'Minor' | 'Major' | 'Catastrophic';
  firePresence: boolean;
  floodPresence: boolean;
}

export interface IncidentAnalysis {
  incidentType: string;
  briefSummary: string;
  estimatedAffectedCount: number;
  likelyCause: string;
  injuries: InjuryDetail[];
  environment: EnvironmentalStatus;
  isEnvironmentalContextRelevant: boolean;
  immediateHazards: string[];
  criticalResponseTime: string;
}

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  data: IncidentAnalysis | null;
}
