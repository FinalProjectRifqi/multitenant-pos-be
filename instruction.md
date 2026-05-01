<context>

Kita akan membuat sebuah fitur pengecekan permission user. Jadi, fitur ini nanti akan mengecek apa saja sih yang bisa dilakukan oleh user. Datanya itu diambil dari table roles, permissions, user, dan role_permissions.

Ide besarnya adalah ketika user misalnya berpindah ke halaman X. Kita akan mengecek apakah user ini pertama-tama punya permission untuk melihat halaman X ini atau tidak. Kalau misalnya tidak. Maka kita akan kembalikan response 403 forbidden. Namun, apabila user memiliki permission untuk melihat (itu permission paling mendasar). Kita akan cek lagi permission apa saja yang bisa dilakukan oleh user. Karena nanti itu akan berpengaruh terhadap action yang bisa dilakukan oleh user.

Di dalam database, kita menyimpan permissionnya dengan format `menu:action`. Contohnya `user:add` itu berarti user bisa menambahkan user baru. Itu nanti dilihat lagi dari kolom deskripsi di table permissions.

Sekarang yang menajdi dilema itu adalah bagaimana fitur ini dibuat. Apakah melalui middleware, API endpoint, atau hal lain? We will not use background job for this feature.

Karena ide aku adalah nantinya setiap endpoint dipanggil. Let's say GET /v1/users yang tujuannya mendapatkan semua list user. Maka itu akan memanggil fitur ini dulu. Jadinya, kita harus mencari the most effective way to build this feature.

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
