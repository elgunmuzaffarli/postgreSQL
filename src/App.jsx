import { useState } from "react";

const sections = [
  {
    id: "basics", icon: "🗄️", title: "PostgreSQL Əsasları", color: "#4FC3F7",
    topics: [
      {
        title: "Arxitektura",
        content: `PostgreSQL — obyekt-əlaqəli DBMS. 1996-cı ildən açıq mənbəli.

**Proses modeli:**
• Postmaster — əsas proses, portu dinləyir, uşaq prosesləri yaradır
• Backend process — hər müştəri bağlantısı üçün ayrıca proses (fork)
• Background Writer (bgwriter) — dirty page-ləri shared_buffers-dən diskə yazır
• WAL Writer — WAL buferini diskə yazır
• Checkpointer — checkpoint-ləri icra edir
• Autovacuum Launcher/Worker — autovacuum işlədər

**Yaddaş:**
• Shared Buffers — ümumi səhifə keşi (bütün backend-lər arasında paylaşılır)
• WAL Buffers — tranzaksiya jurnalı buferi
• Work Mem — sort/hash əməliyyatları üçün yaddaş (hər əməliyyat üçün)
• Maintenance Work Mem — VACUUM, CREATE INDEX üçün

**Saxlama:**
\`\`\`
$PGDATA/
  base/           -- verilənlər bazası faylları (OID-ə görə)
  global/         -- klaster sistem cədvəlləri
  pg_wal/         -- WAL seqmentləri (16MB hər biri)
  pg_xact/        -- tranzaksiya statusları
  postgresql.conf
  pg_hba.conf
  PG_VERSION
\`\`\`

**Sorğunun həyatı:**
Parser → Rewriter → Planner/Optimizer → Executor → nəticə`
      },
      {
        title: "Konfiqurasiya",
        content: `**Əsas parametrlər (postgresql.conf):**
\`\`\`
listen_addresses = '*'
port = 5432
max_connections = 200
shared_buffers = 4GB          -- RAM-ın 25%-i
work_mem = 16MB               -- sort/hash əməliyyatı başına
maintenance_work_mem = 512MB  -- VACUUM, CREATE INDEX
effective_cache_size = 12GB   -- RAM-ın 75%-i (planlayıcı üçün ipucu)
wal_level = replica
fsync = on                    -- HEÇ VAXT söndürməyin!
synchronous_commit = on
max_wal_size = 4GB
checkpoint_completion_target = 0.9
random_page_cost = 1.1        -- SSD üçün (HDD üçün 4.0)
log_min_duration_statement = 1000  -- 1 san-dən uzun sorğular
\`\`\`

**Dəyişikliklərin tətbiqi:**
\`\`\`sql
ALTER SYSTEM SET parametr = dəyər;
ALTER SYSTEM RESET parametr;
SELECT pg_reload_conf();  -- sighup parametrləri üçün restart lazım deyil
\`\`\``
      },
      {
        title: "pg_hba.conf",
        content: `**Sintaksis:**
\`\`\`
TIP  VERİLƏNLƏR_BAZASI  İSTİFADƏÇİ  ÜNVAN  METOD
\`\`\`

**Bağlantı tipləri:**
• local — Unix socket
• host — TCP (SSL və ya SSL-siz)
• hostssl — yalnız SSL
• hostnossl — yalnız SSL-siz

**Autentifikasiya metodları:**
• trust — şifrəsiz (yalnız localhost/infrastruktura üçün!)
• peer — OS username = DB username (yalnız local)
• scram-sha-256 — SCRAM (tövsiyə edilir, PG 10+)
• cert — SSL müştəri sertifikatı
• ldap — LDAP server
• reject — həmişə rədd et

**Nümunələr:**
\`\`\`
local   all          postgres                  peer
host    replication  replicator  10.0.0.0/8   scram-sha-256
host    mydb         app_user    10.10.0.5/32  scram-sha-256
hostssl all          all         0.0.0.0/0    scram-sha-256
host    all          all         0.0.0.0/0    reject
\`\`\`

**Vacib:** fayl yuxarıdan aşağı oxunur, İLK uyğunluq tətbiq edilir!`
      },
      {
        title: "psql və alətlər",
        content: `**Bağlantı:**
\`\`\`bash
psql -U postgres -d mydb -h localhost -p 5432
psql "postgresql://user:pass@host:5432/db?sslmode=require"
psql -U postgres -c "SELECT version();"
psql -U postgres -f skript.sql
\`\`\`

**Meta-əmrlər:**
\`\`\`
\\l [+]          -- verilənlər bazaları
\\c dbname       -- bazanı dəyiş
\\dt [+]         -- cədvəllər
\\d cədvəl       -- cədvəl strukturu
\\d+ cədvəl      -- əlavə məlumatla
\\di             -- indekslər
\\dv             -- görünüşlər
\\dm             -- materialized görünüşlər
\\df             -- funksiyalar
\\dn             -- sxemlər
\\du             -- rollar
\\dp cədvəl      -- imtiyazlar
\\timing on      -- vaxt ölçümü
\\x on|off|auto  -- genişləndirilmiş çıxış
\\e              -- redaktor
\\i fayl.sql     -- faylı icra et
\\watch 2        -- hər 2 san-dən bir təkrar et
\\q              -- çıxış
\`\`\`

**Sistem alətləri:**
\`\`\`bash
initdb -D /var/lib/postgresql/data
pg_ctl start|stop|restart|reload|status -D /data
pg_dump / pg_dumpall / pg_restore
pg_basebackup  -- fiziki ehtiyat nüsxəsi
vacuumdb -U postgres -d mydb -v
\`\`\``
      },
      {
        title: "Verilənlər Bazası Obyektləri",
        content: `**Verilənlər bazaları və sxemlər:**
\`\`\`sql
CREATE DATABASE mydb
    OWNER postgres ENCODING 'UTF8'
    LC_COLLATE 'az_AZ.UTF-8' TEMPLATE template0;

CREATE SCHEMA app;
SET search_path = app, public;
ALTER ROLE app_user SET search_path = app, public;

SELECT datname, pg_size_pretty(pg_database_size(datname))
FROM pg_database ORDER BY pg_database_size(datname) DESC;
\`\`\`

**Ardıcıllıqlar (Sequences):**
\`\`\`sql
CREATE SEQUENCE order_seq START 1000 INCREMENT 5 CACHE 20;
SELECT nextval('order_seq');
SELECT currval('order_seq');
SELECT setval('order_seq', 5000);

-- IDENTITY (SERIAL-in müasir əvəzi)
CREATE TABLE t (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
);
\`\`\`

**Görünüşlər (Views):**
\`\`\`sql
CREATE OR REPLACE VIEW aktiv_isleciler AS
SELECT id, ad, maas, dept_id
FROM islechiler WHERE aktiv = true;

CREATE MATERIALIZED VIEW dept_statistika AS
SELECT dept_id, COUNT(*) as say, AVG(maas) as ort_maas
FROM islechiler GROUP BY dept_id WITH DATA;

REFRESH MATERIALIZED VIEW CONCURRENTLY dept_statistika;
CREATE UNIQUE INDEX ON dept_statistika (dept_id);
\`\`\`

**Tablespace-lər:**
\`\`\`sql
CREATE TABLESPACE ssd_fast LOCATION '/mnt/ssd/pg_data';
CREATE TABLE isti_cedvel (...) TABLESPACE ssd_fast;
\`\`\``
      }
    ]
  },
  {
    id: "sql", icon: "📝", title: "PostgreSQL-də SQL", color: "#81C784",
    topics: [
      {
        title: "Məlumat tipləri",
        content: `**Ədədi tiplər:**
\`\`\`sql
SMALLINT          -- 2 bayt
INTEGER / INT     -- 4 bayt
BIGINT            -- 8 bayt
NUMERIC(p,s)      -- dəqiq onluq
REAL              -- 4 bayt float
DOUBLE PRECISION  -- 8 bayt float
\`\`\`

**Mətn tipləri:**
\`\`\`sql
CHAR(n)     -- sabit uzunluq
VARCHAR(n)  -- n simvola qədər
TEXT        -- limitsiz uzunluq (tövsiyə edilir!)
\`\`\`

**Tarix və vaxt:**
\`\`\`sql
DATE                -- YYYY-MM-DD
TIME / TIMETZ       -- vaxt
TIMESTAMP / TIMESTAMPTZ  -- tarix+vaxt
INTERVAL            -- müddət: '2 il 3 ay 5 gün'

NOW() / CURRENT_TIMESTAMP
CLOCK_TIMESTAMP()   -- tranzaksiyada real vaxt
DATE_TRUNC('ay', ts)
EXTRACT(il FROM ts)
ts + INTERVAL '30 gün'
AGE(ts1, ts2)
\`\`\`

**PostgreSQL xüsusi tipləri:**
\`\`\`sql
UUID              -- gen_random_uuid() (PG 13+)
BOOLEAN           -- true/false/null
BYTEA             -- ikili məlumatlar
INET / CIDR       -- IP ünvanlar
JSONB / JSON      -- JSON (JSONB üstündür!)
INT4RANGE / TSRANGE / DATERANGE  -- aralıqlar
TSVECTOR / TSQUERY -- tam mətn axtarışı
\`\`\`

**Massivlər:**
\`\`\`sql
CREATE TABLE t (etiketler TEXT[], xallar INTEGER[]);
INSERT INTO t VALUES (ARRAY['pg','sql'], '{90,85,95}');
SELECT etiketler[1] FROM t;
SELECT * FROM t WHERE 'pg' = ANY(etiketler);
SELECT unnest(etiketler) FROM t;  -- sıralara aç
\`\`\``
      },
      {
        title: "DDL — Struktur Tərifləri",
        content: `**Cədvəl yaratma:**
\`\`\`sql
CREATE TABLE islechiler (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ad          TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    maas        NUMERIC(12,2) CHECK (maas > 0),
    dept_id     INTEGER REFERENCES departamentler(id)
                    ON DELETE SET NULL ON UPDATE CASCADE,
    status      TEXT DEFAULT 'aktiv'
                    CHECK (status IN ('aktiv','deaktiv','iscidan_cixib')),
    yaradildi   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ad_dept UNIQUE (ad, dept_id)
);
\`\`\`

**Məhdudiyyətlər:**
\`\`\`sql
ALTER TABLE t ADD CONSTRAINT chk_maas CHECK (maas > 0) NOT VALID;
ALTER TABLE t VALIDATE CONSTRAINT chk_maas;  -- ayrıca, qısa kilid

ALTER TABLE t ADD CONSTRAINT fk_dept
    FOREIGN KEY (dept_id) REFERENCES depts(id)
    DEFERRABLE INITIALLY DEFERRED;
\`\`\`

**Cədvəl dəyişiklikləri (təhlükəsiz):**
\`\`\`sql
ALTER TABLE t ADD COLUMN yeni_sutun TEXT;
ALTER TABLE t ADD COLUMN sutun TEXT DEFAULT 'deger';  -- PG 11+: ani!
ALTER TABLE t DROP COLUMN IF EXISTS kohn_sutun;
ALTER TABLE t ALTER COLUMN sutun SET DEFAULT 0;
ALTER TABLE t ALTER COLUMN sutun SET NOT NULL;
ALTER TABLE t RENAME COLUMN kohn TO yeni;
ALTER TABLE t RENAME TO yeni_ad;
\`\`\``
      },
      {
        title: "DML — Məlumat Manipulyasiyası",
        content: `**INSERT:**
\`\`\`sql
INSERT INTO islechiler (ad, email, maas)
VALUES ('Əli', 'eli@mail.az', 75000)
RETURNING id, yaradildi;

INSERT INTO islechiler (ad, email, maas) VALUES
    ('Aynur', 'aynur@mail.az', 80000),
    ('Rauf', 'rauf@mail.az', 90000);

-- Konflikt zamanı yeniləmə (UPSERT)
INSERT INTO islechiler (email, ad, maas)
VALUES ('eli@mail.az', 'Əli', 85000)
ON CONFLICT (email) DO UPDATE
    SET maas = EXCLUDED.maas, yenilendi = NOW();

INSERT INTO t (id, deger) VALUES (1, 'x')
ON CONFLICT DO NOTHING;
\`\`\`

**UPDATE:**
\`\`\`sql
UPDATE islechiler e
SET maas = e.maas * d.artim_faktoru
FROM departamentler d
WHERE e.dept_id = d.id AND d.bucdze > 1000000
RETURNING e.id, e.ad, e.maas;
\`\`\`

**DELETE:**
\`\`\`sql
DELETE FROM sifarisler s
USING musteri c
WHERE s.musteri_id = c.id AND c.bloklanib = true;

TRUNCATE TABLE islechiler RESTART IDENTITY CASCADE;
\`\`\`

**COPY — sürətli yükləmə:**
\`\`\`sql
COPY islechiler (ad, email, maas)
FROM '/tmp/islechiler.csv' CSV HEADER;

COPY islechiler TO '/tmp/ixrac.csv' CSV HEADER;
\`\`\``
      },
      {
        title: "SELECT və JOIN",
        content: `**JOIN növləri:**
\`\`\`sql
-- INNER JOIN
SELECT e.ad, d.ad AS dept
FROM islechiler e JOIN departamentler d ON e.dept_id = d.id;

-- LEFT JOIN
SELECT e.ad, d.ad AS dept
FROM islechiler e LEFT JOIN departamentler d ON e.dept_id = d.id;

-- SELF JOIN
SELECT e.ad, m.ad AS menecer
FROM islechiler e LEFT JOIN islechiler m ON e.menecer_id = m.id;
\`\`\`

**EXISTS (IN-dən daha səmərəli):**
\`\`\`sql
SELECT * FROM departamentler d WHERE EXISTS (
    SELECT 1 FROM islechiler e
    WHERE e.dept_id = d.id AND e.maas > 100000
);
\`\`\`

**GROUP BY və aqreqatlar:**
\`\`\`sql
SELECT dept_id, COUNT(*) AS say, AVG(maas) AS ort_maas,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY maas) AS median,
       STRING_AGG(ad, ', ' ORDER BY ad) AS adlar
FROM islechiler
GROUP BY dept_id HAVING COUNT(*) > 5
ORDER BY ort_maas DESC;

-- GROUPING SETS, ROLLUP, CUBE
SELECT dept_id, status, COUNT(*)
FROM islechiler
GROUP BY GROUPING SETS ((dept_id), (status), ());
\`\`\``
      },
      {
        title: "Pəncərə Funksiyaları",
        content: `**Sintaksis:**
\`\`\`sql
funksiya() OVER (
    [PARTITION BY sutun1, sutun2]
    [ORDER BY sutun3 DESC]
    [ROWS|RANGE BETWEEN ... AND ...]
)
\`\`\`

**Sıralama funksiyaları:**
\`\`\`sql
SELECT ad, maas, dept_id,
    ROW_NUMBER() OVER (ORDER BY maas DESC) AS sira,
    RANK()       OVER (ORDER BY maas DESC) AS rank,
    DENSE_RANK() OVER (ORDER BY maas DESC) AS sıx_rank,
    NTILE(4)     OVER (ORDER BY maas DESC) AS kvartil,
    PERCENT_RANK() OVER (ORDER BY maas)   AS faiz_rank
FROM islechiler;
\`\`\`

**Naviqasiya funksiyaları:**
\`\`\`sql
SELECT ad, maas,
    LAG(maas)  OVER (PARTITION BY dept_id ORDER BY yaradildi) AS evvelki_maas,
    LEAD(maas) OVER (PARTITION BY dept_id ORDER BY yaradildi) AS novbeti_maas,
    FIRST_VALUE(maas) OVER (PARTITION BY dept_id ORDER BY maas DESC) AS en_yuksek
FROM islechiler;
\`\`\`

**Aqreqatlar pəncərə kimi:**
\`\`\`sql
SELECT ad, maas, dept_id,
    SUM(maas) OVER (PARTITION BY dept_id) AS dept_toplam,
    AVG(maas) OVER (PARTITION BY dept_id) AS dept_ort,
    SUM(maas) OVER (ORDER BY yaradildi
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS yigilma_toplam
FROM islechiler;
\`\`\`

**Hər qrupdan TOP N:**
\`\`\`sql
SELECT dept_id, ad, maas FROM (
    SELECT dept_id, ad, maas,
           ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY maas DESC) AS sn
    FROM islechiler
) t WHERE sn <= 3;  -- hər departamentdə top-3
\`\`\``
      },
      {
        title: "CTE və LATERAL",
        content: `**Adi CTE:**
\`\`\`sql
WITH dept_stat AS (
    SELECT dept_id, AVG(maas) AS ort_maas, COUNT(*) AS say
    FROM islechiler GROUP BY dept_id
),
zengin_dept AS (
    SELECT d.ad, ds.ort_maas, ds.say, ds.ort_maas * ds.say AS ümumi_xərc
    FROM departamentler d JOIN dept_stat ds ON d.id = ds.dept_id
)
SELECT * FROM zengin_dept WHERE ümumi_xərc > 1000000;
\`\`\`

**Rekursiv CTE:**
\`\`\`sql
WITH RECURSIVE org AS (
    SELECT id, ad, menecer_id, 0 AS dərinlik, ad::TEXT AS yol
    FROM islechiler WHERE menecer_id IS NULL
    UNION ALL
    SELECT e.id, e.ad, e.menecer_id, o.dərinlik+1, o.yol || ' → ' || e.ad
    FROM islechiler e JOIN org o ON e.menecer_id = o.id
    WHERE o.dərinlik < 10
)
SELECT dərinlik, yol FROM org ORDER BY yol;
\`\`\`

**LATERAL JOIN:**
\`\`\`sql
-- Hər müştərinin son sifarişi
SELECT m.ad, s.mebleg, s.tarix
FROM musteriler m,
LATERAL (
    SELECT mebleg, tarix FROM sifarisler
    WHERE musteri_id = m.id ORDER BY tarix DESC LIMIT 1
) s;
\`\`\`

**MATERİALİZED CTE (PG 12+):**
\`\`\`sql
WITH bahalı AS MATERIALIZED (
    SELECT * FROM böyük_cedvel WHERE şərt
)
SELECT * FROM bahalı WHERE sutun = 1
UNION ALL
SELECT * FROM bahalı WHERE sutun = 2;
\`\`\``
      },
      {
        title: "JSON və JSONB",
        content: `**JSON vs JSONB:**
• JSON — mətni olduğu kimi saxlayır
• JSONB — ikili format, indekslər dəstəklənir → HƏMIŞƏ JSONB istifadə edin!

**Giriş operatorları:**
\`\`\`sql
data->'istifadeci_id'           -- JSONB dəyər
data->>'istifadeci_id'          -- mətn dəyər
data->'elementler'->0            -- massiv elementi
data#>>'{meta,olke}'             -- yolə görə (mətn)
data ? 'istifadeci_id'           -- açar mövcuddur
data @> '{"emel":"alıs"}'::jsonb -- ehtiva edir
\`\`\`

**JSONB dəyişdirmə:**
\`\`\`sql
UPDATE hadiseler
SET data = jsonb_set(data, '{meta,islendi}', 'true');
UPDATE hadiseler SET data = data - 'meta';
UPDATE hadiseler SET data = data || '{"status":"hazır"}';
\`\`\`

**İndekslər:**
\`\`\`sql
CREATE INDEX ON hadiseler USING GIN (data);
CREATE INDEX ON hadiseler USING GIN (data jsonb_path_ops);
CREATE INDEX ON hadiseler ((data->>'istifadeci_id'));
\`\`\``
      }
    ]
  },
  {
    id: "indexes", icon: "⚡", title: "İndekslər", color: "#FFB74D",
    topics: [
      {
        title: "İndeks növləri",
        content: `**B-Tree (standart):** =, <, >, BETWEEN, IN, IS NULL, LIKE 'prefix%'
\`\`\`sql
CREATE INDEX idx_ad ON islechiler (ad);
CREATE UNIQUE INDEX idx_email ON islechiler (email);
CREATE INDEX idx_dept_maas ON islechiler (dept_id, maas DESC NULLS LAST);
CREATE INDEX idx_aktiv ON islechiler (email) WHERE silinme_tarixi IS NULL;
CREATE INDEX idx_kicik ON islechiler (LOWER(email));
CREATE INDEX idx_ortulu ON islechiler (dept_id) INCLUDE (ad, maas);
\`\`\`

**Hash:** yalnız = üçün (bərabərlik üçün B-Tree-dən sürətli)
\`\`\`sql
CREATE INDEX ON sessialar USING HASH (sessiya_tokeni);
\`\`\`

**GIN:** massivlər, JSONB, tsvector
\`\`\`sql
CREATE INDEX ON meqaleler USING GIN (etiketler);
CREATE INDEX ON hadiseler USING GIN (data);
CREATE INDEX ON senedler  USING GIN (axtaris_vektoru);
CREATE INDEX ON t         USING GIN (ad gin_trgm_ops);
\`\`\`

**GiST:** həndəsə, aralıqlar, PostGIS
\`\`\`sql
CREATE INDEX ON yerler      USING GIST (nokta_sutun);
CREATE INDEX ON rezervasiya USING GIST (muddet);  -- TSRANGE
\`\`\`

**BRIN:** böyük append-only cədvəllər üçün kiçik indeks
\`\`\`sql
CREATE INDEX ON jurnal USING BRIN (yaradildi) WITH (pages_per_range=128);
\`\`\``
      },
      {
        title: "İndeks strategiyaları",
        content: `**ESR qaydası (Equality → Sort → Range):**
\`\`\`sql
-- Sorğu:
SELECT * FROM sifarisler
WHERE musteri_id = 42 AND status = 'gozleyir'
ORDER BY yaradildi LIMIT 20;

-- Optimal indeks:
CREATE INDEX ON sifarisler (musteri_id, status, yaradildi);
\`\`\`

**Az seçici sütunlar üçün qismli indeks:**
\`\`\`sql
-- status üçün ayrıca indeks əvəzinə:
CREATE INDEX ON sifarisler (yaradildi) WHERE status = 'gozleyir';
\`\`\`

**Örtücü indeks (INCLUDE):**
\`\`\`sql
CREATE INDEX idx_ortulu ON islechiler (dept_id)
INCLUDE (ad, maas);
-- Index Only Scan → cədvələ müraciət lazım deyil
\`\`\`

**İndeks istifadə edilmədiyi hallar:**
• Cədvəl kiçikdir — Seq Scan daha ucuzdur
• Sütun üzərində funksiya var (WHERE UPPER(email) = 'ƏLİ')
• Aşağı seçicilik (WHERE cins = 'K' → 50% sətir)
• Örtük tip çevrilməsi: WHERE varchar_sutun = 123

**İstifadə edilməyən indekslər:**
\`\`\`sql
SELECT schemaname, tablename, indexname, idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid)) AS ölçü
FROM pg_stat_user_indexes WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
\`\`\`

**Online yaratma/silmə:**
\`\`\`sql
CREATE INDEX CONCURRENTLY idx_yeni ON t (sutun);
DROP INDEX CONCURRENTLY idx_kohn;
REINDEX INDEX CONCURRENTLY idx_ad;
\`\`\``
      },
      {
        title: "EXPLAIN ANALYZE",
        content: `**Sintaksis:**
\`\`\`sql
EXPLAIN SELECT ...;
EXPLAIN ANALYZE SELECT ...;
EXPLAIN (ANALYZE, BUFFERS) SELECT ...;
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT ...;
\`\`\`

**İcra planı qovşaqları:**
• Seq Scan — cədvəlin tam taranması
• Index Scan — indeks üzrə axtarış + cədvəldən oxuma
• Index Only Scan — yalnız indeksdən (örtücü indeks — ideal!)
• Bitmap Heap Scan — bit xəritəsi ilə yığın tarama
• Hash Join — böyük cədvəllər üçün hash birləşmə
• Nested Loop — kiçik xarici cədvəl üçün
• Merge Join — sıralanmış dəstlərin birləşməsi
• Sort, Aggregate, HashAggregate
• Gather — paralel worker nəticələrinin toplanması

**Şərh:**
\`\`\`
cost=0.00..1234.56 rows=50000 width=64
    ^başlanğıc ^cəmi   ^gözlənilən  ^sətir eni
(actual time=0.042..15.3 rows=48921 loops=1)
Buffers: shared hit=823 read=12  -- keş vs disk
Filter: (maas > 50000)
Rows Removed by Filter: 1079
\`\`\`

**Statistika problemi:**
\`\`\`sql
ANALYZE islechiler;
ALTER TABLE islechiler ALTER COLUMN maas SET STATISTICS 500;
CREATE STATISTICS stat ON dept_id, maas FROM islechiler;
\`\`\`

**Onlayn alətlər:**
• explain.depesz.com — rəngli analiz
• explain.dalibo.com — ağac vizuallaşdırma`
      },
      {
        title: "pg_stat_statements",
        content: `**Qurulum:**
\`\`\`
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.max = 10000
pg_stat_statements.track = all
pg_stat_statements.track_io_timing = on
\`\`\`
\`\`\`sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
\`\`\`

**Ən yavaş sorğular:**
\`\`\`sql
SELECT query, calls,
       round(total_exec_time::numeric, 2) AS cəmi_ms,
       round(mean_exec_time::numeric, 2)  AS ort_ms,
       rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC LIMIT 10;
\`\`\`

**Diskdən oxuma:**
\`\`\`sql
SELECT query, shared_blks_read AS disk_oxuma,
       shared_blks_hit AS kes_vurma,
       round(shared_blks_hit::numeric /
             NULLIF(shared_blks_hit+shared_blks_read,0)*100,1) AS kes_faizi
FROM pg_stat_statements WHERE shared_blks_read > 1000
ORDER BY disk_oxuma DESC LIMIT 10;
\`\`\`

**Müvəqqəti fayllar (work_mem çatmır):**
\`\`\`sql
SELECT query, temp_blks_written
FROM pg_stat_statements WHERE temp_blks_written > 0
ORDER BY temp_blks_written DESC LIMIT 10;
\`\`\`

\`\`\`sql
SELECT pg_stat_statements_reset();  -- statistikanı sıfırla
\`\`\``
      }
    ]
  },
  {
    id: "transactions", icon: "🔒", title: "Tranzaksiyalar və MVCC", color: "#F48FB1",
    topics: [
      {
        title: "ACID və Tranzaksiyalar",
        content: `**ACID:**
• Atomicity — hamısı ya heç biri
• Consistency — məhdudiyyətlər pozulmur
• Isolation — tranzaksiyalar bir-birindən təcrid edilir
• Durability — qeydə alınmış məlumatlar saxlanır (WAL → disk)

**İdarəetmə:**
\`\`\`sql
BEGIN;
BEGIN ISOLATION LEVEL SERIALIZABLE;
BEGIN READ ONLY;

COMMIT;
ROLLBACK;

SAVEPOINT sp1;
ROLLBACK TO SAVEPOINT sp1;
RELEASE SAVEPOINT sp1;

-- DDL tranzaksiyalarda dəstəklənir!
BEGIN;
  ALTER TABLE t ADD COLUMN yeni_sutun TEXT;
  UPDATE t SET yeni_sutun = 'default';
COMMIT;  -- ya da ROLLBACK — DDL də geri qaytarılır!
\`\`\`

**Tranzaksiya vəziyyətləri:**
• active — sorğu icra edilir
• idle — növbəti əmri gözləyir
• idle in transaction — BEGIN-siz COMMIT (təhlükəli!)
• idle in transaction (aborted) — xəta, ROLLBACK lazımdır

\`\`\`sql
-- Donmuş tranzaksiyaları öldür
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle in transaction'
  AND now() - state_change > interval '10 dəqiqə';

SET idle_in_transaction_session_timeout = '5min';
\`\`\``
      },
      {
        title: "MVCC",
        content: `**MVCC (Çox Versiyalı Paralellik İdarəetməsi) necə işləyir:**

Hər sətirdə gizli sistem sahələri var:
• xmin — sətiri yaradan tranzaksiyanın ID-si
• xmax — sətiri silən tranzaksiyanın ID-si (0 isə aktivdir)
• ctid — fiziki yer (blok, ofset)

\`\`\`sql
SELECT xmin, xmax, ctid, id, ad FROM islechiler LIMIT 5;
\`\`\`

**UPDATE zamanı:**
1. Köhnə sətir: xmax = cari xid ilə işarələnir
2. Yeni sətir: xmin = cari xid ilə yaradılır
Hər ikisi diskdədir → VACUUM lazımdır!

**DELETE zamanı:**
Sətir xmax ilə işarələnir, VACUUM-a qədər fiziki silinmir.

**Snapshot (Anlıq görüntü):**
Tranzaksiya başlayanda aktiv XID-lərin siyahısı götürülür.
Sətir görünür: xmin qeydə alınıb VƏ (xmax=0 YAXUD xmax qeydə alınmayıb)

**Transaction ID Wraparound:**
\`\`\`sql
SELECT datname, age(datfrozenxid),
       2147483647 - age(datfrozenxid) AS qalan_xid
FROM pg_database ORDER BY age(datfrozenxid) DESC;
-- age > ~1.5 mlrd → TƏHLÜKƏLİ!

VACUUM FREEZE cedvel_adi;
-- autovacuum_freeze_max_age = 200mln (standart)
\`\`\``
      },
      {
        title: "İzolyasiya Səviyyələri",
        content: `| Səviyyə | Dirty Read | Non-repeatable | Phantom |
| Read Committed | xeyr | mümkündür | mümkündür |
| Repeatable Read | xeyr | xeyr | xeyr (PG-də) |
| Serializable | xeyr | xeyr | xeyr |

**Read Committed (standart):**
Hər statement ən son qeydə alınmış məlumatları görür.
Problem: eyni tranzaksiyada fərqli SELECT nəticələri.

**Repeatable Read:**
\`\`\`sql
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
-- Snapshot bir dəfə götürülür (ilk SELECT-də)
-- Konflikt: ERROR: could not serialize access
\`\`\`

**Serializable (SSI):**
\`\`\`sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- Tam serializasiya (PG 9.1+)
-- Konfliktdə: ERROR: could not serialize access
-- Tətbiq tranzaksiyanı MÜTLƏQ təkrar etməlidir!
\`\`\`

**Serializable üçün təkrar şablonu:**
\`\`\`sql
-- Tətbiqdə (psevdokod):
LOOP
  BEGIN;
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  -- biznes məntiqi...
  COMMIT;
  EXIT;  -- uğur
  EXCEPTION WHEN serialization_failure THEN
    ROLLBACK;
    -- fasilə və təkrar
END LOOP;
\`\`\``
      },
      {
        title: "Kilid mexanizmi",
        content: `**Cədvəl kilid növləri (zəifdən güclüyə):**
\`\`\`
ACCESS SHARE            -- SELECT
ROW SHARE               -- SELECT FOR UPDATE/SHARE
ROW EXCLUSIVE           -- INSERT, UPDATE, DELETE
SHARE UPDATE EXCLUSIVE  -- VACUUM, ANALYZE, CREATE INDEX CONCURRENTLY
SHARE                   -- CREATE INDEX (CONCURRENTLY-siz)
EXCLUSIVE               -- REFRESH MATERIALIZED VIEW CONCURRENTLY
ACCESS EXCLUSIVE        -- ALTER TABLE, DROP, TRUNCATE, VACUUM FULL
\`\`\`

**Sətir kilidi:**
\`\`\`sql
SELECT * FROM t WHERE id = 1 FOR UPDATE;
SELECT * FROM t WHERE id = 1 FOR UPDATE SKIP LOCKED;
SELECT * FROM t WHERE id = 1 FOR UPDATE NOWAIT;
SELECT * FROM t WHERE id = 1 FOR SHARE;
\`\`\`

**Kilid monitorinqi:**
\`\`\`sql
SELECT blocked.pid AS blok_pid, blocked.query AS blok_sorgu,
       blocking.pid AS bloke_eden_pid, blocking.query AS bloke_eden_sorgu,
       now()-blocked.query_start AS gozleme_muddeti
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking
    ON blocking.pid = ANY(pg_blocking_pids(blocked.pid));

SELECT pg_cancel_backend(pid);    -- yumşaq: sorğunu ləğv et
SELECT pg_terminate_backend(pid); -- sərt: bağlantını öldür

SET lock_timeout = '5s';
SET statement_timeout = '30s';
SET deadlock_timeout = '1s';
\`\`\``
      },
      {
        title: "Advisory Locks",
        content: `**Tətbiq kilid mexanizmi (obyektlərə bağlı deyil):**

**Sessiya kilidi:**
\`\`\`sql
SELECT pg_advisory_lock(42);            -- al (gözlə)
SELECT pg_advisory_unlock(42);          -- burax
SELECT pg_advisory_unlock_all();        -- hamısını burax
SELECT pg_try_advisory_lock(42);        -- gözləmədən → boolean
SELECT pg_advisory_lock_shared(42);     -- paylaşılan kilit
\`\`\`

**Tranzaksiya kilidi (COMMIT/ROLLBACK-da avtomatik azad olur):**
\`\`\`sql
SELECT pg_advisory_xact_lock(42);
SELECT pg_try_advisory_xact_lock(42);
\`\`\`

**Tapşırığın paralel işləməsinin qarşısını alma:**
\`\`\`sql
DO $$
BEGIN
    IF NOT pg_try_advisory_lock(hashtext('gece_hesabati')) THEN
        RAISE NOTICE 'Artıq işləyir, ötür';
        RETURN;
    END IF;
    -- tapşırığı icra et...
    PERFORM pg_advisory_unlock(hashtext('gece_hesabati'));
END $$;
\`\`\`

**İş növbəsi şablonu:**
\`\`\`sql
SELECT id, yuk FROM isler
WHERE status = 'gozleyir'
  AND pg_try_advisory_lock(id)
ORDER BY oncelik DESC, yaradildi
LIMIT 1 FOR UPDATE SKIP LOCKED;
\`\`\`

\`\`\`sql
SELECT pid, classid, objid, mode, granted
FROM pg_locks WHERE locktype = 'advisory';
\`\`\``
      }
    ]
  },
  {
    id: "performance", icon: "🚀", title: "Performans", color: "#CE93D8",
    topics: [
      {
        title: "VACUUM və şişkinlik",
        content: `**VACUUM nə üçün lazımdır:**
• Ölü sətirləri (dead tuples) silir → yenidən istifadə üçün yer açır
• Görünürlük xəritəsini yeniləyir → Index Only Scan-i sürətləndirir
• XID-ləri dondurur (wraparound-un qarşısını alır)
• Diski OS-ə qaytırmır (yalnız VACUUM FULL bunu edir)

\`\`\`sql
VACUUM cedvel_adi;
VACUUM VERBOSE cedvel_adi;
VACUUM ANALYZE cedvel_adi;
VACUUM FREEZE cedvel_adi;
VACUUM FULL cedvel_adi;   -- KİLİDLƏYİR! maintenance window-da istifadə edin
\`\`\`

**Autovacuum parametrləri:**
\`\`\`
autovacuum_vacuum_threshold = 50
autovacuum_vacuum_scale_factor = 0.2
autovacuum_analyze_scale_factor = 0.1
autovacuum_vacuum_cost_delay = 2ms
\`\`\`

**İsti cədvəl üçün:**
\`\`\`sql
ALTER TABLE sifarisler SET (
    autovacuum_vacuum_scale_factor = 0.01,
    autovacuum_analyze_scale_factor = 0.005,
    autovacuum_vacuum_cost_delay = 0,
    autovacuum_vacuum_cost_limit = 1000
);
\`\`\`

**Monitorinq:**
\`\`\`sql
SELECT relname, n_live_tup, n_dead_tup,
       round(n_dead_tup::numeric/NULLIF(n_live_tup+n_dead_tup,0)*100,1) AS olu_faiz,
       last_vacuum, last_autovacuum
FROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 20;
\`\`\``
      },
      {
        title: "Partisiyalama",
        content: `**RANGE — aralıq üzrə:**
\`\`\`sql
CREATE TABLE sifarisler (
    id BIGINT, yaradildi TIMESTAMPTZ NOT NULL, mebleg NUMERIC
) PARTITION BY RANGE (yaradildi);

CREATE TABLE sifarisler_2024q1 PARTITION OF sifarisler
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
CREATE TABLE sifarisler_default PARTITION OF sifarisler DEFAULT;
\`\`\`

**LIST — dəyərlər siyahısı:**
\`\`\`sql
CREATE TABLE satislar PARTITION BY LIST (region);
CREATE TABLE satislar_az PARTITION OF satislar
    FOR VALUES IN ('Bakı', 'Gəncə', 'Sumqayıt');
\`\`\`

**HASH — bərabər paylanma:**
\`\`\`sql
CREATE TABLE jurnallar PARTITION BY HASH (istifadeci_id);
CREATE TABLE jurnallar_p0 PARTITION OF jurnallar
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);
\`\`\`

**İdarəetmə:**
\`\`\`sql
-- Yeni partisiya əlavə et
CREATE TABLE sifarisler_2025q1 PARTITION OF sifarisler
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

-- Ayır (PG 14+: CONCURRENTLY — kilidləmədən)
ALTER TABLE sifarisler DETACH PARTITION sifarisler_2024q1 CONCURRENTLY;

-- Sil
DROP TABLE sifarisler_2024q1;

-- İndeks bütün partisiyalarda avtomatik yaranır
CREATE INDEX ON sifarisler (yaradildi);
\`\`\``
      },
      {
        title: "Connection Pooling",
        content: `**Problem:** Hər bağlantı = OS prosesi (~5-10 MB RAM). 1000 bağlantıda → 5-10 GB overhead!

**PgBouncer:**
Rejimlər:
• Session — müştəri bağlantı saxlayır (ən az səmərəli)
• Transaction — COMMIT/ROLLBACK-dan sonra havuza qayıdır (tövsiyə edilir)
• Statement — hər sorğudan sonra

\`\`\`ini
[databases]
mydb = host=127.0.0.1 port=5432 dbname=mydb

[pgbouncer]
listen_port = 6432
auth_type = scram-sha-256
pool_mode = transaction
max_client_conn = 10000
default_pool_size = 20
min_pool_size = 5
server_idle_timeout = 600
max_db_connections = 50
\`\`\`

**Monitorinq:**
\`\`\`sql
psql -p 6432 pgbouncer
SHOW POOLS;    -- havuz vəziyyəti
SHOW STATS;    -- statistika
SHOW CLIENTS;  -- müştəri bağlantıları
RELOAD;        -- konfiqurasiyanı yenidən oxu
\`\`\`

**Transaction mode məhdudiyyətləri:**
SET, LISTEN/NOTIFY, sessiya advisory locks — işləmir`
      },
      {
        title: "Paralel sorğular",
        content: `**Parametrlər:**
\`\`\`
max_parallel_workers = 8
max_parallel_workers_per_gather = 4
max_parallel_maintenance_workers = 4  -- CREATE INDEX, VACUUM
min_parallel_table_scan_size = 8MB
\`\`\`

**İdarəetmə:**
\`\`\`sql
SET max_parallel_workers_per_gather = 4;
ALTER TABLE boyuk_cedvel SET (parallel_workers = 4);
SET max_parallel_workers_per_gather = 0;  -- söndür
\`\`\`

**Paralel işlənir:**
• Parallel Seq Scan
• Parallel Bitmap Heap Scan
• Parallel Hash Join (PG 11+)
• Partial Aggregate → Finalize Aggregate
• CREATE INDEX (PG 11+)
• VACUUM (PG 13+)

**Paralel işlənmir:**
• INSERT/UPDATE/DELETE
• PARALLEL UNSAFE funksiyalar
• FOR UPDATE

\`\`\`sql
-- Funksiyanın volatility-sini yoxla
SELECT proname, proparallel FROM pg_proc WHERE proname = 'menim_funksiyam';
-- s=safe, r=restricted, u=unsafe

CREATE FUNCTION menim_funksiyam() RETURNS void
LANGUAGE sql PARALLEL SAFE AS '...';
\`\`\``
      },
      {
        title: "Materialized Görünüşlər",
        content: `**Yaratma və yeniləmə:**
\`\`\`sql
CREATE MATERIALIZED VIEW aylik_satislar AS
SELECT DATE_TRUNC('ay', yaradildi) AS ay,
       kateqoriya_id, SUM(mebleg) AS toplam
FROM sifarisler GROUP BY 1, 2
WITH DATA;

-- Yenilə (oxumanı kilidləyir!)
REFRESH MATERIALIZED VIEW aylik_satislar;

-- Kilidləmədən (unikal indeks lazımdır!)
CREATE UNIQUE INDEX ON aylik_satislar (ay, kateqoriya_id);
REFRESH MATERIALIZED VIEW CONCURRENTLY aylik_satislar;
\`\`\`

**Yeniləmə strategiyaları:**
\`\`\`sql
-- pg_cron ilə cədvəl üzrə
SELECT cron.schedule('yenile-mv', '0 * * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY aylik_satislar');

-- İnkremental yeniləmə
BEGIN;
DELETE FROM mv_gunluk WHERE tarix = CURRENT_DATE;
INSERT INTO mv_gunluk SELECT ... WHERE DATE(yaradildi) = CURRENT_DATE;
COMMIT;
\`\`\`

**Nə vaxt istifadə etmək:**
• Ağır analitik sorğular (böyük aqreqasiyalar)
• Məlumat nadir yenilənir (saatda/gündə bir dəfə)
• Kiçik gecikmə qəbul edilə bilər`
      }
    ]
  },
  {
    id: "replication", icon: "🔄", title: "Replikasiya və Yüksək Mövcudluq", color: "#80DEEA",
    topics: [
      {
        title: "Fiziki Replikasiya",
        content: `**WAL səviyyələri:**
\`\`\`
wal_level = minimal    -- yalnız çöküş bərpası
wal_level = replica    -- fiziki replikasiya (standart)
wal_level = logical    -- + məntiqi replikasiya
\`\`\`

**Primary qurulumu:**
\`\`\`
wal_level = replica
max_wal_senders = 10
wal_keep_size = 1GB
hot_standby = on
\`\`\`
\`\`\`
host replication replicator 10.0.0.0/8 scram-sha-256
\`\`\`
\`\`\`sql
CREATE ROLE replicator REPLICATION LOGIN PASSWORD 'sirr';
\`\`\`

**Replika yaratmaq:**
\`\`\`bash
pg_basebackup -h primary_host -U replicator \
  -D /var/lib/postgresql/15/standby \
  -Fp -Xs -P -R
\`\`\`

**Monitorinq:**
\`\`\`sql
-- Primary-də:
SELECT client_addr, state, sent_lsn, replay_lsn,
       write_lag, flush_lag, replay_lag, sync_state
FROM pg_stat_replication;

-- Standby-da:
SELECT pg_is_in_recovery();
SELECT now() - pg_last_xact_replay_timestamp() AS gec_qalma;
\`\`\`

**Sinxron replikasiya:**
\`\`\`
synchronous_standby_names = 'FIRST 1 (standby1, standby2)'
\`\`\``
      },
      {
        title: "Replikasiya Slotları",
        content: `**WAL-ın replika tərəfindən alınana qədər silinməməsini təmin edir.**
TƏHLÜKƏLİ: Replika uzun müddət bağlı qalsa — disk dolacaq!

\`\`\`sql
-- Fiziki slot yarat
SELECT pg_create_physical_replication_slot('replika1_slotu');
-- postgresql.conf standby-da: primary_slot_name = 'replika1_slotu'

-- Məntiqi slot yarat
SELECT pg_create_logical_replication_slot('menim_slotum', 'pgoutput');

-- Yoxla
SELECT slot_name, slot_type, active, restart_lsn,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS gec_qalma
FROM pg_replication_slots;

-- Sil
SELECT pg_drop_replication_slot('menim_slotum');
\`\`\`

**Disk dolmasının qarşısını almaq:**
\`\`\`sql
SELECT slot_name, active,
       pg_size_pretty(pg_wal_lsn_diff(
           pg_current_wal_lsn(), restart_lsn)) AS wal_gecikmesi
FROM pg_replication_slots WHERE NOT active;

-- PG 13+: slot silinməzdən əvvəl WAL həddini qur
-- max_slot_wal_keep_size = 10GB
\`\`\``
      },
      {
        title: "Məntiqi Replikasiya",
        content: `**Üstünlüklər:** Müxtəlif PG versiyaları arasında replikasiya, cədvəl/sətir/sütun filtrasiyası

**Nəşriyyatçı (Publisher):**
\`\`\`sql
-- wal_level = logical (postgresql.conf-da)

CREATE PUBLICATION pub_sifarisler FOR TABLE sifarisler, sifaris_elementleri;
CREATE PUBLICATION pub_az FOR TABLE sifarisler WHERE (region = 'AZ');
CREATE PUBLICATION pub_qismli FOR TABLE islechiler (id, ad, dept_id);

ALTER PUBLICATION pub_sifarisler ADD TABLE catdirilmalar;
DROP PUBLICATION pub_sifarisler;

SELECT * FROM pg_publication;
SELECT * FROM pg_publication_tables;
\`\`\`

**Abunəçi (Subscriber):**
\`\`\`sql
CREATE SUBSCRIPTION abune_sifarisler
    CONNECTION 'host=primary dbname=mydb user=replicator'
    PUBLICATION pub_sifarisler;

ALTER SUBSCRIPTION abune_sifarisler DISABLE;
ALTER SUBSCRIPTION abune_sifarisler ENABLE;
ALTER SUBSCRIPTION abune_sifarisler REFRESH PUBLICATION;

SELECT * FROM pg_stat_subscription;
\`\`\`

**Məhdudiyyətlər:**
• DDL replikasiya edilmir
• Cədvəllərdə PK və ya REPLICA IDENTITY lazımdır
\`\`\`sql
ALTER TABLE t REPLICA IDENTITY FULL;
ALTER TABLE t REPLICA IDENTITY USING INDEX idx_unikal;
\`\`\``
      },
      {
        title: "Patroni və Yüksək Mövcudluq",
        content: `**Arxitektura:**
\`\`\`
      DCS (etcd/Consul/ZooKeeper)
         lider seçimi
    ┌────────────┼────────────┐
  node1        node2        node3
 Primary      Replika      Replika
    ▲ HAProxy / VIP
 müştərilər
\`\`\`

**patronictl əmrləri:**
\`\`\`bash
patronictl -c /etc/patroni.yml list
patronictl -c /etc/patroni.yml switchover --master node1 --candidate node2
patronictl -c /etc/patroni.yml failover --master node1
patronictl -c /etc/patroni.yml restart klaster_adi node1
patronictl -c /etc/patroni.yml reload klaster_adi
patronictl -c /etc/patroni.yml edit-config
patronictl -c /etc/patroni.yml pause klaster_adi
patronictl -c /etc/patroni.yml resume klaster_adi
patronictl -c /etc/patroni.yml history
\`\`\`

**HAProxy yük balansı:**
\`\`\`
backend pg_primary
  option httpchk GET /primary
  server node1 10.0.0.1:5432 check port 8008

backend pg_replicas
  balance roundrobin
  option httpchk GET /replica
  server node1 10.0.0.1:5432 check port 8008
  server node2 10.0.0.2:5432 check port 8008
\`\`\`

**Gecikdirilmiş replika (təsadüfi silinmədən qorunma):**
\`\`\`
recovery_min_apply_delay = '1h'
\`\`\``
      }
    ]
  },
  {
    id: "backup", icon: "💾", title: "Ehtiyat Nüsxəsi və Bərpa", color: "#FFCC80",
    topics: [
      {
        title: "pg_dump",
        content: `**Format növləri:**
• plain (p) — SQL skript, oxuna bilən mətn
• custom (c) — sıxılmış binar, paralel bərpa
• directory (d) — paralel dump (-j N)
• tar (t) — tar arxiv

\`\`\`bash
# Custom format (tövsiyə edilir!)
pg_dump -U postgres -Fc mydb > mydb.dump
pg_dump -U postgres -Fc -Z 9 mydb > mydb.dump   # maks sıxışdırma

# Paralel dump
pg_dump -U postgres -Fd -j 8 mydb -f /backup/mydb_dir/

# Yalnız struktur / yalnız məlumat
pg_dump -U postgres -s mydb > schema.sql
pg_dump -U postgres -a mydb > data.sql

# Müəyyən cədvəllər
pg_dump -U postgres -t sifarisler -t sifaris_elementleri mydb > sifarisler.dump

# Bütün klaster
pg_dumpall -U postgres > klaster.sql
pg_dumpall -U postgres -g > global_only.sql
\`\`\`

**Bərpa:**
\`\`\`bash
psql -U postgres mydb < mydb.sql
pg_restore -U postgres -d mydb mydb.dump
pg_restore -U postgres -d mydb -j 8 mydb.dump   # paralel
pg_restore -U postgres -C -d postgres mydb.dump  # DB yarat
pg_restore -U postgres -d mydb -t sifarisler mydb.dump  # bir cədvəl
pg_restore -U postgres -d mydb --clean mydb.dump
\`\`\``
      },
      {
        title: "PITR (Zaman Nöqtəsinə Bərpa)",
        content: `**Prinsip:** Əsas ehtiyat nüsxəsi + davamlı WAL arxivi → istənilən ana bərpa

**WAL arxivləşdirməsi:**
\`\`\`
archive_mode = on
archive_command = 'cp %p /arxiv/%f'
archive_command = 'aws s3 cp %p s3://kova/wal/%f'
archive_timeout = 60  -- hər 60 san bir WAL faylını arxivlə
\`\`\`

**Əsas ehtiyat nüsxəsi:**
\`\`\`bash
pg_basebackup -U postgres -D /backup/base \
  -Ft -z -P --wal-method=stream
\`\`\`

**Bərpa konfiqurasiyası (PG 12+):**
\`\`\`bash
cp -r /backup/base/* $PGDATA/
touch $PGDATA/recovery.signal
\`\`\`
\`\`\`
# postgresql.conf-da:
restore_command = 'cp /arxiv/%f %p'

# Bərpa hədəfi:
recovery_target_time = '2025-06-01 14:30:00 UTC'
recovery_target_lsn  = '0/15000060'
recovery_target_name = 'miqrasiyadan_once'
recovery_target       = 'immediate'

recovery_target_inclusive = true
recovery_target_action = 'promote'
\`\`\`

**Adlandırılmış bərpa nöqtələri:**
\`\`\`sql
SELECT pg_create_restore_point('miqrasiyadan_once_v2');
\`\`\``
      },
      {
        title: "pgBackRest",
        content: `\`\`\`ini
[global]
repo1-path=/var/lib/pgbackrest
repo1-retention-full=2
repo1-retention-diff=7
repo1-cipher-type=aes-256-cbc
repo1-cipher-pass=şifrəaçarı

# S3 üçün:
repo1-type=s3
repo1-s3-bucket=pg-ehtiyat-nusxeleri
repo1-s3-region=eu-central-1
repo1-s3-key=GİRİŞ_AÇARI
repo1-s3-key-secret=GİZLİ_ACAR

[main]
pg1-path=/var/lib/postgresql/15/main
\`\`\`

\`\`\`bash
pgbackrest --stanza=main stanza-create
pgbackrest --stanza=main check
pgbackrest --stanza=main backup --type=full
pgbackrest --stanza=main backup --type=diff
pgbackrest --stanza=main backup --type=incr
pgbackrest --stanza=main backup --type=full --process-max=4
pgbackrest --stanza=main info
pgbackrest --stanza=main restore
pgbackrest --stanza=main restore \
    --target="2025-06-01 14:30:00" --target-action=promote
pgbackrest --stanza=main verify
\`\`\`

**Cədvəl (crontab):**
\`\`\`cron
0 2 * * 0 pgbackrest --stanza=main backup --type=full
0 2 * * 1-6 pgbackrest --stanza=main backup --type=diff
\`\`\``
      },
      {
        title: "Ehtiyat nüsxəsi strategiyası",
        content: `**RPO və RTO:**
• RPO (Recovery Point Objective) — icazə verilən maksimum məlumat itkisi
• RTO (Recovery Time Objective) — maksimum bərpa müddəti

**Strategiya matrisi:**
| Tələb | Həll |
| RPO = 0 | Sinxron replikasiya |
| RPO < 1 dəq | Streaming + WAL arxiv |
| RPO < 1 saat | PITR ilə archive_timeout |
| RTO < 1 dəq | Hot standby + avtomatik failover |
| RTO < 1 saat | pg_basebackup + WAL replay |

**3-2-1 qaydası:**
• 3 məlumat nüsxəsi
• 2 müxtəlif daşıyıcı
• 1 nüsxə fərqli yerdə (başqa DC / bulud)

**Bərpanın sınanması (MÜTLƏQ etmək lazımdır!):**
\`\`\`bash
pg_restore -d test_db /backup/mydb.dump
psql test_db -f /skriptler/butovluk_yoxlama.sql
SELECT COUNT(*) FROM kritik_cedvel;
\`\`\`

**Ehtiyat nüsxəsinin monitorinqi:**
\`\`\`sql
SELECT backup_time, backup_type, duration, size
FROM backup_tarixi ORDER BY backup_time DESC LIMIT 5;
-- Alart: 26 saatdır uğurlu ehtiyat nüsxəsi yoxdur
\`\`\``
      }
    ]
  },
  {
    id: "security", icon: "🛡️", title: "Təhlükəsizlik", color: "#EF9A9A",
    topics: [
      {
        title: "Rollar və İmtiyazlar",
        content: `**Rol yaratma:**
\`\`\`sql
CREATE ROLE yalniz_oxu;
CREATE ROLE oxu_yaz;
CREATE USER app_user WITH PASSWORD 'sirr' LOGIN;
CREATE USER hesabat WITH PASSWORD 'sirr' LOGIN CONNECTION LIMIT 5;
CREATE USER muveqqeti WITH PASSWORD 'p' LOGIN VALID UNTIL '2025-12-31';

GRANT yalniz_oxu TO oxu_yaz;
GRANT oxu_yaz TO admin_db;
GRANT admin_db TO tətbiq_adminı;
\`\`\`

**İmtiyazlar:**
\`\`\`sql
REVOKE CONNECT ON DATABASE mydb FROM PUBLIC;
GRANT CONNECT ON DATABASE mydb TO yalniz_oxu;
GRANT USAGE ON SCHEMA public TO yalniz_oxu, oxu_yaz;
GRANT CREATE ON SCHEMA public TO oxu_yaz;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO yalniz_oxu;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO oxu_yaz;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO oxu_yaz;
\`\`\`

**Gələcək obyektlər üçün (çox vacib!):**
\`\`\`sql
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO yalniz_oxu;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO oxu_yaz;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE ON SEQUENCES TO oxu_yaz;

-- Sütun səviyyəsində:
GRANT SELECT (id, ad, dept_id) ON islechiler TO yalniz_oxu;
\`\`\``
      },
      {
        title: "Sətir Səviyyəsində Təhlükəsizlik (RLS)",
        content: `\`\`\`sql
ALTER TABLE senedler ENABLE ROW LEVEL SECURITY;
ALTER TABLE senedler FORCE ROW LEVEL SECURITY;  -- sahibi üçün də

-- Siyasət: istifadəçi yalnız öz sənədlərini görür
CREATE POLICY istifadeci_senedleri ON senedler
    FOR ALL TO PUBLIC
    USING (sahib_id = cari_istifadeci_id())
    WITH CHECK (sahib_id = cari_istifadeci_id());

-- Ayrı siyasətlər
CREATE POLICY oz_senedleri_oxu ON senedler FOR SELECT
    USING (sahib_id = cari_istifadeci_id());
CREATE POLICY umumi_senedler ON senedler FOR SELECT
    USING (umumidir = true);
CREATE POLICY admin_hepsi ON senedler FOR ALL TO admin_rolu
    USING (true);

-- İstifadəçi ID funksiyası
CREATE FUNCTION cari_istifadeci_id() RETURNS INT AS $$
    SELECT id FROM istifadeciler WHERE istifadeci_adi = current_user;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
\`\`\`

**Connection pooling üçün:**
\`\`\`sql
SET app.cari_istifadeci_id = '42';

CREATE POLICY sessiya_siyaseti ON senedler FOR ALL
    USING (sahib_id = current_setting('app.cari_istifadeci_id')::INT);
\`\`\``
      },
      {
        title: "SSL və Şifrələmə",
        content: `**SSL konfiqurasiyası:**
\`\`\`
ssl = on
ssl_cert_file = '/etc/ssl/certs/server.crt'
ssl_key_file  = '/etc/ssl/private/server.key'
ssl_ca_file   = '/etc/ssl/certs/ca.crt'
ssl_min_protocol_version = 'TLSv1.2'
ssl_ciphers = 'HIGH:!aNULL'
\`\`\`
\`\`\`
hostssl all all 0.0.0.0/0 scram-sha-256
hostssl all all 0.0.0.0/0 cert clientcert=verify-full
\`\`\`
\`\`\`sql
SELECT ssl, client_addr FROM pg_stat_ssl
JOIN pg_stat_activity USING (pid);
\`\`\`

**pgcrypto — məlumat şifrələməsi:**
\`\`\`sql
CREATE EXTENSION pgcrypto;

-- Bcrypt şifrə hash
INSERT INTO istifadeciler (email, şifre_hash)
VALUES ('user@mail.az', crypt('parol', gen_salt('bf', 10)));

SELECT * FROM istifadeciler
WHERE şifre_hash = crypt('parol', şifre_hash);

-- Simmetrik şifrələmə (AES)
UPDATE həssas_məlumat
SET şifreli = pgp_sym_encrypt(aydın_mətn, 'açar', 'cipher-algo=aes256');

SELECT pgp_sym_decrypt(şifreli, 'açar') FROM həssas_məlumat;

SELECT gen_random_uuid();
\`\`\``
      },
      {
        title: "Audit",
        content: `**pgaudit:**
\`\`\`
shared_preload_libraries = 'pgaudit'
pgaudit.log = 'write,ddl'
pgaudit.log_parameter = on
pgaudit.log_catalog = off
\`\`\`
\`\`\`sql
CREATE EXTENSION pgaudit;
ALTER ROLE həssas_user SET pgaudit.log = 'all';
\`\`\`

**Kateqoriyalar:** read, write, function, role, ddl, misc, all

**Təhlükəsizlik monitorinqi:**
\`\`\`sql
-- Aktiv super istifadəçi sessiyaları
SELECT pid, usename, client_addr, query
FROM pg_stat_activity WHERE usesuper AND state != 'idle';

-- Şifrəsiz rollar (zəiflik!)
SELECT rolname FROM pg_roles
WHERE rolcanlogin AND rolpassword IS NULL;

-- Köhnə MD5 şifrələr
SELECT rolname FROM pg_authid WHERE rolpassword LIKE 'md5%';

-- Etibarsız autentifikasiya metodları
SELECT type, database, user_name, auth_method
FROM pg_hba_file_rules WHERE auth_method IN ('trust','password');
\`\`\`

**Ən yaxşı təcrübələr:**
• REVOKE ALL ON SCHEMA public FROM PUBLIC
• REVOKE CONNECT ON DATABASE FROM PUBLIC
• scram-sha-256 istifadə edin, md5 yox
• Rollara CONNECTION LIMIT qoyun
• Gelişdiricilərə SUPERUSER verməyin`
      }
    ]
  },
  {
    id: "monitoring", icon: "📊", title: "Monitorinq", color: "#A5D6A7",
    topics: [
      {
        title: "Sistem görünüşləri",
        content: `**pg_stat_activity — aktiv proseslər:**
\`\`\`sql
SELECT pid, usename, application_name, client_addr, state,
       wait_event_type, wait_event,
       now()-query_start  AS sorgu_muddeti,
       now()-state_change AS veziyyet_muddeti,
       left(query, 120) AS sorgu
FROM pg_stat_activity
WHERE pid != pg_backend_pid()
ORDER BY sorgu_muddeti DESC NULLS LAST;
\`\`\`

**Cədvəl statistikası:**
\`\`\`sql
SELECT relname, seq_scan, idx_scan,
       CASE WHEN seq_scan+idx_scan > 0
            THEN round(idx_scan::numeric/(seq_scan+idx_scan)*100,1)
       END AS idx_istifade_faiz,
       n_live_tup, n_dead_tup, last_autovacuum, last_analyze,
       pg_size_pretty(pg_total_relation_size(relid)) AS cemi_ölçü
FROM pg_stat_user_tables ORDER BY seq_scan DESC;
\`\`\`

**Ölçülər:**
\`\`\`sql
SELECT datname, pg_size_pretty(pg_database_size(datname))
FROM pg_database ORDER BY pg_database_size(datname) DESC;

SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS cemi,
       pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indekslər
FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 20;
\`\`\``
      },
      {
        title: "Keş və Performans",
        content: `**Cache Hit Ratio (norma > 99%):**
\`\`\`sql
-- Baza üzrə ümumi
SELECT round(
    blks_hit::numeric / NULLIF(blks_hit+blks_read, 0) * 100, 2
) AS kes_nisbeti
FROM pg_stat_database WHERE datname = current_database();

-- Cədvəl üzrə
SELECT relname,
       round(heap_blks_hit::numeric /
             NULLIF(heap_blks_hit+heap_blks_read,0)*100,2) AS kes_nisbeti
FROM pg_statio_user_tables ORDER BY heap_blks_read DESC;
\`\`\`

**Checkpoint statistikası:**
\`\`\`sql
SELECT checkpoints_timed, checkpoints_req,
       checkpoint_write_time/1000 AS yaz_san,
       buffers_checkpoint, buffers_clean, buffers_backend, maxwritten_clean
FROM pg_stat_bgwriter;
-- buffers_backend yüksəkdir → shared_buffers az
-- maxwritten_clean > 0 → bgwriter çatışmır
\`\`\`

**Müvəqqəti fayllar:**
\`\`\`sql
SELECT datname, temp_files, pg_size_pretty(temp_bytes) AS müvəqqəti_ölçü
FROM pg_stat_database WHERE temp_files > 0 ORDER BY temp_bytes DESC;
-- Varsa → work_mem artır
\`\`\`

**Rollback nisbəti:**
\`\`\`sql
SELECT datname,
       round(xact_rollback::numeric / NULLIF(xact_commit+xact_rollback,0)*100, 2) AS geri_alma_faizi
FROM pg_stat_database WHERE datname NOT LIKE 'template%';
-- > 5% → tətbiqdə tez-tez xətalar var
\`\`\``
      },
      {
        title: "Kilidlərin monitorinqi",
        content: `**Uzun sorğular:**
\`\`\`sql
SELECT pid, usename, now()-query_start AS muddet, state, query
FROM pg_stat_activity
WHERE state != 'idle' AND now()-query_start > interval '30 saniye'
ORDER BY muddet DESC;
\`\`\`

**Kimin kimi bloklaması:**
\`\`\`sql
SELECT blocked.pid AS blok_pid, blocked.query AS blok_sorgu,
       blocking.pid AS bloke_eden, blocking.query AS bloke_eden_sorgu,
       now()-blocked.query_start AS gozleme
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking
    ON blocking.pid = ANY(pg_blocking_pids(blocked.pid))
ORDER BY gozleme DESC;
\`\`\`

**Kilid detalları:**
\`\`\`sql
SELECT l.pid, l.locktype, l.relation::regclass, l.mode, l.granted, a.query
FROM pg_locks l JOIN pg_stat_activity a ON l.pid = a.pid
WHERE NOT l.granted;
\`\`\`

**Vaxt limitlər:**
\`\`\`sql
SET lock_timeout = '10s';
SET statement_timeout = '60s';
SET idle_in_transaction_session_timeout = '5min';
\`\`\``
      },
      {
        title: "Prometheus və Alartlar",
        content: `**postgres_exporter:**
\`\`\`bash
docker run -d -p 9187:9187 \
    -e DATA_SOURCE_NAME="postgresql://postgres:pass@host:5432/postgres?sslmode=disable" \
    prometheuscommunity/postgres-exporter
\`\`\`

**Əsas metriklər:**
• pg_up — əlçatımlılıq (1/0)
• pg_stat_activity_count — bağlantı sayı vəziyyətə görə
• pg_stat_database_blks_hit/read — keş istifadəsi
• pg_replication_lag — replikasiya gecikmesi (saniyə)
• pg_stat_user_tables_n_dead_tup — ölü sətirlər
• pg_database_size_bytes — DB ölçüsü

**Alart qaydaları:**
\`\`\`yaml
- alert: PostgreSQLDown
  expr: pg_up == 0
  for: 1m
  labels: { severity: critical }

- alert: CoxluBaglantilar
  expr: sum(pg_stat_activity_count) > pg_settings_max_connections * 0.8
  for: 5m

- alert: YuksekReplikasiyaGecikmesi
  expr: pg_replication_lag > 30
  for: 5m

- alert: AşağıKesNisbeti
  expr: cache_hit_ratio < 0.99
  for: 10m

- alert: UzunMuddetliSorgu
  expr: pg_stat_activity_max_tx_duration > 300
  for: 2m
\`\`\``
      },
      {
        title: "Problem diaqnostikası",
        content: `**Performans problemlərinin siyahısı:**

\`\`\`sql
-- 1. İndi nə baş verir?
SELECT pid, state, wait_event_type, wait_event,
       now()-query_start AS muddet, query
FROM pg_stat_activity WHERE state != 'idle'
ORDER BY muddet DESC NULLS LAST;

-- 2. Kilid gözləməsi varmı?
SELECT count(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock';

-- 3. Keş nisbəti normaldırmı?
SELECT round(blks_hit::numeric/(blks_hit+blks_read)*100,2)
FROM pg_stat_database WHERE datname = current_database();

-- 4. Müvəqqəti fayllar varmı?
SELECT temp_files, pg_size_pretty(temp_bytes)
FROM pg_stat_database WHERE datname = current_database();

-- 5. Çoxlu ölü sətir?
SELECT relname, n_dead_tup,
       round(n_dead_tup::numeric/NULLIF(n_live_tup,0)*100,1) AS ölü_faiz
FROM pg_stat_user_tables WHERE n_dead_tup > 10000
ORDER BY ölü_faiz DESC;

-- 6. Ən yavaş sorğular
SELECT left(query,80), calls, round(mean_exec_time::numeric,1) AS ort_ms
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;

-- 7. Replikasiya slotu WAL gecikməsi
SELECT slot_name, pg_size_pretty(
    pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn))
FROM pg_replication_slots WHERE NOT active;

-- 8. Wraparound təhlükəsi
SELECT datname, age(datfrozenxid),
       2147483647 - age(datfrozenxid) AS qalan_xid
FROM pg_database ORDER BY age(datfrozenxid) DESC LIMIT 5;
\`\`\``
      }
    ]
  },
  {
    id: "advanced", icon: "🔬", title: "Qabaqcıl Mövzular", color: "#B39DDB",
    topics: [
      {
        title: "PL/pgSQL",
        content: `**Funksiya strukturu:**
\`\`\`sql
CREATE OR REPLACE FUNCTION funksiya_adi(p1 TİP, p2 TİP DEFAULT dəyər)
RETURNS qaytaris_tipi
LANGUAGE plpgsql
VOLATILE | STABLE | IMMUTABLE
SECURITY DEFINER | SECURITY INVOKER
AS $$
DECLARE
    v_deyishen  TİP := baslangic_deyer;
    v_qeyd      RECORD;
BEGIN
    -- gövdə
    RETURN neticə;
EXCEPTION
    WHEN unique_violation THEN RAISE NOTICE 'Dublikat: %', SQLERRM;
    WHEN OTHERS THEN RAISE EXCEPTION 'Xəta %: %', SQLSTATE, SQLERRM;
END;
$$;
\`\`\`

**İdarəetmə konstruksiyaları:**
\`\`\`sql
IF maas > 100000 THEN dərəcə := 'Baş mütəxəssis';
ELSIF maas > 60000 THEN dərəcə := 'Mütəxəssis';
ELSE dərəcə := 'Kiçik mütəxəssis'; END IF;

FOR qeyd IN SELECT * FROM t WHERE şərt LOOP
    RAISE NOTICE 'Sətir: %', qeyd.sutun;
END LOOP;

FOR i IN 1..10 LOOP ... END LOOP;
WHILE sayğac < 100 LOOP ... END LOOP;

-- Dinamik SQL (təhlükəsiz!)
EXECUTE 'SELECT * FROM ' || quote_ident(cedvel_adi)
    INTO v_qeyd USING parametr;
EXECUTE format('CREATE INDEX ON %I (%I)', cedvel, sutun);
\`\`\`

**Çoxlu sətir qaytarma:**
\`\`\`sql
CREATE FUNCTION statistika_al()
RETURNS TABLE (dept_id INT, ort_maas NUMERIC)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
        SELECT e.dept_id, AVG(e.maas) FROM islechiler e GROUP BY 1;
END; $$;
\`\`\`

**Prosedurlar (PG 11+):**
\`\`\`sql
CREATE OR REPLACE PROCEDURE pul_kocur(
    kimden INT, kime INT, mebleg NUMERIC)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE hesablar SET balans = balans - mebleg WHERE id = kimden;
    UPDATE hesablar SET balans = balans + mebleg WHERE id = kime;
    COMMIT;
END; $$;
CALL pul_kocur(1, 2, 1000);
\`\`\``
      },
      {
        title: "Tetikleyiciler (Triggers)",
        content: `**Növlər:** BEFORE/AFTER/INSTEAD OF × INSERT/UPDATE/DELETE/TRUNCATE × ROW/STATEMENT

**Audit tetikleyicisi:**
\`\`\`sql
CREATE OR REPLACE FUNCTION audit_deyishiklikleri()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO audit_jurnal (
        cedvel_adi, emeliyyat, kohn_data, yeni_data, deyishdiren, zaman)
    VALUES (
        TG_TABLE_NAME, TG_OP,
        CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) END,
        CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) END,
        current_user, NOW()
    );
    RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER trg_audit
    AFTER INSERT OR UPDATE OR DELETE ON islechiler
    FOR EACH ROW EXECUTE FUNCTION audit_deyishiklikleri();
\`\`\`

**Avtomatik updated_at:**
\`\`\`sql
CREATE OR REPLACE FUNCTION updated_at_qur()
RETURNS TRIGGER AS $$
BEGIN NEW.yenilendi := NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_zaman BEFORE UPDATE ON islechiler
FOR EACH ROW EXECUTE FUNCTION updated_at_qur();
\`\`\`

**Tetikleyici idarəetməsi:**
\`\`\`sql
ALTER TABLE islechiler DISABLE TRIGGER trg_audit;
ALTER TABLE islechiler ENABLE TRIGGER trg_audit;
ALTER TABLE islechiler DISABLE TRIGGER ALL;
DROP TRIGGER IF EXISTS trg_audit ON islechiler;
\`\`\``
      },
      {
        title: "Genişləndirmələr (Extensions)",
        content: `\`\`\`sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SELECT * FROM pg_extension;
SELECT * FROM pg_available_extensions ORDER BY name;
\`\`\`

**Vacib genişləndirmələr:**

**pg_trgm** — alt sətir axtarışı (LIKE '%..%' indekslə):
\`\`\`sql
CREATE EXTENSION pg_trgm;
CREATE INDEX ON məhsullar USING GIN (ad gin_trgm_ops);
SELECT * FROM məhsullar WHERE ad ILIKE '%telefon%';
SELECT similarity('PostgreSQL', 'PostreSQL');  -- 0.7
\`\`\`

**pg_cron** — tapşırıq planlaşdırıcı:
\`\`\`sql
-- shared_preload_libraries = 'pg_cron'
CREATE EXTENSION pg_cron;
SELECT cron.schedule('gece-vacuum', '0 3 * * *', 'VACUUM ANALYZE sifarisler');
SELECT cron.schedule('mv-yenile', '*/15 * * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY aylik_statistika');
\`\`\`

**pgvector** — vektor axtarışı (AI/ML):
\`\`\`sql
CREATE EXTENSION vector;
CREATE TABLE embeddingler (id BIGSERIAL PRIMARY KEY, vektor vector(1536));
CREATE INDEX ON embeddingler USING ivfflat (vektor vector_cosine_ops);
SELECT * FROM embeddingler ORDER BY vektor <=> sorgu_vektoru LIMIT 5;
\`\`\`

| Genişləndirmə | Təyinat |
| pg_stat_statements | Sorğu statistikası |
| pgcrypto | Şifrələmə |
| uuid-ossp | UUID generasiyası |
| pg_trgm | LIKE '%text%' indekslə |
| citext | Böyük/kiçik həssas olmayan TEXT |
| postgres_fdw | Xarici məlumat mənbəyi |
| TimescaleDB | Zaman seriyası |
| PostGIS | Coğrafi məlumat |
| pgvector | Vektor axtarışı |`
      },
      {
        title: "Tam Mətn Axtarışı",
        content: `**tsvector-u cədvəldə saxla:**
\`\`\`sql
ALTER TABLE meqaleler ADD COLUMN axtaris_vektoru TSVECTOR;

-- Avtomatik yeniləmə tetikleyicisi
CREATE TRIGGER tsvector_yenile BEFORE INSERT OR UPDATE ON meqaleler
    FOR EACH ROW EXECUTE FUNCTION
    tsvector_update_trigger(axtaris_vektoru, 'pg_catalog.russian', bashliq, metn);
\`\`\`

**Çəkilərlə əl ilə:**
\`\`\`sql
UPDATE meqaleler SET axtaris_vektoru =
    setweight(to_tsvector('russian', coalesce(bashliq,'')), 'A') ||
    setweight(to_tsvector('russian', coalesce(metn,'')), 'B');

CREATE INDEX ON meqaleler USING GIN (axtaris_vektoru);
\`\`\`

**Axtarış və sıralama:**
\`\`\`sql
SELECT id, bashliq,
       ts_rank(axtaris_vektoru, sorgu) AS rank,
       ts_headline('russian', metn, sorgu, 'MaxWords=15,MinWords=5') AS parça
FROM meqaleler, to_tsquery('russian', 'postgresql & replikasiya') sorgu
WHERE axtaris_vektoru @@ sorgu ORDER BY rank DESC LIMIT 10;
\`\`\`

**Sorğu növləri:**
\`\`\`sql
to_tsquery('russian', 'baza & melumatlari')   -- VƏ
to_tsquery('russian', 'baza | melumatlari')   -- YA DA
plainto_tsquery('russian', 'baza melumatlari') -- sözlər & ilə
websearch_to_tsquery('russian', 'baza -oracle') -- Google stili
\`\`\``
      },
      {
        title: "LISTEN / NOTIFY",
        content: `**Asinxron bildirişlər:**
\`\`\`sql
LISTEN sifarisler_kanali;
UNLISTEN sifarisler_kanali;
UNLISTEN *;

NOTIFY sifarisler_kanali;
NOTIFY sifarisler_kanali, '{"id": 42, "mebleg": 999}';
\`\`\`

**Tetikleyicidən bildiriş:**
\`\`\`sql
CREATE OR REPLACE FUNCTION yeni_sifaris_bildir()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM pg_notify('yeni_sifarisler', row_to_json(NEW)::TEXT);
    RETURN NEW;
END; $$;

CREATE TRIGGER trg_bildir AFTER INSERT ON sifarisler
FOR EACH ROW EXECUTE FUNCTION yeni_sifaris_bildir();
\`\`\`

**İstifadə halları:**
• Tətbiq keşinin etibarsızlaşdırılması
• Tapşırıq növbələri
• Real-time bildirişlər xidmətlər arasında

**VACİB:** LISTEN daimi bağlantı tələb edir → PgBouncer transaction mode ilə uyğunsuz!

**Tapşırıq növbəsi şablonu:**
\`\`\`sql
LISTEN iş_novbesi;
-- NOTIFY alandıqda:
SELECT id, yuk FROM isler WHERE status = 'gozleyir'
ORDER BY yaradildi LIMIT 1 FOR UPDATE SKIP LOCKED;
UPDATE isler SET status = 'icra_edilir' WHERE id = :id;
\`\`\``
      },
      {
        title: "Xarici Məlumat Sarıyıcıları (FDW)",
        content: `**postgres_fdw — PostgreSQL ↔ PostgreSQL:**
\`\`\`sql
CREATE EXTENSION postgres_fdw;

CREATE SERVER uzaq_analitika
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (host '10.0.0.100', port '5432', dbname 'analitika',
             fetch_size '10000', use_remote_estimate 'true');

CREATE USER MAPPING FOR app_user SERVER uzaq_analitika
    OPTIONS (user 'oxucu', password 'sirr');

IMPORT FOREIGN SCHEMA public
    FROM SERVER uzaq_analitika INTO uzaq_sxem;

-- Adi cədvəl kimi istifadə (JOIN da işləyir!)
SELECT y.ad, u.mebleg FROM yerli_musteriler y
JOIN uzaq_sifarisler u ON y.id = u.musteri_id;
\`\`\`

**file_fdw — CSV fayllar:**
\`\`\`sql
CREATE EXTENSION file_fdw;
CREATE SERVER csv_fayllar FOREIGN DATA WRAPPER file_fdw;

CREATE FOREIGN TABLE giriş_jurnali (ip TEXT, zaman TIMESTAMPTZ, yol TEXT)
    SERVER csv_fayllar
    OPTIONS (filename '/var/log/access.csv', format 'csv', header 'true');
\`\`\`

| Tip | FDW |
| PostgreSQL | postgres_fdw |
| MySQL/MariaDB | mysql_fdw |
| Oracle | oracle_fdw |
| SQL Server | tds_fdw |
| CSV faylı | file_fdw |
| İstənilən mənbə | multicorn (Python) |`
      }
    ]
  },
  {
    id: "dba_tasks", icon: "🧰", title: "DBA Vəzifələri", color: "#FFD54F",
    topics: [
      {
        title: "Günlük yoxlama siyahısı",
        content: `\`\`\`sql
-- 1. Əlçatımlılıq
SELECT now(), version(), pg_is_in_recovery();

-- 2. Bağlantılar
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

-- 3. Uzun sorğular (> 5 dəqiqə)
SELECT pid, usename, now()-query_start AS muddet, left(query,80)
FROM pg_stat_activity WHERE state != 'idle'
  AND now()-query_start > interval '5 dəqiqə'
ORDER BY muddet DESC;

-- 4. Kilid gözləməsi
SELECT count(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock';

-- 5. Replikasiya
SELECT client_addr, state, replay_lag, sync_state FROM pg_stat_replication;
SELECT now() - pg_last_xact_replay_timestamp() AS gec_qalma;  -- standby-da

-- 6. Baza ölçüləri
SELECT datname, pg_size_pretty(pg_database_size(datname))
FROM pg_database WHERE datname NOT LIKE 'template%';

-- 7. Ölü sətirler
SELECT relname, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables WHERE n_dead_tup > 50000
ORDER BY n_dead_tup DESC LIMIT 10;

-- 8. Aktiv olmayan replikasiya slotları (disk dolacaq!)
SELECT slot_name,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS wal_gecikme
FROM pg_replication_slots WHERE NOT active;

-- 9. Wraparound təhlükəsi
SELECT datname, age(datfrozenxid),
       2147483647 - age(datfrozenxid) AS qalan_xid
FROM pg_database ORDER BY age(datfrozenxid) DESC;
\`\`\``
      },
      {
        title: "pg_upgrade",
        content: `**Major versiya yeniləməsi:**

**Üsul 1: pg_upgrade (dayanma müddəti ilə):**
\`\`\`bash
pg_ctl stop -D /kohn/data
/usr/lib/postgresql/16/bin/initdb -D /yeni/data

# Uyğunluq yoxlaması (real miqrasiya olmadan)
pg_upgrade --old-datadir /kohn/data --new-datadir /yeni/data \
    --old-bindir /usr/lib/postgresql/14/bin \
    --new-bindir /usr/lib/postgresql/16/bin --check

# Yeniləmə
pg_upgrade --old-datadir /kohn/data --new-datadir /yeni/data \
    --old-bindir /usr/lib/postgresql/14/bin \
    --new-bindir /usr/lib/postgresql/16/bin \
    --jobs 4 --link   # hard link (sürətli, geri qayıtmaq olmaz!)

./analyze_new_cluster.sh
./delete_old_cluster.sh
\`\`\`

**Üsul 2: Məntiqi Replikasiya (dayanmasız):**
\`\`\`
1. Yeni PG 16 klaster qur
2. Köhnə → yeni məntiqi replikasiya qur
3. Sinxronizasiyayı gözlə
4. Tətbiqi yeni klasterə keç (minimal dayanma)
5. Köhnə klateri dayandır
\`\`\`

**Yeniləmədən sonra yoxlama:**
\`\`\`sql
SELECT version();
SELECT * FROM pg_extension;
ALTER EXTENSION postgis UPDATE;
VACUUM ANALYZE;  -- planlaşdırıcı üçün statistika yenilə
\`\`\``
      },
      {
        title: "Böyük cədvəllərlə iş",
        content: `**Toplu DELETE (kilid qarşısını almaq):**
\`\`\`sql
DO $$
DECLARE silinen_satirlar INT := 1;
BEGIN
    WHILE silinen_satirlar > 0 LOOP
        DELETE FROM jurnallar WHERE id IN (
            SELECT id FROM jurnallar
            WHERE yaradildi < '2024-01-01' LIMIT 10000
        );
        GET DIAGNOSTICS silinen_satirlar = ROW_COUNT;
        PERFORM pg_sleep(0.1);
        RAISE NOTICE 'Silindi: %', silinen_satirlar;
    END LOOP;
END $$;
\`\`\`

**CLUSTER — fiziki yenidən sıralama:**
\`\`\`sql
CLUSTER islechiler USING idx_dept_yaradildi;  -- KİLİDLƏYİR!
-- pg_repack kilidsiz alternativ:
-- pg_repack -U postgres -d mydb -t islechiler
\`\`\`

**Köhnə partisiyaların avtomatik silinməsi:**
\`\`\`sql
CREATE OR REPLACE FUNCTION kohne_partisiyalari_sil()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE partisiya_adi TEXT;
BEGIN
    FOR partisiya_adi IN
        SELECT inhrelid::regclass::TEXT FROM pg_inherits
        WHERE inhparent = 'jurnallar'::regclass
    LOOP
        IF partisiya_adi < 'jurnallar_' ||
           to_char(NOW()-interval '90 gün', 'YYYY_MM') THEN
            EXECUTE 'DROP TABLE IF EXISTS ' || partisiya_adi;
            RAISE NOTICE 'Silindi: %', partisiya_adi;
        END IF;
    END LOOP;
END; $$;

SELECT cron.schedule('kohne-sil', '0 2 1 * *',
    'SELECT kohne_partisiyalari_sil()');
\`\`\``
      },
      {
        title: "Tipik DBA səhvləri",
        content: `**Kritik konfiqurasiya səhvləri:**
• fsync = off — HEÇVAXT! → məlumat itkisi
• Həddindən böyük work_mem: 200 bağlantı × 4 sort × 256MB = 200GB!
• idle in transaction-a diqqətsizlik → snapshot saxlayır, VACUUM-a mane olur
• Aktiv olmayan replikasiya slotlarını nəzərə almamaq → disk dolacaq!

**İndeksləmə səhvləri:**
• Boolean/enum sütununda standart indeks → qismli indeks istifadə edin!
• Yanlış sırada mürəkkəb indeks (ESR qaydası unudulub)
• WHERE UPPER(email) = 'X' funksional indekssiz
• Produksiyada CONCURRENTLY-siz CREATE INDEX → bütün cədvəl kilidlənir

**Texniki xidmət səhvləri:**
• Autovacuum-a etinasızlıq → şişkinlik, wraparound
• İş saatlarında VACUUM FULL → tam kilidləmə
• WAL gecikməsini izləməmək
• Ehtiyat nüsxəsindən bərpanı sınamamaq

**Miqrasiya səhvləri:**
• lock_timeout olmadan ALTER TABLE → tətbiqi asar
• NOT NULL əlavəsi DEFAULT-suz (< PG 11 cədvəli yenidən yaradır)
• CONCURRENTLY-siz indeks silinməsi
• Riskli miqrasiyadan əvvəl geri qaytarma planı yoxdur

**Təhlükəsizlik səhvləri:**
\`\`\`sql
-- ETMƏ:
-- pg_hba.conf-da 0.0.0.0/0 üçün trust
-- Bütün istifadəçilərə SUPERUSER ver
-- md5 istifadə et, scram-sha-256 deyil

-- ET:
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE CONNECT ON DATABASE mydb FROM PUBLIC;
ALTER ROLE app_user CONNECTION LIMIT 20;
\`\`\``
      },
      {
        title: "Faydalı DBA sorğuları",
        content: `**Dublikat indekslər:**
\`\`\`sql
SELECT indrelid::regclass AS cedvel,
       array_agg(indexrelid::regclass) AS indekslər,
       array_agg(indkey) AS sutunlar
FROM pg_index GROUP BY indrelid, indkey
HAVING count(*) > 1;
\`\`\`

**Birincil açar olmayan cədvəllər:**
\`\`\`sql
SELECT tablename FROM pg_tables pt
WHERE schemaname = 'public'
  AND NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      WHERE tc.table_name = pt.tablename
        AND tc.constraint_type = 'PRIMARY KEY'
  );
\`\`\`

**Böyük cədvəllərə Seq Scan:**
\`\`\`sql
SELECT schemaname, tablename, seq_scan,
       round(seq_tup_read::numeric / NULLIF(seq_scan,0)) AS scan_başına_ortalama
FROM pg_stat_user_tables
WHERE seq_scan > 0 AND n_live_tup > 100000
ORDER BY seq_tup_read DESC LIMIT 10;
\`\`\`

**Aktiv bağlantılar tətbiq üzrə:**
\`\`\`sql
SELECT application_name, state, count(*)
FROM pg_stat_activity
GROUP BY application_name, state
ORDER BY count(*) DESC;
\`\`\`

**Donmuş hazırlanmış tranzaksiyalar:**
\`\`\`sql
SELECT gid, prepared, owner, database FROM pg_prepared_xacts;
-- Köhnə varsa:
ROLLBACK PREPARED 'tranzaksiya_id';
\`\`\`

**Cədvəl şişkinliyi:**
\`\`\`sql
SELECT relname,
       pg_size_pretty(pg_total_relation_size(oid)) AS cemi,
       pg_size_pretty(pg_relation_size(oid)) AS cedvel,
       pg_size_pretty(pg_total_relation_size(oid) - pg_relation_size(oid)) AS extra
FROM pg_class WHERE relkind = 'r'
ORDER BY pg_total_relation_size(oid) DESC LIMIT 10;
\`\`\``
      }
    ]
  }
];

