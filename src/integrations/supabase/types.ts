export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      game_players: {
        Row: {
          avatar: string
          created_at: string
          device_id: string | null
          drinks_taken: number
          id: string
          is_host: boolean
          is_ready: boolean | null
          last_active: string | null
          last_answer_time: string | null
          nickname: string
          room_id: string | null
          score: number
          streak: number
        }
        Insert: {
          avatar?: string
          created_at?: string
          device_id?: string | null
          drinks_taken?: number
          id?: string
          is_host?: boolean
          is_ready?: boolean | null
          last_active?: string | null
          last_answer_time?: string | null
          nickname: string
          room_id?: string | null
          score?: number
          streak?: number
        }
        Update: {
          avatar?: string
          created_at?: string
          device_id?: string | null
          drinks_taken?: number
          id?: string
          is_host?: boolean
          is_ready?: boolean | null
          last_active?: string | null
          last_answer_time?: string | null
          nickname?: string
          room_id?: string | null
          score?: number
          streak?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rooms: {
        Row: {
          created_at: string
          current_phase: string | null
          current_question_index: number
          expires_at: string
          game_type: string
          host_id: string | null
          id: string
          intensity: string
          question_order: string[] | null
          question_start_time: string | null
          room_code: string
          status: string
          total_questions: number | null
        }
        Insert: {
          created_at?: string
          current_phase?: string | null
          current_question_index?: number
          expires_at?: string
          game_type: string
          host_id?: string | null
          id?: string
          intensity?: string
          question_order?: string[] | null
          question_start_time?: string | null
          room_code: string
          status?: string
          total_questions?: number | null
        }
        Update: {
          created_at?: string
          current_phase?: string | null
          current_question_index?: number
          expires_at?: string
          game_type?: string
          host_id?: string | null
          id?: string
          intensity?: string
          question_order?: string[] | null
          question_start_time?: string | null
          room_code?: string
          status?: string
          total_questions?: number | null
        }
        Relationships: []
      }
      most_likely_players: {
        Row: {
          avatar: string
          created_at: string
          device_id: string
          id: string
          is_host: boolean
          is_ready: boolean
          last_active: string
          nickname: string
          room_id: string
          times_voted_differently: number
          total_votes_cast: number
          total_votes_received: number
        }
        Insert: {
          avatar?: string
          created_at?: string
          device_id: string
          id?: string
          is_host?: boolean
          is_ready?: boolean
          last_active?: string
          nickname: string
          room_id: string
          times_voted_differently?: number
          total_votes_cast?: number
          total_votes_received?: number
        }
        Update: {
          avatar?: string
          created_at?: string
          device_id?: string
          id?: string
          is_host?: boolean
          is_ready?: boolean
          last_active?: string
          nickname?: string
          room_id?: string
          times_voted_differently?: number
          total_votes_cast?: number
          total_votes_received?: number
        }
        Relationships: [
          {
            foreignKeyName: "most_likely_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "most_likely_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      most_likely_rooms: {
        Row: {
          created_at: string
          current_question_index: number
          expires_at: string
          host_id: string
          id: string
          question_order: string[]
          room_code: string
          status: string
          total_questions: number
        }
        Insert: {
          created_at?: string
          current_question_index?: number
          expires_at?: string
          host_id: string
          id?: string
          question_order?: string[]
          room_code: string
          status?: string
          total_questions?: number
        }
        Update: {
          created_at?: string
          current_question_index?: number
          expires_at?: string
          host_id?: string
          id?: string
          question_order?: string[]
          room_code?: string
          status?: string
          total_questions?: number
        }
        Relationships: []
      }
      most_likely_votes: {
        Row: {
          id: string
          question_index: number
          room_id: string
          submitted_at: string
          voted_for_id: string
          voter_id: string
        }
        Insert: {
          id?: string
          question_index: number
          room_id: string
          submitted_at?: string
          voted_for_id: string
          voter_id: string
        }
        Update: {
          id?: string
          question_index?: number
          room_id?: string
          submitted_at?: string
          voted_for_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "most_likely_votes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "most_likely_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "most_likely_votes_voted_for_id_fkey"
            columns: ["voted_for_id"]
            isOneToOne: false
            referencedRelation: "most_likely_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "most_likely_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "most_likely_players"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_redemptions: {
        Row: {
          created_at: string
          id: string
          is_redeemed: boolean
          offer_id: string
          redeemed_at: string | null
          redemption_code: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_redeemed?: boolean
          offer_id: string
          redeemed_at?: string | null
          redemption_code: string
        }
        Update: {
          created_at?: string
          id?: string
          is_redeemed?: boolean
          offer_id?: string
          redeemed_at?: string | null
          redemption_code?: string
        }
        Relationships: []
      }
      player_answers: {
        Row: {
          answer_index: number | null
          answer_time_ms: number | null
          created_at: string
          id: string
          is_correct: boolean
          player_id: string | null
          points_earned: number
          question_index: number
          room_id: string | null
          submitted_at: string | null
        }
        Insert: {
          answer_index?: number | null
          answer_time_ms?: number | null
          created_at?: string
          id?: string
          is_correct?: boolean
          player_id?: string | null
          points_earned?: number
          question_index: number
          room_id?: string | null
          submitted_at?: string | null
        }
        Update: {
          answer_index?: number | null
          answer_time_ms?: number | null
          created_at?: string
          id?: string
          is_correct?: boolean
          player_id?: string | null
          points_earned?: number
          question_index?: number
          room_id?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_answers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "game_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_answers_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_most_likely_room_code: { Args: never; Returns: string }
      generate_room_code: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
