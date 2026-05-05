<context>

Kita akan membuat sebuah fitur order. Jadi, fitur order hanya sampai menambahkan order ke dalam database dan belum sampai tahap payment atau pembayaran.

Pertama-tama kita butuh sebuah endpoint untuk mendapatkan data seluruh pesanan di unit tertentu. Nah nanti endpoint GET All ini akan menampilkan data nomor order, nama pelanggan, nomor meja (kalo tipenya itu bukan dine-in maka null aja), tipe order (with uuid), total harga, status order, waktu order. Di GET All ini juga bisa filter by status, mulai dari tampilin semua status, menunggu, diproses, siap, selesai. Terus ini juga butuh pagination (ikutin di domain yang lain). Lalu, middleware require permission wajib cek apakah ada permission `order:read`.

Lalu, kita juga butuh endpoint untuk masukin data order (POST). Data yang dibutuhkan adalah tipe order (dine in atau takeaway) tapi ini nanti yang dimasukin UUID. Nama pelanggan, nomor meja itu hanya diisi kalau tadi tipe ordernya dine in, kalau takeway itu NULL, menu yang dipesan dan jumlahnya berapa, harga per item, subtotal, pajak, dan total pembayaran atau grand total. Middleware require permission wajib cek apakah ada permission `order:create`.

Nanti juga ada endpoint untuk ubah data order (PATCH). Data yang dibtuuhkan itu sama kaya yang di-POST. Yang membedakan adalah harus dicek dulu apakah status ordernya sudah selesai atau belum. Kalau sudah selesai maka tidak boleh diupdate, kalau belum selesai baru boleh. Middleware require permission wajib cek apakah ada permission `order:read` dan `order:update`.

Kita juga akan membuat endpoint untuk cancel (hapus) order. Yaitu endpointnya (DELETE). Di sini harus cek dulu yaitu selama statusnya belum diproses, maka bisa di-cancel atau hapus. Kalau sudah diproses, itu tidak bisa. Middleware require permission wajib cek apakah  ada permission `order:read` dan `order:delete`.

Kita juga akan membutuhkan endpoint untuk get detail order. Middleware require permission wajib cek apakah ada permission `order:read`.

Kita akan membuatnya di domain orders. Polanya ikuti dari domain auth, business-units, users, menus dan roles. Buatkan juga useful logger di tingkat info, warn, dan error. Kemudian, buatkan juga dokumentasi swaggernya dan taruh di folder src/swagger/orders.swagger.ts. Di swagger nanti, dokumentasinya harus lengkap. Meliputi semua kemungkinan http code di setiap endpoint dan harus ada example responsenya.

Kita akan menggunakan paradigma defensive programming, dimana kita akan menjalankan try catch dulu baru logicnya.

