import { useEffect, useState } from 'react';

const STORAGE_KEY = 'fieldnotes.projects.v1';

function loadProjects() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return JSON.parse(saved);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
  } catch {
    return [];
  }
}

export function useProjects() {
  const [projects, setProjects] = useState(loadProjects);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch {
      // storage full / blocked — toast handled by caller if needed
    }
  }, [projects]);

  return [projects, setProjects];
}
