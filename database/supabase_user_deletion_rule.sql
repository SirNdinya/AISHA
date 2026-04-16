-- ============================================================================
-- AISHA - USER DELETION RULE (SUPABASE)
-- Ensures complete cleanup of public schema data while protecting
-- institutional records for students.
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER AS $$
DECLARE
    student_admission_no TEXT;
    inst_schema_name TEXT;
    target_table RECORD;
BEGIN
    -- 1. PREPARE CONTEXT (Fetch Student Info if applicable)
    IF OLD.role = 'STUDENT' THEN
        SELECT admission_number INTO student_admission_no 
        FROM public.students 
        WHERE user_id = OLD.id;
    END IF;

    -- 2. DYNAMIC CLEANUP OF PUBLIC SCHEMA (BY EMAIL, ADM_NO, OR UUIDS)
    -- This handles tables "irrespective of public key constraints" to prevent FK errors
    FOR target_table IN (
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name IN ('email', 'admission_number', 'reg_number', 'user_id', 'owner_id', 'student_id')
    ) LOOP
        -- Skip core tables that are handled by the main delete or cascades
        IF target_table.table_name IN ('users', 'students') THEN
            CONTINUE;
        END IF;

        IF target_table.column_name = 'email' THEN
            EXECUTE format('DELETE FROM public.%I WHERE %I::text = $1', target_table.table_name, target_table.column_name) 
            USING OLD.email;
        ELSIF target_table.column_name IN ('admission_number', 'reg_number') AND student_admission_no IS NOT NULL THEN
            EXECUTE format('DELETE FROM public.%I WHERE %I::text = $1', target_table.table_name, target_table.column_name) 
            USING student_admission_no;
        ELSIF target_table.column_name IN ('user_id', 'owner_id') THEN
            EXECUTE format('DELETE FROM public.%I WHERE %I = $1', target_table.table_name, target_table.column_name) 
            USING OLD.id;
        ELSIF target_table.column_name = 'student_id' THEN
            DECLARE
                curr_student_id UUID;
            BEGIN
                SELECT id INTO curr_student_id FROM public.students WHERE user_id = OLD.id;
                IF curr_student_id IS NOT NULL THEN
                    EXECUTE format('DELETE FROM public.%I WHERE %I = $1', target_table.table_name, target_table.column_name) 
                    USING curr_student_id;
                END IF;
            END;
        END IF;
    END LOOP;

    -- 3. ROLE-SPECIFIC CLEANUP (SYSTEM DELETION)
    IF OLD.role = 'INSTITUTION' THEN
        -- Get the institution's schema name
        SELECT schema_name INTO inst_schema_name 
        FROM public.institutions 
        WHERE user_id = OLD.id;

        -- Drop the associated institution schema
        IF inst_schema_name IS NOT NULL AND inst_schema_name LIKE 'inst_%' THEN
            EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', inst_schema_name);
        END IF;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 6. CREATE THE TRIGGER
DROP TRIGGER IF EXISTS tr_user_deletion_cleanup ON public.users;
CREATE TRIGGER tr_user_deletion_cleanup
BEFORE DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION handle_user_deletion();

-- ============================================================================
-- NOTE ON USAGE:
-- Paste this script into the Supabase SQL Editor and run it. 
-- It will automatically handle cleanup whenever a record is deleted from 'public.users'.
-- ============================================================================
