import { organColors } from '../data/organ-colors';
import { projectCatalog, type OrganKey } from '../data/project-catalog';

export interface NavigatorProject {
  slug: string;
  title: string;
}

export interface NavigatorOrgan {
  organ: OrganKey;
  label: string;
  count: number;
  projects: NavigatorProject[];
  color: string;
}

export interface ArchitectureNavigatorData {
  organs: NavigatorOrgan[];
}

const organLabels: Record<OrganKey, string> = {
  'ORGAN-I': 'Theoria',
  'ORGAN-II': 'Poiesis',
  'ORGAN-III': 'Ergon',
  'ORGAN-IV': 'Taxis/Orchestration',
  'ORGAN-V': 'Logos',
  'ORGAN-VI': 'Koinonia',
  'ORGAN-VII': 'Kerygma',
  'META-ORGANVM': 'Meta',
};

const organOrder = Object.keys(organColors) as OrganKey[];

export function buildArchitectureNavigatorData(): ArchitectureNavigatorData {
  const byOrgan = new Map<OrganKey, NavigatorProject[]>();

  for (const organ of organOrder) {
    byOrgan.set(organ, []);
  }

  for (const project of projectCatalog) {
    byOrgan.get(project.organ)?.push({
      slug: project.slug,
      title: project.title,
    });
  }

  return {
    organs: organOrder.map((organ) => ({
      organ,
      label: organLabels[organ],
      count: byOrgan.get(organ)?.length ?? 0,
      projects: byOrgan.get(organ) ?? [],
      color: organColors[organ],
    })),
  };
}
