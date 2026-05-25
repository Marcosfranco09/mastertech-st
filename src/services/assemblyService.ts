import { Assembly } from '@/types';

let assemblies: Assembly[] = [];

export async function fetchAssemblies(): Promise<Assembly[]> {
  return [...assemblies];
}

export async function createAssembly(data: Omit<Assembly, 'id'>): Promise<Assembly> {
  const newAssembly: Assembly = {
    ...data,
    id: "ENS-" + Math.floor(1000 + Math.random() * 9000),
  };
  assemblies = [newAssembly, ...assemblies];
  return newAssembly;
}

export async function updateAssembly(id: string, fields: Partial<Assembly>): Promise<Assembly> {
  const idx = assemblies.findIndex(a => a.id === id);
  if (idx === -1) throw new Error(`Assembly ${id} not found`);
  assemblies[idx] = { ...assemblies[idx], ...fields };
  return assemblies[idx];
}