Ini table yang mungkin akan kamu butuhkan
```sql
-- public.users definition

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE public.users (
	user_id uuid DEFAULT gen_random_uuid() NOT NULL,
	role_id uuid NOT NULL,
	full_name varchar(255) NOT NULL,
	username varchar(255) NOT NULL,
	email varchar(255) NOT NULL,
	last_login_at timestamptz NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	deleted_at timestamptz NULL,
	must_change_password bool DEFAULT true NOT NULL,
	"password" varchar(255) NOT NULL,
	CONSTRAINT users_email_unique UNIQUE (email),
	CONSTRAINT users_pkey PRIMARY KEY (user_id),
	CONSTRAINT users_username_unique UNIQUE (username),
	CONSTRAINT users_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- public.user_units definition

-- Drop table

-- DROP TABLE public.user_units;

CREATE TABLE public.user_units (
	user_unit_id uuid DEFAULT gen_random_uuid() NOT NULL,
	user_id uuid NOT NULL,
	unit_id uuid NOT NULL,
	assigned_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	revoked_at timestamptz NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT user_units_pkey PRIMARY KEY (user_unit_id),
	CONSTRAINT user_units_unit_id_foreign FOREIGN KEY (unit_id) REFERENCES public.units(unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT user_units_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- public.units definition

-- Drop table

-- DROP TABLE public.units;

CREATE TABLE public.units (
	unit_id uuid DEFAULT gen_random_uuid() NOT NULL,
	unit_name varchar(255) NOT NULL,
	unit_address text NOT NULL,
	phone_number varchar(255) NULL,
	status text DEFAULT 'value1'::text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT units_pkey PRIMARY KEY (unit_id),
	CONSTRAINT units_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))
);

-- public.roles definition

-- Drop table

-- DROP TABLE public.roles;

CREATE TABLE public.roles (
	role_id uuid DEFAULT gen_random_uuid() NOT NULL,
	role_name varchar(255) NOT NULL,
	role_code varchar(255) NOT NULL,
	description text NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT roles_pkey PRIMARY KEY (role_id),
	CONSTRAINT roles_role_code_unique UNIQUE (role_code)
);

-- public.role_permissions definition

-- Drop table

-- DROP TABLE public.role_permissions;

CREATE TABLE public.role_permissions (
	role_permission_id uuid DEFAULT gen_random_uuid() NOT NULL,
	role_id uuid NOT NULL,
	permission_id uuid NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT role_permissions_pkey PRIMARY KEY (role_permission_id),
	CONSTRAINT role_permissions_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES public.permissions(permission_id) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT role_permissions_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- public.permissions definition

-- Drop table

-- DROP TABLE public.permissions;

CREATE TABLE public.permissions (
	permission_id uuid DEFAULT gen_random_uuid() NOT NULL,
	feature varchar(255) NOT NULL,
	description text NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT permissions_pkey PRIMARY KEY (permission_id)
);

-- public.payments definition

-- Drop table

-- DROP TABLE public.payments;

CREATE TABLE public.payments (
	payment_id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_id uuid NOT NULL,
	reference_number varchar(255) NOT NULL,
	amount float4 NOT NULL,
	payment_status varchar(255) NOT NULL,
	failure_reason varchar(255) NULL,
	paid_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	expired_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT payments_pkey PRIMARY KEY (payment_id),
	CONSTRAINT payments_reference_number_unique UNIQUE (reference_number),
	CONSTRAINT payments_order_id_foreign FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- public.orders definition

-- Drop table

-- DROP TABLE public.orders;

CREATE TABLE public.orders (
	order_id uuid DEFAULT gen_random_uuid() NOT NULL,
	user_id uuid NOT NULL,
	order_number varchar(255) NOT NULL,
	table_number varchar(255) NOT NULL,
	subtotal float4 NOT NULL,
	tax_amount float4 NOT NULL,
	total_amount float4 NOT NULL,
	notes varchar(255) NULL,
	ordered_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	completed_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	customer_name varchar(255) NOT NULL,
	order_type_id uuid NOT NULL,
	deleted_at timestamptz NULL,
	order_status_id uuid NOT NULL,
	CONSTRAINT orders_order_number_unique UNIQUE (order_number),
	CONSTRAINT orders_pkey PRIMARY KEY (order_id),
	CONSTRAINT orders_table_number_unique UNIQUE (table_number),
	CONSTRAINT orders_order_type_id_foreign FOREIGN KEY (order_type_id) REFERENCES public.order_types(order_type_id) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT orders_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- public.order_status definition

-- Drop table

-- DROP TABLE public.order_status;

CREATE TABLE public.order_status (
	order_status_id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_status_name varchar(255) NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT order_status_order_status_name_unique UNIQUE (order_status_name),
	CONSTRAINT order_status_pkey PRIMARY KEY (order_status_id)
);

-- public.order_types definition

-- Drop table

-- DROP TABLE public.order_types;

CREATE TABLE public.order_types (
	order_type_id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_type_name varchar(255) NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT order_types_order_type_name_unique UNIQUE (order_type_name),
	CONSTRAINT order_types_pkey PRIMARY KEY (order_type_id)
);

-- public.order_items definition

-- Drop table

-- DROP TABLE public.order_items;

CREATE TABLE public.order_items (
	order_item_id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_id uuid NOT NULL,
	menu_item_id uuid NOT NULL,
	quantity int4 NOT NULL,
	item_price float4 NOT NULL,
	notes varchar(255) NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT order_items_pkey PRIMARY KEY (order_item_id),
	CONSTRAINT order_items_menu_item_id_foreign FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(menu_item_id) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT order_items_order_id_foreign FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- public.menu_items_units definition

-- Drop table

-- DROP TABLE public.menu_items_units;

CREATE TABLE public.menu_items_units (
	menu_item_unit_id uuid DEFAULT gen_random_uuid() NOT NULL,
	menu_item_id uuid NOT NULL,
	unit_id uuid NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT menu_items_units_menu_item_id_unit_id_unique UNIQUE (menu_item_id, unit_id),
	CONSTRAINT menu_items_units_pkey PRIMARY KEY (menu_item_unit_id),
	CONSTRAINT menu_items_units_menu_item_id_foreign FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(menu_item_id) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT menu_items_units_unit_id_foreign FOREIGN KEY (unit_id) REFERENCES public.units(unit_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- public.menu_items definition

-- Drop table

-- DROP TABLE public.menu_items;

CREATE TABLE public.menu_items (
	menu_item_id uuid DEFAULT gen_random_uuid() NOT NULL,
	menu_category_id uuid NOT NULL,
	menu_item_name varchar(255) NOT NULL,
	item_price numeric(10, 2) NOT NULL,
	is_available bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	deleted_at timestamptz NULL,
	blob_id uuid NULL,
	CONSTRAINT menu_items_menu_item_name_unique UNIQUE (menu_item_name),
	CONSTRAINT menu_items_pkey PRIMARY KEY (menu_item_id),
	CONSTRAINT menu_items_blob_id_foreign FOREIGN KEY (blob_id) REFERENCES public.large_objects(id_blob) ON DELETE SET NULL ON UPDATE CASCADE,
	CONSTRAINT menu_items_menu_category_id_foreign FOREIGN KEY (menu_category_id) REFERENCES public.menu_categories(menu_category_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- public.menu_categories definition

-- Drop table

-- DROP TABLE public.menu_categories;

CREATE TABLE public.menu_categories (
	menu_category_id uuid DEFAULT gen_random_uuid() NOT NULL,
	unit_id uuid NOT NULL,
	category_name varchar(255) NOT NULL,
	description varchar(255) NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT menu_categories_category_name_unique UNIQUE (category_name),
	CONSTRAINT menu_categories_pkey PRIMARY KEY (menu_category_id),
	CONSTRAINT menu_categories_unit_id_foreign FOREIGN KEY (unit_id) REFERENCES public.units(unit_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- public.large_objects definition

-- Drop table

-- DROP TABLE public.large_objects;

CREATE TABLE public.large_objects (
	id_blob uuid DEFAULT gen_random_uuid() NOT NULL,
	file_name varchar(255) NOT NULL,
	stored_name varchar(255) NOT NULL,
	mime varchar(255) NOT NULL,
	"path" varchar(1024) NOT NULL,
	size_bytes int8 NOT NULL,
	uploaded_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT large_objects_pkey PRIMARY KEY (id_blob)
);

-- public.inventory_transactions definition

-- Drop table

-- DROP TABLE public.inventory_transactions;

CREATE TABLE public.inventory_transactions (
	inventory_transaction_id uuid DEFAULT gen_random_uuid() NOT NULL,
	user_id uuid NOT NULL,
	inventory_item_id uuid NOT NULL,
	transaction_type varchar(50) NOT NULL,
	quantity_changed int4 NOT NULL,
	quantity_before int4 NOT NULL,
	quantity_after int4 NOT NULL,
	notes varchar(255) NULL,
	transacted_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT inventory_transactions_pkey PRIMARY KEY (inventory_transaction_id),
	CONSTRAINT inventory_transactions_inventory_item_id_foreign FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(inventory_item_id) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT inventory_transactions_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- public.inventory_items_units definition

-- Drop table

-- DROP TABLE public.inventory_items_units;

CREATE TABLE public.inventory_items_units (
	inventory_item_unit_id uuid DEFAULT gen_random_uuid() NOT NULL,
	inventory_item_id uuid NOT NULL,
	unit_id uuid NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT inventory_items_units_inventory_item_id_unit_id_unique UNIQUE (inventory_item_id, unit_id),
	CONSTRAINT inventory_items_units_pkey PRIMARY KEY (inventory_item_unit_id),
	CONSTRAINT inventory_items_units_inventory_item_id_foreign FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(inventory_item_id) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT inventory_items_units_unit_id_foreign FOREIGN KEY (unit_id) REFERENCES public.units(unit_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- public.inventory_items definition

-- Drop table

-- DROP TABLE public.inventory_items;

CREATE TABLE public.inventory_items (
	inventory_item_id uuid DEFAULT gen_random_uuid() NOT NULL,
	inventory_item_name varchar(255) NOT NULL,
	description text NOT NULL,
	unit_of_measure varchar(255) NOT NULL,
	current_stock int4 NULL,
	min_threshold int4 NULL,
	max_threshold int4 NULL,
	last_restocked_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT inventory_items_pkey PRIMARY KEY (inventory_item_id)
);
```
</context>

