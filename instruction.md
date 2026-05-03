<context>

Kita akan membuat fitur kelola menu. Jadi ini fitur CRUD gitu lah dengan perintilan lainnya.

Untuk fitur ini kita akan membuat beberapa endpoint. Endpoint pertama yang akan kita buat adalah GET `/v1/menus/:businessUnitId`. Di endpoint ini, kita juga bisa menerima query params `?search` yang akan mencari nama menu. Selain itu, endpoint ini menerima params `?sortBy` nah ini nanti bisa sort nama menu, kategori menu, dan harga menu. Kemudian bisa juga menerima query params `?sortType` yang isinya `ASC` atau `DESC`, dengan defaultnya adalah `ASC`. Lalu ada juga query params yang related dengan pagination, yaitu `?page` dan `?limit`. Secara default, nilai kedua params itu adalah 1 & 10. Nah, kita juga wajib memakai middleware `src\common\middlewares\require-permission.ts`. Permission yang kita butuhkan untuk endpoint ini adalah `menu:read` dan `menu_category:read`.

Bentuk response yang diharapkan dari endpoint ini adalah sebagai berikut.

```json
{
	"sucess": true,
	"statusCode": 200,
	"message": "String dalam bahasa indonesia",
	"data": [
		{
			"menu_id": "string",
			"menu_name": "string",
			"menu_category_id": "string",
			"menu_category_name": "string",
			"menu_price": integer,
			"menu_image": "string",
			"business_unit_id": "string",
			"business_unit_name": "string",
			"is_available": boolean,
		}
	],
	"meta": {
		"page": integer,
		"limit": integer,
		"total": integer,
		"totalPages": integer
	}
}
```

Nah, sebagai catatan, di sini kita akan menampilkan menu, regardless apakah menu itu available atau tidak. Kita akan memanfaatkan libs storage untuk mendapatkan url dari si menu_image nya ya. Kita akan mengambinya dari table `large_objects` dan bukan `menu_items`.

Lalu, endpoint berikutnya adalah GET `/v1/menus/:businessId/stats`. Tujuan utama dari endpoint ini adalah untuk melihat status dari semua menu di unit usaha tertentu. Nah, kita juga wajib menggunakan middleware `src\common\middlewares\require-permission.ts` yang akan mengecek permission `menu:read` dan `menu_category:read`. Untuk endpoint ini,response yang diharapkan adalah sebagai berikut.

```json
{
	"sucess": true,
	"statusCode": 200,
	"message": "String dalam bahasa indonesia",
	"data": {
		"total_menu": integer,
		"menu_active": integer,
		"menu_inactive": integer,
	}
}
```

Beralih ke endpoint selanjutnya adalah POST `/v1/menus/:businessId`. Jadi, tujuan dari endpoint ini adalah untuk menambah menu di unit usaha tertentu. Di endpoint ini kita akan menerima request `menu_name`, `menu_category_id`, `price`, `is_available` --> menerima true or false, dan `menu_image` --> ini opsional, wajib dicek mimetypenya itu image/\* dan max sizenya tidak boleh melebihi STORAGE_MAX_SIZE_PER_FILE. Kita juga akan menggunakan libs storage yang sudah ada. Nanti di sini kita tidak perlu menyimpan data ke kolom `image_url` di table `menu_items` karena nanti table itu akan dihapus. Nah, di Di endpoint ini middleware `src\common\middlewares\require-permission.ts` akan mengecek permission `menu:read`, `menu:create`. Untuk endpoint ini, bentuk response yang diharapkan adalah sebagai berikut.

```json
{
  "sucess": true,
  "statusCode": 201,
  "message": "String dalam bahasa indonesia",
  "data": {
			"menu_id": "string",
			"menu_name": "string",
			"menu_category_id": "string",
			"menu_category_name": "string",
			"menu_price": integer,
			"menu_image": "string",
			"is_available": boolean,
  }
}
```

Untuk mengedit data, kita akan menggunakan endpoint PATCH `/v1/menus/:businessId/:menuId`. Jadi, tujuan dari endpoint ini adalah untuk menambah menu di unit usaha tertentu. Di endpoint ini kita akan menerima request `menu_name`, `menu_category_id`, `price`, `is_available` --> menerima true or false, dan `menu_image` --> ini opsional, wajib dicek mimetypenya itu image/\* dan max sizenya tidak boleh melebihi STORAGE_MAX_SIZE_PER_FILE. Kita juga akan menggunakan libs storage yang sudah ada. Nanti di sini kita tidak perlu menyimpan data ke kolom `image_url` di table `menu_items` karena nanti table itu akan dihapus. Nah, di Di endpoint ini middleware `src\common\middlewares\require-permission.ts` akan mengecek permission `menu:read`, `menu:update`. Nah, karena ini kita menggunakan `PATCH`, ini Untuk endpoint ini, bentuk response yang diharapkan adalah sebagai berikut.

```json
{
  "sucess": true,
  "statusCode": 200,
  "message": "String dalam bahasa indonesia",
  "data": {
			"menu_id": "string",
			"menu_name": "string",
			"menu_category_id": "string",
			"menu_category_name": "string",
			"menu_price": integer,
			"menu_image": "string",
			"is_available": boolean,
  }
}
```

Ada endpoint untuk melihat detail data dengan endpoint GET `/v1/menus/:businessId/:menuId`. Di endpoint ini, middlewarenya akan cek permission `menu:read` saja.

```json
{
	"sucess": true,
	"statusCode": 200,
	"message": "String dalam bahasa indonesia",
	"data":
		{
			"menu_id": "string",
			"menu_name": "string",
			"menu_category_id": "string",
			"menu_category_name": "string",
			"menu_price": integer,
			"menu_image": "string",
			"business_unit_id": "string",
			"business_unit_name": "string",
			"is_available": boolean,
		}
}
```

Terakhir, endpoint yang akan kita buat adalah endpoint DELETE `/v1/menus/:businessId/:menuId`. Di endpoint ini, middlewarenya akan mengecek permission `menu:read` dan `menu:delete`. Kita juga akan menggunakan libs storage yang sudah ada untuk mengelola file image dari menunya ya.

```json
{
	"success": true,
	"statusCode": 200, --> Ini diambil dari header gitu
	"message": "string dalam bahasa indonesia"
}
```

Kita akan membuatnya di domain menus. Polanya ikuti dari domain auth, business-units, users, dan roles. Buatkan juga useful logger di tingkat info, warn, dan error. Kemudian, buatkan juga dokumentasi swaggernya dan taruh di folder `src/swagger/menus.swagger.ts`. Di swagger nanti, dokumentasinya harus lengkap. Meliputi semua kemungkinan http code di setiap endpoint dan harus ada example responsenya.

Kita akan menggunakan paradigma defensive programming, dimana kita akan menjalankan try catch dulu baru logicnya.

Ini adalah table-table yang mungkin kamu butuhkan dalam fitur ini.

```sql
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
