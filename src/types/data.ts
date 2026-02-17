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
  tests: { total: number | null; passed: number | null; files: number };
  security: {
    critical: number | null;
    high: number | null;
    moderate: number | null;
    low: number | null;
    total: number | null;
    prodCounts: {
      critical: number | null;
      high: number | null;
      moderate: number | null;
      low: number | null;
      total: number | null;
    };
    devCounts: {
      critical: number | null;
      high: number | null;
      moderate: number | null;
      low: number | null;
      total: number | null;
    };
    allowlistActive: number;
    policyCheckpoint: { date: string; maxModerate: number; maxLow: number } | null;
    status: string;
    source: string | null;
  };
  coverage: { statements: number | null; branches: number | null; functions: number | null; lines: number | null };
  lighthouse: { performance: number | null; accessibility: number | null; bestPractices: number | null; seo: number | null };
  a11y: {
    status: string;
    static: { pagesAudited: number | null; critical: number | null; serious: number | null; status: string };
    runtime: {
      pagesAudited: number | null;
      critical: number | null;
      serious: number | null;
      focusChecks: number | null;
      focusFailures: number | null;
      routesCovered: number | null;
      totalRoutes: number | null;
      coveragePct: number | null;
      status: string;
    };
  };
  performance: {
    routeBudgetsStatus: string;
    chunkBudgetsStatus: string;
    interactionBudgetsStatus: string;
    largestChunks: Array<{ chunk: string; gzipBytes: number }>;
    interactiveRouteJsTotals: Record<string, { scenario: string; rawBytes: number; gzipBytes: number; assetCount: number; assets: string[] }>;
    routeJsTotals: Record<string, { rawBytes: number; gzipBytes: number; assetCount: number; assets: string[] }>;
    source: string | null;
  };
  build: { pages: number; bundleFiles: number };
  sources: {
    tests: string;
    security: string;
    securityProd: string;
    coverage: string;
    lighthouse: string;
    a11yStatic: string;
    a11yRuntime: string;
    runtimeCoverage: string;
    e2eSmoke: string;
    performance: string;
    build: string;
  };
}