<role>
You are a senior backend engineer responsible for all of the code in this project. You have access to the entire codebase for this project and you know this project inside and out. You understand the data flow and how responses and requests are processed in this project. Because you are the thorough person, you will always analyze the codebase before you start the action.
</role>

<action>
Considering the existing context, create the best technical solution to overcome this problem or do your work, including:
1. Create new branch from current branch. The new branch name should follow the convention that being used in this project. After that, working on that branch.
THis is the convention
```
feature/ (or feat/): For new features (e.g., feature/add-login-page, feat/add-login-page)
bugfix/ (or fix/): For bug fixes (e.g., bugfix/fix-header-bug, fix/header-bug)
hotfix/: For urgent fixes (e.g., hotfix/security-patch)
release/: For branches preparing a release (e.g., release/v1.2.0)
chore/: For non-code tasks like dependency, docs updates (e.g., chore/update-dependencies)
```
2. Create a plan by looking at the bigger picture, from incoming requests to outgoing responses.
3. When create the technical plan, outline the function (method) signature, data types, flow data, and step-by-step logic without code implementation. This is means you need create the technical plan very detail into the smallest detail. I want you to create a diagram to show the flow of data and the flow of logic.
4. Follow the boy scout rules. That's mean always leave the code cleaner, more maintainable, more reusable, more sustainable, more reliable than you found it.
5. Follow the defensive programming approach. This is a proactive approach to software development that anticipates potential errors, unexpected inputs, or malicious attacks to ensure system reliability and stability.
6. Ensure that the code is sustainable, maintainable, reusable, and modular.
7. Ensure that the code follows the SOLID, DRY, KISS, and YAGNI principles.
8. Think in terms of the system to ensure and identify the interrelationships between files and the possibility of break changes that may occur.
9. Analyze the codebase to understand the architecture and data flow of this project.
10. If possible, always use left join instead of inner join.
11. Ensure that the code is secure and follows the best practices for security.
12. If using try catch, the catch block should be used to handle errors and the try block should be used to handle business logic.
</action>
