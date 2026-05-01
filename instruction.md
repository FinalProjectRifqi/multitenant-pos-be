<context>

Kita akan membuat sebuah fitur kelola unit usaha. Dalam hal ini adalah CRUD unit usaha dan beberapa perintilan lainnya.

Untuk fitur ini kita akan membuat beberapa endpoint. Endpoint pertama yang akan kita buat adalah GET `/v1/business-units`. Di endpoint ini, kita juga bisa menerima query params `?search`. Query params itu nantinnya akan search nama unit usaha, alamat unit usaha, dan bahkan nomor telepon. Selain itu, endpoint ini juga menerima query params `?show_inactive`. Query params yang ini pilihannya "true" or "false". Lalu ada juga query params yang related dengan pagination, yaitu `?page` dan `?limit`. Secara default, nilai kedua params itu adalah 1 & 10. Nah, kita juga wajib memakai middleware `src\common\middlewares\require-permission.ts`. Permission yang kita butuhkan untuk endpoint ini adalah `unit:read` saja.

Bentuk response yang diharapkan dari endpoint ini adalah sebagai berikut

```json
{
	"success": true,
	"statusCode": 200, --> ini diambil dari response header gitu
	"message": "String dalam bahasa indonesia",
	"data": [
		{
			"business_unit_name": "string",
			"business_unit_address": "string",
			"business_unit_phone": "string",
			"business_unit_status": "string",
		},
	],
	"meta": {
		"page": integer,
		"limit": integer,
		"total": integer,
		"totalPages": integer
	}
}
```

Lalu, endpoint berikutnya adalah GET `/v1/business-units/stats`. Di endpoint ini tujuan kita adalah menampilkan data statistik dari unit bisnis yang ada. Di endpoint ini, middleware `src\common\middlewares\require-permission.ts` akan mengecek apakah ada permission `unit:read` saja. Untuk endpoint ini, bentuk response yang diharapkan adalah sebagai berikut

```json
{
	"success": true,
	"statusCode": 200, --> Ini diambil dari header gitu
	"message": "string dalam bahasa indonesia",
	"data": [
		{
			"total_business_unit": integer,
			"business_unit_active": integer,
			"business_unit_inactive": integer
		}
	]
}
```

Beralih ke endpoint selanjutnya adalah POST `/v1/business-units`. Di endpoint ini kita akan menerima request `business_unit_name`, `business_unit_address`, `business_unit_phone`, dan `in_active` yang menerima true or false. Kita harus validasi ketat, terutama untuk nomor telepon apakah itu nomor telepon valid atau tidak. Umm, untuk saat ini sih hanya di indonesia saja ya. Di endpoint ini, middleware `src\common\middlewares\require-permission.ts` akan mengecek permission `unit:read` dan `unit:create`. Untuk endpoint ini, bentuk response yang diharapkan adalah sebagai berikut.

```json
{
	"success": true,
	"statusCode": 201, --> Ini diambil dari header gitu
	"message": "string dalam bahasa indonesia",
	"data": [
		{
			"business_unit_name": "string",
			"business_unit_address": "string",
			"business_unit_phone": "string",
			"business_unit_status": "string",
		}
	]
}
```

Untuk mengedit data, kita akan menggunakan endpoint PATCH `/v1/business-units/:id`. Di endpoint ini kita akan menerima request `business_unit_name`, `business_unit_address`, `business_unit_phone`, dan `in_active` yang menerima true or false. Kita harus validasi ketat, terutama untuk nomor telepon apakah itu nomor telepon valid atau tidak. Umm, untuk saat ini sih hanya di indonesia saja ya. Di endpoint ini, middleware `src\common\middlewares\require-permission.ts` akan mengecek permission `unit:read` dan `unit:edit`. Nah, karena ini ktia menggunakan `PATCH`, ini berarti kita bisa mengganti data secara partial saja dan data lama ya yaudah tidak akan terganti. Di endpoint ini, bentuk response yang diharapkan adalah sebagai berikut.

```json
{
	"success": true,
	"statusCode": 200, --> Ini diambil dari header gitu
	"message": "string dalam bahasa indonesia",
	"data": [
		{
			"business_unit_name": "string",
			"business_unit_address": "string",
			"business_unit_phone": "string",
			"business_unit_status": "string",
		}
	]
}
```

Ada endpoint untuk melihat detail data dengan endpoint GET `/v1/business-units/:id`. Di endpoint ini, middlewarenya akan cek permission `unit:read` saja.

Ini bentuk response yang diharapkan dari endpoint ini.

````json

```json
{
	"success": true,
	"statusCode": 200, --> ini diambil dari response header gitu
	"message": "String dalam bahasa indonesia",
	"data":
		{
			"business_unit_name": "string",
			"business_unit_address": "string",
			"business_unit_phone": "string",
			"business_unit_status": "string",
		},

}
````

Terakhir, endpoint yang akan kita buat adalah endpoint DELETE `/v1/business-units/:id`. Di endpoint ini, middleware `src\common\middlewares\require-permission.ts` akan mengecek permission `unit:read` dan `unit:delete`.

Di endpoint ini, bentuk response yang diharapkan adalah sebagai berikut.

```json
{
	"success": true,
	"statusCode": 200, --> Ini diambil dari header gitu
	"message": "string dalam bahasa indonesia"
}
```

Kita akan membuatnya di domain business-units. Polanya ikuti dari domain auth. Buatkan juga useful logger di tingkat info, warn, dan error. Kemudian, buatkan juga dokumentasi swaggernya dan taruh di folder `src/swagger/business-units.swagger.ts`. Di swagger nanti, dokumentasinya harus lengkap. Meliputi semua kemungkinan http code di setiap endpoint dan harus ada example responsenya.

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
	deleted_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	must_change_password bool DEFAULT true NOT NULL,
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
	deleted_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT roles_pkey PRIMARY KEY (role_id),
	CONSTRAINT roles_role_code_unique UNIQUE (role_code)
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
	deleted_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT permissions_pkey PRIMARY KEY (permission_id)
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
	deleted_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT role_permissions_pkey PRIMARY KEY (role_permission_id),
	CONSTRAINT role_permissions_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES public.permissions(permission_id) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT role_permissions_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE ON UPDATE CASCADE
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
	CONSTRAINT units_status_check CHECK ((status = ANY (ARRAY['value1'::text, 'value2'::text])))
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
