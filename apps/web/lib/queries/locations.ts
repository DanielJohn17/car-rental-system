import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// Types
export type Location = {
  id: string;
  name: string;
  address: string;
};

export type LocationListResponse = {
  data: Location[];
  total: number;
};

// Query keys
export const locationKeys = {
  all: ["locations"] as const,
  lists: () => [...locationKeys.all, "list"] as const,
  list: (filters: Record<string, any>) =>
    [...locationKeys.lists(), filters] as const,
  details: () => [...locationKeys.all, "detail"] as const,
  detail: (id: string) => [...locationKeys.details(), id] as const,
};

// API functions
const locationApi = {
  getLocations: async (
    params?: Record<string, any>,
  ): Promise<LocationListResponse | Location[]> => {
    const response = await apiClient.get<LocationListResponse | Location[]>(
      "/api/public/locations",
      params,
    );
    return response;
  },

  getLocation: async (id: string): Promise<Location> => {
    return apiClient.get<Location>(`/api/public/locations/${id}`);
  },
};

// Custom hooks
export const useLocations = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: locationKeys.list(params || {}),
    queryFn: () => locationApi.getLocations(params),
    staleTime: 5 * 60 * 1000, // 5 minutes - locations don't change often
  });
};

export const useLocation = (id: string) => {
  return useQuery({
    queryKey: locationKeys.detail(id),
    queryFn: () => locationApi.getLocation(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};
