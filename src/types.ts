export type AccessState = {
  frankiflow: boolean;
  frankiholz: boolean;
  frankiflowRole: string | null;
};

export type QuoteRequest = {
  id: string;
  customer_name: string;
  company_name: string;
  customer_email: string;
  customer_phone: string;
  service_key: string;
  area_sqm: number | null;
  window_sqm: number | null;
  frequency_key: string | null;
  contract_months: number | null;
  deep_cleaning: boolean;
  equipment_by_frankiflow: boolean;
  estimated_monthly: number | null;
  postcode: string;
  message: string;
  internal_note: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type FlowPayment = {
  id: string;
  quote_request_id: string | null;
  customer_email: string;
  amount_cents: number;
  currency: string;
  description: string;
  status: string;
  checkout_url: string | null;
  paid_at: string | null;
  created_at: string;
};

export type FlowClient = {
  id: string;
  client_type: string;
  customer_name: string;
  company_name: string;
  email: string;
  phone: string;
  street: string;
  postcode: string;
  city: string;
  notes: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type FlowEmployee = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  employment_type: string;
  hourly_rate: number;
  active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type FlowJob = {
  id: string;
  client_id: string | null;
  assigned_employee_id: string | null;
  title: string;
  service_key: string;
  street: string;
  postcode: string;
  city: string;
  starts_at: string;
  ends_at: string | null;
  status: string;
  billing_mode: string;
  agreed_rate: number | null;
  estimated_hours: number | null;
  internal_note: string;
  created_at: string;
  updated_at: string;
  frankiflow_clients?: Pick<FlowClient, 'customer_name' | 'company_name'> | null;
  frankiflow_employees?: Pick<FlowEmployee, 'full_name'> | null;
};

export type ChecklistItem = {
  id: string;
  job_id: string;
  label: string;
  sort_order: number;
  completed: boolean;
  completed_at: string | null;
  inspector_checked: boolean;
  inspector_checked_at: string | null;
  note: string;
};

export type HolzRoom = {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  max_guests: number;
  image_url: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type HolzBooking = {
  id: string;
  reference: string;
  room_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  guest_country: string | null;
  guests: number;
  check_in: string;
  check_out: string;
  total_price: number;
  message: string | null;
  status: string;
  payment_status: string;
  payment_due_at: string | null;
  stripe_checkout_url: string | null;
  paid_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  frankiholz_rooms?: Pick<HolzRoom, 'name'> | null;
};

export type HolzCalendarRate = {
  date: string;
  is_available: boolean;
  availability_status: string;
  nightly_price: number;
};

export type HolzCalendarRow = {
  id: string;
  room_id: string;
  date: string;
  is_available: boolean;
  availability_status: string;
  price_override: number | null;
  note: string | null;
  booking_id: string | null;
  external_source: string | null;
};

export type HolzPricing = {
  id: number;
  weekend_markup_pct: number;
  last_minute_days: number;
  last_minute_discount_pct: number;
  long_stay_nights_1: number;
  long_stay_discount_1_pct: number;
  long_stay_nights_2: number;
  long_stay_discount_2_pct: number;
  occupancy_level_1_pct: number;
  occupancy_markup_1_pct: number;
  occupancy_level_2_pct: number;
  occupancy_markup_2_pct: number;
  payment_hold_minutes: number;
  updated_at: string;
};

export type IcalFeed = {
  id: string;
  room_id: string;
  provider: string;
  feed_url: string;
  enabled: boolean;
  last_synced_at: string | null;
  last_status: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  frankiholz_rooms?: Pick<HolzRoom, 'name'> | null;
};
