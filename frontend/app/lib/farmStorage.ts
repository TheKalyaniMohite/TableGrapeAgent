/**
 * Helper functions for managing farm storage in localStorage
 */

export interface FarmListItem {
  id: string;
  label: string;
}

/**
 * Add a farm to the farms_list in localStorage
 * @param farmId - The farm ID
 * @param farmName - The farm name (or null/undefined for "My Farm")
 * @param locationInfo - Optional location info like "City, State, Country"
 */
export function addFarmToList(farmId: string, farmName: string | null | undefined, locationInfo?: string): void {
  const farmsList = getFarmsList();
  
  // Check if farm already exists
  const existingIndex = farmsList.findIndex(f => f.id === farmId);
  
  // Create label
  const name = farmName || 'My Farm';
  const label = locationInfo ? `${name} – ${locationInfo}` : name;
  
  if (existingIndex >= 0) {
    // Update existing
    farmsList[existingIndex].label = label;
  } else {
    // Add new
    farmsList.push({ id: farmId, label });
  }
  
  localStorage.setItem('farms_list', JSON.stringify(farmsList));
}

/**
 * Get the farms list from localStorage
 */
export function getFarmsList(): FarmListItem[] {
  const stored = localStorage.getItem('farms_list');
  if (!stored) {
    return [];
  }
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Remove a farm from the farms list
 */
export function removeFarmFromList(farmId: string): void {
  const farmsList = getFarmsList();
  const filtered = farmsList.filter(f => f.id !== farmId);
  localStorage.setItem('farms_list', JSON.stringify(filtered));
}






