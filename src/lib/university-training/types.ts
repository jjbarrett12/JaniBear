/**
 * JANIBEAR University Training — shared types for courses, enrollments, certifications, requirements.
 */

export type CourseCategory =
  | 'floor_care'
  | 'chemicals'
  | 'customer_service'
  | 'medical'
  | 'safety'
  | 'supervision'
  | 'other';

export type CourseLevel = 'foundation' | 'skill' | 'site' | 'leadership';

export type ContentType = 'video' | 'pdf' | 'checklist' | 'mixed';

export type PremiumTier = 'free' | 'grizzly' | 'kodiak';

export type EnrollmentStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export type CertificationStatus = 'active' | 'expired' | 'revoked';

export type RequirementType = 'role' | 'site' | 'account';

export type RequirementEnforcement = 'hard_gate' | 'soft_recommend';

export type RecommendationStatus = 'open' | 'dismissed' | 'completed';

export type RecommendationSource = 'inspection_fail' | 'complaint' | 'sla_breach' | 'manual';

export type QuizQuestionType = 'single_choice' | 'multi_choice' | 'true_false';

export interface JbTrainingCourse {
  id: string;
  org_id: string | null;
  title: string;
  description: string | null;
  category: CourseCategory;
  level: CourseLevel;
  language: string;
  is_active: boolean;
  estimated_minutes: number;
  content_type: ContentType;
  content_url: string | null;
  thumbnail_url: string | null;
  premium_tier: PremiumTier;
  created_at: string;
  updated_at: string;
}

export interface JbTrainingLesson {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
  content_url: string | null;
  content_type: ContentType;
  estimated_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface JbTrainingEnrollment {
  id: string;
  course_id: string;
  user_id: string;
  status: EnrollmentStatus;
  started_at: string | null;
  completed_at: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JbTrainingCertification {
  id: string;
  user_id: string;
  course_id: string;
  issued_at: string;
  expires_at: string | null;
  renewal_due_at: string | null;
  status: CertificationStatus;
  created_at: string;
  updated_at: string;
}

export interface JbTrainingRequirement {
  id: string;
  org_id: string;
  requirement_type: RequirementType;
  role_key: string | null;
  account_id: string | null;
  required_course_ids: string[];
  enforcement: RequirementEnforcement;
  created_at: string;
  updated_at: string;
}

export interface JbTrainingRecommendation {
  id: string;
  org_id: string;
  user_id: string;
  account_id: string | null;
  location_id: string | null;
  source_type: RecommendationSource;
  source_ref_id: string | null;
  course_id: string;
  reason: string | null;
  status: RecommendationStatus;
  created_at: string;
  updated_at: string;
}

export interface EligibilityResult {
  eligible: boolean;
  missing_course_ids: string[];
  expired_course_ids: string[];
}
