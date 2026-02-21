-- QA Sequencing Migration
-- Date: 21 February 2026
-- Purpose: Add QA positioning between PeelingProducts and PeeledDispatches

-- ============================================
-- Step 1: Add peeled_product_id to qa_checklists
-- ============================================

ALTER TABLE qa_checklists 
ADD COLUMN peeled_product_id UUID NULL 
DEFAULT NULL;

COMMENT ON COLUMN qa_checklists.peeled_product_id IS 'Reference to peeled product record (between PeelingProducts and PeeledDispatches)';

-- Add foreign key constraint
ALTER TABLE qa_checklists
ADD CONSTRAINT fk_qa_checklists_peeled_product_id
FOREIGN KEY (peeled_product_id)
REFERENCES peeling_products(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Create index for performance
CREATE INDEX idx_qa_checklists_peeled_product_id 
ON qa_checklists(peeled_product_id);

-- ============================================
-- Step 2: Add qa_checklist_id to peeled_dispatches
-- ============================================

ALTER TABLE peeled_dispatches
ADD COLUMN qa_checklist_id UUID NULL
DEFAULT NULL;

COMMENT ON COLUMN peeled_dispatches.qa_checklist_id IS 'Reference to QA Checklist (new position between PeelingProducts and PeeledDispatches)';

-- Add foreign key constraint
ALTER TABLE peeled_dispatches
ADD CONSTRAINT fk_peeled_dispatches_qa_checklist_id
FOREIGN KEY (qa_checklist_id)
REFERENCES qa_checklists(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Create index for performance
CREATE INDEX idx_peeled_dispatches_qa_checklist_id
ON peeled_dispatches(qa_checklist_id);

-- ============================================
-- Step 3: Verify the columns were added
-- ============================================

-- Check qa_checklists table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'qa_checklists' 
AND column_name IN ('peeled_product_id', 'peeled_dispatch_id')
ORDER BY ordinal_position;

-- Check peeled_dispatches table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'peeled_dispatches'
AND column_name IN ('qa_checklist_id', 'qa_id')
ORDER BY ordinal_position;

-- ============================================
-- Step 4: Data Migration (Optional - if existing QA records)
-- ============================================
-- Note: Uncomment and adjust if you have existing data to migrate

-- UPDATE qa_checklists qa
-- SET peeled_product_id = pd.peeled_product_id
-- FROM peeled_dispatches pd
-- WHERE qa.peeled_dispatch_id = pd.id
-- AND qa.peeled_product_id IS NULL;

-- UPDATE peeled_dispatches pd
-- SET qa_checklist_id = qa.id
-- FROM qa_checklists qa
-- WHERE pd.qa_id = qa.id
-- AND pd.qa_checklist_id IS NULL;
