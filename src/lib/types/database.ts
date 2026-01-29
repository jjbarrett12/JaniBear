export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          language_preference: 'en' | 'es';
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          language_preference?: 'en' | 'es';
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          language_preference?: 'en' | 'es';
          created_at?: string;
        };
      };
      org_members: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          role: 'owner' | 'manager' | 'inspector' | 'client_viewer';
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          role: 'owner' | 'manager' | 'inspector' | 'client_viewer';
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string;
          role?: 'owner' | 'manager' | 'inspector' | 'client_viewer';
          created_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          address: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          square_footage: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          square_footage?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          square_footage?: number | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      crews: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      templates: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      inspections: {
        Row: {
          id: string;
          org_id: string;
          location_id: string;
          template_id: string;
          schedule_id: string | null;
          inspector_user_id: string;
          started_at: string;
          completed_at: string | null;
          total_score: number | null;
          lat: number | null;
          lng: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          location_id: string;
          template_id: string;
          schedule_id?: string | null;
          inspector_user_id: string;
          started_at?: string;
          completed_at?: string | null;
          total_score?: number | null;
          lat?: number | null;
          lng?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          location_id?: string;
          template_id?: string;
          schedule_id?: string | null;
          inspector_user_id?: string;
          started_at?: string;
          completed_at?: string | null;
          total_score?: number | null;
          lat?: number | null;
          lng?: number | null;
          created_at?: string;
        };
      };
      issues: {
        Row: {
          id: string;
          org_id: string;
          location_id: string;
          inspection_id: string | null;
          inspection_response_id: string | null;
          title: string;
          description: string | null;
          severity: 'low' | 'med' | 'high';
          status: 'open' | 'in_progress' | 'resolved';
          assignee_user_id: string | null;
          due_at: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          location_id: string;
          inspection_id?: string | null;
          inspection_response_id?: string | null;
          title: string;
          description?: string | null;
          severity?: 'low' | 'med' | 'high';
          status?: 'open' | 'in_progress' | 'resolved';
          assignee_user_id?: string | null;
          due_at?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          location_id?: string;
          inspection_id?: string | null;
          inspection_response_id?: string | null;
          title?: string;
          description?: string | null;
          severity?: 'low' | 'med' | 'high';
          status?: 'open' | 'in_progress' | 'resolved';
          assignee_user_id?: string | null;
          due_at?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
      };
    };
  };
}
