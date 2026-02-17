/** Typed interfaces for the JSON data files in src/data/ */

export interface Organ {
  name: string;
  status: string;
  total_repos: number;
  implementation_status: Record<string, number>;
  tier_distribution: Record<string, number>;
  ci_coverage: number;
}

export interface FlagshipRepo {
  org: string;
  repo: string;
  classification: string;
  code_files: number;
  test_files: number;
}

export interface Sprint {
  name: string;
  date: string;
  focus: string;
  deliverables: string;
}

export interface PraxisTarget {
  current: string | number;
  target: string | number;
  met?: boolean;
}

export interface SystemMetrics {
  generated: string;
  sprint: string;
  system: { name: string; launch_date: string; project_status: string };
  registry: {
    total_repos: number;
    total_organs: number;
    operational_organs: number;
    implementation_status: Record<string, number>;
    tier_distribution: Record<string, number>;
    promotion_status: Record<string, number>;
    ci_coverage: number;
    dependency_edges: number;
    organs: Record<string, Organ>;
  };
  code_substance: {
    total_code_files: number;
    total_test_files: number;
    ci_passing: number;
  };
  flagship_vivification: {
    total_audited: number;
    classifications: Record<string, number>;
    repos: FlagshipRepo[];
  };
  sprint_history: Sprint[];
  praxis_targets: Record<string, PraxisTarget>;
  essays: { total: number };
}

export interface Essay {
  path: string;
  filename: string;
  date: string;
  slug: string;
  title: string;
  url: string;
}

export interface EssayData {
  total: number;
  essays: Essay[];
  feed_url: string;
  site_url: string;
}

export interface GraphNode {
  id: string;
  organ: string;
  [key: string]: unknown;
}

export interface GraphEdge {
  source: string;
  target: string;
  [key: string]: unknown;
}

export interface GraphData {
  total_nodes: number;
  total_edges: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface QualityMetrics {
  generated: string;
  tests: { total: number; passed: number; files: number };
  coverage: { statements: number; branches: number; functions: number; lines: number };
  lighthouse: { performance: number; accessibility: number; bestPractices: number; seo: number };
  a11y: { pagesAudited: number; critical: number; serious: number; status: string };
  build: { pages: number; bundleFiles: number };
}
