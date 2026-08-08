/**
 * Seeds a demo "Dexter" workspace with a project, labels, and a handful of
 * tasks across every status column — useful for exercising the List/Board
 * views immediately after a fresh `npm run start:dev`.
 *
 * Usage: npm run seed
 */
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { UserSchema, UserEntity } from '../modules/users/entities/user.entity';
import { WorkspaceSchema, WorkspaceEntity } from '../modules/workspaces/entities/workspace.entity';
import { ProjectSchema, ProjectEntity } from '../modules/projects/entities/project.entity';
import { TaskSchema, TaskEntity } from '../modules/tasks/entities/task.entity';
import { LabelSchema, LabelEntity } from '../modules/labels/entities/label.entity';
import { TaskPriority, TaskStatus } from '../common/enums';

dotenv.config();

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskflow';
  await mongoose.connect(uri);
  console.log(`Connected to ${uri}`);

  const UserModel = mongoose.model(UserEntity.name, UserSchema);
  const WorkspaceModel = mongoose.model(WorkspaceEntity.name, WorkspaceSchema);
  const ProjectModel = mongoose.model(ProjectEntity.name, ProjectSchema);
  const TaskModel = mongoose.model(TaskEntity.name, TaskSchema);
  const LabelModel = mongoose.model(LabelEntity.name, LabelSchema);

  const user = await UserModel.create({
    name: 'Demo User',
    email: 'demo@taskflow.dev',
    isGuest: false,
  });

  const workspace = await WorkspaceModel.create({
    name: 'Dexter',
    ownerId: user._id,
    memberIds: [user._id],
  });

  await UserModel.updateOne({ _id: user._id }, { $set: { defaultWorkspaceId: workspace._id } });

  const project = await ProjectModel.create({
    workspaceId: workspace._id,
    name: 'Website Redesign',
    priority: TaskPriority.HIGH,
    leadId: user._id,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  const labelDefs = [
    { name: 'Research', color: '#8B5CF6' },
    { name: 'Design', color: '#F59E0B' },
    { name: 'Development', color: '#3B82F6' },
    { name: 'Testing', color: '#10B981' },
    { name: 'Deployment', color: '#EF4444' },
  ];
  const labels = await LabelModel.insertMany(
    labelDefs.map((l) => ({ ...l, workspaceId: workspace._id })),
  );

  const taskDefs: { title: string; status: TaskStatus; priority: TaskPriority }[] = [
    { title: 'Audit current site information architecture', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM },
    { title: 'Design landing page hero section', status: TaskStatus.DOING, priority: TaskPriority.HIGH },
    { title: 'Set up Next.js project scaffold', status: TaskStatus.COMPLETED, priority: TaskPriority.URGENT },
    { title: 'Waiting on brand guideline sign-off', status: TaskStatus.ON_HOLD, priority: TaskPriority.LOW },
    { title: 'Write API integration tests', status: TaskStatus.TODO, priority: TaskPriority.NO_PRIORITY },
  ];

  for (const def of taskDefs) {
    await TaskModel.create({
      workspaceId: workspace._id,
      projectId: project._id,
      title: def.title,
      status: def.status,
      priority: def.priority,
      memberIds: [user._id],
      labelIds: [labels[Math.floor(Math.random() * labels.length)]._id],
      reporterId: user._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  }

  console.log('✅ Seed complete');
  console.log(`   Workspace: ${workspace._id}`);
  console.log(`   Project:   ${project._id}`);
  console.log(`   Demo user: ${user._id} (${user.email})`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
