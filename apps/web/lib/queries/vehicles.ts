import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api-client";

// Types
export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  color?: string | null;
  fuelType: string;
  transmission: string;
  seats: number;
  dailyRate: number;
  hourlyRate?: number | null;
  locationId: string;
  status: string;
  mileage: number;
  createdAt: string;
};

export type VehicleListResponse = {
  data: Vehicle[];
  total: number;
};

export type CreateVehicleData = {
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  color?: string;
  fuelType: string;
  transmission: string;
  seats: number;
  dailyRate: number;
  hourlyRate?: number;
  locationId: string;
  mileage?: number;
  images?: string[];
};

export type UpdateVehicleStatusData = {
  status: string;
};

// Query keys
export const vehicleKeys = {
  all: ["vehicles"] as const,
  lists: () => [...vehicleKeys.all, "list"] as const,
  list: (filters: Record<string, any>) =>
    [...vehicleKeys.lists(), filters] as const,
  details: () => [...vehicleKeys.all, "detail"] as const,
  detail: (id: string) => [...vehicleKeys.details(), id] as const,
};

// API functions
const vehicleApi = {
  getVehicles: async (
    params?: Record<string, any>,
  ): Promise<VehicleListResponse> => {
    return apiClient.get<VehicleListResponse>("/api/admin/vehicles", params);
  },

  getVehicle: async (id: string): Promise<Vehicle> => {
    return apiClient.get<Vehicle>(`/api/admin/vehicles/${id}`);
  },

  createVehicle: async (data: CreateVehicleData): Promise<Vehicle> => {
    return apiClient.post<Vehicle>("/api/admin/vehicles", data);
  },

  updateVehicle: async (
    id: string,
    data: Partial<CreateVehicleData>,
  ): Promise<Vehicle> => {
    return apiClient.put<Vehicle>(`/api/admin/vehicles/${id}`, data);
  },

  updateVehicleStatus: async (
    id: string,
    data: UpdateVehicleStatusData,
  ): Promise<Vehicle> => {
    return apiClient.put<Vehicle>(`/api/admin/vehicles/${id}/status`, data);
  },

  deleteVehicle: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/admin/vehicles/${id}`);
  },
};

// Custom hooks
export const useVehicles = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: vehicleKeys.list(params || {}),
    queryFn: () => vehicleApi.getVehicles(params),
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useVehicle = (id: string) => {
  return useQuery({
    queryKey: vehicleKeys.detail(id),
    queryFn: () => vehicleApi.getVehicle(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
};

export const useCreateVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVehicleData) => vehicleApi.createVehicle(data),
    onSuccess: () => {
      // Invalidate and refetch vehicles list
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
    },
  });
};

export const useUpdateVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateVehicleData>;
    }) => vehicleApi.updateVehicle(id, data),
    onSuccess: (_, variables) => {
      // Update the specific vehicle in cache
      queryClient.invalidateQueries({
        queryKey: vehicleKeys.detail(variables.id),
      });
      // Invalidate the list to refetch
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
    },
  });
};

export const useUpdateVehicleStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVehicleStatusData }) =>
      vehicleApi.updateVehicleStatus(id, data),
    onSuccess: (_, variables) => {
      // Update the specific vehicle in cache
      queryClient.invalidateQueries({
        queryKey: vehicleKeys.detail(variables.id),
      });
      // Invalidate the list to refetch
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
    },
  });
};

export const useDeleteVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vehicleApi.deleteVehicle(id),
    onSuccess: () => {
      // Invalidate and refetch vehicles list
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
    },
  });
};