const renderContent = (content, color) => {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const code = part.replace(/^```\w*\n?/, "").replace(/```$/, "");
      return (
        <pre key={i} style={{
          background:"#0d1117", border:"1px solid #30363d", borderRadius:"8px",
          padding:"16px", overflowX:"auto", fontSize:"12px", lineHeight:"1.6",
          color:"#e6edf3", margin:"12px 0", fontFamily:"'JetBrains Mono','Fira Code',monospace"
        }}><code>{code}</code></pre>
      );
    }
    const lines = part.split("\n");
    return (
      <div key={i} style={{fontSize:"14px",lineHeight:"1.85",color:"#c9d1d9"}}>
        {lines.map((line, li) => {
          if (!line.trim()) return <div key={li} style={{height:"6px"}} />;
          if (line.startsWith("**") && line.endsWith("**") && line.length > 4)
            return <p key={li} style={{fontWeight:700,color:"#f0f6fc",marginTop:"14px",marginBottom:"4px",fontSize:"15px"}}>{line.replace(/\*\*/g,"")}</p>;
          if (line.match(/^\|.*\|$/)) {
            if (line.match(/^\|[-| ]+\|$/)) return null;
            const cells = line.split("|").filter(c=>c.trim());
            return (
              <div key={li} style={{display:"flex",gap:"1px",margin:"1px 0"}}>
                {cells.map((c,ci)=>(
                  <div key={ci} style={{flex:1,padding:"6px 10px",background:"#0d1117",border:"1px solid #30363d",fontSize:"12px",color:"#8b949e"}}>{c.trim()}</div>
                ))}
              </div>
            );
          }
          if (line.startsWith("•")) {
            return <p key={li} style={{margin:"4px 0",paddingLeft:"20px",color:"#8b949e"}}><span style={{color,marginRight:"8px"}}>▸</span>{line.slice(1).trim()}</p>;
          }
          return <p key={li} style={{margin:"3px 0"}}>{line}</p>;
        })}
      </div>
    );
  });
};

