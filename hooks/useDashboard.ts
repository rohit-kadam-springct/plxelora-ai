import { useQuery, UseQueryResult } from "@tanstack/react-query";
import type {
  DashboardStatsResponse,
  RecentGenerationsResponse,
  UserPersonasResponse,
  UserStylesResponse,
} from "@/types/dashboard";

// Dashboard Stats Hook
export function useDashboardStats(): UseQueryResult<
  DashboardStatsResponse,
  Error
> {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStatsResponse> => {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Recent Generations Hook
export function useRecentGenerations(): UseQueryResult<
  RecentGenerationsResponse,
  Error
> {
  return useQuery({
    queryKey: ["recent-generations"],
    queryFn: async (): Promise<RecentGenerationsResponse> => {
      const response = await fetch("/api/generations/history?limit=5");
      if (!response.ok) {
        throw new Error("Failed to fetch recent generations");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// User Personas Hook
export function useUserPersonas(): UseQueryResult<UserPersonasResponse, Error> {
  return useQuery({
    queryKey: ["user-personas"],
    queryFn: async (): Promise<UserPersonasResponse> => {
      const response = await fetch("/api/personas");
      if (!response.ok) {
        throw new Error("Failed to fetch personas");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// User Styles Hook
export function useUserStyles(): UseQueryResult<UserStylesResponse, Error> {
  return useQuery({
    queryKey: ["user-styles"],
    queryFn: async (): Promise<UserStylesResponse> => {
      const response = await fetch("/api/styles");
      if (!response.ok) {
        throw new Error("Failed to fetch styles");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
