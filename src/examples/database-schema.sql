-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.daily_inventory_plans (
  daily_inventory_plan_id uuid NOT NULL DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL,
  date date NOT NULL,
  inventory_item_id uuid NOT NULL,
  planned_usage_qty integer NOT NULL DEFAULT 0 CHECK (planned_usage_qty >= 0),
  unit character varying NOT NULL,
  notes character varying,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT daily_inventory_plans_pkey PRIMARY KEY (daily_inventory_plan_id),
  CONSTRAINT daily_inventory_plans_unit_id_foreign FOREIGN KEY (unit_id) REFERENCES public.units(unit_id),
  CONSTRAINT daily_inventory_plans_inventory_item_id_foreign FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(inventory_item_id),
  CONSTRAINT daily_inventory_plans_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.users(user_id)
);
CREATE TABLE public.daily_inventory_realizations (
  daily_inventory_realization_id uuid NOT NULL DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL,
  date date NOT NULL,
  inventory_item_id uuid NOT NULL,
  daily_inventory_plan_id uuid NOT NULL UNIQUE,
  planned_usage_qty integer NOT NULL DEFAULT 0 CHECK (planned_usage_qty >= 0),
  actual_usage_qty integer NOT NULL DEFAULT 0 CHECK (actual_usage_qty >= 0),
  waste_qty integer NOT NULL DEFAULT 0 CHECK (waste_qty >= 0),
  remaining_qty integer CHECK (remaining_qty IS NULL OR remaining_qty >= 0),
  variance_qty integer NOT NULL DEFAULT 0,
  notes character varying,
  status character varying NOT NULL DEFAULT 'SUBMITTED'::character varying,
  submitted_by uuid NOT NULL,
  submitted_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT daily_inventory_realizations_pkey PRIMARY KEY (daily_inventory_realization_id),
  CONSTRAINT daily_inventory_realizations_unit_id_foreign FOREIGN KEY (unit_id) REFERENCES public.units(unit_id),
  CONSTRAINT daily_inventory_realizations_inventory_item_id_foreign FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(inventory_item_id),
  CONSTRAINT daily_inventory_realizations_daily_inventory_plan_id_foreign FOREIGN KEY (daily_inventory_plan_id) REFERENCES public.daily_inventory_plans(daily_inventory_plan_id),
  CONSTRAINT daily_inventory_realizations_submitted_by_foreign FOREIGN KEY (submitted_by) REFERENCES public.users(user_id)
);
CREATE TABLE public.inventory_items (
  inventory_item_id uuid NOT NULL DEFAULT gen_random_uuid(),
  inventory_item_name character varying NOT NULL,
  description text NOT NULL,
  unit_of_measure character varying NOT NULL,
  current_stock integer,
  min_threshold integer,
  max_threshold integer,
  last_restocked_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp with time zone,
  CONSTRAINT inventory_items_pkey PRIMARY KEY (inventory_item_id)
);
CREATE TABLE public.inventory_items_units (
  inventory_item_unit_id uuid NOT NULL DEFAULT gen_random_uuid(),
  inventory_item_id uuid NOT NULL,
  unit_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp with time zone,
  CONSTRAINT inventory_items_units_pkey PRIMARY KEY (inventory_item_unit_id),
  CONSTRAINT inventory_items_units_inventory_item_id_foreign FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(inventory_item_id),
  CONSTRAINT inventory_items_units_unit_id_foreign FOREIGN KEY (unit_id) REFERENCES public.units(unit_id)
);
CREATE TABLE public.inventory_transactions (
  inventory_transaction_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  inventory_item_id uuid NOT NULL,
  transaction_type character varying NOT NULL,
  quantity_changed integer NOT NULL,
  quantity_before integer NOT NULL,
  quantity_after integer NOT NULL,
  notes character varying,
  transacted_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp with time zone,
  reference_type character varying,
  reference_id uuid,
  CONSTRAINT inventory_transactions_pkey PRIMARY KEY (inventory_transaction_id),
  CONSTRAINT inventory_transactions_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT inventory_transactions_inventory_item_id_foreign FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(inventory_item_id)
);
CREATE TABLE public.knex_migrations (
  id integer NOT NULL DEFAULT nextval('knex_migrations_id_seq'::regclass),
  name character varying,
  batch integer,
  migration_time timestamp with time zone,
  CONSTRAINT knex_migrations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.knex_migrations_lock (
  index integer NOT NULL DEFAULT nextval('knex_migrations_lock_index_seq'::regclass),
  is_locked integer,
  CONSTRAINT knex_migrations_lock_pkey PRIMARY KEY (index)
);
CREATE TABLE public.large_objects (
  id_blob uuid NOT NULL DEFAULT gen_random_uuid(),
  file_name character varying NOT NULL,
  stored_name character varying NOT NULL,
  mime character varying NOT NULL,
  path character varying NOT NULL,
  size_bytes bigint NOT NULL,
  uploaded_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp with time zone,
  CONSTRAINT large_objects_pkey PRIMARY KEY (id_blob)
);
CREATE TABLE public.menu_categories (
  menu_category_id uuid NOT NULL DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL,
  category_name character varying NOT NULL UNIQUE,
  description character varying,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp with time zone,
  CONSTRAINT menu_categories_pkey PRIMARY KEY (menu_category_id),
  CONSTRAINT menu_categories_unit_id_foreign FOREIGN KEY (unit_id) REFERENCES public.units(unit_id)
);
CREATE TABLE public.menu_items (
  menu_item_id uuid NOT NULL DEFAULT gen_random_uuid(),
  menu_category_id uuid NOT NULL,
  menu_item_name character varying NOT NULL UNIQUE,
  item_price numeric NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp with time zone,
  blob_id uuid,
  CONSTRAINT menu_items_pkey PRIMARY KEY (menu_item_id),
  CONSTRAINT menu_items_menu_category_id_foreign FOREIGN KEY (menu_category_id) REFERENCES public.menu_categories(menu_category_id),
  CONSTRAINT menu_items_blob_id_foreign FOREIGN KEY (blob_id) REFERENCES public.large_objects(id_blob)
);
CREATE TABLE public.menu_items_units (
  menu_item_unit_id uuid NOT NULL DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL,
  unit_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp with time zone,
  CONSTRAINT menu_items_units_pkey PRIMARY KEY (menu_item_unit_id),
  CONSTRAINT menu_items_units_menu_item_id_foreign FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(menu_item_id),
  CONSTRAINT menu_items_units_unit_id_foreign FOREIGN KEY (unit_id) REFERENCES public.units(unit_id)
);
CREATE TABLE public.order_items (
  order_item_id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  menu_item_id uuid NOT NULL,
  quantity integer NOT NULL,
  item_price real NOT NULL,
  notes character varying,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp with time zone,
  CONSTRAINT order_items_pkey PRIMARY KEY (order_item_id),
  CONSTRAINT order_items_order_id_foreign FOREIGN KEY (order_id) REFERENCES public.orders(order_id),
  CONSTRAINT order_items_menu_item_id_foreign FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(menu_item_id)
);
CREATE TABLE public.order_status (
  order_status_id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_status_name character varying NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp with time zone,
  order_status_code character varying NOT NULL UNIQUE,
  CONSTRAINT order_status_pkey PRIMARY KEY (order_status_id)
);
CREATE TABLE public.order_types (
  order_type_id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_type_name character varying NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp with time zone,
  order_type_code character varying NOT NULL UNIQUE,
  CONSTRAINT order_types_pkey PRIMARY KEY (order_type_id)
);
CREATE TABLE public.orders (
  order_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_number character varying NOT NULL UNIQUE,
  table_number character varying,
  subtotal real NOT NULL,
  tax_amount real NOT NULL,
  total_amount real NOT NULL,
  notes character varying,
  ordered_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  customer_name character varying NOT NULL,
  order_type_id uuid NOT NULL,
  deleted_at timestamp with time zone,
  order_status_id uuid NOT NULL,
  unit_id uuid NOT NULL,
  CONSTRAINT orders_pkey PRIMARY KEY (order_id),
  CONSTRAINT orders_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT orders_order_type_id_foreign FOREIGN KEY (order_type_id) REFERENCES public.order_types(order_type_id),
  CONSTRAINT orders_order_status_id_foreign FOREIGN KEY (order_status_id) REFERENCES public.order_status(order_status_id),
  CONSTRAINT orders_unit_id_foreign FOREIGN KEY (unit_id) REFERENCES public.units(unit_id)
);
CREATE TABLE public.payments (
  payment_id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  reference_number character varying NOT NULL UNIQUE,
  amount real NOT NULL,
  payment_status character varying NOT NULL,
  failure_reason character varying,
  paid_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expired_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp with time zone,
  qr_code_url character varying,
  qr_string character varying,
  CONSTRAINT payments_pkey PRIMARY KEY (payment_id),
  CONSTRAINT payments_order_id_foreign FOREIGN KEY (order_id) REFERENCES public.orders(order_id)
);
CREATE TABLE public.permissions (
  permission_id uuid NOT NULL DEFAULT gen_random_uuid(),
  feature character varying NOT NULL,
  description text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp with time zone,
  CONSTRAINT permissions_pkey PRIMARY KEY (permission_id)
);
CREATE TABLE public.recipe_boms (
  recipe_bom_id uuid NOT NULL DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL,
  inventory_item_id uuid NOT NULL,
  quantity integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp with time zone,
  CONSTRAINT recipe_boms_pkey PRIMARY KEY (recipe_bom_id),
  CONSTRAINT recipe_boms_menu_item_id_foreign FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(menu_item_id),
  CONSTRAINT recipe_boms_inventory_item_id_foreign FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(inventory_item_id)
);
CREATE TABLE public.role_permissions (
  role_permission_id uuid NOT NULL DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp with time zone,
  CONSTRAINT role_permissions_pkey PRIMARY KEY (role_permission_id),
  CONSTRAINT role_permissions_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(role_id),
  CONSTRAINT role_permissions_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES public.permissions(permission_id)
);
CREATE TABLE public.roles (
  role_id uuid NOT NULL DEFAULT gen_random_uuid(),
  role_name character varying NOT NULL,
  role_code character varying NOT NULL UNIQUE,
  description text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp with time zone,
  CONSTRAINT roles_pkey PRIMARY KEY (role_id)
);
CREATE TABLE public.units (
  unit_id uuid NOT NULL DEFAULT gen_random_uuid(),
  unit_name character varying NOT NULL,
  unit_address text NOT NULL,
  phone_number character varying,
  status text DEFAULT 'value1'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp with time zone,
  CONSTRAINT units_pkey PRIMARY KEY (unit_id)
);
CREATE TABLE public.user_units (
  user_unit_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  unit_id uuid NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp with time zone,
  CONSTRAINT user_units_pkey PRIMARY KEY (user_unit_id),
  CONSTRAINT user_units_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT user_units_unit_id_foreign FOREIGN KEY (unit_id) REFERENCES public.units(unit_id)
);
CREATE TABLE public.users (
  user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL,
  full_name character varying NOT NULL,
  username character varying NOT NULL UNIQUE,
  email character varying NOT NULL UNIQUE,
  last_login_at timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp with time zone,
  must_change_password boolean NOT NULL DEFAULT true,
  password character varying NOT NULL,
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT users_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(role_id)
);