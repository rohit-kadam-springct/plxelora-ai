import { useQuery } from "@tanstack/react-query";

export function useUserCredits() {
  return useQuery({
    queryKey: ["user-credits"],
    queryFn: async () => {
      const response = await fetch("/api/user/credits");
      if (!response.ok) throw new Error("Failed to fetch credits");
      return response.json();
    },
    staleTime: 1000 * 30, // 30 seconds - refresh frequently for credits
    refetchInterval: 60000, // Auto-refetch every minute
  });
}
