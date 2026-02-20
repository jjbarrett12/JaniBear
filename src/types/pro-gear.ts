export type ProGearCategory = 'gloves' | 'equipment';

export type ProGearOrderStatus =
  | 'draft'
  | 'submitted'
  | 'confirmed'
  | 'shipped'
  | 'canceled';

export type ProGearInquiryStatus = 'new' | 'contacted' | 'quoted' | 'closed';

export interface GloveFields {
  material?: string;
  color?: string;
  thickness_mil?: number;
  size_range?: string;
  case_count?: number;
}

export interface EquipmentFields {
  type?: string;
  power?: string;
  width_in?: number | null;
  battery?: string | null;
  warranty_years?: number;
}

export interface ProGearProduct {
  id: string;
  slug: string;
  sku: string | null;
  name: string;
  category: ProGearCategory;
  brand: string | null;
  description: string | null;
  images: string[];
  retail_price_cents: number | null;
  member_price_cents: number;
  savings_percent: number | null;
  shipping_estimate_days: number | null;
  featured: boolean;
  active: boolean;
  glove_fields: GloveFields | null;
  equipment_fields: EquipmentFields | null;
  estimated_labor_hours_saved_per_week: number | null;
  avg_operator_hourly_rate_cents: number;
  recommended_sqft_min: number | null;
  recommended_sqft_max: number | null;
  private_label_available: boolean;
  private_label_moq_units: number | null;
  private_label_notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export type ProGearPaymentType = 'one_time' | 'financed';

export interface ProGearOrder {
  id: string;
  user_id: string;
  status: ProGearOrderStatus;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  payment_type?: ProGearPaymentType | null;
  stripe_checkout_session_id?: string | null;
  stripe_subscription_id?: string | null;
  financing_months?: number | null;
  notes: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ProGearOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  created_at?: string;
  products?: ProGearProduct | null;
}

export interface ProGearPrivateLabelInquiry {
  id: string;
  product_id: string;
  user_id: string;
  company_name: string | null;
  contact_name: string;
  email: string;
  phone: string | null;
  estimated_quantity: number | null;
  notes: string | null;
  status: ProGearInquiryStatus;
  created_at: string;
  updated_at?: string;
  products?: ProGearProduct | null;
}

export interface ProGearContactRequest {
  id: string;
  user_id: string | null;
  contact_name: string;
  email: string;
  company_name: string | null;
  phone: string | null;
  estimated_quantity: string | null;
  estimated_value_cents: number | null;
  message: string | null;
  status: 'new' | 'contacted' | 'closed';
  created_at: string;
  updated_at?: string;
}
