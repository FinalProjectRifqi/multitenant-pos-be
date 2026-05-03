<context>

Kita akan membuat sebuah fitur untuk mengupload, mengambil, mengedit, dan, menghapus file. Jadi, fitur ini akan memanfaatkan object storage dari Supabase. Pertama-tama ini adalah informasi koneksi penting untuk object storage Supabase kita.

```
STORAGE_URL=https://yftrnebyjqxohepbzgkq.supabase.co
STORAGE_SECRET_KEYS=sb_secret_DyVuMVdEDjEYTINyFgBSZA_hZqNBnud
STORAGE_BUCKET_NAME=uploads
STORAGE_MAX_SIZE_PER_FILE=5MB
```

Kamu hanya akan menulis lengkap credential di atas di file `.env`. Di file env lain cukup data dummy saja.

Kita akan membuat konfigurasi koneksinya di `src/config/storage.config.ts`.

Nah, lalu semua fungsionalitas seperti untuk mengupload, retrieve, dan menghapus filenya itu akan kita buat di `src/libs/storage`.

Mengapa kita membuatnya di sana? Karena rencananya itu adalah kita tidak akan membuatkan endpoint untuk seluruh fungsionalitas storage ini. Jadi, nanti domain yang membutuhkannya akan memanggil fungsi/method dari libs tersebut.

Di dalam folder libs itu juga akan ada folder dto, errors, models, repositories, kemudian ada file storage.controller.ts, storage.service.ts, dan storage.ts.

Untuk retrieved file itu kita akan mengugnakan signed file itu dengan TTL nya maybe di sekitar 6 jam (please give me suggestion regarding this) dan yang diambil itu adalah `stored_name` dari table `large_objects`. Nah, `stored_name` ini sendiri adalah string unique yang akan digenerate ketika proses upload dilakukan dan berhasil. Oiya, karena kita tidak membuat dan mendefinisikan "folder" apa yang ingin jadi tujuan dimana menyimpan filenya. Maka nanti domain yang menggunakan fungsi/method mengupload/mengedit akan menentukan mau di folder apa. Jika ternnyata di supabasenya belum ada, harus dibuat. Tapi, jika sudah ada, ya langusng taruh di sana saja.

Jadi nanti ketika di-retrieved filenya itu akan seperti ini ketika di-retrieved `storage_url/storage_bucket_name/folders_name/stored_name-signed.mimetype`. Alias itu mengambil dari kolom `path`, dimana `path` ini akan dibuat ketika mengupload/mengedit file.

Kita juga akan membuat useful log dengan tingkatan INFO, WARN, dan ERROR.

Kemudian, kita juga akan membuat unit test dan integration test. Integration testnya bertujuan untuk mengecek apakah siklus CRUD file sudah berhasil atau tidak. Semua bahan testnya ada di file `tests/assets/images/*`.

Kita akan menggunakan paradigma defensive programming, dimana kita akan menjalankan try catch dulu baru logicnya.

Ini adalah table-table yang mungkin kamu butuhkan dalam fitur ini.

```sql
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
