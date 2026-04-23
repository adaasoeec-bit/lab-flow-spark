-- Add new columns to equipment to support unified fixed/consumable inventory with store location
ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS equipment_type text NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS shelf text,
  ADD COLUMN IF NOT EXISTS row_number text,
  ADD COLUMN IF NOT EXISTS quantity integer,
  ADD COLUMN IF NOT EXISTS unit text;

-- Constrain equipment_type values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'equipment_type_check'
  ) THEN
    ALTER TABLE public.equipment
      ADD CONSTRAINT equipment_type_check CHECK (equipment_type IN ('fixed', 'consumable'));
  END IF;
END $$;