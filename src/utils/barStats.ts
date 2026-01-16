import type { GameType } from "@/types/game";

const API_BASE = import.meta.env.VITE_SUPABASE_URL || "";

export const recordBarGameStat = async (barId: string, gameType: GameType) => {
  if (!barId || !gameType) return;
  try {
    await fetch(`${API_BASE}/api/bar/${barId}/game-stats/${gameType}`, {
      method: "POST",
    });
  } catch (error) {
    console.error("Failed to record bar game stat:", error);
  }
};

export const recordBarAppEntry = async (barId: string) => {
  if (!barId) return;
  try {
    await fetch(`${API_BASE}/api/bar/${barId}/entry`, {
      method: "POST",
    });
  } catch (error) {
    console.error("Failed to record bar entry:", error);
  }
};
