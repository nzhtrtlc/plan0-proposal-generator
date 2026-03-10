export type FormState = {
  projectName: string;
  address: string;
  billingEntity: string;
  date: string;
  clientEmail: string;
  clientName: string;
  clientCompanyName: string;
  clientPosition: string;
  clientCompanyAddress: string;
  assetClass: string;
  projectDescription: string;
  proposedMandates: ProposedMandate[];
  listOfServices: string[];
  fee: FeeSummary;
  bios: Bio[];
  notes: string;
  signatures: Staff[];
};

export type Bio = {
  id: string;
  name: string;
};

export type Staff = {
  id: string;
  name: string;
  surname: string;
};

export type StaffWithRate = {
  id: string;
  name: string;
  surname: string;
  rate: number;
};

export type ProposedMandate = "Estimating" | "Proforma";

export type FeeLine = {
  id: string;
  staffId: string;
  staffName: string;
  hours: number;
  rate: number;
  lineTotal: number;
};

export type MandateSection = {
  lines: FeeLine[];
  suggestedFee: number | null;
};

export type FeeSummary = {
  sections: Record<string, MandateSection>;
  total: number;
};

export type GenerateProposalPayload = {
  projectName: string;
  billingEntity: string;
  date: string;
  clientEmail: string;
  clientName: string;
  clientCompanyName: string;
  clientPosition: string;
  clientCompanyAddress: string;
  assetClass: string;
  projectDescription: string;
  address: string;
  fee: FeeSummary;
  proposedMandates: ProposedMandate[];
  listOfServices: string[];
  bios: string[]; // array of bio IDs
  notes: string;
  signatures: string[]; // array of staff IDs
};

export type Mandate = {
  id: string;
  name: ProposedMandate;
  defaultRate: number;
};


export enum Division {
  key_cost_consulting_staff = "KEY COST CONSULTING STAFF",
  development_cost_monitoring = "DEVELOPMENT & COST MONITORING",
  cost_estimating = "COST ESTIMATING"
}