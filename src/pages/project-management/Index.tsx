import { Shell } from "@/components/layout/Shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./OverviewTab";
import { TasksTab } from "./TasksTab";
import { SprintsTab } from "./SprintsTab";
import { BugReportsTab } from "./BugReportsTab";
import { LogsTab } from "./LogsTab";
import { DeploymentsTab } from "./DeploymentsTab";

const ProjectManagement = () => {
  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Project Management</h1>
          <p className="text-muted-foreground">
            Track tasks, sprints, bugs, and deployments
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="sprints">Sprints</TabsTrigger>
            <TabsTrigger value="bugs">Bug Reports</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="deployments">Deployments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="tasks">
            <TasksTab />
          </TabsContent>

          <TabsContent value="sprints">
            <SprintsTab />
          </TabsContent>

          <TabsContent value="bugs">
            <BugReportsTab />
          </TabsContent>

          <TabsContent value="logs">
            <LogsTab />
          </TabsContent>

          <TabsContent value="deployments">
            <DeploymentsTab />
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
};

export default ProjectManagement;
