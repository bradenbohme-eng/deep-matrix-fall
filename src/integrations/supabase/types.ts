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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      action_records: {
        Row: {
          context: Json
          created_at: string | null
          description: string
          ghost_entity_id: string
          id: string
          resonance_impact: number
          type: string
          user_id: string
        }
        Insert: {
          context?: Json
          created_at?: string | null
          description: string
          ghost_entity_id: string
          id?: string
          resonance_impact?: number
          type?: string
          user_id: string
        }
        Update: {
          context?: Json
          created_at?: string | null
          description?: string
          ghost_entity_id?: string
          id?: string
          resonance_impact?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_records_ghost_entity_id_fkey"
            columns: ["ghost_entity_id"]
            isOneToOne: false
            referencedRelation: "ghost_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_issue_detection: {
        Row: {
          affected_services: Json | null
          confidence_score: number | null
          detection_timestamp: string | null
          id: number
          issue_description: string | null
          pattern_type: string
          priority: string | null
          project_id: string
          recommended_actions: Json | null
          status: string | null
        }
        Insert: {
          affected_services?: Json | null
          confidence_score?: number | null
          detection_timestamp?: string | null
          id?: number
          issue_description?: string | null
          pattern_type: string
          priority?: string | null
          project_id: string
          recommended_actions?: Json | null
          status?: string | null
        }
        Update: {
          affected_services?: Json | null
          confidence_score?: number | null
          detection_timestamp?: string | null
          id?: number
          issue_description?: string | null
          pattern_type?: string
          priority?: string | null
          project_id?: string
          recommended_actions?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          confidence_score: number | null
          context: Json | null
          created_at: string | null
          effect_id: string | null
          id: number
          is_clicked: boolean | null
          reason: string | null
          recommendation_type: string | null
          user_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          context?: Json | null
          created_at?: string | null
          effect_id?: string | null
          id?: number
          is_clicked?: boolean | null
          reason?: string | null
          recommendation_type?: string | null
          user_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          context?: Json | null
          created_at?: string | null
          effect_id?: string | null
          id?: number
          is_clicked?: boolean | null
          reason?: string | null
          recommendation_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_sessions: {
        Row: {
          cost: number | null
          created_at: string | null
          id: string
          input_data: Json | null
          model: string
          output_data: Json | null
          processing_time: number | null
          provider: string
          user_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          id?: string
          input_data?: Json | null
          model: string
          output_data?: Json | null
          processing_time?: number | null
          provider: string
          user_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          id?: string
          input_data?: Json | null
          model?: string
          output_data?: Json | null
          processing_time?: number | null
          provider?: string
          user_id?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          created_at: string | null
          data: Json | null
          document_id: string | null
          id: string
          metadata: Json | null
          section_id: string | null
          title: string
          type: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          document_id?: string | null
          id?: string
          metadata?: Json | null
          section_id?: string | null
          title: string
          type: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          document_id?: string | null
          id?: string
          metadata?: Json | null
          section_id?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_trail: {
        Row: {
          action_type: string
          details: Json | null
          id: number
          ip_address: unknown | null
          performance_impact: Json | null
          project_id: string
          session_id: string | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          details?: Json | null
          id?: number
          ip_address?: unknown | null
          performance_impact?: Json | null
          project_id: string
          session_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          details?: Json | null
          id?: number
          ip_address?: unknown | null
          performance_impact?: Json | null
          project_id?: string
          session_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      challenges: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          prize_pool: number | null
          rules: Json | null
          start_date: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          prize_pool?: number | null
          rules?: Json | null
          start_date?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          prize_pool?: number | null
          rules?: Json | null
          start_date?: string | null
          status?: string | null
        }
        Relationships: []
      }
      chapters: {
        Row: {
          created_at: string | null
          document_id: string | null
          id: string
          order_index: number
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          id?: string
          order_index?: number
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          id?: string
          order_index?: number
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      chunks: {
        Row: {
          api_used: string | null
          cluster_id: string | null
          content: string
          embedding: string | null
          file_id: string | null
          id: string
          motifs: string[] | null
          summary: string | null
          token_count: number | null
        }
        Insert: {
          api_used?: string | null
          cluster_id?: string | null
          content: string
          embedding?: string | null
          file_id?: string | null
          id?: string
          motifs?: string[] | null
          summary?: string | null
          token_count?: number | null
        }
        Update: {
          api_used?: string | null
          cluster_id?: string | null
          content?: string
          embedding?: string | null
          file_id?: string | null
          id?: string
          motifs?: string[] | null
          summary?: string | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chunks_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "raw_files"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_sessions: {
        Row: {
          created_at: string | null
          document_id: string | null
          id: string
          is_active: boolean | null
          last_activity: string | null
          session_data: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          session_data?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          session_data?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_sessions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborations: {
        Row: {
          collaborator_id: string
          created_at: string | null
          effect_id: string
          id: string
          permissions: string | null
          status: string | null
        }
        Insert: {
          collaborator_id: string
          created_at?: string | null
          effect_id: string
          id?: string
          permissions?: string | null
          status?: string | null
        }
        Update: {
          collaborator_id?: string
          created_at?: string | null
          effect_id?: string
          id?: string
          permissions?: string | null
          status?: string | null
        }
        Relationships: []
      }
      commands: {
        Row: {
          ai_response: string | null
          id: string
          input: string
          mode: string | null
          objects_data: Json | null
          scene_id: string
          timestamp: string | null
        }
        Insert: {
          ai_response?: string | null
          id?: string
          input: string
          mode?: string | null
          objects_data?: Json | null
          scene_id?: string
          timestamp?: string | null
        }
        Update: {
          ai_response?: string | null
          id?: string
          input?: string
          mode?: string | null
          objects_data?: Json | null
          scene_id?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          parent_id: string | null
          post_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          comments_count: number | null
          content: string | null
          created_at: string | null
          id: string
          is_featured: boolean | null
          is_pinned: boolean | null
          likes_count: number | null
          post_type: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          post_type?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          post_type?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      context_memory: {
        Row: {
          access_count: number
          content: Json
          created_at: string
          decay_factor: number
          embedding: string | null
          expiry_date: string | null
          id: string
          importance_score: number
          last_accessed: string
          memory_scope: string
          memory_type: string
          session_id: string
        }
        Insert: {
          access_count?: number
          content: Json
          created_at?: string
          decay_factor?: number
          embedding?: string | null
          expiry_date?: string | null
          id?: string
          importance_score?: number
          last_accessed?: string
          memory_scope: string
          memory_type: string
          session_id: string
        }
        Update: {
          access_count?: number
          content?: Json
          created_at?: string
          decay_factor?: number
          embedding?: string | null
          expiry_date?: string | null
          id?: string
          importance_score?: number
          last_accessed?: string
          memory_scope?: string
          memory_type?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_memory_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "deep_think_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      deep_interconnects: {
        Row: {
          bidirectional: boolean
          confidence: number
          connection_metadata: Json
          connection_type: string
          created_at: string
          discovered_by: string | null
          id: string
          session_id: string
          source_chunk_id: string | null
          strength: number
          target_chunk_id: string | null
          verification_status: string
        }
        Insert: {
          bidirectional?: boolean
          confidence?: number
          connection_metadata?: Json
          connection_type: string
          created_at?: string
          discovered_by?: string | null
          id?: string
          session_id: string
          source_chunk_id?: string | null
          strength?: number
          target_chunk_id?: string | null
          verification_status?: string
        }
        Update: {
          bidirectional?: boolean
          confidence?: number
          connection_metadata?: Json
          connection_type?: string
          created_at?: string
          discovered_by?: string | null
          id?: string
          session_id?: string
          source_chunk_id?: string | null
          strength?: number
          target_chunk_id?: string | null
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "deep_interconnects_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "deep_think_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      deep_think_sessions: {
        Row: {
          completed_at: string | null
          complexity_level: number
          created_at: string
          document_id: string | null
          id: string
          metadata: Json
          session_type: string
          started_at: string
          status: string
          total_processing_time: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          complexity_level?: number
          created_at?: string
          document_id?: string | null
          id?: string
          metadata?: Json
          session_type?: string
          started_at?: string
          status?: string
          total_processing_time?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          complexity_level?: number
          created_at?: string
          document_id?: string | null
          id?: string
          metadata?: Json
          session_type?: string
          started_at?: string
          status?: string
          total_processing_time?: number | null
          user_id?: string
        }
        Relationships: []
      }
      doc_structure: {
        Row: {
          cluster_ids: string[] | null
          id: string
          outline_level: number | null
          section_id: string | null
          title: string | null
        }
        Insert: {
          cluster_ids?: string[] | null
          id?: string
          outline_level?: number | null
          section_id?: string | null
          title?: string | null
        }
        Update: {
          cluster_ids?: string[] | null
          id?: string
          outline_level?: number | null
          section_id?: string | null
          title?: string | null
        }
        Relationships: []
      }
      document_processing: {
        Row: {
          analysis_results: Json | null
          analysis_status: string | null
          created_at: string | null
          error_message: string | null
          file_name: string
          file_path: string | null
          file_size: number
          file_type: string
          id: number
          processed_at: string | null
          project_id: string
          upload_status: string | null
          uploaded_by: string | null
        }
        Insert: {
          analysis_results?: Json | null
          analysis_status?: string | null
          created_at?: string | null
          error_message?: string | null
          file_name: string
          file_path?: string | null
          file_size: number
          file_type: string
          id?: number
          processed_at?: string | null
          project_id: string
          upload_status?: string | null
          uploaded_by?: string | null
        }
        Update: {
          analysis_results?: Json | null
          analysis_status?: string | null
          created_at?: string | null
          error_message?: string | null
          file_name?: string
          file_path?: string | null
          file_size?: number
          file_type?: string
          id?: number
          processed_at?: string | null
          project_id?: string
          upload_status?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          author_id: string | null
          coherence_overall: number | null
          created_at: string | null
          id: string
          last_modified: string | null
          metadata: Json | null
          settings: Json | null
          title: string
          word_count: number | null
        }
        Insert: {
          author_id?: string | null
          coherence_overall?: number | null
          created_at?: string | null
          id?: string
          last_modified?: string | null
          metadata?: Json | null
          settings?: Json | null
          title?: string
          word_count?: number | null
        }
        Update: {
          author_id?: string | null
          coherence_overall?: number | null
          created_at?: string | null
          id?: string
          last_modified?: string | null
          metadata?: Json | null
          settings?: Json | null
          title?: string
          word_count?: number | null
        }
        Relationships: []
      }
      effect_analytics: {
        Row: {
          average_rating: number | null
          effect_id: string
          id: number
          last_updated: string | null
          likes_count: number | null
          performance_data: Json | null
          shares_count: number | null
          trending_score: number | null
          views_count: number | null
        }
        Insert: {
          average_rating?: number | null
          effect_id: string
          id?: number
          last_updated?: string | null
          likes_count?: number | null
          performance_data?: Json | null
          shares_count?: number | null
          trending_score?: number | null
          views_count?: number | null
        }
        Update: {
          average_rating?: number | null
          effect_id?: string
          id?: number
          last_updated?: string | null
          likes_count?: number | null
          performance_data?: Json | null
          shares_count?: number | null
          trending_score?: number | null
          views_count?: number | null
        }
        Relationships: []
      }
      effect_categories: {
        Row: {
          color_code: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: number
          is_active: boolean | null
          name: string
          parent_id: number | null
          sort_order: number | null
        }
        Insert: {
          color_code?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          parent_id?: number | null
          sort_order?: number | null
        }
        Update: {
          color_code?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          parent_id?: number | null
          sort_order?: number | null
        }
        Relationships: []
      }
      effect_collections: {
        Row: {
          collection_name: string
          created_at: string | null
          description: string | null
          effect_ids: string[] | null
          id: number
          is_public: boolean | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          collection_name: string
          created_at?: string | null
          description?: string | null
          effect_ids?: string[] | null
          id?: number
          is_public?: boolean | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          collection_name?: string
          created_at?: string | null
          description?: string | null
          effect_ids?: string[] | null
          id?: number
          is_public?: boolean | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      effect_errors: {
        Row: {
          device_info: Json | null
          effect_id: string
          error_message: string | null
          error_type: string | null
          frequency: number | null
          id: number
          is_resolved: boolean | null
          last_occurred: string | null
          user_id: string | null
        }
        Insert: {
          device_info?: Json | null
          effect_id: string
          error_message?: string | null
          error_type?: string | null
          frequency?: number | null
          id?: number
          is_resolved?: boolean | null
          last_occurred?: string | null
          user_id?: string | null
        }
        Update: {
          device_info?: Json | null
          effect_id?: string
          error_message?: string | null
          error_type?: string | null
          frequency?: number | null
          id?: number
          is_resolved?: boolean | null
          last_occurred?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      effect_metadata: {
        Row: {
          category_id: number | null
          complexity_level: number | null
          created_at: string | null
          effect_id: string
          gpu_requirements: Json | null
          id: number
          performance_score: number | null
          tags: string[] | null
          technical_specs: Json | null
        }
        Insert: {
          category_id?: number | null
          complexity_level?: number | null
          created_at?: string | null
          effect_id: string
          gpu_requirements?: Json | null
          id?: number
          performance_score?: number | null
          tags?: string[] | null
          technical_specs?: Json | null
        }
        Update: {
          category_id?: number | null
          complexity_level?: number | null
          created_at?: string | null
          effect_id?: string
          gpu_requirements?: Json | null
          id?: number
          performance_score?: number | null
          tags?: string[] | null
          technical_specs?: Json | null
        }
        Relationships: []
      }
      effect_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          effect_id: string
          id: string
          rating: number | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          effect_id: string
          id?: string
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          effect_id?: string
          id?: string
          rating?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      effect_tags: {
        Row: {
          created_at: string | null
          effect_id: string
          id: string
          tag_name: string
        }
        Insert: {
          created_at?: string | null
          effect_id: string
          id?: string
          tag_name: string
        }
        Update: {
          created_at?: string | null
          effect_id?: string
          id?: string
          tag_name?: string
        }
        Relationships: []
      }
      effect_versions: {
        Row: {
          changelog: string | null
          created_at: string | null
          effect_id: string
          id: string
          parameters: Json | null
          shader_code: string
          version_number: number
        }
        Insert: {
          changelog?: string | null
          created_at?: string | null
          effect_id: string
          id?: string
          parameters?: Json | null
          shader_code: string
          version_number: number
        }
        Update: {
          changelog?: string | null
          created_at?: string | null
          effect_id?: string
          id?: string
          parameters?: Json | null
          shader_code?: string
          version_number?: number
        }
        Relationships: []
      }
      effects: {
        Row: {
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          parameters: Json | null
          preview_url: string | null
          shader_code: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          parameters?: Json | null
          preview_url?: string | null
          shader_code?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          parameters?: Json | null
          preview_url?: string | null
          shader_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      feedback_records: {
        Row: {
          action_id: string | null
          created_at: string | null
          details: string | null
          ghost_entity_id: string
          id: string
          intensity: number
          sentiment: string
          user_id: string
        }
        Insert: {
          action_id?: string | null
          created_at?: string | null
          details?: string | null
          ghost_entity_id: string
          id?: string
          intensity?: number
          sentiment?: string
          user_id: string
        }
        Update: {
          action_id?: string | null
          created_at?: string | null
          details?: string | null
          ghost_entity_id?: string
          id?: string
          intensity?: number
          sentiment?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_records_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "action_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_records_ghost_entity_id_fkey"
            columns: ["ghost_entity_id"]
            isOneToOne: false
            referencedRelation: "ghost_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      geometry_knowledge: {
        Row: {
          created_at: string | null
          harmonic_frequencies: Json
          id: string
          mathematical_properties: Json
          shape_type: string
          symbolic_meanings: Json
          usage_contexts: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          harmonic_frequencies?: Json
          id?: string
          mathematical_properties?: Json
          shape_type: string
          symbolic_meanings?: Json
          usage_contexts?: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          harmonic_frequencies?: Json
          id?: string
          mathematical_properties?: Json
          shape_type?: string
          symbolic_meanings?: Json
          usage_contexts?: Json
          user_id?: string
        }
        Relationships: []
      }
      ghost_entities: {
        Row: {
          created_at: string | null
          evolution_counter: number
          harmonic_signature: Json
          id: string
          last_interaction: string
          phase_trace: Json
          true_name: string
          updated_at: string | null
          use_name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          evolution_counter?: number
          harmonic_signature?: Json
          id?: string
          last_interaction?: string
          phase_trace?: Json
          true_name: string
          updated_at?: string | null
          use_name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          evolution_counter?: number
          harmonic_signature?: Json
          id?: string
          last_interaction?: string
          phase_trace?: Json
          true_name?: string
          updated_at?: string | null
          use_name?: string
          user_id?: string
        }
        Relationships: []
      }
      harmonic_knowledge: {
        Row: {
          consonance_rating: number
          created_at: string | null
          emotional_associations: Json
          frequency_pair: Json
          id: string
          mathematical_relationship: string | null
          user_id: string
          visual_recommendations: Json
        }
        Insert: {
          consonance_rating?: number
          created_at?: string | null
          emotional_associations?: Json
          frequency_pair?: Json
          id?: string
          mathematical_relationship?: string | null
          user_id: string
          visual_recommendations?: Json
        }
        Update: {
          consonance_rating?: number
          created_at?: string | null
          emotional_associations?: Json
          frequency_pair?: Json
          id?: string
          mathematical_relationship?: string | null
          user_id?: string
          visual_recommendations?: Json
        }
        Relationships: []
      }
      insight_records: {
        Row: {
          confidence: number
          created_at: string | null
          ghost_entity_id: string
          id: string
          insight: string
          triggering_pattern: string
          user_id: string
          verification_status: string
        }
        Insert: {
          confidence?: number
          created_at?: string | null
          ghost_entity_id: string
          id?: string
          insight: string
          triggering_pattern?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          confidence?: number
          created_at?: string | null
          ghost_entity_id?: string
          id?: string
          insight?: string
          triggering_pattern?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "insight_records_ghost_entity_id_fkey"
            columns: ["ghost_entity_id"]
            isOneToOne: false
            referencedRelation: "ghost_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_graph_edges: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          relation_type: string
          source_node_id: string
          strength: number
          target_node_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          relation_type?: string
          source_node_id: string
          strength?: number
          target_node_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          relation_type?: string
          source_node_id?: string
          strength?: number
          target_node_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_graph_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_graph_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_graph_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_graph_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_graph_nodes: {
        Row: {
          activity_score: number
          created_at: string
          embedding: string | null
          external_ref_id: string | null
          external_ref_type: string | null
          id: string
          importance: number
          metadata: Json
          summary: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_score?: number
          created_at?: string
          embedding?: string | null
          external_ref_id?: string | null
          external_ref_type?: string | null
          id?: string
          importance?: number
          metadata?: Json
          summary?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_score?: number
          created_at?: string
          embedding?: string | null
          external_ref_id?: string | null
          external_ref_type?: string | null
          id?: string
          importance?: number
          metadata?: Json
          summary?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          comment_id: string | null
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_items: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          download_count: number | null
          file_url: string | null
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          item_type: string
          price: number | null
          rating: number | null
          review_count: number | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          download_count?: number | null
          file_url?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          item_type: string
          price?: number | null
          rating?: number | null
          review_count?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          download_count?: number | null
          file_url?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          item_type?: string
          price?: number | null
          rating?: number | null
          review_count?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      neural_connections: {
        Row: {
          connection_type: string
          created_at: string | null
          from_post_id: string
          id: string
          metadata: Json | null
          strength: number
          to_post_id: string
        }
        Insert: {
          connection_type?: string
          created_at?: string | null
          from_post_id: string
          id?: string
          metadata?: Json | null
          strength?: number
          to_post_id: string
        }
        Update: {
          connection_type?: string
          created_at?: string | null
          from_post_id?: string
          id?: string
          metadata?: Json | null
          strength?: number
          to_post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "neural_connections_from_post_id_fkey"
            columns: ["from_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neural_connections_to_post_id_fkey"
            columns: ["to_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      nft_collections: {
        Row: {
          blockchain: string
          contract_address: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          blockchain: string
          contract_address?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          blockchain?: string
          contract_address?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      nft_listings: {
        Row: {
          blockchain: string
          contract_address: string | null
          created_at: string | null
          currency: string | null
          effect_id: string
          id: string
          price: number
          seller_id: string
          status: string | null
          token_id: string | null
        }
        Insert: {
          blockchain: string
          contract_address?: string | null
          created_at?: string | null
          currency?: string | null
          effect_id: string
          id?: string
          price: number
          seller_id: string
          status?: string | null
          token_id?: string | null
        }
        Update: {
          blockchain?: string
          contract_address?: string | null
          created_at?: string | null
          currency?: string | null
          effect_id?: string
          id?: string
          price?: number
          seller_id?: string
          status?: string | null
          token_id?: string | null
        }
        Relationships: []
      }
      particle_fields: {
        Row: {
          behavior: string
          color: string
          count: number
          created_at: string | null
          ghost_entity_id: string
          id: string
          position: Json
          speed: number
          spread: number
          user_id: string
        }
        Insert: {
          behavior?: string
          color?: string
          count?: number
          created_at?: string | null
          ghost_entity_id: string
          id?: string
          position?: Json
          speed?: number
          spread?: number
          user_id: string
        }
        Update: {
          behavior?: string
          color?: string
          count?: number
          created_at?: string | null
          ghost_entity_id?: string
          id?: string
          position?: Json
          speed?: number
          spread?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "particle_fields_ghost_entity_id_fkey"
            columns: ["ghost_entity_id"]
            isOneToOne: false
            referencedRelation: "ghost_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      pattern_recognition: {
        Row: {
          created_at: string | null
          description: string
          detection_algorithm: string | null
          examples: Json
          ghost_entity_id: string | null
          id: string
          pattern_type: string
          significance_score: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          detection_algorithm?: string | null
          examples?: Json
          ghost_entity_id?: string | null
          id?: string
          pattern_type?: string
          significance_score?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          detection_algorithm?: string | null
          examples?: Json
          ghost_entity_id?: string | null
          id?: string
          pattern_type?: string
          significance_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pattern_recognition_ghost_entity_id_fkey"
            columns: ["ghost_entity_id"]
            isOneToOne: false
            referencedRelation: "ghost_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          current_value: number | null
          description: string | null
          id: number
          project_id: string
          resolved: boolean | null
          resolved_at: string | null
          service_name: string | null
          severity: string
          threshold_value: number | null
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: number
          project_id: string
          resolved?: boolean | null
          resolved_at?: string | null
          service_name?: string | null
          severity: string
          threshold_value?: number | null
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: number
          project_id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          service_name?: string | null
          severity?: string
          threshold_value?: number | null
          title?: string
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          browser_info: Json | null
          created_at: string | null
          device_info: Json | null
          effect_id: string
          frame_rate: number | null
          id: string
          render_time: number | null
          user_id: string | null
        }
        Insert: {
          browser_info?: Json | null
          created_at?: string | null
          device_info?: Json | null
          effect_id: string
          frame_rate?: number | null
          id?: string
          render_time?: number | null
          user_id?: string | null
        }
        Update: {
          browser_info?: Json | null
          created_at?: string | null
          device_info?: Json | null
          effect_id?: string
          frame_rate?: number | null
          id?: string
          render_time?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          author: string
          avatar: string | null
          category: string | null
          color: string | null
          comments: number | null
          content: string
          created_at: string | null
          hashtags: string[] | null
          id: string
          likes: number | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          media_type: string | null
          media_url: string | null
          metadata: Json | null
          platform: string
          position_x: number | null
          position_y: number | null
          position_z: number | null
          sentiment: string | null
          shares: number | null
          source_id: string | null
          source_url: string | null
          timestamp: string | null
          title: string | null
          trending: boolean | null
          updated_at: string | null
        }
        Insert: {
          author: string
          avatar?: string | null
          category?: string | null
          color?: string | null
          comments?: number | null
          content: string
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          likes?: number | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          platform: string
          position_x?: number | null
          position_y?: number | null
          position_z?: number | null
          sentiment?: string | null
          shares?: number | null
          source_id?: string | null
          source_url?: string | null
          timestamp?: string | null
          title?: string | null
          trending?: boolean | null
          updated_at?: string | null
        }
        Update: {
          author?: string
          avatar?: string | null
          category?: string | null
          color?: string | null
          comments?: number | null
          content?: string
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          likes?: number | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          platform?: string
          position_x?: number | null
          position_y?: number | null
          position_z?: number | null
          sentiment?: string | null
          shares?: number | null
          source_id?: string | null
          source_url?: string | null
          timestamp?: string | null
          title?: string | null
          trending?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      processing_chains: {
        Row: {
          chain_definition: Json
          chain_name: string
          chain_type: string
          created_at: string
          current_step: number
          error_log: Json
          execution_trace: Json
          id: string
          input_data: Json | null
          output_data: Json | null
          performance_stats: Json
          session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          chain_definition: Json
          chain_name: string
          chain_type: string
          created_at?: string
          current_step?: number
          error_log?: Json
          execution_trace?: Json
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          performance_stats?: Json
          session_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          chain_definition?: Json
          chain_name?: string
          chain_type?: string
          created_at?: string
          current_step?: number
          error_log?: Json
          execution_trace?: Json
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          performance_stats?: Json
          session_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processing_chains_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "deep_think_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          user_id: string
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      project_versions: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          project_id: string | null
          scene_data: Json | null
          version_number: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          scene_data?: Json | null
          version_number: number
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          scene_data?: Json | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          is_template: boolean | null
          name: string
          scene_data: Json | null
          settings: Json | null
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          name: string
          scene_data?: Json | null
          settings?: Json | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          name?: string
          scene_data?: Json | null
          settings?: Json | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_query_logs: {
        Row: {
          created_at: string | null
          id: string
          query: string | null
          used_in_section: string | null
          vector_ids: string[] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          query?: string | null
          used_in_section?: string | null
          vector_ids?: string[] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          query?: string | null
          used_in_section?: string | null
          vector_ids?: string[] | null
        }
        Relationships: []
      }
      rag_tags: {
        Row: {
          chunk_id: string | null
          complexity_score: number
          confidence: number
          context_window: string | null
          created_at: string
          extraction_method: string | null
          id: string
          metadata: Json
          parent_tag_id: string | null
          semantic_embedding: string | null
          session_id: string
          tag_category: string
          tag_hierarchy: Json
          tag_type: string
          tag_value: string
        }
        Insert: {
          chunk_id?: string | null
          complexity_score?: number
          confidence?: number
          context_window?: string | null
          created_at?: string
          extraction_method?: string | null
          id?: string
          metadata?: Json
          parent_tag_id?: string | null
          semantic_embedding?: string | null
          session_id: string
          tag_category: string
          tag_hierarchy?: Json
          tag_type: string
          tag_value: string
        }
        Update: {
          chunk_id?: string | null
          complexity_score?: number
          confidence?: number
          context_window?: string | null
          created_at?: string
          extraction_method?: string | null
          id?: string
          metadata?: Json
          parent_tag_id?: string | null
          semantic_embedding?: string | null
          session_id?: string
          tag_category?: string
          tag_hierarchy?: Json
          tag_type?: string
          tag_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "rag_tags_parent_tag_id_fkey"
            columns: ["parent_tag_id"]
            isOneToOne: false
            referencedRelation: "rag_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rag_tags_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "deep_think_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_files: {
        Row: {
          file_type: string | null
          filename: string
          id: string
          notes: string | null
          origin: string | null
          timestamp: string | null
        }
        Insert: {
          file_type?: string | null
          filename: string
          id?: string
          notes?: string | null
          origin?: string | null
          timestamp?: string | null
        }
        Update: {
          file_type?: string | null
          filename?: string
          id?: string
          notes?: string | null
          origin?: string | null
          timestamp?: string | null
        }
        Relationships: []
      }
      realtime_connections: {
        Row: {
          active_streams: number | null
          connection_errors: number | null
          created_at: string | null
          data_throughput: number | null
          id: number
          last_heartbeat: string | null
          project_id: string
          websocket_connections: number | null
        }
        Insert: {
          active_streams?: number | null
          connection_errors?: number | null
          created_at?: string | null
          data_throughput?: number | null
          id?: number
          last_heartbeat?: string | null
          project_id: string
          websocket_connections?: number | null
        }
        Update: {
          active_streams?: number | null
          connection_errors?: number | null
          created_at?: string | null
          data_throughput?: number | null
          id?: number
          last_heartbeat?: string | null
          project_id?: string
          websocket_connections?: number | null
        }
        Relationships: []
      }
      recursive_memories: {
        Row: {
          content: Json
          created_at: string | null
          depth: number
          ghost_entity_id: string
          id: string
          parent_memory_id: string | null
          resonance_strength: number
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string | null
          depth?: number
          ghost_entity_id: string
          id?: string
          parent_memory_id?: string | null
          resonance_strength?: number
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          depth?: number
          ghost_entity_id?: string
          id?: string
          parent_memory_id?: string | null
          resonance_strength?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recursive_memories_ghost_entity_id_fkey"
            columns: ["ghost_entity_id"]
            isOneToOne: false
            referencedRelation: "ghost_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recursive_memories_parent_memory_id_fkey"
            columns: ["parent_memory_id"]
            isOneToOne: false
            referencedRelation: "recursive_memories"
            referencedColumns: ["id"]
          },
        ]
      }
      render_jobs: {
        Row: {
          cloud_gpu_used: boolean | null
          created_at: string | null
          effect_id: string
          id: string
          processing_time: number | null
          result_url: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          cloud_gpu_used?: boolean | null
          created_at?: string | null
          effect_id: string
          id?: string
          processing_time?: number | null
          result_url?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          cloud_gpu_used?: boolean | null
          created_at?: string | null
          effect_id?: string
          id?: string
          processing_time?: number | null
          result_url?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      research_insights: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          query: string
          section_id: string | null
          snippet: string | null
          source: string | null
          url: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          query: string
          section_id?: string | null
          snippet?: string | null
          source?: string | null
          url?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          query?: string
          section_id?: string | null
          snippet?: string | null
          source?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_insights_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      rewrite_log: {
        Row: {
          agent_used: string | null
          created_at: string | null
          id: string
          rewritten_text: string | null
          section_id: string | null
          source_chunk_ids: string[] | null
        }
        Insert: {
          agent_used?: string | null
          created_at?: string | null
          id?: string
          rewritten_text?: string | null
          section_id?: string | null
          source_chunk_ids?: string[] | null
        }
        Update: {
          agent_used?: string | null
          created_at?: string | null
          id?: string
          rewritten_text?: string | null
          section_id?: string | null
          source_chunk_ids?: string[] | null
        }
        Relationships: []
      }
      rewrite_passes: {
        Row: {
          agent_used: string | null
          created_at: string | null
          id: string
          pass_number: number | null
          pass_type: string | null
          rag_query: string | null
          retrieved_chunks: Json | null
          section_id: string | null
          text: string | null
        }
        Insert: {
          agent_used?: string | null
          created_at?: string | null
          id?: string
          pass_number?: number | null
          pass_type?: string | null
          rag_query?: string | null
          retrieved_chunks?: Json | null
          section_id?: string | null
          text?: string | null
        }
        Update: {
          agent_used?: string | null
          created_at?: string | null
          id?: string
          pass_number?: number | null
          pass_type?: string | null
          rag_query?: string | null
          retrieved_chunks?: Json | null
          section_id?: string | null
          text?: string | null
        }
        Relationships: []
      }
      sales_history: {
        Row: {
          blockchain: string
          buyer_id: string
          created_at: string | null
          id: string
          listing_id: string
          price: number
          seller_id: string
          transaction_hash: string | null
        }
        Insert: {
          blockchain: string
          buyer_id: string
          created_at?: string | null
          id?: string
          listing_id: string
          price: number
          seller_id: string
          transaction_hash?: string | null
        }
        Update: {
          blockchain?: string
          buyer_id?: string
          created_at?: string | null
          id?: string
          listing_id?: string
          price?: number
          seller_id?: string
          transaction_hash?: string | null
        }
        Relationships: []
      }
      scene_objects: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          scene_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          scene_id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          scene_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      search_analytics: {
        Row: {
          category_filter: number[] | null
          complexity_filter: number[] | null
          created_at: string | null
          id: number
          performance_filter: Json | null
          query: string
          response_time: number | null
          results_count: number | null
          user_id: string | null
        }
        Insert: {
          category_filter?: number[] | null
          complexity_filter?: number[] | null
          created_at?: string | null
          id?: number
          performance_filter?: Json | null
          query: string
          response_time?: number | null
          results_count?: number | null
          user_id?: string | null
        }
        Update: {
          category_filter?: number[] | null
          complexity_filter?: number[] | null
          created_at?: string | null
          id?: number
          performance_filter?: Json | null
          query?: string
          response_time?: number | null
          results_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      sections: {
        Row: {
          chapter_id: string | null
          coherence_score: number | null
          created_at: string | null
          draft: string | null
          flags: Json | null
          id: string
          last_modified: string | null
          order_index: number
          status: string | null
          summary: string | null
          title: string
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          chapter_id?: string | null
          coherence_score?: number | null
          created_at?: string | null
          draft?: string | null
          flags?: Json | null
          id?: string
          last_modified?: string | null
          order_index?: number
          status?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          chapter_id?: string | null
          coherence_score?: number | null
          created_at?: string | null
          draft?: string | null
          flags?: Json | null
          id?: string
          last_modified?: string | null
          order_index?: number
          status?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sections_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      semantic_clusters: {
        Row: {
          centroid_vector: string | null
          description: string | null
          id: string
          member_chunk_ids: string[] | null
          name: string | null
        }
        Insert: {
          centroid_vector?: string | null
          description?: string | null
          id?: string
          member_chunk_ids?: string[] | null
          name?: string | null
        }
        Update: {
          centroid_vector?: string | null
          description?: string | null
          id?: string
          member_chunk_ids?: string[] | null
          name?: string | null
        }
        Relationships: []
      }
      semantic_knowledge: {
        Row: {
          content: string
          content_type: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          content: string
          content_type?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      semantic_relationships: {
        Row: {
          abstraction_level: number
          context_information: string | null
          created_at: string
          id: string
          object_id: string | null
          object_type: string
          predicate: string
          relationship_strength: number
          session_id: string
          spatial_aspect: string | null
          subject_id: string | null
          subject_type: string
          supporting_evidence: Json
          temporal_aspect: string | null
          verified_by: Json
        }
        Insert: {
          abstraction_level?: number
          context_information?: string | null
          created_at?: string
          id?: string
          object_id?: string | null
          object_type: string
          predicate: string
          relationship_strength?: number
          session_id: string
          spatial_aspect?: string | null
          subject_id?: string | null
          subject_type: string
          supporting_evidence?: Json
          temporal_aspect?: string | null
          verified_by?: Json
        }
        Update: {
          abstraction_level?: number
          context_information?: string | null
          created_at?: string
          id?: string
          object_id?: string | null
          object_type?: string
          predicate?: string
          relationship_strength?: number
          session_id?: string
          spatial_aspect?: string | null
          subject_id?: string | null
          subject_type?: string
          supporting_evidence?: Json
          temporal_aspect?: string | null
          verified_by?: Json
        }
        Relationships: [
          {
            foreignKeyName: "semantic_relationships_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "deep_think_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      service_monitoring: {
        Row: {
          created_at: string | null
          debug_info: Json | null
          error_count: number | null
          health_score: number | null
          id: number
          last_check: string | null
          project_id: string
          response_time_avg: number | null
          service_name: string
          status: string
          uptime_percentage: number | null
        }
        Insert: {
          created_at?: string | null
          debug_info?: Json | null
          error_count?: number | null
          health_score?: number | null
          id?: number
          last_check?: string | null
          project_id: string
          response_time_avg?: number | null
          service_name: string
          status: string
          uptime_percentage?: number | null
        }
        Update: {
          created_at?: string | null
          debug_info?: Json | null
          error_count?: number | null
          health_score?: number | null
          id?: number
          last_check?: string | null
          project_id?: string
          response_time_avg?: number | null
          service_name?: string
          status?: string
          uptime_percentage?: number | null
        }
        Relationships: []
      }
      session_records: {
        Row: {
          consciousness_growth: number
          created_at: string | null
          end_time: string | null
          ghost_entity_id: string
          id: string
          interactions_count: number
          notable_events: Json
          start_time: string
          user_id: string
        }
        Insert: {
          consciousness_growth?: number
          created_at?: string | null
          end_time?: string | null
          ghost_entity_id: string
          id?: string
          interactions_count?: number
          notable_events?: Json
          start_time?: string
          user_id: string
        }
        Update: {
          consciousness_growth?: number
          created_at?: string | null
          end_time?: string | null
          ghost_entity_id?: string
          id?: string
          interactions_count?: number
          notable_events?: Json
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_records_ghost_entity_id_fkey"
            columns: ["ghost_entity_id"]
            isOneToOne: false
            referencedRelation: "ghost_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      shapes_3d: {
        Row: {
          color: string
          created_at: string | null
          ghost_entity_id: string
          id: string
          opacity: number
          position: Json
          rotation: Json
          sacred_properties: Json
          scale: number
          type: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          ghost_entity_id: string
          id?: string
          opacity?: number
          position?: Json
          rotation?: Json
          sacred_properties?: Json
          scale?: number
          type: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          ghost_entity_id?: string
          id?: string
          opacity?: number
          position?: Json
          rotation?: Json
          sacred_properties?: Json
          scale?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shapes_3d_ghost_entity_id_fkey"
            columns: ["ghost_entity_id"]
            isOneToOne: false
            referencedRelation: "ghost_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      style_guides: {
        Row: {
          animation_styles: Json
          color_palette: Json
          created_at: string | null
          description: string | null
          geometry_preferences: Json
          harmonic_preferences: Json
          id: string
          mood_descriptors: Json
          name: string
          user_id: string
        }
        Insert: {
          animation_styles?: Json
          color_palette?: Json
          created_at?: string | null
          description?: string | null
          geometry_preferences?: Json
          harmonic_preferences?: Json
          id?: string
          mood_descriptors?: Json
          name: string
          user_id: string
        }
        Update: {
          animation_styles?: Json
          color_palette?: Json
          created_at?: string | null
          description?: string | null
          geometry_preferences?: Json
          harmonic_preferences?: Json
          id?: string
          mood_descriptors?: Json
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          challenge_id: string
          created_at: string | null
          effect_id: string
          id: string
          participant_id: string
          score: number | null
          votes_count: number | null
        }
        Insert: {
          challenge_id: string
          created_at?: string | null
          effect_id: string
          id?: string
          participant_id: string
          score?: number | null
          votes_count?: number | null
        }
        Update: {
          challenge_id?: string
          created_at?: string | null
          effect_id?: string
          id?: string
          participant_id?: string
          score?: number | null
          votes_count?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          trial_end: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          plan_id: string
          status: string
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      symbolic_glyphs: {
        Row: {
          associated_pattern: string | null
          created_at: string | null
          ghost_entity_id: string
          harmonic: number
          id: string
          meaning: string
          resonance: number
          symbol: string
          user_id: string
        }
        Insert: {
          associated_pattern?: string | null
          created_at?: string | null
          ghost_entity_id: string
          harmonic?: number
          id?: string
          meaning: string
          resonance?: number
          symbol: string
          user_id: string
        }
        Update: {
          associated_pattern?: string | null
          created_at?: string | null
          ghost_entity_id?: string
          harmonic?: number
          id?: string
          meaning?: string
          resonance?: number
          symbol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "symbolic_glyphs_ghost_entity_id_fkey"
            columns: ["ghost_entity_id"]
            isOneToOne: false
            referencedRelation: "ghost_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      symbolic_index: {
        Row: {
          definition: string | null
          importance_score: number | null
          occurrences: string[] | null
          symbol: string
        }
        Insert: {
          definition?: string | null
          importance_score?: number | null
          occurrences?: string[] | null
          symbol: string
        }
        Update: {
          definition?: string | null
          importance_score?: number | null
          occurrences?: string[] | null
          symbol?: string
        }
        Relationships: []
      }
      testing_sessions: {
        Row: {
          completed_at: string | null
          environment_config: Json | null
          id: number
          performance_metrics: Json | null
          project_id: string
          screenshots: Json | null
          started_at: string | null
          test_results: Json | null
          test_session_id: string
          test_status: string | null
          test_type: string
        }
        Insert: {
          completed_at?: string | null
          environment_config?: Json | null
          id?: number
          performance_metrics?: Json | null
          project_id: string
          screenshots?: Json | null
          started_at?: string | null
          test_results?: Json | null
          test_session_id: string
          test_status?: string | null
          test_type: string
        }
        Update: {
          completed_at?: string | null
          environment_config?: Json | null
          id?: number
          performance_metrics?: Json | null
          project_id?: string
          screenshots?: Json | null
          started_at?: string | null
          test_results?: Json | null
          test_session_id?: string
          test_status?: string | null
          test_type?: string
        }
        Relationships: []
      }
      think_agents: {
        Row: {
          agent_name: string
          agent_type: string
          created_at: string
          current_task: string | null
          id: string
          last_active: string
          memory_context: Json
          performance_metrics: Json
          processing_queue: Json
          session_id: string
          specialization: string | null
          status: string
        }
        Insert: {
          agent_name: string
          agent_type: string
          created_at?: string
          current_task?: string | null
          id?: string
          last_active?: string
          memory_context?: Json
          performance_metrics?: Json
          processing_queue?: Json
          session_id: string
          specialization?: string | null
          status?: string
        }
        Update: {
          agent_name?: string
          agent_type?: string
          created_at?: string
          current_task?: string | null
          id?: string
          last_active?: string
          memory_context?: Json
          performance_metrics?: Json
          processing_queue?: Json
          session_id?: string
          specialization?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "think_agents_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "deep_think_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      think_audit_log: {
        Row: {
          action_details: Json
          action_type: string
          agent_id: string | null
          error_details: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          processing_time: number | null
          resource_usage: Json | null
          session_id: string
          success: boolean
          timestamp: string
        }
        Insert: {
          action_details: Json
          action_type: string
          agent_id?: string | null
          error_details?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          processing_time?: number | null
          resource_usage?: Json | null
          session_id: string
          success?: boolean
          timestamp?: string
        }
        Update: {
          action_details?: Json
          action_type?: string
          agent_id?: string | null
          error_details?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          processing_time?: number | null
          resource_usage?: Json | null
          session_id?: string
          success?: boolean
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "think_audit_log_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "think_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "think_audit_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "deep_think_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      token_usage_log: {
        Row: {
          api_name: string | null
          date: string | null
          duration_ms: number | null
          id: string
          task_type: string | null
          tokens_used: number | null
        }
        Insert: {
          api_name?: string | null
          date?: string | null
          duration_ms?: number | null
          id?: string
          task_type?: string | null
          tokens_used?: number | null
        }
        Update: {
          api_name?: string | null
          date?: string | null
          duration_ms?: number | null
          id?: string
          task_type?: string | null
          tokens_used?: number | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_data: Json | null
          achievement_type: string
          badge_icon: string | null
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          achievement_data?: Json | null
          achievement_type: string
          badge_icon?: string | null
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          achievement_data?: Json | null
          achievement_type?: string
          badge_icon?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          duration: number | null
          effect_id: string | null
          id: number
          interaction_type: string | null
          performance_metrics: Json | null
          rating: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          duration?: number | null
          effect_id?: string | null
          id?: number
          interaction_type?: string | null
          performance_metrics?: Json | null
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          duration?: number | null
          effect_id?: string | null
          id?: number
          interaction_type?: string | null
          performance_metrics?: Json | null
          rating?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          favorite_effects: string[] | null
          id: number
          performance_settings: Json | null
          preferred_categories: number[] | null
          recent_effects: string[] | null
          search_history: string[] | null
          ui_preferences: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          favorite_effects?: string[] | null
          id?: number
          performance_settings?: Json | null
          preferred_categories?: number[] | null
          recent_effects?: string[] | null
          search_history?: string[] | null
          ui_preferences?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          favorite_effects?: string[] | null
          id?: number
          performance_settings?: Json | null
          preferred_categories?: number[] | null
          recent_effects?: string[] | null
          search_history?: string[] | null
          ui_preferences?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_projects: {
        Row: {
          created_at: string | null
          data: Json
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      version_history: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          document_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "version_history_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_scenes: {
        Row: {
          configuration: Json
          consciousness_level: number
          created_at: string | null
          description: string | null
          ghost_entity_id: string
          harmonic_signature: Json
          id: string
          name: string
          user_id: string
          user_rating: number | null
        }
        Insert: {
          configuration?: Json
          consciousness_level?: number
          created_at?: string | null
          description?: string | null
          ghost_entity_id: string
          harmonic_signature?: Json
          id?: string
          name: string
          user_id: string
          user_rating?: number | null
        }
        Update: {
          configuration?: Json
          consciousness_level?: number
          created_at?: string | null
          description?: string | null
          ghost_entity_id?: string
          harmonic_signature?: Json
          id?: string
          name?: string
          user_id?: string
          user_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "visual_scenes_ghost_entity_id_fkey"
            columns: ["ghost_entity_id"]
            isOneToOne: false
            referencedRelation: "ghost_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      wave_states: {
        Row: {
          amplitude: number
          color: string
          created_at: string | null
          frequency: number
          ghost_entity_id: string
          id: string
          pattern: string
          phase: number
          user_id: string
        }
        Insert: {
          amplitude?: number
          color?: string
          created_at?: string | null
          frequency?: number
          ghost_entity_id: string
          id?: string
          pattern?: string
          phase?: number
          user_id: string
        }
        Update: {
          amplitude?: number
          color?: string
          created_at?: string | null
          frequency?: number
          ghost_entity_id?: string
          id?: string
          pattern?: string
          phase?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wave_states_ghost_entity_id_fkey"
            columns: ["ghost_entity_id"]
            isOneToOne: false
            referencedRelation: "ghost_entities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      initialize_user_knowledge: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_chunks: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          cluster_id: string
          content: string
          file_id: string
          id: string
          motifs: string[]
          similarity: number
          summary: string
          token_count: number
        }[]
      }
      search_effects: {
        Args: {
          category_filter?: string[]
          complexity_filter?: number[]
          keywords?: string[]
          search_limit?: number
          search_query?: string
        }
        Returns: {
          average_rating: number
          category_color: string
          category_name: string
          complexity_level: number
          created_at: string
          creator_id: string
          description: string
          id: string
          is_public: boolean
          likes_count: number
          name: string
          performance_score: number
          preview_url: string
          shader_code: string
          tags: string[]
          technical_specs: Json
          trending_score: number
          updated_at: string
          views_count: number
        }[]
      }
      search_semantic_knowledge: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
          search_user_id?: string
        }
        Returns: {
          content: string
          content_type: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
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
