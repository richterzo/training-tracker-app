export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          display_name: string | null
          group_id: string | null
          role: "admin" | "member"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          display_name?: string | null
          group_id?: string | null
          role?: "admin" | "member"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          display_name?: string | null
          group_id?: string | null
          role?: "admin" | "member"
          created_at?: string
          updated_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          group_id: string
          name: string
          category: "push" | "pull" | "legs" | "core" | "cardio" | "skills"
          description: string | null
          video_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          category: "push" | "pull" | "legs" | "core" | "cardio" | "skills"
          description?: string | null
          video_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          name?: string
          category?: "push" | "pull" | "legs" | "core" | "cardio" | "skills"
          description?: string | null
          video_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workout_templates: {
        Row: {
          id: string
          group_id: string
          name: string
          description: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          description?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          name?: string
          description?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      planned_workouts: {
        Row: {
          id: string
          group_id: string
          user_id: string
          template_id: string | null
          scheduled_date: string
          name: string
          notes: string | null
          location: string | null
          is_group_workout: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          template_id?: string | null
          scheduled_date: string
          name: string
          notes?: string | null
          location?: string | null
          is_group_workout?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          template_id?: string | null
          scheduled_date?: string
          name?: string
          notes?: string | null
          location?: string | null
          is_group_workout?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      workout_participants: {
        Row: {
          id: string
          planned_workout_id: string
          user_id: string
          status: "invited" | "confirmed" | "declined"
          created_at: string
        }
        Insert: {
          id?: string
          planned_workout_id: string
          user_id: string
          status?: "invited" | "confirmed" | "declined"
          created_at?: string
        }
        Update: {
          id?: string
          planned_workout_id?: string
          user_id?: string
          status?: "invited" | "confirmed" | "declined"
          created_at?: string
        }
      }
      completed_workouts: {
        Row: {
          id: string
          group_id: string
          user_id: string
          planned_workout_id: string | null
          name: string
          started_at: string
          completed_at: string | null
          duration_seconds: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          planned_workout_id?: string | null
          name: string
          started_at: string
          completed_at?: string | null
          duration_seconds?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          planned_workout_id?: string | null
          name?: string
          started_at?: string
          completed_at?: string | null
          duration_seconds?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      completed_sets: {
        Row: {
          id: string
          completed_workout_id: string
          exercise_id: string
          set_number: number
          reps: number | null
          weight: number | null
          duration_seconds: number | null
          completed_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          completed_workout_id: string
          exercise_id: string
          set_number: number
          reps?: number | null
          weight?: number | null
          duration_seconds?: number | null
          completed_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          completed_workout_id?: string
          exercise_id?: string
          set_number?: number
          reps?: number | null
          weight?: number | null
          duration_seconds?: number | null
          completed_at?: string
          notes?: string | null
        }
      }
    }
  }
}
