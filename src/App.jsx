import { useState } from "react";

const sections = [
  {
    id: "basics", icon: "🗄️", title: "Основы PostgreSQL", color: "#4FC3F7",
    topics: [
      {
        title: "Архитектура",
        content: `PostgreSQL — объектно-реляционная СУБД. Открытый исходный код с 1996 года.

**Модель процессов:**
• Postmaster — главный процесс, слушает порт, создаёт дочерние процессы
• Backend process — отдельный процесс для каждого соединения клиента (fork)
• Background Writer (bgwriter) — записывает грязные страницы из shared_buffers на диск
• WAL Writer — записывает WAL-буфер на диск
• Checkpointer — выполняет контрольные точки
• Autovacuum Launcher/Worker — запускает автовакуум

**Память:**
• Shared Buffers — общий кэш страниц (разделяется между всеми backend-ами)
• WAL Buffers — буфер журнала транзакций
• Work Mem — память для операций сортировки/хеширования (на каждую операцию)
• Maintenance Work Mem — для VACUUM, CREATE INDEX

**Хранение:**
\`\`\`
$PGDATA/
  base/           -- файлы баз данных (по OID)
  global/         -- системные таблицы кластера
  pg_wal/         -- WAL-сегменты (16 МБ каждый)
  pg_xact/        -- статусы транзакций
  postgresql.conf
  pg_hba.conf
  PG_VERSION
\`\`\`

**Жизнь запроса:**
Parser → Rewriter → Planner/Optimizer → Executor → результат`
      },
      {
        title: "Конфигурация",
        content: `**Основные параметры (postgresql.conf):**
\`\`\`
listen_addresses = '*'
port = 5432
max_connections = 200
shared_buffers = 4GB          -- 25% RAM
work_mem = 16MB               -- на одну операцию сортировки/хеширования
maintenance_work_mem = 512MB  -- VACUUM, CREATE INDEX
effective_cache_size = 12GB   -- 75% RAM (подсказка для планировщика)
wal_level = replica
fsync = on                    -- НИКОГДА не отключать!
synchronous_commit = on
max_wal_size = 4GB
checkpoint_completion_target = 0.9
random_page_cost = 1.1        -- для SSD (для HDD — 4.0)
log_min_duration_statement = 1000  -- запросы длиннее 1 сек
\`\`\`

**Применение изменений:**
\`\`\`sql
ALTER SYSTEM SET параметр = значение;
ALTER SYSTEM RESET параметр;
SELECT pg_reload_conf();  -- для sighup-параметров рестарт не нужен
\`\`\``
      },
      {
        title: "pg_hba.conf",
        content: `**Синтаксис:**
\`\`\`
ТИП  БАЗА_ДАННЫХ  ПОЛЬЗОВАТЕЛЬ  АДРЕС  МЕТОД
\`\`\`

**Типы подключений:**
• local — Unix-сокет
• host — TCP (с SSL или без)
• hostssl — только SSL
• hostnossl — только без SSL

**Методы аутентификации:**
• trust — без пароля (только для localhost/инфраструктуры!)
• peer — имя пользователя ОС = имя пользователя БД (только local)
• scram-sha-256 — SCRAM (рекомендуется, PG 10+)
• cert — SSL-сертификат клиента
• ldap — LDAP-сервер
• reject — всегда отклонять

**Примеры:**
\`\`\`
local   all          postgres                  peer
host    replication  replicator  10.0.0.0/8   scram-sha-256
host    mydb         app_user    10.10.0.5/32  scram-sha-256
hostssl all          all         0.0.0.0/0    scram-sha-256
host    all          all         0.0.0.0/0    reject
\`\`\`

**Важно:** файл читается сверху вниз, применяется ПЕРВОЕ совпадение!`
      },
      {
        title: "psql и инструменты",
        content: `**Подключение:**
\`\`\`bash
psql -U postgres -d mydb -h localhost -p 5432
psql "postgresql://user:pass@host:5432/db?sslmode=require"
psql -U postgres -c "SELECT version();"
psql -U postgres -f script.sql
\`\`\`

**Мета-команды:**
\`\`\`
\\l [+]          -- базы данных
\\c dbname       -- сменить базу
\\dt [+]         -- таблицы
\\d таблица      -- структура таблицы
\\d+ таблица     -- с дополнительной информацией
\\di             -- индексы
\\dv             -- представления
\\dm             -- материализованные представления
\\df             -- функции
\\dn             -- схемы
\\du             -- роли
\\dp таблица     -- права
\\timing on      -- замер времени
\\x on|off|auto  -- расширенный вывод
\\e              -- редактор
\\i file.sql     -- выполнить файл
\\watch 2        -- повторять каждые 2 сек
\\q              -- выход
\`\`\`

**Системные утилиты:**
\`\`\`bash
initdb -D /var/lib/postgresql/data
pg_ctl start|stop|restart|reload|status -D /data
pg_dump / pg_dumpall / pg_restore
pg_basebackup  -- физическая резервная копия
vacuumdb -U postgres -d mydb -v
\`\`\``
      },
      {
        title: "Объекты базы данных",
        content: `**Базы данных и схемы:**
\`\`\`sql
CREATE DATABASE mydb
    OWNER postgres ENCODING 'UTF8'
    LC_COLLATE 'ru_RU.UTF-8' TEMPLATE template0;

CREATE SCHEMA app;
SET search_path = app, public;
ALTER ROLE app_user SET search_path = app, public;

SELECT datname, pg_size_pretty(pg_database_size(datname))
FROM pg_database ORDER BY pg_database_size(datname) DESC;
\`\`\`

**Последовательности (Sequences):**
\`\`\`sql
CREATE SEQUENCE order_seq START 1000 INCREMENT 5 CACHE 20;
SELECT nextval('order_seq');
SELECT currval('order_seq');
SELECT setval('order_seq', 5000);

-- IDENTITY (современная замена SERIAL)
CREATE TABLE t (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
);
\`\`\`

**Представления (Views):**
\`\`\`sql
CREATE OR REPLACE VIEW active_employees AS
SELECT id, name, salary, dept_id
FROM employees WHERE active = true;

CREATE MATERIALIZED VIEW dept_stats AS
SELECT dept_id, COUNT(*) as cnt, AVG(salary) as avg_salary
FROM employees GROUP BY dept_id WITH DATA;

REFRESH MATERIALIZED VIEW CONCURRENTLY dept_stats;
CREATE UNIQUE INDEX ON dept_stats (dept_id);
\`\`\`

**Табличные пространства:**
\`\`\`sql
CREATE TABLESPACE ssd_fast LOCATION '/mnt/ssd/pg_data';
CREATE TABLE hot_table (...) TABLESPACE ssd_fast;
\`\`\``
      }
    ]
  },
  {
    id: "sql", icon: "📝", title: "SQL в PostgreSQL", color: "#81C784",
    topics: [
      {
        title: "Типы данных",
        content: `**Числовые типы:**
\`\`\`sql
SMALLINT          -- 2 байта
INTEGER / INT     -- 4 байта
BIGINT            -- 8 байт
NUMERIC(p,s)      -- точное десятичное
REAL              -- 4 байта float
DOUBLE PRECISION  -- 8 байт float
\`\`\`

**Текстовые типы:**
\`\`\`sql
CHAR(n)     -- фиксированная длина
VARCHAR(n)  -- до n символов
TEXT        -- неограниченная длина (рекомендуется!)
\`\`\`

**Дата и время:**
\`\`\`sql
DATE                -- YYYY-MM-DD
TIME / TIMETZ       -- время
TIMESTAMP / TIMESTAMPTZ  -- дата+время
INTERVAL            -- промежуток: '2 years 3 months 5 days'

NOW() / CURRENT_TIMESTAMP
CLOCK_TIMESTAMP()   -- реальное время внутри транзакции
DATE_TRUNC('month', ts)
EXTRACT(year FROM ts)
ts + INTERVAL '30 days'
AGE(ts1, ts2)
\`\`\`

**Специальные типы PostgreSQL:**
\`\`\`sql
UUID              -- gen_random_uuid() (PG 13+)
BOOLEAN           -- true/false/null
BYTEA             -- бинарные данные
INET / CIDR       -- IP-адреса
JSONB / JSON      -- JSON (JSONB предпочтительнее!)
INT4RANGE / TSRANGE / DATERANGE  -- диапазоны
TSVECTOR / TSQUERY -- полнотекстовый поиск
\`\`\`

**Массивы:**
\`\`\`sql
CREATE TABLE t (tags TEXT[], scores INTEGER[]);
INSERT INTO t VALUES (ARRAY['pg','sql'], '{90,85,95}');
SELECT tags[1] FROM t;
SELECT * FROM t WHERE 'pg' = ANY(tags);
SELECT unnest(tags) FROM t;  -- развернуть в строки
\`\`\``
      },
      {
        title: "DDL — Определение структуры",
        content: `**Создание таблицы:**
\`\`\`sql
CREATE TABLE employees (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    salary      NUMERIC(12,2) CHECK (salary > 0),
    dept_id     INTEGER REFERENCES departments(id)
                    ON DELETE SET NULL ON UPDATE CASCADE,
    status      TEXT DEFAULT 'active'
                    CHECK (status IN ('active','inactive','fired')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_name_dept UNIQUE (name, dept_id)
);
\`\`\`

**Ограничения:**
\`\`\`sql
ALTER TABLE t ADD CONSTRAINT chk_salary CHECK (salary > 0) NOT VALID;
ALTER TABLE t VALIDATE CONSTRAINT chk_salary;  -- отдельно, с коротким локом

ALTER TABLE t ADD CONSTRAINT fk_dept
    FOREIGN KEY (dept_id) REFERENCES depts(id)
    DEFERRABLE INITIALLY DEFERRED;
\`\`\`

**Изменение таблицы (безопасно):**
\`\`\`sql
ALTER TABLE t ADD COLUMN new_col TEXT;
ALTER TABLE t ADD COLUMN col TEXT DEFAULT 'value';  -- PG 11+: мгновенно!
ALTER TABLE t DROP COLUMN IF EXISTS old_col;
ALTER TABLE t ALTER COLUMN col SET DEFAULT 0;
ALTER TABLE t ALTER COLUMN col SET NOT NULL;
ALTER TABLE t RENAME COLUMN old_name TO new_name;
ALTER TABLE t RENAME TO new_table_name;
\`\`\``
      },
      {
        title: "DML — Манипуляция данными",
        content: `**INSERT:**
\`\`\`sql
INSERT INTO employees (name, email, salary)
VALUES ('Алексей', 'alex@mail.ru', 75000)
RETURNING id, created_at;

INSERT INTO employees (name, email, salary) VALUES
    ('Анна', 'anna@mail.ru', 80000),
    ('Рустам', 'rustam@mail.ru', 90000);

-- Обновление при конфликте (UPSERT)
INSERT INTO employees (email, name, salary)
VALUES ('alex@mail.ru', 'Алексей', 85000)
ON CONFLICT (email) DO UPDATE
    SET salary = EXCLUDED.salary, updated_at = NOW();

INSERT INTO t (id, value) VALUES (1, 'x')
ON CONFLICT DO NOTHING;
\`\`\`

**UPDATE:**
\`\`\`sql
UPDATE employees e
SET salary = e.salary * d.raise_factor
FROM departments d
WHERE e.dept_id = d.id AND d.budget > 1000000
RETURNING e.id, e.name, e.salary;
\`\`\`

**DELETE:**
\`\`\`sql
DELETE FROM orders o
USING customers c
WHERE o.customer_id = c.id AND c.blocked = true;

TRUNCATE TABLE employees RESTART IDENTITY CASCADE;
\`\`\`

**COPY — быстрая загрузка:**
\`\`\`sql
COPY employees (name, email, salary)
FROM '/tmp/employees.csv' CSV HEADER;

COPY employees TO '/tmp/export.csv' CSV HEADER;
\`\`\``
      },
      {
        title: "SELECT и JOIN",
        content: `**Виды JOIN:**
\`\`\`sql
-- INNER JOIN
SELECT e.name, d.name AS dept
FROM employees e JOIN departments d ON e.dept_id = d.id;

-- LEFT JOIN
SELECT e.name, d.name AS dept
FROM employees e LEFT JOIN departments d ON e.dept_id = d.id;

-- SELF JOIN
SELECT e.name, m.name AS manager
FROM employees e LEFT JOIN employees m ON e.manager_id = m.id;
\`\`\`

**EXISTS (эффективнее чем IN):**
\`\`\`sql
SELECT * FROM departments d WHERE EXISTS (
    SELECT 1 FROM employees e
    WHERE e.dept_id = d.id AND e.salary > 100000
);
\`\`\`

**GROUP BY и агрегаты:**
\`\`\`sql
SELECT dept_id, COUNT(*) AS cnt, AVG(salary) AS avg_salary,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) AS median,
       STRING_AGG(name, ', ' ORDER BY name) AS names
FROM employees
GROUP BY dept_id HAVING COUNT(*) > 5
ORDER BY avg_salary DESC;

-- GROUPING SETS, ROLLUP, CUBE
SELECT dept_id, status, COUNT(*)
FROM employees
GROUP BY GROUPING SETS ((dept_id), (status), ());
\`\`\``
      },
      {
        title: "Оконные функции",
        content: `**Синтаксис:**
\`\`\`sql
функция() OVER (
    [PARTITION BY col1, col2]
    [ORDER BY col3 DESC]
    [ROWS|RANGE BETWEEN ... AND ...]
)
\`\`\`

**Функции ранжирования:**
\`\`\`sql
SELECT name, salary, dept_id,
    ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num,
    RANK()       OVER (ORDER BY salary DESC) AS rank,
    DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rank,
    NTILE(4)     OVER (ORDER BY salary DESC) AS quartile,
    PERCENT_RANK() OVER (ORDER BY salary)   AS pct_rank
FROM employees;
\`\`\`

**Функции навигации:**
\`\`\`sql
SELECT name, salary,
    LAG(salary)  OVER (PARTITION BY dept_id ORDER BY created_at) AS prev_salary,
    LEAD(salary) OVER (PARTITION BY dept_id ORDER BY created_at) AS next_salary,
    FIRST_VALUE(salary) OVER (PARTITION BY dept_id ORDER BY salary DESC) AS max_salary
FROM employees;
\`\`\`

**Агрегаты как оконные:**
\`\`\`sql
SELECT name, salary, dept_id,
    SUM(salary) OVER (PARTITION BY dept_id) AS dept_total,
    AVG(salary) OVER (PARTITION BY dept_id) AS dept_avg,
    SUM(salary) OVER (ORDER BY created_at
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM employees;
\`\`\`

**TOP N из каждой группы:**
\`\`\`sql
SELECT dept_id, name, salary FROM (
    SELECT dept_id, name, salary,
           ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rn
    FROM employees
) t WHERE rn <= 3;  -- топ-3 в каждом отделе
\`\`\``
      },
      {
        title: "CTE и LATERAL",
        content: `**Обычный CTE:**
\`\`\`sql
WITH dept_stat AS (
    SELECT dept_id, AVG(salary) AS avg_salary, COUNT(*) AS cnt
    FROM employees GROUP BY dept_id
),
rich_dept AS (
    SELECT d.name, ds.avg_salary, ds.cnt, ds.avg_salary * ds.cnt AS total_cost
    FROM departments d JOIN dept_stat ds ON d.id = ds.dept_id
)
SELECT * FROM rich_dept WHERE total_cost > 1000000;
\`\`\`

**Рекурсивный CTE:**
\`\`\`sql
WITH RECURSIVE org AS (
    SELECT id, name, manager_id, 0 AS depth, name::TEXT AS path
    FROM employees WHERE manager_id IS NULL
    UNION ALL
    SELECT e.id, e.name, e.manager_id, o.depth+1, o.path || ' → ' || e.name
    FROM employees e JOIN org o ON e.manager_id = o.id
    WHERE o.depth < 10
)
SELECT depth, path FROM org ORDER BY path;
\`\`\`

**LATERAL JOIN:**
\`\`\`sql
-- Последний заказ каждого клиента
SELECT c.name, o.amount, o.date
FROM customers c,
LATERAL (
    SELECT amount, date FROM orders
    WHERE customer_id = c.id ORDER BY date DESC LIMIT 1
) o;
\`\`\`

**MATERIALIZED CTE (PG 12+):**
\`\`\`sql
WITH expensive AS MATERIALIZED (
    SELECT * FROM big_table WHERE condition
)
SELECT * FROM expensive WHERE col = 1
UNION ALL
SELECT * FROM expensive WHERE col = 2;
\`\`\``
      },
      {
        title: "JSON и JSONB",
        content: `**JSON vs JSONB:**
• JSON — хранит текст как есть
• JSONB — бинарный формат, поддерживает индексы → ВСЕГДА используйте JSONB!

**Операторы доступа:**
\`\`\`sql
data->'user_id'           -- JSONB значение
data->>'user_id'          -- текстовое значение
data->'items'->0          -- элемент массива
data#>>'{meta,country}'   -- по пути (текст)
data ? 'user_id'          -- ключ существует
data @> '{"action":"buy"}'::jsonb -- содержит
\`\`\`

**Изменение JSONB:**
\`\`\`sql
UPDATE events
SET data = jsonb_set(data, '{meta,processed}', 'true');
UPDATE events SET data = data - 'meta';
UPDATE events SET data = data || '{"status":"ready"}';
\`\`\`

**Индексы:**
\`\`\`sql
CREATE INDEX ON events USING GIN (data);
CREATE INDEX ON events USING GIN (data jsonb_path_ops);
CREATE INDEX ON events ((data->>'user_id'));
\`\`\``
      }
    ]
  },
  {
    id: "indexes", icon: "⚡", title: "Индексы", color: "#FFB74D",
    topics: [
      {
        title: "Типы индексов",
        content: `**B-Tree (стандартный):** =, <, >, BETWEEN, IN, IS NULL, LIKE 'prefix%'
\`\`\`sql
CREATE INDEX idx_name ON employees (name);
CREATE UNIQUE INDEX idx_email ON employees (email);
CREATE INDEX idx_dept_salary ON employees (dept_id, salary DESC NULLS LAST);
CREATE INDEX idx_active ON employees (email) WHERE deleted_at IS NULL;
CREATE INDEX idx_lower ON employees (LOWER(email));
CREATE INDEX idx_covering ON employees (dept_id) INCLUDE (name, salary);
\`\`\`

**Hash:** только для = (быстрее B-Tree для точного совпадения)
\`\`\`sql
CREATE INDEX ON sessions USING HASH (session_token);
\`\`\`

**GIN:** массивы, JSONB, tsvector
\`\`\`sql
CREATE INDEX ON articles USING GIN (tags);
CREATE INDEX ON events USING GIN (data);
CREATE INDEX ON documents USING GIN (search_vector);
CREATE INDEX ON t USING GIN (name gin_trgm_ops);
\`\`\`

**GiST:** геометрия, диапазоны, PostGIS
\`\`\`sql
CREATE INDEX ON locations USING GIST (point_col);
CREATE INDEX ON reservations USING GIST (period);  -- TSRANGE
\`\`\`

**BRIN:** маленький индекс для больших append-only таблиц
\`\`\`sql
CREATE INDEX ON logs USING BRIN (created_at) WITH (pages_per_range=128);
\`\`\``
      },
      {
        title: "Стратегии индексирования",
        content: `**Правило ESR (Equality → Sort → Range):**
\`\`\`sql
-- Запрос:
SELECT * FROM orders
WHERE customer_id = 42 AND status = 'pending'
ORDER BY created_at LIMIT 20;

-- Оптимальный индекс:
CREATE INDEX ON orders (customer_id, status, created_at);
\`\`\`

**Частичный индекс для низкоселективных столбцов:**
\`\`\`sql
-- Вместо отдельного индекса по status:
CREATE INDEX ON orders (created_at) WHERE status = 'pending';
\`\`\`

**Покрывающий индекс (INCLUDE):**
\`\`\`sql
CREATE INDEX idx_covering ON employees (dept_id)
INCLUDE (name, salary);
-- Index Only Scan → обращение к таблице не нужно
\`\`\`

**Когда индекс не используется:**
• Таблица маленькая — Seq Scan дешевле
• На столбце есть функция (WHERE UPPER(email) = 'ALEX')
• Низкая селективность (WHERE gender = 'M' → 50% строк)
• Неявное приведение типа: WHERE varchar_col = 123

**Неиспользуемые индексы:**
\`\`\`sql
SELECT schemaname, tablename, indexname, idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
\`\`\`

**Онлайн-создание/удаление:**
\`\`\`sql
CREATE INDEX CONCURRENTLY idx_new ON t (col);
DROP INDEX CONCURRENTLY idx_old;
REINDEX INDEX CONCURRENTLY idx_name;
\`\`\``
      },
      {
        title: "EXPLAIN ANALYZE",
        content: `**Синтаксис:**
\`\`\`sql
EXPLAIN SELECT ...;
EXPLAIN ANALYZE SELECT ...;
EXPLAIN (ANALYZE, BUFFERS) SELECT ...;
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT ...;
\`\`\`

**Узлы плана выполнения:**
• Seq Scan — полное сканирование таблицы
• Index Scan — поиск по индексу + чтение из таблицы
• Index Only Scan — только из индекса (покрывающий индекс — идеально!)
• Bitmap Heap Scan — сканирование кучи по битовой карте
• Hash Join — хеш-соединение для больших таблиц
• Nested Loop — для маленькой внешней таблицы
• Merge Join — соединение отсортированных наборов
• Sort, Aggregate, HashAggregate
• Gather — сбор результатов параллельных воркеров

**Расшифровка:**
\`\`\`
cost=0.00..1234.56 rows=50000 width=64
    ^старт    ^итого  ^ожидаемых  ^ширина строки
(actual time=0.042..15.3 rows=48921 loops=1)
Buffers: shared hit=823 read=12  -- кэш vs диск
Filter: (salary > 50000)
Rows Removed by Filter: 1079
\`\`\`

**Проблема статистики:**
\`\`\`sql
ANALYZE employees;
ALTER TABLE employees ALTER COLUMN salary SET STATISTICS 500;
CREATE STATISTICS stat ON dept_id, salary FROM employees;
\`\`\`

**Онлайн-инструменты:**
• explain.depesz.com — цветной анализ
• explain.dalibo.com — визуализация дерева`
      },
      {
        title: "pg_stat_statements",
        content: `**Настройка:**
\`\`\`
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.max = 10000
pg_stat_statements.track = all
pg_stat_statements.track_io_timing = on
\`\`\`
\`\`\`sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
\`\`\`

**Самые медленные запросы:**
\`\`\`sql
SELECT query, calls,
       round(total_exec_time::numeric, 2) AS total_ms,
       round(mean_exec_time::numeric, 2)  AS avg_ms,
       rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC LIMIT 10;
\`\`\`

**Чтение с диска:**
\`\`\`sql
SELECT query, shared_blks_read AS disk_reads,
       shared_blks_hit AS cache_hits,
       round(shared_blks_hit::numeric /
             NULLIF(shared_blks_hit+shared_blks_read,0)*100,1) AS cache_ratio
FROM pg_stat_statements WHERE shared_blks_read > 1000
ORDER BY disk_reads DESC LIMIT 10;
\`\`\`

**Временные файлы (нехватка work_mem):**
\`\`\`sql
SELECT query, temp_blks_written
FROM pg_stat_statements WHERE temp_blks_written > 0
ORDER BY temp_blks_written DESC LIMIT 10;
\`\`\`

\`\`\`sql
SELECT pg_stat_statements_reset();  -- сбросить статистику
\`\`\``
      }
    ]
  },
  {
    id: "transactions", icon: "🔒", title: "Транзакции и MVCC", color: "#F48FB1",
    topics: [
      {
        title: "ACID и транзакции",
        content: `**ACID:**
• Atomicity — всё или ничего
• Consistency — ограничения не нарушаются
• Isolation — транзакции изолированы друг от друга
• Durability — зафиксированные данные сохраняются (WAL → диск)

**Управление:**
\`\`\`sql
BEGIN;
BEGIN ISOLATION LEVEL SERIALIZABLE;
BEGIN READ ONLY;

COMMIT;
ROLLBACK;

SAVEPOINT sp1;
ROLLBACK TO SAVEPOINT sp1;
RELEASE SAVEPOINT sp1;

-- DDL поддерживается в транзакциях!
BEGIN;
  ALTER TABLE t ADD COLUMN new_col TEXT;
  UPDATE t SET new_col = 'default';
COMMIT;  -- или ROLLBACK — DDL тоже откатывается!
\`\`\`

**Состояния транзакции:**
• active — запрос выполняется
• idle — ожидает следующую команду
• idle in transaction — BEGIN без COMMIT (опасно!)
• idle in transaction (aborted) — ошибка, нужен ROLLBACK

\`\`\`sql
-- Убить зависшие транзакции
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle in transaction'
  AND now() - state_change > interval '10 minutes';

SET idle_in_transaction_session_timeout = '5min';
\`\`\``
      },
      {
        title: "MVCC",
        content: `**Как работает MVCC (Многоверсионное управление конкурентным доступом):**

У каждой строки есть скрытые системные поля:
• xmin — ID транзакции, создавшей строку
• xmax — ID транзакции, удалившей строку (0 = активна)
• ctid — физическое расположение (блок, смещение)

\`\`\`sql
SELECT xmin, xmax, ctid, id, name FROM employees LIMIT 5;
\`\`\`

**При UPDATE:**
1. Старая строка: отмечается xmax = текущий xid
2. Новая строка: создаётся с xmin = текущий xid
Обе на диске → нужен VACUUM!

**При DELETE:**
Строка отмечается xmax, физически не удаляется до VACUUM.

**Снимок (Snapshot):**
При старте транзакции берётся список активных XID.
Строка видна: xmin зафиксирован И (xmax=0 ИЛИ xmax не зафиксирован)

**Transaction ID Wraparound:**
\`\`\`sql
SELECT datname, age(datfrozenxid),
       2147483647 - age(datfrozenxid) AS xid_left
FROM pg_database ORDER BY age(datfrozenxid) DESC;
-- age > ~1.5 млрд → ОПАСНО!

VACUUM FREEZE table_name;
-- autovacuum_freeze_max_age = 200 млн (по умолчанию)
\`\`\``
      },
      {
        title: "Уровни изоляции",
        content: `| Уровень | Грязное чтение | Неповторяемое | Фантомное |
| Read Committed | нет | возможно | возможно |
| Repeatable Read | нет | нет | нет (в PG) |
| Serializable | нет | нет | нет |

**Read Committed (по умолчанию):**
Каждый оператор видит последние зафиксированные данные.
Проблема: разные SELECT в одной транзакции могут вернуть разные результаты.

**Repeatable Read:**
\`\`\`sql
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
-- Снимок берётся один раз (при первом SELECT)
-- Конфликт: ERROR: could not serialize access
\`\`\`

**Serializable (SSI):**
\`\`\`sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- Полная сериализация (PG 9.1+)
-- При конфликте: ERROR: could not serialize access
-- Приложение ОБЯЗАНО повторить транзакцию!
\`\`\`

**Шаблон повтора для Serializable:**
\`\`\`sql
-- В приложении (псевдокод):
LOOP
  BEGIN;
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  -- бизнес-логика...
  COMMIT;
  EXIT;  -- успех
  EXCEPTION WHEN serialization_failure THEN
    ROLLBACK;
    -- пауза и повтор
END LOOP;
\`\`\``
      },
      {
        title: "Механизм блокировок",
        content: `**Виды блокировок таблицы (от слабых к сильным):**
\`\`\`
ACCESS SHARE            -- SELECT
ROW SHARE               -- SELECT FOR UPDATE/SHARE
ROW EXCLUSIVE           -- INSERT, UPDATE, DELETE
SHARE UPDATE EXCLUSIVE  -- VACUUM, ANALYZE, CREATE INDEX CONCURRENTLY
SHARE                   -- CREATE INDEX (без CONCURRENTLY)
EXCLUSIVE               -- REFRESH MATERIALIZED VIEW CONCURRENTLY
ACCESS EXCLUSIVE        -- ALTER TABLE, DROP, TRUNCATE, VACUUM FULL
\`\`\`

**Блокировка строки:**
\`\`\`sql
SELECT * FROM t WHERE id = 1 FOR UPDATE;
SELECT * FROM t WHERE id = 1 FOR UPDATE SKIP LOCKED;
SELECT * FROM t WHERE id = 1 FOR UPDATE NOWAIT;
SELECT * FROM t WHERE id = 1 FOR SHARE;
\`\`\`

**Мониторинг блокировок:**
\`\`\`sql
SELECT blocked.pid AS blocked_pid, blocked.query AS blocked_query,
       blocking.pid AS blocking_pid, blocking.query AS blocking_query,
       now()-blocked.query_start AS wait_time
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking
    ON blocking.pid = ANY(pg_blocking_pids(blocked.pid));

SELECT pg_cancel_backend(pid);    -- мягко: отменить запрос
SELECT pg_terminate_backend(pid); -- жёстко: убить соединение

SET lock_timeout = '5s';
SET statement_timeout = '30s';
SET deadlock_timeout = '1s';
\`\`\``
      },
      {
        title: "Advisory Locks",
        content: `**Механизм блокировки на уровне приложения (не привязан к объектам):**

**Блокировка сессии:**
\`\`\`sql
SELECT pg_advisory_lock(42);            -- взять (ждать)
SELECT pg_advisory_unlock(42);          -- освободить
SELECT pg_advisory_unlock_all();        -- освободить все
SELECT pg_try_advisory_lock(42);        -- без ожидания → boolean
SELECT pg_advisory_lock_shared(42);     -- разделяемая блокировка
\`\`\`

**Блокировка транзакции (освобождается при COMMIT/ROLLBACK):**
\`\`\`sql
SELECT pg_advisory_xact_lock(42);
SELECT pg_try_advisory_xact_lock(42);
\`\`\`

**Предотвращение параллельного запуска задачи:**
\`\`\`sql
DO $$
BEGIN
    IF NOT pg_try_advisory_lock(hashtext('night_report')) THEN
        RAISE NOTICE 'Уже запущено, пропускаем';
        RETURN;
    END IF;
    -- выполнить задачу...
    PERFORM pg_advisory_unlock(hashtext('night_report'));
END $$;
\`\`\`

**Шаблон очереди задач:**
\`\`\`sql
SELECT id, payload FROM jobs
WHERE status = 'pending'
  AND pg_try_advisory_lock(id)
ORDER BY priority DESC, created_at
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
    id: "performance", icon: "🚀", title: "Производительность", color: "#CE93D8",
    topics: [
      {
        title: "VACUUM и раздувание",
        content: `**Зачем нужен VACUUM:**
• Удаляет мёртвые кортежи (dead tuples) → освобождает место для повторного использования
• Обновляет карту видимости → ускоряет Index Only Scan
• Замораживает XID (предотвращает wraparound)
• Не возвращает место ОС (только VACUUM FULL это делает)

\`\`\`sql
VACUUM table_name;
VACUUM VERBOSE table_name;
VACUUM ANALYZE table_name;
VACUUM FREEZE table_name;
VACUUM FULL table_name;   -- БЛОКИРУЕТ! Использовать в окне обслуживания
\`\`\`

**Параметры autovacuum:**
\`\`\`
autovacuum_vacuum_threshold = 50
autovacuum_vacuum_scale_factor = 0.2
autovacuum_analyze_scale_factor = 0.1
autovacuum_vacuum_cost_delay = 2ms
\`\`\`

**Для горячей таблицы:**
\`\`\`sql
ALTER TABLE orders SET (
    autovacuum_vacuum_scale_factor = 0.01,
    autovacuum_analyze_scale_factor = 0.005,
    autovacuum_vacuum_cost_delay = 0,
    autovacuum_vacuum_cost_limit = 1000
);
\`\`\`

**Мониторинг:**
\`\`\`sql
SELECT relname, n_live_tup, n_dead_tup,
       round(n_dead_tup::numeric/NULLIF(n_live_tup+n_dead_tup,0)*100,1) AS dead_pct,
       last_vacuum, last_autovacuum
FROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 20;
\`\`\``
      },
      {
        title: "Партиционирование",
        content: `**RANGE — по диапазону:**
\`\`\`sql
CREATE TABLE orders (
    id BIGINT, created_at TIMESTAMPTZ NOT NULL, amount NUMERIC
) PARTITION BY RANGE (created_at);

CREATE TABLE orders_2024q1 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
CREATE TABLE orders_default PARTITION OF orders DEFAULT;
\`\`\`

**LIST — по списку значений:**
\`\`\`sql
CREATE TABLE sales PARTITION BY LIST (region);
CREATE TABLE sales_ru PARTITION OF sales
    FOR VALUES IN ('Москва', 'СПб', 'Казань');
\`\`\`

**HASH — равномерное распределение:**
\`\`\`sql
CREATE TABLE logs PARTITION BY HASH (user_id);
CREATE TABLE logs_p0 PARTITION OF logs
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);
\`\`\`

**Управление:**
\`\`\`sql
-- Добавить новую партицию
CREATE TABLE orders_2025q1 PARTITION OF orders
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

-- Отсоединить (PG 14+: CONCURRENTLY — без блокировки)
ALTER TABLE orders DETACH PARTITION orders_2024q1 CONCURRENTLY;

-- Удалить
DROP TABLE orders_2024q1;

-- Индекс автоматически создаётся на всех партициях
CREATE INDEX ON orders (created_at);
\`\`\``
      },
      {
        title: "Connection Pooling",
        content: `**Проблема:** Каждое соединение = процесс ОС (~5–10 МБ RAM). 1000 соединений → 5–10 ГБ overhead!

**PgBouncer:**
Режимы:
• Session — клиент удерживает соединение (наименее эффективно)
• Transaction — возврат в пул после COMMIT/ROLLBACK (рекомендуется)
• Statement — после каждого запроса

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

**Мониторинг:**
\`\`\`sql
psql -p 6432 pgbouncer
SHOW POOLS;    -- состояние пулов
SHOW STATS;    -- статистика
SHOW CLIENTS;  -- клиентские соединения
RELOAD;        -- перечитать конфигурацию
\`\`\`

**Ограничения transaction mode:**
SET, LISTEN/NOTIFY, сессионные advisory locks — не работают`
      },
      {
        title: "Параллельные запросы",
        content: `**Параметры:**
\`\`\`
max_parallel_workers = 8
max_parallel_workers_per_gather = 4
max_parallel_maintenance_workers = 4  -- CREATE INDEX, VACUUM
min_parallel_table_scan_size = 8MB
\`\`\`

**Управление:**
\`\`\`sql
SET max_parallel_workers_per_gather = 4;
ALTER TABLE big_table SET (parallel_workers = 4);
SET max_parallel_workers_per_gather = 0;  -- отключить
\`\`\`

**Выполняется параллельно:**
• Parallel Seq Scan
• Parallel Bitmap Heap Scan
• Parallel Hash Join (PG 11+)
• Partial Aggregate → Finalize Aggregate
• CREATE INDEX (PG 11+)
• VACUUM (PG 13+)

**Не выполняется параллельно:**
• INSERT/UPDATE/DELETE
• Функции PARALLEL UNSAFE
• FOR UPDATE

\`\`\`sql
-- Проверить volatility функции
SELECT proname, proparallel FROM pg_proc WHERE proname = 'my_function';
-- s=safe, r=restricted, u=unsafe

CREATE FUNCTION my_function() RETURNS void
LANGUAGE sql PARALLEL SAFE AS '...';
\`\`\``
      },
      {
        title: "Материализованные представления",
        content: `**Создание и обновление:**
\`\`\`sql
CREATE MATERIALIZED VIEW monthly_sales AS
SELECT DATE_TRUNC('month', created_at) AS month,
       category_id, SUM(amount) AS total
FROM orders GROUP BY 1, 2
WITH DATA;

-- Обновить (блокирует чтение!)
REFRESH MATERIALIZED VIEW monthly_sales;

-- Без блокировки (нужен уникальный индекс!)
CREATE UNIQUE INDEX ON monthly_sales (month, category_id);
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales;
\`\`\`

**Стратегии обновления:**
\`\`\`sql
-- По расписанию через pg_cron
SELECT cron.schedule('refresh-mv', '0 * * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales');

-- Инкрементальное обновление
BEGIN;
DELETE FROM mv_daily WHERE date = CURRENT_DATE;
INSERT INTO mv_daily SELECT ... WHERE DATE(created_at) = CURRENT_DATE;
COMMIT;
\`\`\`

**Когда использовать:**
• Тяжёлые аналитические запросы (большие агрегации)
• Данные редко обновляются (раз в час/день)
• Небольшая задержка приемлема`
      }
    ]
  },
  {
    id: "replication", icon: "🔄", title: "Репликация и Высокая Доступность", color: "#80DEEA",
    topics: [
      {
        title: "Физическая репликация",
        content: `**Уровни WAL:**
\`\`\`
wal_level = minimal    -- только восстановление после сбоя
wal_level = replica    -- физическая репликация (по умолчанию)
wal_level = logical    -- + логическая репликация
\`\`\`

**Настройка Primary:**
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
CREATE ROLE replicator REPLICATION LOGIN PASSWORD 'secret';
\`\`\`

**Создание реплики:**
\`\`\`bash
pg_basebackup -h primary_host -U replicator \
  -D /var/lib/postgresql/15/standby \
  -Fp -Xs -P -R
\`\`\`

**Мониторинг:**
\`\`\`sql
-- На Primary:
SELECT client_addr, state, sent_lsn, replay_lsn,
       write_lag, flush_lag, replay_lag, sync_state
FROM pg_stat_replication;

-- На Standby:
SELECT pg_is_in_recovery();
SELECT now() - pg_last_xact_replay_timestamp() AS lag;
\`\`\`

**Синхронная репликация:**
\`\`\`
synchronous_standby_names = 'FIRST 1 (standby1, standby2)'
\`\`\``
      },
      {
        title: "Слоты репликации",
        content: `**Гарантирует, что WAL не будет удалён до получения репликой.**
ОПАСНО: если реплика долго отключена — диск заполнится!

\`\`\`sql
-- Создать физический слот
SELECT pg_create_physical_replication_slot('replica1_slot');
-- В postgresql.conf standby: primary_slot_name = 'replica1_slot'

-- Создать логический слот
SELECT pg_create_logical_replication_slot('my_slot', 'pgoutput');

-- Просмотр
SELECT slot_name, slot_type, active, restart_lsn,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS lag
FROM pg_replication_slots;

-- Удалить
SELECT pg_drop_replication_slot('my_slot');
\`\`\`

**Предотвращение заполнения диска:**
\`\`\`sql
SELECT slot_name, active,
       pg_size_pretty(pg_wal_lsn_diff(
           pg_current_wal_lsn(), restart_lsn)) AS wal_lag
FROM pg_replication_slots WHERE NOT active;

-- PG 13+: установить лимит WAL перед удалением слота
-- max_slot_wal_keep_size = 10GB
\`\`\``
      },
      {
        title: "Логическая репликация",
        content: `**Преимущества:** Репликация между разными версиями PG, фильтрация таблиц/строк/столбцов

**Издатель (Publisher):**
\`\`\`sql
-- wal_level = logical (в postgresql.conf)

CREATE PUBLICATION pub_orders FOR TABLE orders, order_items;
CREATE PUBLICATION pub_ru FOR TABLE orders WHERE (region = 'RU');
CREATE PUBLICATION pub_partial FOR TABLE employees (id, name, dept_id);

ALTER PUBLICATION pub_orders ADD TABLE deliveries;
DROP PUBLICATION pub_orders;

SELECT * FROM pg_publication;
SELECT * FROM pg_publication_tables;
\`\`\`

**Подписчик (Subscriber):**
\`\`\`sql
CREATE SUBSCRIPTION sub_orders
    CONNECTION 'host=primary dbname=mydb user=replicator'
    PUBLICATION pub_orders;

ALTER SUBSCRIPTION sub_orders DISABLE;
ALTER SUBSCRIPTION sub_orders ENABLE;
ALTER SUBSCRIPTION sub_orders REFRESH PUBLICATION;

SELECT * FROM pg_stat_subscription;
\`\`\`

**Ограничения:**
• DDL не реплицируется
• Таблицы должны иметь PK или REPLICA IDENTITY
\`\`\`sql
ALTER TABLE t REPLICA IDENTITY FULL;
ALTER TABLE t REPLICA IDENTITY USING INDEX idx_unique;
\`\`\``
      },
      {
        title: "Patroni и Высокая Доступность",
        content: `**Архитектура:**
\`\`\`
      DCS (etcd/Consul/ZooKeeper)
         выбор лидера
    ┌────────────┼────────────┐
  node1        node2        node3
 Primary      Реплика      Реплика
    ▲ HAProxy / VIP
 клиенты
\`\`\`

**Команды patronictl:**
\`\`\`bash
patronictl -c /etc/patroni.yml list
patronictl -c /etc/patroni.yml switchover --master node1 --candidate node2
patronictl -c /etc/patroni.yml failover --master node1
patronictl -c /etc/patroni.yml restart cluster_name node1
patronictl -c /etc/patroni.yml reload cluster_name
patronictl -c /etc/patroni.yml edit-config
patronictl -c /etc/patroni.yml pause cluster_name
patronictl -c /etc/patroni.yml resume cluster_name
patronictl -c /etc/patroni.yml history
\`\`\`

**Балансировка нагрузки HAProxy:**
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

**Задержанная реплика (защита от случайного удаления):**
\`\`\`
recovery_min_apply_delay = '1h'
\`\`\``
      }
    ]
  },
  {
    id: "backup", icon: "💾", title: "Резервное копирование и Восстановление", color: "#FFCC80",
    topics: [
      {
        title: "pg_dump",
        content: `**Форматы:**
• plain (p) — SQL-скрипт, читаемый текст
• custom (c) — сжатый бинарный, параллельное восстановление
• directory (d) — параллельный дамп (-j N)
• tar (t) — tar-архив

\`\`\`bash
# Custom формат (рекомендуется!)
pg_dump -U postgres -Fc mydb > mydb.dump
pg_dump -U postgres -Fc -Z 9 mydb > mydb.dump   # макс. сжатие

# Параллельный дамп
pg_dump -U postgres -Fd -j 8 mydb -f /backup/mydb_dir/

# Только структура / только данные
pg_dump -U postgres -s mydb > schema.sql
pg_dump -U postgres -a mydb > data.sql

# Определённые таблицы
pg_dump -U postgres -t orders -t order_items mydb > orders.dump

# Весь кластер
pg_dumpall -U postgres > cluster.sql
pg_dumpall -U postgres -g > globals_only.sql
\`\`\`

**Восстановление:**
\`\`\`bash
psql -U postgres mydb < mydb.sql
pg_restore -U postgres -d mydb mydb.dump
pg_restore -U postgres -d mydb -j 8 mydb.dump   # параллельно
pg_restore -U postgres -C -d postgres mydb.dump  # создать БД
pg_restore -U postgres -d mydb -t orders mydb.dump  # одна таблица
pg_restore -U postgres -d mydb --clean mydb.dump
\`\`\``
      },
      {
        title: "PITR (восстановление на момент времени)",
        content: `**Принцип:** Базовый бэкап + непрерывный архив WAL → восстановление на любой момент

**Архивирование WAL:**
\`\`\`
archive_mode = on
archive_command = 'cp %p /archive/%f'
archive_command = 'aws s3 cp %p s3://bucket/wal/%f'
archive_timeout = 60  -- архивировать WAL-файл каждые 60 сек
\`\`\`

**Базовый бэкап:**
\`\`\`bash
pg_basebackup -U postgres -D /backup/base \
  -Ft -z -P --wal-method=stream
\`\`\`

**Конфигурация восстановления (PG 12+):**
\`\`\`bash
cp -r /backup/base/* $PGDATA/
touch $PGDATA/recovery.signal
\`\`\`
\`\`\`
# В postgresql.conf:
restore_command = 'cp /archive/%f %p'

# Цель восстановления:
recovery_target_time = '2025-06-01 14:30:00 UTC'
recovery_target_lsn  = '0/15000060'
recovery_target_name = 'before_migration'
recovery_target       = 'immediate'

recovery_target_inclusive = true
recovery_target_action = 'promote'
\`\`\`

**Именованные точки восстановления:**
\`\`\`sql
SELECT pg_create_restore_point('before_migration_v2');
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
repo1-cipher-pass=my_secret_key

# Для S3:
repo1-type=s3
repo1-s3-bucket=pg-backups
repo1-s3-region=eu-central-1
repo1-s3-key=ACCESS_KEY
repo1-s3-key-secret=SECRET_KEY

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

**Расписание (crontab):**
\`\`\`cron
0 2 * * 0 pgbackrest --stanza=main backup --type=full
0 2 * * 1-6 pgbackrest --stanza=main backup --type=diff
\`\`\``
      },
      {
        title: "Стратегия резервного копирования",
        content: `**RPO и RTO:**
• RPO (Recovery Point Objective) — максимально допустимая потеря данных
• RTO (Recovery Time Objective) — максимальное время восстановления

**Матрица стратегий:**
| Требование | Решение |
| RPO = 0 | Синхронная репликация |
| RPO < 1 мин | Streaming + WAL архив |
| RPO < 1 час | PITR с archive_timeout |
| RTO < 1 мин | Hot standby + автофейловер |
| RTO < 1 час | pg_basebackup + WAL replay |

**Правило 3-2-1:**
• 3 копии данных
• 2 разных носителя
• 1 копия в другом месте (другой ДЦ / облако)

**Тестирование восстановления (ОБЯЗАТЕЛЬНО!):**
\`\`\`bash
pg_restore -d test_db /backup/mydb.dump
psql test_db -f /scripts/integrity_check.sql
SELECT COUNT(*) FROM critical_table;
\`\`\`

**Мониторинг бэкапов:**
\`\`\`sql
SELECT backup_time, backup_type, duration, size
FROM backup_history ORDER BY backup_time DESC LIMIT 5;
-- Алерт: нет успешного бэкапа за 26 часов
\`\`\``
      }
    ]
  },
  {
    id: "security", icon: "🛡️", title: "Безопасность", color: "#EF9A9A",
    topics: [
      {
        title: "Роли и привилегии",
        content: `**Создание ролей:**
\`\`\`sql
CREATE ROLE read_only;
CREATE ROLE read_write;
CREATE USER app_user WITH PASSWORD 'secret' LOGIN;
CREATE USER report WITH PASSWORD 'secret' LOGIN CONNECTION LIMIT 5;
CREATE USER temp_user WITH PASSWORD 'p' LOGIN VALID UNTIL '2025-12-31';

GRANT read_only TO read_write;
GRANT read_write TO db_admin;
GRANT db_admin TO app_admin;
\`\`\`

**Привилегии:**
\`\`\`sql
REVOKE CONNECT ON DATABASE mydb FROM PUBLIC;
GRANT CONNECT ON DATABASE mydb TO read_only;
GRANT USAGE ON SCHEMA public TO read_only, read_write;
GRANT CREATE ON SCHEMA public TO read_write;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO read_only;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO read_write;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO read_write;
\`\`\`

**Для будущих объектов (очень важно!):**
\`\`\`sql
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO read_only;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO read_write;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE ON SEQUENCES TO read_write;

-- На уровне столбцов:
GRANT SELECT (id, name, dept_id) ON employees TO read_only;
\`\`\``
      },
      {
        title: "Безопасность на уровне строк (RLS)",
        content: `\`\`\`sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;  -- даже для владельца

-- Политика: пользователь видит только свои документы
CREATE POLICY user_docs ON documents
    FOR ALL TO PUBLIC
    USING (owner_id = current_user_id())
    WITH CHECK (owner_id = current_user_id());

-- Раздельные политики
CREATE POLICY own_docs_read ON documents FOR SELECT
    USING (owner_id = current_user_id());
CREATE POLICY public_docs ON documents FOR SELECT
    USING (is_public = true);
CREATE POLICY admin_all ON documents FOR ALL TO admin_role
    USING (true);

-- Функция получения ID пользователя
CREATE FUNCTION current_user_id() RETURNS INT AS $$
    SELECT id FROM users WHERE username = current_user;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
\`\`\`

**Для connection pooling:**
\`\`\`sql
SET app.current_user_id = '42';

CREATE POLICY session_policy ON documents FOR ALL
    USING (owner_id = current_setting('app.current_user_id')::INT);
\`\`\``
      },
      {
        title: "SSL и шифрование",
        content: `**Настройка SSL:**
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

**pgcrypto — шифрование данных:**
\`\`\`sql
CREATE EXTENSION pgcrypto;

-- Хеш пароля bcrypt
INSERT INTO users (email, password_hash)
VALUES ('user@mail.ru', crypt('password', gen_salt('bf', 10)));

SELECT * FROM users
WHERE password_hash = crypt('password', password_hash);

-- Симметричное шифрование (AES)
UPDATE sensitive_data
SET encrypted = pgp_sym_encrypt(plain_text, 'key', 'cipher-algo=aes256');

SELECT pgp_sym_decrypt(encrypted, 'key') FROM sensitive_data;

SELECT gen_random_uuid();
\`\`\``
      },
      {
        title: "Аудит",
        content: `**pgaudit:**
\`\`\`
shared_preload_libraries = 'pgaudit'
pgaudit.log = 'write,ddl'
pgaudit.log_parameter = on
pgaudit.log_catalog = off
\`\`\`
\`\`\`sql
CREATE EXTENSION pgaudit;
ALTER ROLE sensitive_user SET pgaudit.log = 'all';
\`\`\`

**Категории:** read, write, function, role, ddl, misc, all

**Мониторинг безопасности:**
\`\`\`sql
-- Активные суперпользовательские сессии
SELECT pid, usename, client_addr, query
FROM pg_stat_activity WHERE usesuper AND state != 'idle';

-- Роли без пароля (уязвимость!)
SELECT rolname FROM pg_roles
WHERE rolcanlogin AND rolpassword IS NULL;

-- Устаревшие MD5 пароли
SELECT rolname FROM pg_authid WHERE rolpassword LIKE 'md5%';

-- Небезопасные методы аутентификации
SELECT type, database, user_name, auth_method
FROM pg_hba_file_rules WHERE auth_method IN ('trust','password');
\`\`\`

**Лучшие практики:**
• REVOKE ALL ON SCHEMA public FROM PUBLIC
• REVOKE CONNECT ON DATABASE FROM PUBLIC
• Используйте scram-sha-256, не md5
• Устанавливайте CONNECTION LIMIT для ролей
• Не давайте разработчикам SUPERUSER`
      }
    ]
  },
  {
    id: "monitoring", icon: "📊", title: "Мониторинг", color: "#A5D6A7",
    topics: [
      {
        title: "Системные представления",
        content: `**pg_stat_activity — активные процессы:**
\`\`\`sql
SELECT pid, usename, application_name, client_addr, state,
       wait_event_type, wait_event,
       now()-query_start  AS query_duration,
       now()-state_change AS state_duration,
       left(query, 120) AS query
FROM pg_stat_activity
WHERE pid != pg_backend_pid()
ORDER BY query_duration DESC NULLS LAST;
\`\`\`

**Статистика таблиц:**
\`\`\`sql
SELECT relname, seq_scan, idx_scan,
       CASE WHEN seq_scan+idx_scan > 0
            THEN round(idx_scan::numeric/(seq_scan+idx_scan)*100,1)
       END AS idx_usage_pct,
       n_live_tup, n_dead_tup, last_autovacuum, last_analyze,
       pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_stat_user_tables ORDER BY seq_scan DESC;
\`\`\`

**Размеры:**
\`\`\`sql
SELECT datname, pg_size_pretty(pg_database_size(datname))
FROM pg_database ORDER BY pg_database_size(datname) DESC;

SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total,
       pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes
FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 20;
\`\`\``
      },
      {
        title: "Кэш и производительность",
        content: `**Cache Hit Ratio (норма > 99%):**
\`\`\`sql
-- По всей базе
SELECT round(
    blks_hit::numeric / NULLIF(blks_hit+blks_read, 0) * 100, 2
) AS cache_ratio
FROM pg_stat_database WHERE datname = current_database();

-- По таблицам
SELECT relname,
       round(heap_blks_hit::numeric /
             NULLIF(heap_blks_hit+heap_blks_read,0)*100,2) AS cache_ratio
FROM pg_statio_user_tables ORDER BY heap_blks_read DESC;
\`\`\`

**Статистика checkpoints:**
\`\`\`sql
SELECT checkpoints_timed, checkpoints_req,
       checkpoint_write_time/1000 AS write_sec,
       buffers_checkpoint, buffers_clean, buffers_backend, maxwritten_clean
FROM pg_stat_bgwriter;
-- buffers_backend высокий → shared_buffers мало
-- maxwritten_clean > 0 → bgwriter не справляется
\`\`\`

**Временные файлы:**
\`\`\`sql
SELECT datname, temp_files, pg_size_pretty(temp_bytes) AS temp_size
FROM pg_stat_database WHERE temp_files > 0 ORDER BY temp_bytes DESC;
-- Если есть → увеличить work_mem
\`\`\`

**Коэффициент откатов:**
\`\`\`sql
SELECT datname,
       round(xact_rollback::numeric / NULLIF(xact_commit+xact_rollback,0)*100, 2) AS rollback_pct
FROM pg_stat_database WHERE datname NOT LIKE 'template%';
-- > 5% → частые ошибки в приложении
\`\`\``
      },
      {
        title: "Мониторинг блокировок",
        content: `**Долгие запросы:**
\`\`\`sql
SELECT pid, usename, now()-query_start AS duration, state, query
FROM pg_stat_activity
WHERE state != 'idle' AND now()-query_start > interval '30 seconds'
ORDER BY duration DESC;
\`\`\`

**Кто кого блокирует:**
\`\`\`sql
SELECT blocked.pid AS blocked_pid, blocked.query AS blocked_query,
       blocking.pid AS blocking_pid, blocking.query AS blocking_query,
       now()-blocked.query_start AS wait_time
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking
    ON blocking.pid = ANY(pg_blocking_pids(blocked.pid))
ORDER BY wait_time DESC;
\`\`\`

**Детали блокировок:**
\`\`\`sql
SELECT l.pid, l.locktype, l.relation::regclass, l.mode, l.granted, a.query
FROM pg_locks l JOIN pg_stat_activity a ON l.pid = a.pid
WHERE NOT l.granted;
\`\`\`

**Лимиты времени:**
\`\`\`sql
SET lock_timeout = '10s';
SET statement_timeout = '60s';
SET idle_in_transaction_session_timeout = '5min';
\`\`\``
      },
      {
        title: "Prometheus и алерты",
        content: `**postgres_exporter:**
\`\`\`bash
docker run -d -p 9187:9187 \
    -e DATA_SOURCE_NAME="postgresql://postgres:pass@host:5432/postgres?sslmode=disable" \
    prometheuscommunity/postgres-exporter
\`\`\`

**Основные метрики:**
• pg_up — доступность (1/0)
• pg_stat_activity_count — количество соединений по состоянию
• pg_stat_database_blks_hit/read — использование кэша
• pg_replication_lag — задержка репликации (секунды)
• pg_stat_user_tables_n_dead_tup — мёртвые строки
• pg_database_size_bytes — размер БД

**Правила алертов:**
\`\`\`yaml
- alert: PostgreSQLDown
  expr: pg_up == 0
  for: 1m
  labels: { severity: critical }

- alert: TooManyConnections
  expr: sum(pg_stat_activity_count) > pg_settings_max_connections * 0.8
  for: 5m

- alert: HighReplicationLag
  expr: pg_replication_lag > 30
  for: 5m

- alert: LowCacheRatio
  expr: cache_hit_ratio < 0.99
  for: 10m

- alert: LongRunningQuery
  expr: pg_stat_activity_max_tx_duration > 300
  for: 2m
\`\`\``
      },
      {
        title: "Диагностика проблем",
        content: `**Чеклист диагностики производительности:**

\`\`\`sql
-- 1. Что происходит прямо сейчас?
SELECT pid, state, wait_event_type, wait_event,
       now()-query_start AS duration, query
FROM pg_stat_activity WHERE state != 'idle'
ORDER BY duration DESC NULLS LAST;

-- 2. Есть ли ожидание блокировок?
SELECT count(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock';

-- 3. Cache ratio в норме?
SELECT round(blks_hit::numeric/(blks_hit+blks_read)*100,2)
FROM pg_stat_database WHERE datname = current_database();

-- 4. Есть ли временные файлы?
SELECT temp_files, pg_size_pretty(temp_bytes)
FROM pg_stat_database WHERE datname = current_database();

-- 5. Много мёртвых строк?
SELECT relname, n_dead_tup,
       round(n_dead_tup::numeric/NULLIF(n_live_tup,0)*100,1) AS dead_pct
FROM pg_stat_user_tables WHERE n_dead_tup > 10000
ORDER BY dead_pct DESC;

-- 6. Самые медленные запросы
SELECT left(query,80), calls, round(mean_exec_time::numeric,1) AS avg_ms
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;

-- 7. Задержка WAL слотов репликации
SELECT slot_name, pg_size_pretty(
    pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn))
FROM pg_replication_slots WHERE NOT active;

-- 8. Угроза wraparound
SELECT datname, age(datfrozenxid),
       2147483647 - age(datfrozenxid) AS xid_left
FROM pg_database ORDER BY age(datfrozenxid) DESC LIMIT 5;
\`\`\``
      }
    ]
  },
  {
    id: "advanced", icon: "🔬", title: "Продвинутые темы", color: "#B39DDB",
    topics: [
      {
        title: "PL/pgSQL",
        content: `**Структура функции:**
\`\`\`sql
CREATE OR REPLACE FUNCTION func_name(p1 TYPE, p2 TYPE DEFAULT value)
RETURNS return_type
LANGUAGE plpgsql
VOLATILE | STABLE | IMMUTABLE
SECURITY DEFINER | SECURITY INVOKER
AS $$
DECLARE
    v_var   TYPE := initial_value;
    v_rec   RECORD;
BEGIN
    -- тело
    RETURN result;
EXCEPTION
    WHEN unique_violation THEN RAISE NOTICE 'Дубликат: %', SQLERRM;
    WHEN OTHERS THEN RAISE EXCEPTION 'Ошибка %: %', SQLSTATE, SQLERRM;
END;
$$;
\`\`\`

**Управляющие конструкции:**
\`\`\`sql
IF salary > 100000 THEN grade := 'Ведущий специалист';
ELSIF salary > 60000 THEN grade := 'Специалист';
ELSE grade := 'Младший специалист'; END IF;

FOR rec IN SELECT * FROM t WHERE condition LOOP
    RAISE NOTICE 'Строка: %', rec.col;
END LOOP;

FOR i IN 1..10 LOOP ... END LOOP;
WHILE counter < 100 LOOP ... END LOOP;

-- Динамический SQL (безопасно!)
EXECUTE 'SELECT * FROM ' || quote_ident(table_name)
    INTO v_rec USING param;
EXECUTE format('CREATE INDEX ON %I (%I)', tbl, col);
\`\`\`

**Возврат нескольких строк:**
\`\`\`sql
CREATE FUNCTION get_stats()
RETURNS TABLE (dept_id INT, avg_salary NUMERIC)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
        SELECT e.dept_id, AVG(e.salary) FROM employees e GROUP BY 1;
END; $$;
\`\`\`

**Процедуры (PG 11+):**
\`\`\`sql
CREATE OR REPLACE PROCEDURE transfer_money(
    from_id INT, to_id INT, amount NUMERIC)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE accounts SET balance = balance - amount WHERE id = from_id;
    UPDATE accounts SET balance = balance + amount WHERE id = to_id;
    COMMIT;
END; $$;
CALL transfer_money(1, 2, 1000);
\`\`\``
      },
      {
        title: "Триггеры",
        content: `**Виды:** BEFORE/AFTER/INSTEAD OF × INSERT/UPDATE/DELETE/TRUNCATE × ROW/STATEMENT

**Триггер аудита:**
\`\`\`sql
CREATE OR REPLACE FUNCTION audit_changes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO audit_log (
        table_name, operation, old_data, new_data, changed_by, changed_at)
    VALUES (
        TG_TABLE_NAME, TG_OP,
        CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) END,
        CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) END,
        current_user, NOW()
    );
    RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER trg_audit
    AFTER INSERT OR UPDATE OR DELETE ON employees
    FOR EACH ROW EXECUTE FUNCTION audit_changes();
\`\`\`

**Автоматический updated_at:**
\`\`\`sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_timestamp BEFORE UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
\`\`\`

**Управление триггерами:**
\`\`\`sql
ALTER TABLE employees DISABLE TRIGGER trg_audit;
ALTER TABLE employees ENABLE TRIGGER trg_audit;
ALTER TABLE employees DISABLE TRIGGER ALL;
DROP TRIGGER IF EXISTS trg_audit ON employees;
\`\`\``
      },
      {
        title: "Расширения (Extensions)",
        content: `\`\`\`sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SELECT * FROM pg_extension;
SELECT * FROM pg_available_extensions ORDER BY name;
\`\`\`

**Важные расширения:**

**pg_trgm** — поиск подстрок (LIKE '%..%' с индексом):
\`\`\`sql
CREATE EXTENSION pg_trgm;
CREATE INDEX ON products USING GIN (name gin_trgm_ops);
SELECT * FROM products WHERE name ILIKE '%телефон%';
SELECT similarity('PostgreSQL', 'PostreSQL');  -- 0.7
\`\`\`

**pg_cron** — планировщик задач:
\`\`\`sql
-- shared_preload_libraries = 'pg_cron'
CREATE EXTENSION pg_cron;
SELECT cron.schedule('night-vacuum', '0 3 * * *', 'VACUUM ANALYZE orders');
SELECT cron.schedule('refresh-mv', '*/15 * * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_stats');
\`\`\`

**pgvector** — векторный поиск (AI/ML):
\`\`\`sql
CREATE EXTENSION vector;
CREATE TABLE embeddings (id BIGSERIAL PRIMARY KEY, vec vector(1536));
CREATE INDEX ON embeddings USING ivfflat (vec vector_cosine_ops);
SELECT * FROM embeddings ORDER BY vec <=> query_vector LIMIT 5;
\`\`\`

| Расширение | Назначение |
| pg_stat_statements | Статистика запросов |
| pgcrypto | Шифрование |
| uuid-ossp | Генерация UUID |
| pg_trgm | LIKE '%text%' с индексом |
| citext | TEXT без учёта регистра |
| postgres_fdw | Внешние источники данных |
| TimescaleDB | Временные ряды |
| PostGIS | Геопространственные данные |
| pgvector | Векторный поиск |`
      },
      {
        title: "Полнотекстовый поиск",
        content: `**Хранение tsvector в таблице:**
\`\`\`sql
ALTER TABLE articles ADD COLUMN search_vector TSVECTOR;

-- Автоматическое обновление через триггер
CREATE TRIGGER tsvector_update BEFORE INSERT OR UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION
    tsvector_update_trigger(search_vector, 'pg_catalog.russian', title, body);
\`\`\`

**Вручную с весами:**
\`\`\`sql
UPDATE articles SET search_vector =
    setweight(to_tsvector('russian', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('russian', coalesce(body,'')), 'B');

CREATE INDEX ON articles USING GIN (search_vector);
\`\`\`

**Поиск и ранжирование:**
\`\`\`sql
SELECT id, title,
       ts_rank(search_vector, query) AS rank,
       ts_headline('russian', body, query, 'MaxWords=15,MinWords=5') AS excerpt
FROM articles, to_tsquery('russian', 'postgresql & репликация') query
WHERE search_vector @@ query ORDER BY rank DESC LIMIT 10;
\`\`\`

**Типы запросов:**
\`\`\`sql
to_tsquery('russian', 'база & данных')   -- И
to_tsquery('russian', 'база | данных')   -- ИЛИ
plainto_tsquery('russian', 'база данных') -- слова через &
websearch_to_tsquery('russian', 'база -oracle') -- Google-стиль
\`\`\``
      },
      {
        title: "LISTEN / NOTIFY",
        content: `**Асинхронные уведомления:**
\`\`\`sql
LISTEN orders_channel;
UNLISTEN orders_channel;
UNLISTEN *;

NOTIFY orders_channel;
NOTIFY orders_channel, '{"id": 42, "amount": 999}';
\`\`\`

**Уведомление из триггера:**
\`\`\`sql
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM pg_notify('new_orders', row_to_json(NEW)::TEXT);
    RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify AFTER INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION notify_new_order();
\`\`\`

**Сценарии использования:**
• Инвалидация кэша приложения
• Очереди задач
• Real-time уведомления между сервисами

**ВАЖНО:** LISTEN требует постоянного соединения → несовместимо с PgBouncer в transaction mode!

**Шаблон очереди задач:**
\`\`\`sql
LISTEN job_queue;
-- При получении NOTIFY:
SELECT id, payload FROM jobs WHERE status = 'pending'
ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED;
UPDATE jobs SET status = 'running' WHERE id = :id;
\`\`\``
      },
      {
        title: "Foreign Data Wrappers (FDW)",
        content: `**postgres_fdw — PostgreSQL ↔ PostgreSQL:**
\`\`\`sql
CREATE EXTENSION postgres_fdw;

CREATE SERVER remote_analytics
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (host '10.0.0.100', port '5432', dbname 'analytics',
             fetch_size '10000', use_remote_estimate 'true');

CREATE USER MAPPING FOR app_user SERVER remote_analytics
    OPTIONS (user 'reader', password 'secret');

IMPORT FOREIGN SCHEMA public
    FROM SERVER remote_analytics INTO remote_schema;

-- Использовать как обычную таблицу (JOIN тоже работает!)
SELECT c.name, o.amount FROM local_customers c
JOIN remote_orders o ON c.id = o.customer_id;
\`\`\`

**file_fdw — CSV файлы:**
\`\`\`sql
CREATE EXTENSION file_fdw;
CREATE SERVER csv_files FOREIGN DATA WRAPPER file_fdw;

CREATE FOREIGN TABLE access_log (ip TEXT, ts TIMESTAMPTZ, path TEXT)
    SERVER csv_files
    OPTIONS (filename '/var/log/access.csv', format 'csv', header 'true');
\`\`\`

| Тип | FDW |
| PostgreSQL | postgres_fdw |
| MySQL/MariaDB | mysql_fdw |
| Oracle | oracle_fdw |
| SQL Server | tds_fdw |
| CSV файл | file_fdw |
| Любой источник | multicorn (Python) |`
      }
    ]
  },
  {
    id: "dba_tasks", icon: "🧰", title: "Задачи DBA", color: "#FFD54F",
    topics: [
      {
        title: "Ежедневный чеклист",
        content: `\`\`\`sql
-- 1. Доступность
SELECT now(), version(), pg_is_in_recovery();

-- 2. Соединения
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

-- 3. Долгие запросы (> 5 минут)
SELECT pid, usename, now()-query_start AS duration, left(query,80)
FROM pg_stat_activity WHERE state != 'idle'
  AND now()-query_start > interval '5 minutes'
ORDER BY duration DESC;

-- 4. Ожидание блокировок
SELECT count(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock';

-- 5. Репликация
SELECT client_addr, state, replay_lag, sync_state FROM pg_stat_replication;
SELECT now() - pg_last_xact_replay_timestamp() AS lag;  -- на standby

-- 6. Размеры баз
SELECT datname, pg_size_pretty(pg_database_size(datname))
FROM pg_database WHERE datname NOT LIKE 'template%';

-- 7. Мёртвые строки
SELECT relname, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables WHERE n_dead_tup > 50000
ORDER BY n_dead_tup DESC LIMIT 10;

-- 8. Неактивные слоты репликации (диск заполнится!)
SELECT slot_name,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS wal_lag
FROM pg_replication_slots WHERE NOT active;

-- 9. Угроза wraparound
SELECT datname, age(datfrozenxid),
       2147483647 - age(datfrozenxid) AS xid_left
FROM pg_database ORDER BY age(datfrozenxid) DESC;
\`\`\``
      },
      {
        title: "pg_upgrade",
        content: `**Обновление major-версии:**

**Способ 1: pg_upgrade (с простоем):**
\`\`\`bash
pg_ctl stop -D /old/data
/usr/lib/postgresql/16/bin/initdb -D /new/data

# Проверка совместимости (без реальной миграции)
pg_upgrade --old-datadir /old/data --new-datadir /new/data \
    --old-bindir /usr/lib/postgresql/14/bin \
    --new-bindir /usr/lib/postgresql/16/bin --check

# Обновление
pg_upgrade --old-datadir /old/data --new-datadir /new/data \
    --old-bindir /usr/lib/postgresql/14/bin \
    --new-bindir /usr/lib/postgresql/16/bin \
    --jobs 4 --link   # hard link (быстро, но откат невозможен!)

./analyze_new_cluster.sh
./delete_old_cluster.sh
\`\`\`

**Способ 2: Логическая репликация (без простоя):**
\`\`\`
1. Поднять новый PG 16 кластер
2. Настроить логическую репликацию старый → новый
3. Дождаться синхронизации
4. Переключить приложение на новый кластер (минимальный простой)
5. Остановить старый кластер
\`\`\`

**Проверка после обновления:**
\`\`\`sql
SELECT version();
SELECT * FROM pg_extension;
ALTER EXTENSION postgis UPDATE;
VACUUM ANALYZE;  -- обновить статистику для планировщика
\`\`\``
      },
      {
        title: "Работа с большими таблицами",
        content: `**Пакетный DELETE (избегать блокировок):**
\`\`\`sql
DO $$
DECLARE deleted_rows INT := 1;
BEGIN
    WHILE deleted_rows > 0 LOOP
        DELETE FROM logs WHERE id IN (
            SELECT id FROM logs
            WHERE created_at < '2024-01-01' LIMIT 10000
        );
        GET DIAGNOSTICS deleted_rows = ROW_COUNT;
        PERFORM pg_sleep(0.1);
        RAISE NOTICE 'Удалено: %', deleted_rows;
    END LOOP;
END $$;
\`\`\`

**CLUSTER — физическая пересортировка:**
\`\`\`sql
CLUSTER employees USING idx_dept_created;  -- БЛОКИРУЕТ!
-- pg_repack — альтернатива без блокировки:
-- pg_repack -U postgres -d mydb -t employees
\`\`\`

**Автоматическое удаление старых партиций:**
\`\`\`sql
CREATE OR REPLACE FUNCTION drop_old_partitions()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE part_name TEXT;
BEGIN
    FOR part_name IN
        SELECT inhrelid::regclass::TEXT FROM pg_inherits
        WHERE inhparent = 'logs'::regclass
    LOOP
        IF part_name < 'logs_' ||
           to_char(NOW()-interval '90 days', 'YYYY_MM') THEN
            EXECUTE 'DROP TABLE IF EXISTS ' || part_name;
            RAISE NOTICE 'Удалено: %', part_name;
        END IF;
    END LOOP;
END; $$;

SELECT cron.schedule('drop-old', '0 2 1 * *',
    'SELECT drop_old_partitions()');
\`\`\``
      },
      {
        title: "Типичные ошибки DBA",
        content: `**Критические ошибки конфигурации:**
• fsync = off — НИКОГДА! → потеря данных
• Слишком большой work_mem: 200 соединений × 4 сортировки × 256 МБ = 200 ГБ!
• Игнорирование idle in transaction → держит снапшот, мешает VACUUM
• Неактивные слоты репликации → диск заполнится!

**Ошибки индексирования:**
• Обычный индекс на boolean/enum-столбец → используйте частичный индекс!
• Неправильный порядок в составном индексе (забыто правило ESR)
• WHERE UPPER(email) = 'X' без функционального индекса
• CREATE INDEX без CONCURRENTLY на проде → вся таблица заблокируется

**Ошибки обслуживания:**
• Игнорирование autovacuum → раздувание, wraparound
• VACUUM FULL в рабочее время → полная блокировка
• Не мониторить задержку WAL
• Не тестировать восстановление из бэкапа

**Ошибки миграций:**
• ALTER TABLE без lock_timeout → повесит приложение
• Добавление NOT NULL без DEFAULT (< PG 11 пересоздаёт таблицу)
• Удаление индекса без CONCURRENTLY
• Нет плана отката перед рискованной миграцией

**Ошибки безопасности:**
\`\`\`sql
-- НЕ ДЕЛАТЬ:
-- trust для 0.0.0.0/0 в pg_hba.conf
-- Давать SUPERUSER всем пользователям
-- Использовать md5 вместо scram-sha-256

-- ДЕЛАТЬ:
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE CONNECT ON DATABASE mydb FROM PUBLIC;
ALTER ROLE app_user CONNECTION LIMIT 20;
\`\`\``
      },
      {
        title: "Полезные запросы DBA",
        content: `**Дублирующиеся индексы:**
\`\`\`sql
SELECT indrelid::regclass AS table,
       array_agg(indexrelid::regclass) AS indexes,
       array_agg(indkey) AS columns
FROM pg_index GROUP BY indrelid, indkey
HAVING count(*) > 1;
\`\`\`

**Таблицы без первичного ключа:**
\`\`\`sql
SELECT tablename FROM pg_tables pt
WHERE schemaname = 'public'
  AND NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      WHERE tc.table_name = pt.tablename
        AND tc.constraint_type = 'PRIMARY KEY'
  );
\`\`\`

**Seq Scan по большим таблицам:**
\`\`\`sql
SELECT schemaname, tablename, seq_scan,
       round(seq_tup_read::numeric / NULLIF(seq_scan,0)) AS avg_per_scan
FROM pg_stat_user_tables
WHERE seq_scan > 0 AND n_live_tup > 100000
ORDER BY seq_tup_read DESC LIMIT 10;
\`\`\`

**Активные соединения по приложению:**
\`\`\`sql
SELECT application_name, state, count(*)
FROM pg_stat_activity
GROUP BY application_name, state
ORDER BY count(*) DESC;
\`\`\`

**Зависшие подготовленные транзакции:**
\`\`\`sql
SELECT gid, prepared, owner, database FROM pg_prepared_xacts;
-- Если есть старые:
ROLLBACK PREPARED 'transaction_id';
\`\`\`

**Раздувание таблиц:**
\`\`\`sql
SELECT relname,
       pg_size_pretty(pg_total_relation_size(oid)) AS total,
       pg_size_pretty(pg_relation_size(oid)) AS table,
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
              <div style={{fontSize:"11px",color:"#4FC3F7",fontWeight:600}}>{totalTopics} тем · Полный конспект</div>
            </div>
          </div>
        </div>
        <div style={{padding:"10px 12px 6px"}}>
          <input type="text" placeholder="🔍 Поиск..." value={searchQuery}
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
                <div style={{fontSize:"10px",color:"#484f58"}}>{sec.topics.length} тем</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{padding:"10px 16px",borderTop:"1px solid #21262d",fontSize:"11px",color:"#484f58",textAlign:"center"}}>DBA Edition 2025 🇷🇺</div>
      </div>

      {/* Main */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {currentSection && (
          <>
            <div style={{padding:"14px 24px",borderBottom:"1px solid #21262d",background:"#0d1117",display:"flex",alignItems:"center",gap:"14px"}}>
              <span style={{fontSize:"22px"}}>{currentSection.icon}</span>
              <div style={{flex:1}}>
                <h1 style={{margin:0,fontSize:"17px",fontWeight:700,color:currentSection.color}}>{currentSection.title}</h1>
                <p style={{margin:0,fontSize:"11px",color:"#484f58"}}>{currentSection.topics.length} тем</p>
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
                  ← Назад
                </button>
                <span style={{fontSize:"12px",color:"#484f58",alignSelf:"center"}}>
                  {activeTopic+1} / {currentSection.topics.length}
                </span>
                <button onClick={()=>{
                  if(activeTopic<currentSection.topics.length-1) setActiveTopic(activeTopic+1);
                  else{const idx=sections.findIndex(s=>s.id===activeSection);if(idx<sections.length-1){setActiveSection(sections[idx+1].id);setActiveTopic(0);}}
                }} style={{padding:"8px 16px",background:currentSection.color,border:"none",borderRadius:"6px",color:"#000",cursor:"pointer",fontSize:"13px",fontWeight:600}}>
                  Далее →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}