export default function PGDBAGuide() {
  const [activeSection, setActiveSection] = useState("basics");
  const [activeTopic, setActiveTopic] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const currentSection = sections.find(s => s.id === activeSection);
  const totalTopics = sections.reduce((a, s) => a + s.topics.length, 0);

  const handleSearch = (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const results = [];
    sections.forEach(sec => {
      sec.topics.forEach((topic, ti) => {
        if (topic.title.toLowerCase().includes(q.toLowerCase()) ||
            topic.content.toLowerCase().includes(q.toLowerCase())) {
          results.push({ section: sec, topicIndex: ti, topic });
        }
      });
    });
    setSearchResults(results);
  };

  return (
    <div style={{display:"flex",height:"100vh",background:"#010409",color:"#f0f6fc",fontFamily:"'Segoe UI',system-ui,sans-serif",overflow:"hidden"}}>
      {/* Sidebar */}
      <div style={{width:"270px",minWidth:"270px",background:"#0d1117",borderRight:"1px solid #21262d",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"18px 16px 12px",borderBottom:"1px solid #21262d",background:"linear-gradient(135deg,#0d1117,#161b22)"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <span style={{fontSize:"26px"}}>🐘</span>
            <div>
              <div style={{fontSize:"15px",fontWeight:700,color:"#f0f6fc"}}>PostgreSQL DBA</div>
              <div style={{fontSize:"11px",color:"#4FC3F7",fontWeight:600}}>{totalTopics} mövzu · Tam konspekt</div>
            </div>
          </div>
        </div>
        <div style={{padding:"10px 12px 6px"}}>
          <input type="text" placeholder="🔍 Axtar..." value={searchQuery}
            onChange={e=>handleSearch(e.target.value)}
            style={{width:"100%",padding:"8px 10px",background:"#161b22",border:"1px solid #30363d",borderRadius:"6px",color:"#f0f6fc",fontSize:"12px",outline:"none",boxSizing:"border-box"}} />
        </div>
        {searchResults.length > 0 && (
          <div style={{padding:"0 10px 6px",maxHeight:"200px",overflowY:"auto"}}>
            {searchResults.map((r,i) => (
              <div key={i} onClick={()=>{setActiveSection(r.section.id);setActiveTopic(r.topicIndex);setSearchQuery("");setSearchResults([]);}}
                style={{padding:"6px 10px",background:"#161b22",borderRadius:"5px",marginBottom:"2px",cursor:"pointer",fontSize:"11px",borderLeft:`3px solid ${r.section.color}`}}>
                <div style={{color:r.section.color}}>{r.section.icon} {r.section.title}</div>
                <div style={{color:"#f0f6fc",marginTop:"1px"}}>{r.topic.title}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{flex:1,overflowY:"auto",padding:"4px 8px 10px"}}>
          {sections.map(sec=>(
            <div key={sec.id} onClick={()=>{setActiveSection(sec.id);setActiveTopic(0);}}
              style={{padding:"9px 12px",marginBottom:"2px",borderRadius:"6px",cursor:"pointer",
                background:activeSection===sec.id?`${sec.color}18`:"transparent",
                border:activeSection===sec.id?`1px solid ${sec.color}40`:"1px solid transparent",
                display:"flex",alignItems:"center",gap:"10px",transition:"all 0.15s"}}>
              <span style={{fontSize:"16px"}}>{sec.icon}</span>
              <div>
                <div style={{fontSize:"13px",fontWeight:activeSection===sec.id?600:400,color:activeSection===sec.id?sec.color:"#8b949e"}}>{sec.title}</div>
                <div style={{fontSize:"10px",color:"#484f58"}}>{sec.topics.length} mövzu</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{padding:"10px 16px",borderTop:"1px solid #21262d",fontSize:"11px",color:"#484f58",textAlign:"center"}}>DBA Edition 2025 🇦🇿</div>
      </div>

      {/* Main */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {currentSection && (
          <>
            <div style={{padding:"14px 24px",borderBottom:"1px solid #21262d",background:"#0d1117",display:"flex",alignItems:"center",gap:"14px"}}>
              <span style={{fontSize:"22px"}}>{currentSection.icon}</span>
              <div style={{flex:1}}>
                <h1 style={{margin:0,fontSize:"17px",fontWeight:700,color:currentSection.color}}>{currentSection.title}</h1>
                <p style={{margin:0,fontSize:"11px",color:"#484f58"}}>{currentSection.topics.length} mövzu</p>
              </div>
            </div>
            <div style={{display:"flex",gap:"4px",padding:"10px 20px",background:"#0d1117",borderBottom:"1px solid #21262d",overflowX:"auto",flexShrink:0}}>
              {currentSection.topics.map((topic,i)=>(
                <button key={i} onClick={()=>setActiveTopic(i)}
                  style={{padding:"6px 13px",borderRadius:"20px",border:"none",cursor:"pointer",fontSize:"11px",
                    fontWeight:activeTopic===i?600:400,whiteSpace:"nowrap",
                    background:activeTopic===i?currentSection.color:"#161b22",
                    color:activeTopic===i?"#000":"#8b949e",transition:"all 0.15s"}}>
                  {topic.title}
                </button>
              ))}
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"24px 32px"}}>
              <h2 style={{fontSize:"19px",fontWeight:700,color:"#f0f6fc",marginTop:0,marginBottom:"18px",
                paddingBottom:"12px",borderBottom:`2px solid ${currentSection.color}40`}}>
                <span style={{color:currentSection.color,marginRight:"10px"}}>◆</span>
                {currentSection.topics[activeTopic]?.title}
              </h2>
              <div>{renderContent(currentSection.topics[activeTopic]?.content||"", currentSection.color)}</div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:"32px",paddingTop:"20px",borderTop:"1px solid #21262d"}}>
                <button onClick={()=>{
                  if(activeTopic>0) setActiveTopic(activeTopic-1);
                  else{const idx=sections.findIndex(s=>s.id===activeSection);if(idx>0){setActiveSection(sections[idx-1].id);setActiveTopic(sections[idx-1].topics.length-1);}}
                }} style={{padding:"8px 16px",background:"#161b22",border:"1px solid #30363d",borderRadius:"6px",color:"#8b949e",cursor:"pointer",fontSize:"13px"}}>
                  ← Geri
                </button>
                <span style={{fontSize:"12px",color:"#484f58",alignSelf:"center"}}>
                  {activeTopic+1} / {currentSection.topics.length}
                </span>
                <button onClick={()=>{
                  if(activeTopic<currentSection.topics.length-1) setActiveTopic(activeTopic+1);
                  else{const idx=sections.findIndex(s=>s.id===activeSection);if(idx<sections.length-1){setActiveSection(sections[idx+1].id);setActiveTopic(0);}}
                }} style={{padding:"8px 16px",background:currentSection.color,border:"none",borderRadius:"6px",color:"#000",cursor:"pointer",fontSize:"13px",fontWeight:600}}>
                  İrəli →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
