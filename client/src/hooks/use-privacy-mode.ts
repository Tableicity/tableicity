import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function usePrivacyMode() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem("privacy-mode") === "true";
    } catch {
      return false;
    }
  });

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("privacy-mode", String(next));
      return next;
    });
  }, []);

  const { data: hashes = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/privacy/hashes"],
    enabled,
  });

  const { data: labels = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/privacy/labels"],
    enabled,
  });

  const updateLabelMutation = useMutation({
    mutationFn: async ({ stakeholderId, label }: { stakeholderId: string; label: string }) => {
      const res = await apiRequest("PATCH", `/api/privacy/labels/${stakeholderId}`, { label });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/privacy/labels"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Label update failed",
        description: error.message?.includes("403") ? "You don't have permission to edit labels." : "Could not save the label. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getDisplayName = useCallback(
    (stakeholderId: string, realName: string): string => {
      if (!enabled) return realName;
      const hash = hashes[stakeholderId];
      const label = labels[stakeholderId];
      if (label) return label;
      return hash || "0x••••...••••";
    },
    [enabled, hashes, labels]
  );

  return {
    enabled,
    toggle,
    hashes,
    labels,
    getDisplayName,
    updateLabel: updateLabelMutation.mutate,
    isUpdatingLabel: updateLabelMutation.isPending,
  };
}
