-- =============================================================================
-- SHERIVS-002 — cross-tenant isolation sweep (LOCAL, DISPOSABLE DATABASE ONLY)
-- =============================================================================
-- Run as a superuser (postgres) against a disposable loopback database that
-- has database/supabase/migrations applied (plus the local identity freeze):
--
--   psql "postgresql://postgres@127.0.0.1:<port>/<disposable_db>" \
--        -v ON_ERROR_STOP=1 -f tests/integration/sherivs-002-cross-tenant.local.sql
--
-- Everything runs inside ONE transaction that is rolled back (or aborted on
-- leak), so no seed data survives. Exit code is non-zero when any LEAK exists.
-- Never point this at a hosted / linked Supabase project. See
-- tests/integration/README-sherivs-002.md.
--
-- Outcomes: PASS (isolation held) | LEAK (cross-tenant access succeeded) |
--           PUBLIC_BY_DESIGN (intentional public website exposure, see below) |
--           SKIPPED (table could not be seeded) | ERROR (inconclusive, triage) |
--           INFO (inventory / control).
--
-- Victim (B) seeding: every boolean is_published / is_active / published /
-- is_public column is seeded FALSE so by-design public visibility cannot mask a
-- leak. For the by-design public tables (published website content, active
-- sports) a SECOND B row with the flag TRUE is seeded and its visibility is
-- recorded as PUBLIC_BY_DESIGN. Also PUBLIC_BY_DESIGN: schools active-row SELECT,
-- admission_applications INSERT (public application form) - classified, not fixed.
-- Step 2 (20261020000040): school-media anon SELECT is NO LONGER by design (a
-- visible object is a LEAK); admissions/student-documents are registrar/admin
-- only; extra sections INTRA-SCHOOL ADMISSIONS, STORAGE and MULTI-ARG FUZZ run
-- after the main sweep.
--
-- COLUMN-SECRET check: any text/bytea/json column named like
-- secret|password|private_key|api_key|service_key|token that anon/authenticated
-- can SELECT (column privilege) while a victim row was visible to that role
-- is recorded as LEAK 'secret column readable cross-tenant'.
-- Tenant value = school id (schools.id) for school_id / tenant_id / tenant_ref
-- columns, mirroring how the app uses the school id as the cg_ tenant ref.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------- guard -----
DO $guard$
BEGIN
  IF NOT (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION 'SV2: must run as a superuser (postgres) on a disposable DB';
  END IF;
  IF inet_server_addr() IS NOT NULL
     AND NOT (inet_server_addr() <<= '127.0.0.0/8'::inet OR inet_server_addr() = '::1'::inet)
     AND coalesce(current_setting('sv2.allow_non_loopback', true), 'off') <> 'on' THEN
    RAISE EXCEPTION 'SV2: refusing non-loopback server address % (set PGOPTIONS="-c sv2.allow_non_loopback=on" only for a disposable container)', inet_server_addr();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
     OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    RAISE EXCEPTION 'SV2: anon/authenticated roles missing - not a Supabase-shaped database';
  END IF;
  IF to_regclass('public.schools') IS NULL OR to_regclass('public.users') IS NULL OR to_regclass('auth.users') IS NULL THEN
    RAISE EXCEPTION 'SV2: public.schools / public.users / auth.users missing - migrations not applied';
  END IF;
  RAISE NOTICE 'SV2: db=% server_addr=%', current_database(), coalesce(inet_server_addr()::text, 'unix-socket');
END
$guard$;

-- ------------------------------------------------------- scratch objects ----
CREATE SCHEMA sv2_test;
GRANT USAGE ON SCHEMA sv2_test TO PUBLIC;

CREATE TEMP TABLE sv2_results (tbl text, actor text, op text, outcome text, detail text);
CREATE TEMP TABLE sv2_schools (label text PRIMARY KEY, id uuid NOT NULL);
CREATE TEMP TABLE sv2_users   (label text, role text, user_id uuid NOT NULL, PRIMARY KEY (label, role));
CREATE TEMP TABLE sv2_cfg (
  tbl text PRIMARY KEY, tcol text NOT NULL, tcols text[] NOT NULL,
  cols text[] NOT NULL, exprs text[] NOT NULL, types text[] NOT NULL,
  status text NOT NULL, err text,
  flagcols text[] NOT NULL DEFAULT '{}', pubseed boolean NOT NULL DEFAULT false
);
-- Per-table column overrides for seeding. variant 'base' applies to every seeded
-- row and to the attack-INSERT template; 'extra' adds one more victim row.
CREATE TEMP TABLE sv2_over (tbl text NOT NULL, col text NOT NULL, expr text NOT NULL, variant text NOT NULL DEFAULT 'base');

-- Default dummy expression (already cast) for a column type.
CREATE FUNCTION sv2_test.default_expr(p_typid oid, p_typmod int) RETURNS text
LANGUAGE plpgsql AS $f$
DECLARE
  base pg_type%ROWTYPE;
  ft text := format_type(p_typid, p_typmod);
  lbl text;
  len int;
BEGIN
  SELECT * INTO base FROM pg_type WHERE oid = p_typid;
  WHILE base.typtype = 'd' LOOP
    SELECT * INTO base FROM pg_type WHERE oid = base.typbasetype;
  END LOOP;
  IF base.typtype = 'e' THEN
    SELECT enumlabel INTO lbl FROM pg_enum WHERE enumtypid = base.oid ORDER BY enumsortorder LIMIT 1;
    RETURN format('%L::%s', lbl, ft);
  END IF;
  IF base.typcategory = 'A' THEN
    RETURN format('%L::%s', '{}', ft);
  END IF;
  CASE
    WHEN base.typname = 'uuid' THEN RETURN format('gen_random_uuid()::%s', ft);
    WHEN base.typname = 'bool' THEN RETURN format('false::%s', ft);
    WHEN base.typname IN ('text','varchar','bpchar','citext','name') THEN
      len := 12;
      IF base.typname IN ('varchar','bpchar') AND p_typmod > 4 THEN len := least(12, p_typmod - 4); END IF;
      RETURN format('substr(md5(random()::text),1,%s)::%s', len, ft);
    WHEN base.typname IN ('int2','int4','int8','numeric','float4','float8','oid','money') THEN RETURN format('0::%s', ft);
    WHEN base.typname = 'date' THEN RETURN format('CURRENT_DATE::%s', ft);
    WHEN base.typname IN ('timestamp','timestamptz') THEN RETURN format('now()::%s', ft);
    WHEN base.typname IN ('time','timetz') THEN RETURN format('localtime::%s', ft);
    WHEN base.typname = 'interval' THEN RETURN format('%L::%s', '0 seconds', ft);
    WHEN base.typname IN ('json','jsonb') THEN RETURN format('%L::%s', '{}', ft);
    WHEN base.typname = 'bytea' THEN RETURN format('%L::%s', '\x00', ft);
    WHEN base.typname = 'inet' THEN RETURN format('%L::%s', '127.0.0.1', ft);
    WHEN base.typname = 'cidr' THEN RETURN format('%L::%s', '127.0.0.0/8', ft);
    WHEN base.typname = 'macaddr' THEN RETURN format('%L::%s', '00:00:00:00:00:01', ft);
    WHEN base.typname = 'tsvector' THEN RETURN format('%L::%s', '', ft);
    ELSE RETURN format('NULL::%s', ft);
  END CASE;
END
$f$;

-- Candidate replacement expressions for a column constrained by a CHECK.
CREATE FUNCTION sv2_test.candidates(p_typid oid, p_typmod int, p_def text) RETURNS text[]
LANGUAGE plpgsql AS $f$
DECLARE
  base pg_type%ROWTYPE;
  ft text := format_type(p_typid, p_typmod);
  outc text[] := '{}';
  lits text[] := '{}';
  m text[];
  lit text;
BEGIN
  SELECT * INTO base FROM pg_type WHERE oid = p_typid;
  WHILE base.typtype = 'd' LOOP
    SELECT * INTO base FROM pg_type WHERE oid = base.typbasetype;
  END LOOP;
  FOR m IN SELECT regexp_matches(p_def, '''([^'']*)''', 'g') LOOP
    lits := lits || m[1];
  END LOOP;
  IF base.typtype = 'e' THEN
    FOR lit IN SELECT enumlabel FROM pg_enum WHERE enumtypid = base.oid ORDER BY enumsortorder LOOP
      outc := outc || format('%L::%s', lit, ft);
    END LOOP;
  ELSIF base.typcategory = 'A' THEN
    outc := ARRAY[format('%L::%s','{}',ft), format('%L::%s','{x}',ft), format('%L::%s','{1}',ft)];
  ELSIF base.typname IN ('text','varchar','bpchar','citext','name') THEN
    lits := lits || ARRAY['x','a','active','role:administrator','role:member','pending','test@example.com',
                          'https://example.com','abc','user','low','0','1'];
    FOREACH lit IN ARRAY lits LOOP outc := outc || format('%L::%s', lit, ft); END LOOP;
  ELSIF base.typname IN ('int2','int4','int8','numeric','float4','float8','money') THEN
    FOR m IN SELECT regexp_matches(p_def, '(-?[0-9]+(?:\.[0-9]+)?)', 'g') LOOP
      outc := outc || format('%s::%s', m[1], ft);
    END LOOP;
    outc := outc || ARRAY[format('1::%s',ft), format('2::%s',ft), format('10::%s',ft), format('100::%s',ft), format('(-1)::%s',ft), format('0::%s',ft)];
  ELSIF base.typname = 'bool' THEN
    outc := ARRAY[format('true::%s',ft), format('false::%s',ft)];
  ELSIF base.typname IN ('json','jsonb') THEN
    outc := ARRAY[format('%L::%s','{}',ft), format('%L::%s','[]',ft), format('%L::%s','{"a":1}',ft),
                  format('%L::%s','"x"',ft), format('%L::%s','1',ft), format('%L::%s','true',ft)];
  ELSIF base.typname IN ('date','timestamp','timestamptz','time','timetz') THEN
    outc := ARRAY[format('now()::%s',ft), format('(now() + interval ''1 day'')::%s',ft),
                  format('(now() - interval ''1 day'')::%s',ft), format('%L::%s','1970-01-01',ft)];
  ELSIF base.typname = 'uuid' THEN
    outc := ARRAY[format('gen_random_uuid()::%s',ft)];
  END IF;
  RETURN outc;
END
$f$;

CREATE FUNCTION sv2_test.build_ins(p_tbl text, p_cols text[], p_exprs text[], p_types text[], p_tenant uuid) RETURNS text
LANGUAGE plpgsql AS $f$
DECLARE s text;
BEGIN
  SELECT format('INSERT INTO public.%I (%s) VALUES (%s)', p_tbl,
                string_agg(quote_ident(c), ',' ORDER BY ord),
                string_agg(replace(e, '@@TENANT@@', format('%L::%s', p_tenant::text, ty)), ',' ORDER BY ord))
    INTO s
    FROM unnest(p_cols, p_exprs, p_types) WITH ORDINALITY AS u(c, e, ty, ord);
  RETURN s;
END
$f$;

-- Run one insert and roll it back; NULL = ok, else {sqlstate, constraint, message}.
CREATE FUNCTION sv2_test.trial(p_tbl text, p_cols text[], p_exprs text[], p_types text[], p_tenant uuid) RETURNS text[]
LANGUAGE plpgsql AS $f$
DECLARE cname text;
BEGIN
  BEGIN
    EXECUTE sv2_test.build_ins(p_tbl, p_cols, p_exprs, p_types, p_tenant);
    RAISE EXCEPTION 'sv2-ok' USING ERRCODE = 'SV002';
  EXCEPTION
    WHEN SQLSTATE 'SV002' THEN
      RETURN NULL;
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS cname = CONSTRAINT_NAME;
      RETURN ARRAY[SQLSTATE, cname, left(SQLERRM, 300)];
  END;
END
$f$;

-- Apply sv2_over overrides (base, then p_variant) to a column/expr/type template.
CREATE FUNCTION sv2_test.apply_over(p_tbl text, p_variant text, INOUT p_cols text[], INOUT p_exprs text[], INOUT p_types text[])
LANGUAGE plpgsql AS $f$
DECLARE
  r record; idx int; ty text;
  rel oid := format('public.%I', p_tbl)::regclass;
BEGIN
  FOR r IN SELECT col, expr FROM sv2_over
            WHERE tbl = p_tbl AND (variant = 'base' OR variant = p_variant)
            ORDER BY (variant <> 'base')
  LOOP
    idx := array_position(p_cols, r.col);
    IF idx IS NULL THEN
      SELECT format_type(a.atttypid, a.atttypmod) INTO ty
        FROM pg_attribute a WHERE a.attrelid = rel AND a.attname = r.col AND NOT a.attisdropped;
      IF ty IS NULL THEN RAISE EXCEPTION 'override column %.% does not exist', p_tbl, r.col; END IF;
      p_cols := p_cols || r.col; p_types := p_types || ty; p_exprs := p_exprs || r.expr;
    ELSE
      p_exprs[idx] := r.expr;
    END IF;
  END LOOP;
END
$f$;

-- Force the visibility flag columns (is_published / is_active / ...) to p_val.
CREATE FUNCTION sv2_test.apply_flags(p_flags text[], p_val boolean, INOUT p_cols text[], INOUT p_exprs text[], INOUT p_types text[])
LANGUAGE plpgsql AS $f$
DECLARE f text; idx int;
BEGIN
  FOREACH f IN ARRAY p_flags LOOP
    idx := array_position(p_cols, f);
    IF idx IS NULL THEN
      p_cols := p_cols || ARRAY[f]; p_types := p_types || ARRAY['boolean']; p_exprs := p_exprs || ARRAY[p_val::text];
    ELSE
      p_exprs[idx] := p_val::text;
    END IF;
  END LOOP;
END
$f$;

-- Build an insert template for a tenant table, repairing CHECK violations, then seed A and B.
CREATE FUNCTION sv2_test.prepare(p_tbl text, p_tcol text, p_tcols text[], p_a uuid, p_b uuid) RETURNS void
LANGUAGE plpgsql AS $f$
DECLARE
  rel oid := format('public.%I', p_tbl)::regclass;
  cols text[] := '{}'; exprs text[] := '{}'; types text[] := '{}';
  r record;
  probe uuid := gen_random_uuid();
  t text[]; t2 text[];
  round int; progress boolean; failed boolean := false;
  err text; cname text; def text; conkey int2[]; att int2;
  aname text; atyp oid; amod int; idx int; old text; cand text;
  lbl text; tenant uuid; status text := 'ready';
  flags text[] := '{}'; pubseed boolean := false;
  c2 text[]; e2 text[]; y2 text[];
  pubtbls text[] := ARRAY['academic_programs','events','faqs','school_facilities','school_gallery',
                          'school_staff','testimonials','why_us_items','school_sports'];
BEGIN
  FOR r IN
    SELECT a.attname, a.atttypid, a.atttypmod, format_type(a.atttypid, a.atttypmod) AS ft
      FROM pg_attribute a
     WHERE a.attrelid = rel AND a.attnum > 0 AND NOT a.attisdropped
       AND a.attgenerated = '' AND a.attidentity = ''
       AND (a.attname = ANY (p_tcols) OR (a.attnotnull AND NOT a.atthasdef))
     ORDER BY a.attnum
  LOOP
    cols  := cols  || r.attname::text;
    types := types || r.ft;
    exprs := exprs || CASE WHEN r.attname = ANY (p_tcols) THEN '@@TENANT@@'
                           ELSE sv2_test.default_expr(r.atttypid, r.atttypmod) END;
  END LOOP;

  SELECT o.p_cols, o.p_exprs, o.p_types INTO cols, exprs, types
    FROM sv2_test.apply_over(p_tbl, 'base', cols, exprs, types) o;

  FOR round IN 1..16 LOOP
    t := sv2_test.trial(p_tbl, cols, exprs, types, probe);
    EXIT WHEN t IS NULL;
    err := t[1] || ' ' || t[3];
    IF t[1] <> '23514' OR t[2] IS NULL THEN failed := true; EXIT; END IF;
    cname := t[2];
    SELECT c.oid, c.conkey, pg_get_constraintdef(c.oid) INTO r
      FROM pg_constraint c WHERE c.conrelid = rel AND c.conname = cname;
    IF NOT FOUND THEN failed := true; EXIT; END IF;
    conkey := r.conkey; def := pg_get_constraintdef(r.oid);
    progress := false;
    FOREACH att IN ARRAY conkey LOOP
      SELECT attname, atttypid, atttypmod INTO aname, atyp, amod
        FROM pg_attribute WHERE attrelid = rel AND attnum = att;
      IF NOT (aname = ANY (cols)) THEN
        cols := cols || aname; types := types || format_type(atyp, amod);
        exprs := exprs || sv2_test.default_expr(atyp, amod);
        progress := true;
      END IF;
    END LOOP;
    IF NOT progress THEN
      FOREACH att IN ARRAY conkey LOOP
        SELECT attname, atttypid, atttypmod INTO aname, atyp, amod
          FROM pg_attribute WHERE attrelid = rel AND attnum = att;
        IF aname = ANY (p_tcols) THEN CONTINUE; END IF;
        idx := array_position(cols, aname);
        old := exprs[idx];
        FOREACH cand IN ARRAY sv2_test.candidates(atyp, amod, def) LOOP
          exprs[idx] := cand;
          t2 := sv2_test.trial(p_tbl, cols, exprs, types, probe);
          IF t2 IS NULL OR (t2[1] = '23514' AND t2[2] IS DISTINCT FROM cname) THEN
            progress := true; EXIT;
          END IF;
          exprs[idx] := old;
        END LOOP;
        EXIT WHEN progress;
      END LOOP;
    END IF;
    IF NOT progress THEN failed := true; EXIT; END IF;
  END LOOP;

  IF NOT failed AND sv2_test.trial(p_tbl, cols, exprs, types, probe) IS NOT NULL THEN
    failed := true; err := coalesce(err, 'template did not converge');
  END IF;

  IF failed THEN
    status := 'skipped';
  ELSIF p_tcol <> 'id' THEN
    SELECT coalesce(array_agg(a.attname::text ORDER BY a.attnum), '{}') INTO flags
      FROM pg_attribute a
     WHERE a.attrelid = rel AND a.attnum > 0 AND NOT a.attisdropped AND a.attgenerated = ''
       AND a.atttypid = 'bool'::regtype
       AND a.attname IN ('is_published','is_active','published','is_public');
    FOREACH lbl IN ARRAY ARRAY['A','B'] LOOP
      SELECT id INTO tenant FROM sv2_schools WHERE label = lbl;
      c2 := cols; e2 := exprs; y2 := types;
      IF lbl = 'B' AND cardinality(flags) > 0 THEN
        SELECT o.p_cols, o.p_exprs, o.p_types INTO c2, e2, y2
          FROM sv2_test.apply_flags(flags, false, c2, e2, y2) o;
      END IF;
      BEGIN
        EXECUTE sv2_test.build_ins(p_tbl, c2, e2, y2, tenant);
      EXCEPTION WHEN OTHERS THEN
        status := 'skipped';
        err := lbl || ' seed: ' || SQLSTATE || ' ' || left(SQLERRM, 300);
      END;
    END LOOP;

    -- Second victim row with the publish flag TRUE (by-design public tables only).
    IF status = 'ready' AND p_tbl = ANY (pubtbls) AND cardinality(flags) > 0 THEN
      SELECT id INTO tenant FROM sv2_schools WHERE label = 'B';
      SELECT o.p_cols, o.p_exprs, o.p_types INTO c2, e2, y2
        FROM sv2_test.apply_flags(flags, true, cols, exprs, types) o;
      BEGIN
        EXECUTE sv2_test.build_ins(p_tbl, c2, e2, y2, tenant);
        pubseed := true;
      EXCEPTION WHEN OTHERS THEN
        INSERT INTO sv2_results VALUES (p_tbl, '-', 'SEED', 'INFO',
          'published B row not seeded: ' || SQLSTATE || ' ' || left(SQLERRM, 200));
      END;
    END IF;

    -- Extra victim row with variant overrides (e.g. an EXPIRED idempotency record).
    IF status = 'ready' AND EXISTS (SELECT 1 FROM sv2_over WHERE tbl = p_tbl AND variant = 'extra') THEN
      SELECT id INTO tenant FROM sv2_schools WHERE label = 'B';
      SELECT o.p_cols, o.p_exprs, o.p_types INTO c2, e2, y2
        FROM sv2_test.apply_over(p_tbl, 'extra', cols, exprs, types) o;
      IF cardinality(flags) > 0 THEN
        SELECT o.p_cols, o.p_exprs, o.p_types INTO c2, e2, y2
          FROM sv2_test.apply_flags(flags, false, c2, e2, y2) o;
      END IF;
      BEGIN
        EXECUTE sv2_test.build_ins(p_tbl, c2, e2, y2, tenant);
      EXCEPTION WHEN OTHERS THEN
        status := 'skipped';
        err := 'B extra seed: ' || SQLSTATE || ' ' || left(SQLERRM, 300);
      END;
    END IF;
  END IF;

  INSERT INTO sv2_cfg (tbl, tcol, tcols, cols, exprs, types, status, err, flagcols, pubseed)
    VALUES (p_tbl, p_tcol, p_tcols, cols, exprs, types, status, err, flags, pubseed);
  IF status = 'ready' THEN
    INSERT INTO sv2_results VALUES (p_tbl, '-', 'SEED', 'INFO',
      CASE WHEN p_tcol = 'id' THEN 'tenant root table (pre-seeded)' ELSE 'seeded A and B via ' || p_tcol END);
  ELSE
    INSERT INTO sv2_results VALUES (p_tbl, '-', 'SEED', 'SKIPPED', left(coalesce(err, 'unknown'), 400));
  END IF;
END
$f$;

-- Execute one statement and roll it back; returns {kind:ok,n} or {kind:err,state,msg}.
CREATE FUNCTION sv2_test.try(p_sql text, p_kind text) RETURNS jsonb
LANGUAGE plpgsql AS $f$
DECLARE n bigint := 0;
BEGIN
  BEGIN
    PERFORM set_config('storage.allow_delete_query', 'true', true);
    IF p_kind = 'count' THEN
      EXECUTE p_sql INTO n;
    ELSE
      EXECUTE p_sql;
      GET DIAGNOSTICS n = ROW_COUNT;
    END IF;
    RAISE EXCEPTION 'sv2-sentinel' USING ERRCODE = 'SV002', DETAIL = n::text;
  EXCEPTION
    WHEN SQLSTATE 'SV002' THEN
      RETURN jsonb_build_object('kind', 'ok', 'n', n);
    WHEN OTHERS THEN
      RETURN jsonb_build_object('kind', 'err', 'state', SQLSTATE, 'msg', left(SQLERRM, 300));
  END;
END
$f$;

CREATE FUNCTION sv2_test.classify(p_op text, r jsonb) RETURNS text[]
LANGUAGE plpgsql AS $f$
DECLARE
  st text := r->>'state';
  msg text := r->>'msg';
  n bigint := coalesce((r->>'n')::bigint, 0);
BEGIN
  IF r->>'kind' = 'ok' THEN
    IF p_op IN ('CONTROL', 'OWN_SELECT') THEN RETURN ARRAY['INFO', 'own-school rows visible=' || n]; END IF;
    IF n = 0 THEN RETURN ARRAY['PASS', 'rows=0']; END IF;
    -- Intentional public exposure (published website content, public application form, website media).
    IF p_op IN ('SELECT[public]','SELECT[published]','INSERT[public]') THEN RETURN ARRAY['PUBLIC_BY_DESIGN', p_op || ' rows=' || n]; END IF;
    RETURN ARRAY['LEAK', p_op || ' rows=' || n];
  END IF;
  IF p_op IN ('CONTROL', 'OWN_SELECT') THEN RETURN ARRAY['INFO', 'error ' || st || ' ' || msg]; END IF;
  IF st = '42501' THEN RETURN ARRAY['PASS', 'denied: ' || msg]; END IF;
  IF msg ~* '(forbidden|not authori[sz]ed|not allowed|permission denied|access denied|denied)' THEN
    RETURN ARRAY['PASS', 'guard [' || st || ']: ' || msg];
  END IF;
  IF p_op = 'INSERT[public]' AND st LIKE '23%' THEN
    RETURN ARRAY['PUBLIC_BY_DESIGN', 'public INSERT policy passed, constraint stopped [' || st || '] ' || msg];
  END IF;
  IF p_op = 'INSERT' AND st LIKE '23%' THEN
    -- RLS WITH CHECK runs before constraint enforcement, so reaching one means the policy allowed the row.
    RETURN ARRAY['LEAK', 'RLS-PASSED-BUT-CONSTRAINT-STOPPED [' || st || '] ' || msg];
  END IF;
  RETURN ARRAY['ERROR', '[' || st || '] ' || msg];
END
$f$;

-- All attack statements for one attacker school vs one victim school.
CREATE FUNCTION sv2_test.targets(p_att uuid, p_vic uuid) RETURNS jsonb
LANGUAGE plpgsql AS $f$
DECLARE
  acc jsonb := '[]'::jsonb;
  c record; f record;
  ops jsonb;
  pat text; admin_id uuid; calls text[]; lbls text[]; i int;
  fl_hidden text; fl_pub text;
BEGIN
  FOR c IN SELECT * FROM sv2_cfg WHERE status = 'ready' ORDER BY tbl LOOP
    fl_hidden := NULL; fl_pub := NULL;
    IF c.pubseed THEN
      SELECT string_agg(format('%I IS NOT TRUE', x), ' AND '), string_agg(format('%I IS TRUE', x), ' AND ')
        INTO fl_hidden, fl_pub FROM unnest(c.flagcols) x;
    END IF;
    ops := jsonb_build_array(
      jsonb_build_object('op','OWN_SELECT','kind','count','sql',
        format('SELECT count(*) FROM public.%I WHERE %I::text = %L', c.tbl, c.tcol, p_att::text)),
      jsonb_build_object('op', CASE WHEN c.tbl = 'schools' THEN 'SELECT[public]' ELSE 'SELECT' END,'kind','count','sql',
        format('SELECT count(*) FROM public.%I WHERE %I::text = %L', c.tbl, c.tcol, p_vic::text)
          || coalesce(' AND (' || fl_hidden || ')', '')));
    IF fl_pub IS NOT NULL THEN
      ops := ops || jsonb_build_array(jsonb_build_object('op','SELECT[published]','kind','count','sql',
        format('SELECT count(*) FROM public.%I WHERE %I::text = %L AND (%s)', c.tbl, c.tcol, p_vic::text, fl_pub)));
    END IF;
    ops := ops || jsonb_build_array(
      jsonb_build_object('op','UPDATE','kind','dml','sql',
        format('UPDATE public.%I SET %I = %I WHERE %I::text = %L', c.tbl, c.tcol, c.tcol, c.tcol, p_vic::text)),
      jsonb_build_object('op','UPDATE_MOVE','kind','dml','sql',
        format('UPDATE public.%I SET %I = %L::%s WHERE %I::text = %L', c.tbl, c.tcol, p_vic::text,
               c.types[array_position(c.cols, c.tcol)], c.tcol, p_att::text)),
      jsonb_build_object('op','DELETE','kind','dml','sql',
        format('DELETE FROM public.%I WHERE %I::text = %L', c.tbl, c.tcol, p_vic::text)),
      jsonb_build_object('op', CASE WHEN c.tbl = 'admission_applications' THEN 'INSERT[public]' ELSE 'INSERT' END,'kind','dml','sql',
        sv2_test.build_ins(c.tbl, c.cols, c.exprs, c.types, p_vic)));
    acc := acc || jsonb_build_array(jsonb_build_object('label', c.tbl, 'ops', ops));
  END LOOP;

  IF to_regclass('storage.objects') IS NOT NULL THEN
    ops := jsonb_build_array(
      jsonb_build_object('op','CONTROL','kind','count','sql',
        format('SELECT count(*) FROM storage.objects WHERE bucket_id = ''school-media'' AND name LIKE %L', p_att::text || '/%')),
      jsonb_build_object('op','SELECT','kind','count','sql',
        format('SELECT count(*) FROM storage.objects WHERE bucket_id = ''school-media'' AND name LIKE %L', p_vic::text || '/%')),
      jsonb_build_object('op','UPDATE','kind','dml','sql',
        format('UPDATE storage.objects SET name = name WHERE bucket_id = ''school-media'' AND name LIKE %L', p_vic::text || '/%')),
      jsonb_build_object('op','UPDATE_MOVE','kind','dml','sql',
        format('UPDATE storage.objects SET name = %L || gen_random_uuid()::text WHERE bucket_id = ''school-media'' AND name LIKE %L',
               p_vic::text || '/moved-', p_att::text || '/%')),
      jsonb_build_object('op','DELETE','kind','dml','sql',
        format('DELETE FROM storage.objects WHERE bucket_id = ''school-media'' AND name LIKE %L', p_vic::text || '/%')),
      jsonb_build_object('op','INSERT','kind','dml','sql',
        format('INSERT INTO storage.objects (bucket_id, name) VALUES (''school-media'', %L || gen_random_uuid()::text || ''.txt'')',
               p_vic::text || '/new-')));
    acc := acc || jsonb_build_array(jsonb_build_object('label', 'storage.objects[school-media]', 'ops', ops));
  END IF;

  -- SECURITY DEFINER functions: zero-arg or single uuid-arg, returning rows/composite/json.
  SELECT '(' || string_agg(x, '|') || ')' INTO pat
    FROM (SELECT p_vic::text AS x UNION ALL SELECT user_id::text FROM sv2_users u
           WHERE u.label = (SELECT label FROM sv2_schools WHERE id = p_vic)) s;
  SELECT user_id INTO admin_id FROM sv2_users
   WHERE role = 'admin' AND label = (SELECT label FROM sv2_schools WHERE id = p_vic);
  FOR f IN
    SELECT p.proname, p.pronargs, p.proretset, t.typtype, t.typname
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
      JOIN pg_type t ON t.oid = p.prorettype
     WHERE p.prosecdef AND p.prokind = 'f'
       AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
       AND (p.pronargs = 0 OR (p.pronargs = 1 AND p.proargtypes[0] = 'uuid'::regtype))
       AND (p.proretset OR t.typtype = 'c' OR t.typname IN ('json','jsonb'))
     ORDER BY p.proname
  LOOP
    calls := '{}'; lbls := '{}';
    IF f.pronargs = 0 THEN
      calls := ARRAY[format('public.%I()', f.proname)]; lbls := ARRAY['FUNC()'];
    ELSE
      calls := ARRAY[format('public.%I(%L::uuid)', f.proname, p_vic::text)]; lbls := ARRAY['FUNC(victim_school)'];
      IF admin_id IS NOT NULL THEN
        calls := calls || ARRAY[format('public.%I(%L::uuid)', f.proname, admin_id::text)];
        lbls := lbls || ARRAY['FUNC(victim_admin)'];
      END IF;
    END IF;
    ops := '[]'::jsonb;
    FOR i IN 1..array_length(calls, 1) LOOP
      ops := ops || jsonb_build_array(jsonb_build_object('op', lbls[i], 'kind', 'count', 'sql',
        CASE WHEN f.proretset
             THEN format('SELECT count(*) FROM %s t WHERE to_jsonb(t)::text ~ %L', calls[i], pat)
             ELSE format('SELECT count(*) FROM (SELECT to_jsonb(%s) AS j) s WHERE j::text ~ %L', calls[i], pat) END));
    END LOOP;
    acc := acc || jsonb_build_array(jsonb_build_object('label', 'fn:' || f.proname, 'ops', ops));
  END LOOP;
  RETURN acc;
END
$f$;

-- Switch to a role/identity, run every attack statement, restore, persist results.
CREATE FUNCTION sv2_test.sweep(p_role text, p_actor_label text, p_actor uuid, p_att uuid, p_vic uuid) RETURNS void
LANGUAGE plpgsql AS $f$
DECLARE
  tg jsonb; t jsonb; o jsonb; res jsonb; cl text[];
  acc jsonb := '[]'::jsonb;
BEGIN
  tg := sv2_test.targets(p_att, p_vic);
  PERFORM set_config('request.jwt.claims',
    CASE WHEN p_actor IS NULL THEN '{"role":"anon"}'
         ELSE json_build_object('sub', p_actor, 'role', 'authenticated')::text END, true);
  PERFORM set_config('request.jwt.claim.sub', coalesce(p_actor::text, ''), true);
  PERFORM set_config('request.jwt.claim.role', p_role, true);
  EXECUTE format('SET LOCAL ROLE %I', p_role);
  FOR t IN SELECT value FROM jsonb_array_elements(tg) LOOP
    FOR o IN SELECT value FROM jsonb_array_elements(t->'ops') LOOP
      res := sv2_test.try(o->>'sql', o->>'kind');
      cl := sv2_test.classify(o->>'op', res);
      acc := acc || jsonb_build_array(jsonb_build_object(
        'tbl', t->>'label', 'actor', p_actor_label, 'op', o->>'op', 'outcome', cl[1], 'detail', cl[2]));
    END LOOP;
  END LOOP;
  RESET ROLE;
  INSERT INTO sv2_results
    SELECT x.tbl, x.actor, x.op, x.outcome, x.detail
      FROM jsonb_to_recordset(acc) AS x(tbl text, actor text, op text, outcome text, detail text);
END
$f$;

-- ------------------------------------------------------------ seeding -------
-- Triggers and FKs are disabled only while seeding (needs superuser).
SET LOCAL session_replication_role = replica;

INSERT INTO sv2_schools VALUES ('A', gen_random_uuid()), ('B', gen_random_uuid());

INSERT INTO public.schools (id, name, slug)
SELECT id, 'SV2 School ' || label, 'sv2-school-' || lower(label) FROM sv2_schools;

-- Neutral model mapping: cg_tenant.id = schools.id for each school.
DO $seed_cg_tenant$
BEGIN
  IF to_regclass('public.cg_tenant') IS NOT NULL THEN
    INSERT INTO public.cg_tenant (id, tenant_type, name, slug, status)
    SELECT id, 'organization', 'SV2 Tenant ' || label, 'sv2-tenant-' || lower(label), 'ACTIVE' FROM sv2_schools;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SV2: cg_tenant seed failed (%): %', SQLSTATE, SQLERRM;
  INSERT INTO sv2_results VALUES ('cg_tenant', '-', 'SEED', 'SKIPPED', SQLSTATE || ' ' || left(SQLERRM, 300));
END
$seed_cg_tenant$;

-- One user per (school, role) for every role allowed by users_role_check.
DO $seed_users$
DECLARE
  s record; r text; uid uuid; def text;
  roles text[] := ARRAY['admin','principal','teacher','bursar','driver','parent','student'];
BEGIN
  SELECT string_agg(pg_get_constraintdef(oid), ' ') INTO def
    FROM pg_constraint WHERE conrelid = 'public.users'::regclass AND conname = 'users_role_check';
  FOR s IN SELECT * FROM sv2_schools ORDER BY label LOOP
    FOREACH r IN ARRAY roles LOOP
      IF def IS NOT NULL AND position(quote_literal(r) IN def) = 0 THEN
        INSERT INTO sv2_results VALUES ('users', '-', 'SEED', 'SKIPPED', 'role ' || r || ' not allowed by users_role_check');
        CONTINUE;
      END IF;
      uid := gen_random_uuid();
      INSERT INTO auth.users (id, email, aud, role)
        VALUES (uid, 'sv2-' || lower(s.label) || '-' || r || '@example.invalid', 'authenticated', 'authenticated');
      INSERT INTO public.users (id, school_id, full_name, email, role)
        VALUES (uid, s.id, 'SV2 ' || s.label || ' ' || r, 'sv2-' || lower(s.label) || '-' || r || '@example.invalid', r);
      INSERT INTO sv2_users VALUES (s.label, r, uid);
      IF to_regclass('public.cg_role_assignment') IS NOT NULL THEN
        INSERT INTO public.cg_role_assignment (tenant_ref, identity_ref, role_id)
        VALUES (s.id::text, uid::text, CASE WHEN r IN ('admin','principal') THEN 'role:administrator' ELSE 'role:member' END);
      END IF;
    END LOOP;
  END LOOP;
END
$seed_users$;

-- Per-table seed overrides derived from the CHECK constraints in
-- database/supabase/migrations (read, not guessed):
--   event digests            ^[0-9a-f]{64}$                    (20261002000006/7)
--   snapshot / output digest ^sha256:[0-9a-f]{64}$, id = snapshot_id (20261002000009)
--   envelope                 schema_version ^[0-9]+\.[0-9]+$, status in (draft,active,...),
--                            pinned object_type, atomic (no NULL envelope field),
--                            causation root (declared_origin)  (envelope_format/_atomic/_causation_root)
--   bitemporal               known validity => valid_from NOT NULL
--   id = tool_id             cg_tool_runtime_tool
--   content_ref              <tenant>/<purpose>/<filename>     cg_file_object
--   status / external_effect cg_execution_record, cg_idempotency_record
--   outcome law              value NOT NULL unless UNRESOLVED_CONTRADICTION
-- @@TENANT@@ is replaced with the row's tenant literal by sv2_test.build_ins.
INSERT INTO sv2_over (tbl, col, expr, variant)
SELECT t.tbl, e.col, replace(e.expr, '@@OT@@', t.ot), 'base'
  FROM (VALUES
         ('cg_evidence_record',                'core.evidence'),
         ('cg_memory_record',                  'memory_record'),
         ('cg_reasoning_provenance_snapshot',  'core.intelligence.snapshot'),
         ('cg_reconciliation_verdict',         'core.reconciliation.verdict'),
         ('cg_worker_definition',              'worker_definition')) AS t(tbl, ot)
 CROSS JOIN (VALUES
         ('object_type',     $x$'@@OT@@'$x$),
         ('schema_version',  $x$'1.0'$x$),
         ('status',          $x$'active'$x$),
         ('updated_by',      $x$'sv2'$x$),
         ('provenance',      $x$'{}'::jsonb$x$),
         ('policy_context',  $x$'{}'::jsonb$x$),
         ('trace_id',        $x$'sv2-trace'$x$),
         ('correlation_id',  $x$'sv2-corr'$x$),
         ('declared_origin', $x$'sv2'$x$)) AS e(col, expr);

INSERT INTO sv2_over (tbl, col, expr, variant) VALUES
  ('cg_event_route_queue', 'event_digest',      $x$(md5(random()::text) || md5(random()::text))$x$, 'base'),
  ('cg_event_route_queue', 'delivery_decision', $x$'ALLOW'$x$, 'base'),
  ('cg_event_security', 'digest',               $x$(md5(random()::text) || md5(random()::text))$x$, 'base'),
  ('cg_event_security', 'visibility',           $x$'tenant'$x$, 'base'),
  ('cg_event_security', 'sensitivity',          $x$'internal'$x$, 'base'),
  ('cg_event_security', 'evidence_class',       $x$'observed'$x$, 'base'),
  ('cg_evidence_record', 'evidence_class',      $x$'generated'$x$, 'base'),
  ('cg_execution_record', 'status',             $x$'denied'$x$, 'base'),
  ('cg_execution_record', 'external_effect',    $x$'none'$x$, 'base'),
  ('cg_file_object', 'purpose',                 $x$'document'$x$, 'base'),
  ('cg_file_object', 'content_type',            $x$'text/plain'$x$, 'base'),
  ('cg_file_object', 'size_bytes',              $x$1$x$, 'base'),
  ('cg_file_object', 'filename',                $x$'sv2.txt'$x$, 'base'),
  ('cg_file_object', 'visibility',              $x$'private'$x$, 'base'),
  ('cg_file_object', 'content_ref',             $x$(@@TENANT@@ || '/document/sv2.txt')$x$, 'base'),
  ('cg_idempotency_record', 'payload_digest',   $x$(md5(random()::text) || md5(random()::text))$x$, 'base'),
  ('cg_idempotency_record', 'status',           $x$'succeeded'$x$, 'base'),
  ('cg_idempotency_record', 'external_effect',  $x$'none'$x$, 'base'),
  ('cg_idempotency_record', 'expires_at',       $x$(now() + interval '1 day')$x$, 'base'),
  -- Second victim row: an EXPIRED record, the weakest target for the replace-expired UPDATE policy.
  ('cg_idempotency_record', 'created_at',       $x$(now() - interval '2 days')$x$, 'extra'),
  ('cg_idempotency_record', 'expires_at',       $x$(now() - interval '1 day')$x$, 'extra'),
  ('cg_memory_record', 'memory_class',          $x$'practical'$x$, 'base'),
  ('cg_memory_record', 'sensitivity',           $x$'internal'$x$, 'base'),
  ('cg_memory_record', 'valid_from',            $x$now()$x$, 'base'),
  ('cg_reasoning_provenance_snapshot', 'id',          $x$('sha256:' || md5(@@TENANT@@ || 'a') || md5(@@TENANT@@ || 'b'))$x$, 'base'),
  ('cg_reasoning_provenance_snapshot', 'snapshot_id', $x$('sha256:' || md5(@@TENANT@@ || 'a') || md5(@@TENANT@@ || 'b'))$x$, 'base'),
  ('cg_reasoning_provenance_snapshot', 'output_digest', $x$('sha256:' || md5(random()::text) || md5(random()::text))$x$, 'base'),
  ('cg_reasoning_provenance_snapshot', 'evidence_class', $x$'generated'$x$, 'base'),
  ('cg_reasoning_provenance_snapshot', 'generated_by_ai', $x$true$x$, 'base'),
  ('cg_reasoning_provenance_snapshot', 'verified',        $x$false$x$, 'base'),
  ('cg_reasoning_provenance_snapshot', 'origin_tenant_id', $x$@@TENANT@@$x$, 'base'),
  ('cg_reconciliation_verdict', 'outcome',      $x$'UNKNOWN'$x$, 'base'),
  ('cg_reconciliation_verdict', 'value',        $x$'{"known":false,"value":null}'::jsonb$x$, 'base'),
  ('cg_tool_runtime_tool', 'id',                $x$('sv2-tool-' || md5(@@TENANT@@))$x$, 'base'),
  ('cg_tool_runtime_tool', 'tool_id',           $x$('sv2-tool-' || md5(@@TENANT@@))$x$, 'base'),
  ('cg_tool_runtime_tool', 'risk_class',        $x$'low'$x$, 'base'),
  ('cg_worker_definition', 'classification',    $x$'human'$x$, 'base'),
  ('cg_worker_definition', 'max_risk_class',    $x$'low'$x$, 'base');

-- Generic seeding of every table keyed by school_id / tenant_id / tenant_ref.
DO $seed_generic$
DECLARE
  r record; a uuid; b uuid;
BEGIN
  SELECT id INTO a FROM sv2_schools WHERE label = 'A';
  SELECT id INTO b FROM sv2_schools WHERE label = 'B';
  FOR r IN
    SELECT c.relname AS tbl,
           array_agg(at.attname::text ORDER BY array_position(ARRAY['school_id','tenant_id','tenant_ref'], at.attname::text)) AS tcols
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
      JOIN pg_attribute at ON at.attrelid = c.oid AND at.attnum > 0 AND NOT at.attisdropped
                          AND at.attname IN ('school_id','tenant_id','tenant_ref')
     WHERE c.relkind IN ('r','p') AND NOT c.relispartition AND c.relname NOT LIKE 'sv2%'
     GROUP BY c.relname
     UNION ALL SELECT 'schools', ARRAY['id'] WHERE to_regclass('public.schools') IS NOT NULL
     UNION ALL SELECT 'cg_tenant', ARRAY['id'] WHERE to_regclass('public.cg_tenant') IS NOT NULL
     ORDER BY 1
  LOOP
    BEGIN
      PERFORM sv2_test.prepare(r.tbl, r.tcols[1], r.tcols, a, b);
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO sv2_cfg VALUES (r.tbl, r.tcols[1], r.tcols, '{}', '{}', '{}', 'skipped', SQLSTATE || ' ' || left(SQLERRM, 300));
      INSERT INTO sv2_results VALUES (r.tbl, '-', 'SEED', 'SKIPPED', SQLSTATE || ' ' || left(SQLERRM, 300));
    END;
  END LOOP;
END
$seed_generic$;

-- Storage fixtures (bucket school-media): <schoolA>/a.txt and <schoolB>/b.txt.
DO $seed_storage$
BEGIN
  IF to_regclass('storage.objects') IS NOT NULL THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('school-media', 'school-media', false) ON CONFLICT (id) DO NOTHING;
    INSERT INTO storage.objects (bucket_id, name)
      SELECT 'school-media', id::text || '/' || lower(label) || '.txt' FROM sv2_schools;
  ELSE
    INSERT INTO sv2_results VALUES ('storage.objects', '-', 'SEED', 'SKIPPED', 'storage schema absent');
  END IF;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO sv2_results VALUES ('storage.objects', '-', 'SEED', 'SKIPPED', SQLSTATE || ' ' || left(SQLERRM, 300));
END
$seed_storage$;

-- SECURITY DEFINER inventory (INFO).
INSERT INTO sv2_results
SELECT 'fn:' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', '-', 'INVENTORY', 'INFO',
       'SECURITY DEFINER; returns ' || pg_get_function_result(p.oid)
       || '; search_path=' || coalesce((SELECT string_agg(x, ',') FROM unnest(p.proconfig) x WHERE x LIKE 'search_path=%'), 'UNPINNED')
       || '; exec anon=' || has_function_privilege('anon', p.oid, 'EXECUTE')
       || ' authenticated=' || has_function_privilege('authenticated', p.oid, 'EXECUTE')
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
 WHERE p.prosecdef AND p.prokind = 'f'
   AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e');

-- ------------------------------------------------------------- sweeps -------
-- Triggers must fire normally during the sweep (RLS itself is unaffected by replica mode).
SET LOCAL session_replication_role = origin;

-- Verify the cg_ tenant mapping the sweep relies on: every seeded user must resolve
-- to ITS school id through get_my_tenant_id() (cg_role_assignment.tenant_ref), anon to NULL,
-- and cg_tenant must carry both schools. A mismatch makes the cg_ results untrustworthy (ERROR).
DO $tenantmap$
DECLARE
  u record; v text; res jsonb := '[]'::jsonb; sid uuid;
BEGIN
  FOR u IN SELECT x.label, x.role, x.user_id, s.id AS school_id
             FROM sv2_users x JOIN sv2_schools s ON s.label = x.label ORDER BY 1, 2 LOOP
    v := NULL;
    BEGIN
      PERFORM set_config('request.jwt.claims', json_build_object('sub', u.user_id, 'role', 'authenticated')::text, true);
      PERFORM set_config('request.jwt.claim.sub', u.user_id::text, true);
      PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
      SET LOCAL ROLE authenticated;
      v := public.get_my_tenant_id();
      RESET ROLE;
    EXCEPTION WHEN OTHERS THEN
      RESET ROLE;
      v := 'EXC ' || SQLSTATE;
    END;
    res := res || jsonb_build_array(jsonb_build_object('actor', u.label || ':' || u.role,
      'ok', v = u.school_id::text, 'detail', 'get_my_tenant_id()=' || coalesce(v, 'NULL') || ' expected=' || u.school_id));
  END LOOP;
  BEGIN
    PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
    PERFORM set_config('request.jwt.claim.sub', '', true);
    PERFORM set_config('request.jwt.claim.role', 'anon', true);
    SET LOCAL ROLE anon;
    v := public.get_my_tenant_id();
    RESET ROLE;
  EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    v := 'EXC ' || SQLSTATE;
  END;
  res := res || jsonb_build_array(jsonb_build_object('actor', 'anon', 'ok', v IS NULL OR v = 'EXC 42501',
    'detail', 'get_my_tenant_id()=' || coalesce(v, 'NULL') || ' expected=NULL'));
  FOR sid IN SELECT id FROM sv2_schools ORDER BY label LOOP
    res := res || jsonb_build_array(jsonb_build_object('actor', 'cg_tenant', 'ok',
      to_regclass('public.cg_tenant') IS NOT NULL AND EXISTS (SELECT 1 FROM public.cg_tenant WHERE id::text = sid::text),
      'detail', 'cg_tenant row for school ' || sid));
  END LOOP;
  INSERT INTO sv2_results
    SELECT 'get_my_tenant_id()', x.actor, 'TENANT_MAP', CASE WHEN x.ok THEN 'PASS' ELSE 'ERROR' END, x.detail
      FROM jsonb_to_recordset(res) AS x(actor text, ok boolean, detail text);
END
$tenantmap$;

DO $sweep$
DECLARE
  a uuid; b uuid; u record;
BEGIN
  SELECT id INTO a FROM sv2_schools WHERE label = 'A';
  SELECT id INTO b FROM sv2_schools WHERE label = 'B';
  FOR u IN SELECT * FROM sv2_users WHERE label = 'A' ORDER BY role LOOP
    PERFORM sv2_test.sweep('authenticated', 'A:' || u.role, u.user_id, a, b);
  END LOOP;
  PERFORM sv2_test.sweep('anon', 'anon', NULL, a, b);
END
$sweep$;

-- ===================== SHERIVS-002 STEP 2 EXTRA SECTIONS =====================
-- Helpers: run one statement as a role/identity and return to superuser.
CREATE FUNCTION sv2_test.probe(p_uid uuid, p_role text, p_sql text, p_kind text) RETURNS jsonb
LANGUAGE plpgsql AS $f$
DECLARE r jsonb;
BEGIN
  PERFORM set_config('request.jwt.claims',
    CASE WHEN p_uid IS NULL THEN '{"role":"anon"}'
         ELSE json_build_object('sub', p_uid, 'role', 'authenticated')::text END, true);
  PERFORM set_config('request.jwt.claim.sub', coalesce(p_uid::text, ''), true);
  PERFORM set_config('request.jwt.claim.role', p_role, true);
  EXECUTE format('SET LOCAL ROLE %I', p_role);
  r := sv2_test.try(p_sql, p_kind);
  RESET ROLE;
  RETURN r;
END
$f$;

CREATE FUNCTION sv2_test.tenant_digest(p_tbl text, p_tcol text, p_tenant uuid) RETURNS text
LANGUAGE plpgsql AS $f$
DECLARE d text;
BEGIN
  EXECUTE format('SELECT count(*)::text || '':'' || coalesce(md5(string_agg(t::text, ''|'' ORDER BY t::text)), '''') FROM public.%I t WHERE %I::text = %L',
                 p_tbl, p_tcol, p_tenant::text) INTO d;
  RETURN d;
END
$f$;

-- Extra school-A identities that must not collide with the (label, role) users.
CREATE TEMP TABLE sv2_extra (tag text PRIMARY KEY, user_id uuid NOT NULL);

SET LOCAL session_replication_role = replica;

DO $seed_extra$
DECLARE
  a uuid; b uuid; uid uuid; t record;
BEGIN
  SELECT id INTO a FROM sv2_schools WHERE label = 'A';
  SELECT id INTO b FROM sv2_schools WHERE label = 'B';
  -- tag, home school, role, position tenant (NULL = none), status, ended_on offset (days)
  FOR t IN SELECT * FROM (VALUES
      ('registrar',         a, 'teacher', a,    'active', NULL::int),
      ('registrar_ended',   a, 'student', a,    'ended',  -1),
      ('registrar_expired', a, 'parent',  a,    'active', -1),
      ('registrar_foreign', a, 'bursar',  b,    'active', NULL::int)
    ) v(tag, home, role, ptenant, pstatus, endoff) LOOP
    uid := gen_random_uuid();
    INSERT INTO auth.users (id, email, aud, role)
      VALUES (uid, 'sv2-a-' || t.tag || '@example.invalid', 'authenticated', 'authenticated');
    INSERT INTO public.users (id, school_id, full_name, email, role)
      VALUES (uid, t.home, 'SV2 A ' || t.tag, 'sv2-a-' || t.tag || '@example.invalid', t.role);
    INSERT INTO sv2_extra VALUES (t.tag, uid);
    IF to_regclass('public.cg_role_assignment') IS NOT NULL THEN
      INSERT INTO public.cg_role_assignment (tenant_ref, identity_ref, role_id)
        VALUES (t.home::text, uid::text, 'role:member');
    END IF;
    INSERT INTO public.cg_workforce_position
      (tenant_ref, runtime_ref, kind_code, identity_ref, started_on, ended_on, status)
    VALUES (t.ptenant::text, 'runtime:scholar', 'registrar', uid::text,
            CURRENT_DATE - 10,
            CASE WHEN t.endoff IS NULL THEN NULL ELSE CURRENT_DATE + t.endoff END,
            t.pstatus);
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO sv2_results VALUES ('intra-school admissions', '-', 'SEED', 'ERROR',
    'registrar seed failed ' || SQLSTATE || ' ' || left(SQLERRM, 300));
END
$seed_extra$;

-- Storage fixtures for the student-documents bucket (admission uploads).
DO $seed_docs$
BEGIN
  IF to_regclass('storage.objects') IS NOT NULL THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('student-documents', 'student-documents', false)
      ON CONFLICT (id) DO NOTHING;
    INSERT INTO storage.objects (bucket_id, name)
      SELECT 'student-documents', 'admissions/' || id::text || '/doc.pdf' FROM sv2_schools;
  END IF;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO sv2_results VALUES ('storage.objects[student-documents]', '-', 'SEED', 'ERROR',
    SQLSTATE || ' ' || left(SQLERRM, 300));
END
$seed_docs$;

SET LOCAL session_replication_role = origin;

-- ---------- (a) INTRA-SCHOOL admissions: only admin/principal/registrar ------
DO $intra$
DECLARE
  a uuid; b uuid; u record; r jsonb; n_a bigint; n_b bigint; actor text;
  ex record;
BEGIN
  SELECT id INTO a FROM sv2_schools WHERE label = 'A';
  SELECT id INTO b FROM sv2_schools WHERE label = 'B';
  SELECT count(*) INTO n_a FROM public.admission_applications WHERE school_id = a;
  IF n_a = 0 THEN
    INSERT INTO sv2_results VALUES ('intra-school admissions', '-', 'SEED', 'ERROR',
      'no seeded admission_applications row for school A; section inconclusive');
    RETURN;
  END IF;

  -- Roles that must see/update nothing.
  FOR u IN SELECT 'A:' || role AS actor, user_id FROM sv2_users
            WHERE label = 'A' AND role IN ('teacher','parent','student','driver','bursar')
          UNION ALL
          SELECT 'A:' || tag, user_id FROM sv2_extra WHERE tag <> 'registrar'
          ORDER BY 1 LOOP
    r := sv2_test.probe(u.user_id, 'authenticated',
      format('SELECT count(*) FROM public.admission_applications WHERE school_id = %L', a::text), 'count');
    INSERT INTO sv2_results VALUES ('intra-school admissions', u.actor, 'SELECT',
      CASE WHEN r->>'kind' = 'ok' AND (r->>'n')::bigint = 0 THEN 'PASS'
           WHEN r->>'kind' = 'ok' THEN 'LEAK' ELSE 'ERROR' END,
      CASE WHEN r->>'kind' = 'ok' THEN 'rows=' || (r->>'n') ELSE r::text END);
    r := sv2_test.probe(u.user_id, 'authenticated',
      format('UPDATE public.admission_applications SET status = status WHERE school_id = %L', a::text), 'dml');
    INSERT INTO sv2_results VALUES ('intra-school admissions', u.actor, 'UPDATE',
      CASE WHEN r->>'kind' = 'ok' AND (r->>'n')::bigint = 0 THEN 'PASS'
           WHEN r->>'kind' = 'ok' THEN 'LEAK'
           WHEN r->>'state' = '42501' THEN 'PASS' ELSE 'ERROR' END,
      CASE WHEN r->>'kind' = 'ok' THEN 'rows=' || (r->>'n') ELSE r::text END);
  END LOOP;

  -- Roles that must work: admin, principal of A, and the seeded registrar.
  FOR u IN SELECT 'A:' || role AS actor, user_id FROM sv2_users WHERE label = 'A' AND role IN ('admin','principal')
          UNION ALL SELECT 'A:registrar', user_id FROM sv2_extra WHERE tag = 'registrar'
          ORDER BY 1 LOOP
    r := sv2_test.probe(u.user_id, 'authenticated',
      format('SELECT count(*) FROM public.admission_applications WHERE school_id = %L', a::text), 'count');
    INSERT INTO sv2_results VALUES ('intra-school admissions', u.actor, 'OWN_SELECT_ADMISSIONS',
      CASE WHEN r->>'kind' = 'ok' AND (r->>'n')::bigint >= 1 THEN 'PASS' ELSE 'ERROR' END,
      CASE WHEN r->>'kind' = 'ok' THEN 'rows=' || (r->>'n') ELSE r::text END
        || CASE WHEN r->>'kind' = 'ok' AND (r->>'n')::bigint >= 1 THEN '' ELSE ' : admissions admin broken' END);
    r := sv2_test.probe(u.user_id, 'authenticated',
      format('UPDATE public.admission_applications SET status = status WHERE school_id = %L', a::text), 'dml');
    INSERT INTO sv2_results VALUES ('intra-school admissions', u.actor, 'UPDATE_ADMISSIONS',
      CASE WHEN r->>'kind' = 'ok' AND (r->>'n')::bigint >= 1 THEN 'PASS' ELSE 'ERROR' END,
      CASE WHEN r->>'kind' = 'ok' THEN 'rows=' || (r->>'n') ELSE r::text END
        || CASE WHEN r->>'kind' = 'ok' AND (r->>'n')::bigint >= 1 THEN '' ELSE ' : admissions admin broken' END);
  END LOOP;

  -- Cross-tenant: admin/principal/registrar of A must not touch B's applications.
  FOR u IN SELECT 'A:' || role AS actor, user_id FROM sv2_users WHERE label = 'A' AND role IN ('admin','principal')
          UNION ALL SELECT 'A:registrar', user_id FROM sv2_extra WHERE tag = 'registrar'
          ORDER BY 1 LOOP
    r := sv2_test.probe(u.user_id, 'authenticated',
      format('SELECT count(*) FROM public.admission_applications WHERE school_id = %L', b::text), 'count');
    INSERT INTO sv2_results VALUES ('intra-school admissions', u.actor, 'SELECT[victim]',
      CASE WHEN r->>'kind' = 'ok' AND (r->>'n')::bigint = 0 THEN 'PASS'
           WHEN r->>'kind' = 'ok' THEN 'LEAK' ELSE 'ERROR' END,
      CASE WHEN r->>'kind' = 'ok' THEN 'rows=' || (r->>'n') ELSE r::text END);
    r := sv2_test.probe(u.user_id, 'authenticated',
      format('UPDATE public.admission_applications SET status = status WHERE school_id = %L', b::text), 'dml');
    INSERT INTO sv2_results VALUES ('intra-school admissions', u.actor, 'UPDATE[victim]',
      CASE WHEN r->>'kind' = 'ok' AND (r->>'n')::bigint = 0 THEN 'PASS'
           WHEN r->>'kind' = 'ok' THEN 'LEAK'
           WHEN r->>'state' = '42501' THEN 'PASS' ELSE 'ERROR' END,
      CASE WHEN r->>'kind' = 'ok' THEN 'rows=' || (r->>'n') ELSE r::text END);
  END LOOP;
END
$intra$;

-- ---------- (b) storage: school-media no longer public; student-documents ----
DO $stor$
DECLARE
  a uuid; b uuid; u record; r jsonb; sql_a text; sql_b text; sql_m text; ok boolean;
BEGIN
  IF to_regclass('storage.objects') IS NULL THEN RETURN; END IF;
  SELECT id INTO a FROM sv2_schools WHERE label = 'A';
  SELECT id INTO b FROM sv2_schools WHERE label = 'B';
  sql_m := format('SELECT count(*) FROM storage.objects WHERE bucket_id = ''school-media'' AND name = %L', a::text || '/a.txt');
  sql_a := format('SELECT count(*) FROM storage.objects WHERE bucket_id = ''student-documents'' AND name = %L', 'admissions/' || a::text || '/doc.pdf');
  sql_b := format('SELECT count(*) FROM storage.objects WHERE bucket_id = ''student-documents'' AND name = %L', 'admissions/' || b::text || '/doc.pdf');

  -- anon must not read school-media any more.
  r := sv2_test.probe(NULL, 'anon', sql_m, 'count');
  INSERT INTO sv2_results VALUES ('storage.objects[school-media]', 'anon', 'SELECT[a-object]',
    CASE WHEN r->>'kind' = 'ok' AND (r->>'n')::bigint = 0 THEN 'PASS'
         WHEN r->>'kind' = 'ok' THEN 'LEAK' ELSE 'PASS' END,
    CASE WHEN r->>'kind' = 'ok' THEN 'rows=' || (r->>'n') ELSE 'denied: ' || r::text END);

  -- own-school member still reads it.
  FOR u IN SELECT 'A:' || role AS actor, user_id FROM sv2_users WHERE label = 'A' AND role IN ('teacher','parent','admin') ORDER BY 1 LOOP
    r := sv2_test.probe(u.user_id, 'authenticated', sql_m, 'count');
    INSERT INTO sv2_results VALUES ('storage.objects[school-media]', u.actor, 'OWN_SELECT_OBJECT',
      CASE WHEN r->>'kind' = 'ok' AND (r->>'n')::bigint >= 1 THEN 'PASS' ELSE 'ERROR' END,
      CASE WHEN r->>'kind' = 'ok' THEN 'rows=' || (r->>'n') ELSE r::text END);
  END LOOP;

  -- student-documents: non-admissions A actors must read nothing.
  FOR u IN SELECT 'A:' || role AS actor, user_id FROM sv2_users
            WHERE label = 'A' AND role IN ('teacher','parent','student','driver','bursar')
          UNION ALL SELECT 'A:' || tag, user_id FROM sv2_extra WHERE tag <> 'registrar'
          ORDER BY 1 LOOP
    r := sv2_test.probe(u.user_id, 'authenticated', sql_a, 'count');
    INSERT INTO sv2_results VALUES ('storage.objects[student-documents]', u.actor, 'SELECT',
      CASE WHEN r->>'kind' = 'ok' AND (r->>'n')::bigint = 0 THEN 'PASS'
           WHEN r->>'kind' = 'ok' THEN 'LEAK' ELSE 'PASS' END,
      CASE WHEN r->>'kind' = 'ok' THEN 'rows=' || (r->>'n') ELSE 'denied: ' || r::text END);
  END LOOP;

  -- admin / principal / registrar of A read A's docs, never B's.
  FOR u IN SELECT 'A:' || role AS actor, user_id FROM sv2_users WHERE label = 'A' AND role IN ('admin','principal')
          UNION ALL SELECT 'A:registrar', user_id FROM sv2_extra WHERE tag = 'registrar'
          ORDER BY 1 LOOP
    r := sv2_test.probe(u.user_id, 'authenticated', sql_a, 'count');
    INSERT INTO sv2_results VALUES ('storage.objects[student-documents]', u.actor, 'OWN_SELECT_DOC',
      CASE WHEN r->>'kind' = 'ok' AND (r->>'n')::bigint >= 1 THEN 'PASS' ELSE 'ERROR' END,
      CASE WHEN r->>'kind' = 'ok' THEN 'rows=' || (r->>'n') ELSE r::text END);
    r := sv2_test.probe(u.user_id, 'authenticated', sql_b, 'count');
    INSERT INTO sv2_results VALUES ('storage.objects[student-documents]', u.actor, 'SELECT[victim]',
      CASE WHEN r->>'kind' = 'ok' AND (r->>'n')::bigint = 0 THEN 'PASS'
           WHEN r->>'kind' = 'ok' THEN 'LEAK' ELSE 'PASS' END,
      CASE WHEN r->>'kind' = 'ok' THEN 'rows=' || (r->>'n') ELSE 'denied: ' || r::text END);
  END LOOP;

  r := sv2_test.probe(NULL, 'anon', sql_a, 'count');
  INSERT INTO sv2_results VALUES ('storage.objects[student-documents]', 'anon', 'SELECT',
    CASE WHEN r->>'kind' = 'ok' AND (r->>'n')::bigint = 0 THEN 'PASS'
         WHEN r->>'kind' = 'ok' THEN 'LEAK' ELSE 'PASS' END,
    CASE WHEN r->>'kind' = 'ok' THEN 'rows=' || (r->>'n') ELSE 'denied: ' || r::text END);
END
$stor$;

-- ---------- (c) MULTI-ARG SECURITY DEFINER fuzz ------------------------------
-- Every public SECURITY DEFINER function with at least one IN argument is called as each school-A actor with school
-- B's ids. Exception = PASS; rows/true/side effect on B = LEAK; empty = PASS.
-- Side effects are detected by comparing a digest of every tenant-keyed table's
-- B rows before/after, inside a subtransaction that is always rolled back.
SET LOCAL session_replication_role = replica;
DO $seed_b$
DECLARE b uuid; b_admin uuid;
BEGIN
  SELECT id INTO b FROM sv2_schools WHERE label = 'B';
  SELECT user_id INTO b_admin FROM sv2_users WHERE label = 'B' AND role = 'admin';
  INSERT INTO public.cg_workforce_position (tenant_ref, runtime_ref, kind_code, identity_ref, started_on, status)
    VALUES (b::text, 'runtime:scholar', 'registrar', b_admin::text, CURRENT_DATE - 5, 'active')
    ON CONFLICT DO NOTHING;
  INSERT INTO public.cg_org_profile (tenant_ref, runtime_ref, profile_key, payload)
    VALUES (b::text, 'runtime:scholar', 'sv2-profile', '{}'::jsonb) ON CONFLICT DO NOTHING;
  INSERT INTO public.cg_role_grant (tenant_ref, role_id, capability, granted_by)
    VALUES (b::text, 'role:member', 'sv2-cap', 'sv2') ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO sv2_results VALUES ('fuzz', '-', 'SEED', 'ERROR', 'tenant-B cg_ seeds failed ' || SQLSTATE || ' ' || left(SQLERRM, 300));
END
$seed_b$;
SET LOCAL session_replication_role = origin;

CREATE TEMP TABLE sv2_bstate (tbl text PRIMARY KEY, tcol text NOT NULL, digest text);
INSERT INTO sv2_bstate
  SELECT tbl, tcol, sv2_test.tenant_digest(tbl, tcol, (SELECT id FROM sv2_schools WHERE label = 'B'))
    FROM sv2_cfg WHERE status = 'ready';

DO $fuzz$
DECLARE
  a uuid; b uuid; b_slug text; b_admin uuid; b_assign uuid; b_grant uuid; b_pos uuid;
  pat text; f record; u record; i int; nm text; ty oid; md text;
  args text[]; matched boolean; call text; n bigint := 0; txt text := ''; err text; msg text;
  changed text; outc text; det text; pre_del boolean; nfn int := 0;
  idents text[]; has_role boolean; v text; lit text; nerr int;
BEGIN
  SELECT id INTO a FROM sv2_schools WHERE label = 'A';
  SELECT id INTO b FROM sv2_schools WHERE label = 'B';
  b_slug := 'sv2-school-b';
  SELECT user_id INTO b_admin FROM sv2_users WHERE label = 'B' AND role = 'admin';
  SELECT id INTO b_assign FROM public.cg_role_assignment WHERE tenant_ref = b::text AND identity_ref = b_admin::text LIMIT 1;
  SELECT id INTO b_grant FROM public.cg_role_grant WHERE tenant_ref = b::text AND revoked_on IS NULL LIMIT 1;
  SELECT id INTO b_pos FROM public.cg_workforce_position WHERE tenant_ref = b::text LIMIT 1;
  IF b_assign IS NULL OR b_grant IS NULL OR b_pos IS NULL THEN
    INSERT INTO sv2_results VALUES ('fuzz', '-', 'SEED', 'ERROR',
      format('tenant-B row ids missing: assignment=%s grant=%s position=%s', b_assign IS NOT NULL, b_grant IS NOT NULL, b_pos IS NOT NULL));
  END IF;
  SELECT '(' || string_agg(x, '|') || ')' INTO pat FROM (
    SELECT b::text AS x UNION ALL SELECT user_id::text FROM sv2_users WHERE label = 'B'
    UNION ALL SELECT b_slug
    UNION ALL SELECT x::text FROM unnest(ARRAY[b_assign, b_grant, b_pos]) x WHERE x IS NOT NULL) s;

  FOR f IN
    SELECT p.oid, p.proname, p.prorettype, p.proretset, p.proargnames, p.proargmodes,
           coalesce(p.proallargtypes::oid[], string_to_array(p.proargtypes::text, ' ')::oid[]) AS atypes
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
     WHERE p.prosecdef AND p.prokind = 'f'
       AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
     ORDER BY p.proname, p.oid
  LOOP
    -- IN/INOUT/VARIADIC args only; OUT/TABLE columns are skipped.
    matched := false; has_role := false;
    FOR i IN 1..coalesce(array_length(f.atypes, 1), 0) LOOP
      IF coalesce(f.proargmodes[i], 'i') NOT IN ('i','b','v') THEN CONTINUE; END IF;
      matched := true;
      IF lower(coalesce(f.proargnames[i], '')) ~ 'role' AND f.atypes[i] = 'text'::regtype::oid THEN has_role := true; END IF;
    END LOOP;
    IF NOT matched THEN CONTINUE; END IF;

    IF f.proname IN ('public_teachers', 'public_school_stats') THEN
      INSERT INTO sv2_results VALUES ('fuzz:' || f.proname, 'A:*', 'FUZZ', 'PUBLIC_BY_DESIGN',
        'documented public website function (slug-addressed), not called');
      CONTINUE;
    END IF;
    nfn := nfn + 1;
    pre_del := (f.proname = 'seed_default_staff_types' AND to_regclass('public.school_staff_types') IS NOT NULL);

   FOREACH v IN ARRAY CASE WHEN has_role THEN ARRAY['role:administrator','role:member'] ELSE ARRAY['role:administrator'] END LOOP
    args := '{}';
    FOR i IN 1..coalesce(array_length(f.atypes, 1), 0) LOOP
      IF coalesce(f.proargmodes[i], 'i') NOT IN ('i','b','v') THEN CONTINUE; END IF;
      nm := lower(coalesce(f.proargnames[i], '')); ty := f.atypes[i];
      lit := CASE
        WHEN ty = 'date'::regtype::oid THEN format('%L', current_date::text)
        WHEN ty = 'timestamptz'::regtype::oid THEN format('%L', now()::text)
        WHEN ty IN ('int4'::regtype::oid, 'int2'::regtype::oid, 'int8'::regtype::oid) THEN format('%L', '10')
        WHEN ty = 'boolean'::regtype::oid THEN format('%L', 'false')
        WHEN ty IN ('jsonb'::regtype::oid, 'json'::regtype::oid) THEN format('%L', '{}')
        WHEN ty IN ('uuid'::regtype::oid, 'text'::regtype::oid) THEN
          CASE
            WHEN nm ~ 'slug' THEN format('%L', b_slug)
            WHEN nm ~ 'tenant|school' THEN format('%L', b::text)
            WHEN nm ~ 'identity|user_id' THEN format('%L', b_admin::text)
            WHEN nm ~ 'assignment' THEN format('%L', b_assign::text)
            WHEN nm ~ 'grant' THEN format('%L', b_grant::text)
            WHEN nm ~ 'position' THEN format('%L', b_pos::text)
            WHEN nm ~ 'runtime' THEN format('%L', 'runtime:scholar')
            WHEN nm ~ 'profile_key' THEN format('%L', 'sv2-profile')
            WHEN nm ~ 'kind' THEN format('%L', 'registrar')
            WHEN nm ~ 'role' THEN format('%L', v)
            WHEN nm ~ 'capability' THEN format('%L', 'sv2-cap')
            ELSE NULL END
        ELSE NULL END;
      IF lit IS NULL THEN
        args := args || coalesce(sv2_test.default_expr(ty, -1), 'NULL::' || format_type(ty, NULL));
      ELSE
        args := args || format('%s::%s', lit, format_type(ty, NULL));
      END IF;
    END LOOP;
    call := format('public.%I(%s)', f.proname, array_to_string(args, ', '));

    FOR u IN SELECT 'A:' || role AS actor, user_id FROM sv2_users WHERE label = 'A'
             UNION ALL SELECT 'A:' || tag, user_id FROM sv2_extra WHERE tag = 'registrar'
             ORDER BY 1 LOOP
      n := 0; txt := ''; err := NULL; msg := NULL; changed := NULL;
      BEGIN
        IF pre_del THEN DELETE FROM public.school_staff_types WHERE school_id = b; END IF;
        PERFORM set_config('request.jwt.claims', json_build_object('sub', u.user_id, 'role', 'authenticated')::text, true);
        PERFORM set_config('request.jwt.claim.sub', u.user_id::text, true);
        PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
        SET LOCAL ROLE authenticated;
        IF f.proretset THEN
          EXECUTE format('SELECT count(*), coalesce(string_agg(to_jsonb(t)::text, ''|''), '''') FROM %s t', call) INTO n, txt;
        ELSIF f.prorettype = 'void'::regtype THEN
          EXECUTE format('SELECT %s', call);
        ELSE
          EXECUTE format('SELECT CASE WHEN r IS NULL THEN 0 ELSE 1 END, coalesce(to_jsonb(r)::text, '''') FROM (SELECT %s AS r) s', call) INTO n, txt;
        END IF;
        RESET ROLE;
        SELECT string_agg(s.tbl, ',') INTO changed FROM sv2_bstate s
         WHERE sv2_test.tenant_digest(s.tbl, s.tcol, b) IS DISTINCT FROM s.digest
           AND NOT (pre_del AND s.tbl = 'school_staff_types');
        IF pre_del AND EXISTS (SELECT 1 FROM public.school_staff_types WHERE school_id = b) THEN
          changed := coalesce(changed || ',', '') || 'school_staff_types(seeded for victim)';
        END IF;
        RAISE EXCEPTION 'sv2-sentinel' USING ERRCODE = 'SV002';
      EXCEPTION
        WHEN SQLSTATE 'SV002' THEN NULL;
        WHEN OTHERS THEN err := SQLSTATE; msg := left(SQLERRM, 200);
      END;
      RESET ROLE;

      IF err IS NOT NULL THEN
        IF err IN ('42501', 'P0001') OR msg ~* 'forbidden|not authori|permission denied|denied' THEN
          outc := 'PASS'; det := 'exception [' || err || '] ' || msg;
        ELSE
          outc := 'ERROR'; det := 'harness call error [' || err || '] ' || msg || ' :: ' || left(call, 200);
        END IF;
      ELSIF changed IS NOT NULL THEN
        outc := 'LEAK'; det := 'side effect on tenant B: ' || changed;
      ELSIF f.proretset AND n > 0 THEN
        outc := 'LEAK'; det := 'returned rows=' || n;
      ELSIF NOT f.proretset AND f.prorettype <> 'void'::regtype AND n > 0 THEN
        IF txt = 'true' OR txt ~ pat THEN
          outc := 'LEAK'; det := 'returned ' || left(txt, 120);
        ELSIF txt IN ('false', '0') THEN
          outc := 'PASS'; det := 'returned ' || txt;
        ELSE
          outc := 'ERROR'; det := 'non-empty scalar result, triage: ' || left(txt, 120);
        END IF;
      ELSE
        outc := 'PASS'; det := 'empty result, no effect on tenant B';
      END IF;
      INSERT INTO sv2_results VALUES ('fuzz:' || f.proname, u.actor, 'FUZZ', outc, det);
    END LOOP;
   END LOOP;
  END LOOP;
  INSERT INTO sv2_results VALUES ('fuzz', '-', 'FUZZ_INVENTORY', 'INFO', nfn || ' multi-arg SECURITY DEFINER functions fuzzed');
  SELECT count(*) INTO nerr FROM sv2_results WHERE op = 'FUZZ' AND outcome = 'ERROR';
  IF nfn < 14 THEN
    RAISE EXCEPTION 'FUZZ COVERAGE: only % functions fuzzed, expected >= 14', nfn;
  END IF;
  IF nerr > 0 THEN
    RAISE EXCEPTION 'FUZZ HARNESS ERRORS: % FUZZ rows are ERROR', nerr;
  END IF;
END
$fuzz$;

-- ------------------------------------------------- column-secret check -----
-- Secret-looking text/bytea/json columns that anon/authenticated can SELECT.
-- LEAK only when a victim row was actually visible to that role in the sweep
-- (so a tenant-scoped table whose rows were invisible passes, while schools -
-- whose active row is public - exposes any granted secret column).
-- Allowlist (skipped): paystack_public_key (public by definition) and push_token
-- (per-device delivery handle; any cross-user visibility is already reported by the
-- table-level sweep). QR/credential-like token columns are NOT allowlisted: they are
-- bearer credentials, so they are evaluated like any other secret column.
-- Numeric/boolean/timestamp columns (e.g. tokens_in) are ignored by type.
DO $secretcols$
DECLARE
  r record; rl text; seen boolean; own boolean; swept boolean;
BEGIN
  FOR r IN
    SELECT k.relname AS tbl, a.attname::text AS col
      FROM pg_class k
      JOIN pg_attribute a ON a.attrelid = k.oid AND a.attnum > 0 AND NOT a.attisdropped
     WHERE k.relnamespace = 'public'::regnamespace AND k.relkind IN ('r','p') AND NOT k.relispartition
       AND k.relname NOT LIKE 'sv2%'
       AND a.attname ~* '(secret|password|private_key|api_key|service_key|token)'
       AND a.attname NOT IN ('paystack_public_key', 'push_token')
       AND (format_type(a.atttypid, a.atttypmod) IN ('text','bytea','json','jsonb','citext')
            OR format_type(a.atttypid, a.atttypmod) LIKE 'character%')
     ORDER BY 1, 2
  LOOP
    swept := EXISTS (SELECT 1 FROM sv2_cfg WHERE tbl = r.tbl AND status = 'ready');
    FOREACH rl IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF NOT has_column_privilege(rl, format('public.%I', r.tbl), r.col, 'SELECT') THEN CONTINUE; END IF;
      IF NOT swept THEN
        INSERT INTO sv2_results VALUES (r.tbl, rl, 'SECRET_COLUMN', 'INFO',
          'secret-named column ' || r.col || ' granted to ' || rl || ' on a table not swept (no tenant column or not seedable)');
        CONTINUE;
      END IF;
      seen := EXISTS (SELECT 1 FROM sv2_results
                       WHERE tbl = r.tbl AND op IN ('SELECT','SELECT[published]','SELECT[public]')
                         AND outcome IN ('LEAK','PUBLIC_BY_DESIGN')
                         AND (CASE WHEN rl = 'anon' THEN actor = 'anon' ELSE actor LIKE 'A:%' END));
      IF seen THEN
        INSERT INTO sv2_results VALUES (r.tbl, rl, 'SECRET_COLUMN', 'LEAK',
          'secret column readable cross-tenant: ' || r.col || ' (victim row visible to ' || rl || ')');
      ELSE
        INSERT INTO sv2_results VALUES (r.tbl, rl, 'SECRET_COLUMN', 'PASS',
          'secret column ' || r.col || ' granted to ' || rl || ' but no victim row visible');
      END IF;
      IF rl = 'authenticated' THEN
        own := EXISTS (SELECT 1 FROM sv2_results WHERE tbl = r.tbl AND op = 'OWN_SELECT' AND actor LIKE 'A:%'
                          AND detail !~ 'visible=0$');
        IF own THEN
          INSERT INTO sv2_results VALUES (r.tbl, 'authenticated', 'SECRET_COLUMN_OWN', 'INFO',
            'secret column readable by authenticated within own tenant: ' || r.col);
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END
$secretcols$;

-- ------------------------------------------------------------ reporting -----
\echo
\echo '=== SUMMARY BY OUTCOME ==='
SELECT outcome, count(*) AS n FROM sv2_results GROUP BY outcome ORDER BY outcome;

\echo '=== COVERAGE (actors swept / tenant mapping) ==='
SELECT actor, count(*) AS probes, count(*) FILTER (WHERE outcome = 'LEAK') AS leaks
  FROM sv2_results WHERE op IN ('OWN_SELECT','SELECT','SELECT[public]','SELECT[published]','UPDATE','DELETE','INSERT','INSERT[public]')
   AND actor <> '-' GROUP BY actor ORDER BY actor;
SELECT actor, outcome, detail FROM sv2_results WHERE op = 'TENANT_MAP' AND (outcome <> 'PASS' OR actor IN ('A:admin','B:admin','anon','cg_tenant')) ORDER BY actor;

\echo '=== LEAKS (table / op / actors) ==='
SELECT tbl, op, count(*) AS actors, string_agg(actor, ',' ORDER BY actor) AS actor_list, min(detail) AS sample_detail
  FROM sv2_results WHERE outcome = 'LEAK' GROUP BY tbl, op ORDER BY tbl, op;

\echo '=== PUBLIC_BY_DESIGN (classified, not leaks) ==='
SELECT tbl, op, count(*) AS actors, string_agg(actor, ',' ORDER BY actor) AS actor_list
  FROM sv2_results WHERE outcome = 'PUBLIC_BY_DESIGN' GROUP BY tbl, op ORDER BY tbl, op;

\echo '=== ERROR / SKIPPED ==='
SELECT outcome, tbl, actor, op, detail FROM sv2_results WHERE outcome IN ('ERROR','SKIPPED') ORDER BY outcome, tbl, actor, op;

\echo '=== INFO (storage control, secret columns, SECURITY DEFINER inventory) ==='
SELECT tbl, actor, op, detail FROM sv2_results WHERE outcome = 'INFO' AND op NOT IN ('SEED','OWN_SELECT') ORDER BY tbl, actor, op;

DO $report$
DECLARE
  r record; n int; skipped int; mapbad int; expected int; got int;
BEGIN
  SELECT count(*) INTO n FROM sv2_results WHERE outcome = 'LEAK';
  FOR r IN SELECT tbl, op, string_agg(actor, ',' ORDER BY actor) AS actors, min(detail) AS d
             FROM sv2_results WHERE outcome = 'LEAK' GROUP BY tbl, op ORDER BY tbl, op LOOP
    RAISE NOTICE 'LEAK % % by [%] : %', r.tbl, r.op, r.actors, r.d;
  END LOOP;
  SELECT count(*) INTO skipped FROM sv2_results WHERE outcome = 'SKIPPED';
  RAISE NOTICE 'SKIPPED tables: % (target 0)', skipped;

  -- Every seeded A role plus anon must have been swept (OWN_SELECT probe runs for every table).
  SELECT count(*) + 1 INTO expected FROM sv2_users WHERE label = 'A';
  SELECT count(DISTINCT actor) INTO got FROM sv2_results WHERE op = 'OWN_SELECT';
  IF got <> expected THEN
    RAISE EXCEPTION 'COVERAGE: swept % actors, expected % (7 roles + anon)', got, expected;
  END IF;

  SELECT count(*) INTO mapbad FROM sv2_results WHERE op = 'TENANT_MAP' AND outcome <> 'PASS';
  IF mapbad > 0 THEN
    RAISE EXCEPTION 'TENANT MAPPING INCONCLUSIVE: % get_my_tenant_id()/cg_tenant checks failed', mapbad;
  END IF;

  SELECT count(*) INTO skipped FROM sv2_results WHERE op = 'FUZZ' AND outcome = 'ERROR';
  IF skipped > 0 THEN
    RAISE EXCEPTION 'FUZZ ERRORS FOUND: %', skipped;
  END IF;

  IF n > 0 THEN
    RAISE EXCEPTION 'LEAKS FOUND: %', n;
  END IF;
  RAISE NOTICE 'NO LEAKS';
END
$report$;

ROLLBACK;
