<context>

Kita akan membuat sebuah fitur untuk mengelola pengguna. Dalam hal ini adalah CRUD pengguna dan beberapa perintilan lainnya.

Untuk fitur ini kita akan membuat beberapa endpoint. Endpoint pertama yang akan kita buat adalah GET `/v1/users`. Di endpoint ini, kita juga bisa menerima query params `?search` yang akan mencari nama, username, email, dan role. Selain itu, endpoint ini menerima params `?sortBy` nah ini nanti bisa sort nama, username, unit usaha, role, status, dan login terakhir (semua make bahasa inggris). Kemudian bisa juga menerima query params `?sortType` yang isinya `ASC` atau `DESC`, dengan defaultnya adalah `ASC`. Lalu ada juga query params yang related dengan pagination, yaitu `?page` dan `?limit`. Secara default, nilai kedua params itu adalah 1 & 10. Nah, kita juga wajib memakai middleware `src\common\middlewares\require-permission.ts`. Permission yang kita butuhkan untuk endpoint ini adalah `user:read` saja.

Bentuk response yang diinginkan dari endpoint ini adadlah sebagai berikut.

```json
{
	"success": true,
	"statusCode": 200, --> ini diambil dari response header gitu
	"message": "String dalam bahasa indonesia",
	"data": [
		{
			"user_id": "string",
			"full_name": "string",
			"user_name": "string", --> diambil dari kolom username
			"business_unit_id": "string",
			"business_unit_name": "string",
			"role_id": "string",
			"role_name": "string",
			"status": "string",
			"last_login": "string",
		}
	]
}
```

Nah sebagai catatan, di sini kita juga akan menampilkan data dari user yang login dan mengakses endpoint ini. Kita hanya akan exclude data yang sudah di soft delete (deleted_at tidak kosong).

Lalu, endpoint berikutnya adalah GET `/v1/users/stats`. Di endpoint ini tujuan kita adalah menampilkan data statistik dari pengguna. Nah, kita juga wajib memakai middleware `src\common\middlewares\require-permission.ts`. Permission yang kita butuhkan untuk endpoint ini adalah `user:read` saja. Untuk endpoint ini, bentuk response yang diharapkan adalah sebagai berikut.

```json
{
	"success": true,
	"statusCode": 200,
	"message": "String dalam bahasa indonesia",
	"data": [
		{
			"total_users": integer,
			"users_active": integer,
			"users_inactive": integer
		}
	]
}
```

Beralih ke endpoint selanjutnya adalah POST `/v1/users`. Di endpoint ini kita akan menerima request `full_name`, `user_name`, `email` --> divalidasi secara ketat apakah emailnya valid atau tidak, `role_id`, `business_unit_id`, dan `password`. Di endpoint ini middleware `src\common\middlewares\require-permission.ts` akan mengecek permission `user:read`, `user:create`, dan `unit:assign_user`. Untuk endpoint ini, bentuk response yang diharapkan adalah sebagai berikut.

```json
{
	"success": true,
	"statusCode": 201,
	"message": "String dalam bahasa Indonesia",
	"data": [
		{
			"user_id": "string",
			"user_name": "string",
			"password": "string" --> ini password yang diinput (bukan yang dihash)
		}
	]
}
```

Rasionalisasi mengapa menampilkan password yang diinput direspon adalah karena ini tools internal dan yang membuat user itu adalah owner dari perusahaan ini. Ini request pribadi beliau dan gabisa diganggu gugat. Nah, karena untuk saat ini belum ada mekanisme menastikan user ini statusnya aktif. Jaidnya kita akan otomatis set di DB statusnya aktif. Kita juga akan langsung masukkan datanya ke unit usaha yang dia di-assign ya.

Untuk mengedit data, kita akan menggunakan endpoint PATCH `/v1/users/:id`. Di endpoint ini kita akan menerima request `full_name`, `user_name`, `email` --> divalidasi secara ketat apakah emailnya valid atau tidak, `role_id`, `business_unit_id`, dan `status`. Di endpoint ini middleware `src\common\middlewares\require-permission.ts`akan mengecek permission`user:read`, `user:update`, dan `unit:assign_user`. Nah, karena ini kita menggunakan `PATCH`, ini Untuk endpoint ini, bentuk response yang diharapkan adalah sebagai berikut.

```json
{
	"success": true,
	"statusCode": 200, --> ini diambil dari response header gitu
	"message": "String dalam bahasa indonesia",
	"data": [
		{
			"user_id": "string",
			"full_name": "string",
			"user_name": "string", --> diambil dari kolom username
			"business_unit_id": "string",
			"business_unit_name": "string",
			"role_id": "string",
			"role_name": "string",
			"status": "string",
		}
	]
}
```

Ada endpoint untuk melihat detail data dengan endpoint GET `/v1/users/:id`. Di endpoint ini, middlewarenya akan cek permission `user:read` saja.

Ini bentuk response yang diharapkan dari endpoint ini.

```json
{
	"success": true,
	"statusCode": 200, --> ini diambil dari response header gitu
	"message": "String dalam bahasa indonesia",
	"data": [
		{
			"user_id": "string",
			"full_name": "string",
			"user_name": "string", --> diambil dari kolom username
			"business_unit_id": "string",
			"business_unit_name": "string",
			"role_id": "string",
			"role_name": "string",
			"status": "string",
		}
	]
}
```

Terakhir, endpoint yang akan kita buat adalah endpoint DELETE `/v1/users/:id`. Di endpoint ini, middlewarenya akan mengecek permission `user:read` dan `user:delete`.

Di endpoint ini, bentuk response yang diharapkan adalah sebagai berikut.

```json
{
	"success": true,
	"statusCode": 200, --> Ini diambil dari header gitu
	"message": "string dalam bahasa indonesia"
}
```

Kita akan membuatnya di domain users. Polanya ikuti dari domain auth. Buatkan juga useful logger di tingkat info, warn, dan error. Kemudian, buatkan juga dokumentasi swaggernya dan taruh di folder `src/swagger/users.swagger.ts`. Di swagger nanti, dokumentasinya harus lengkap. Meliputi semua kemungkinan http code di setiap endpoint dan harus ada example responsenya.

Kita akan menggunakan paradigma defensive programming, dimana kita akan menjalankan try catch dulu baru logicnya.

Ini adalah table-table yang mungkin kamu butuhkan dalam fitur ini.

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

-- public.user_units definition

-- Drop table

-- DROP TABLE public.user_units;

CREATE TABLE public.user_units (
	user_unit_id uuid DEFAULT gen_random_uuid() NOT NULL,
	user_id uuid NOT NULL,
	unit_id uuid NOT NULL,
	assigned_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	revoked_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
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
