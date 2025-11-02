-- Add created_by column to sprints table
ALTER TABLE public.sprints 
ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_sprints_created_by ON public.sprints(created_by);

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view all sprints" ON public.sprints;
DROP POLICY IF EXISTS "Admins can manage sprints" ON public.sprints;

-- Create new policies
CREATE POLICY "Users can view all sprints"
ON public.sprints
FOR SELECT
USING (true);

CREATE POLICY "Users can create sprints"
ON public.sprints
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own sprints or admins can update all"
ON public.sprints
FOR UPDATE
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete sprints"
ON public.sprints
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));