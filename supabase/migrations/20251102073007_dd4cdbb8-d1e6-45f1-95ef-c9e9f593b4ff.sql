-- Add foreign key constraints for profiles relationships

-- Tasks table - created_by references profiles
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- Sprints table - created_by references profiles  
ALTER TABLE public.sprints
DROP CONSTRAINT IF EXISTS sprints_created_by_fkey;

ALTER TABLE public.sprints
ADD CONSTRAINT sprints_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- Bug reports table - reporter_id references profiles
ALTER TABLE public.bug_reports
DROP CONSTRAINT IF EXISTS bug_reports_reporter_id_fkey;

ALTER TABLE public.bug_reports
ADD CONSTRAINT bug_reports_reporter_id_fkey
FOREIGN KEY (reporter_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- Deployments table - deployed_by references profiles
ALTER TABLE public.deployments
DROP CONSTRAINT IF EXISTS deployments_deployed_by_fkey;

ALTER TABLE public.deployments
ADD CONSTRAINT deployments_deployed_by_fkey
FOREIGN KEY (deployed_by)
REFERENCES public.profiles(id)
ON DELETE SET NULL;