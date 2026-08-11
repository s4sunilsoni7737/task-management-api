/**
 * Seeds a demo "Dexter" workspace with a project, labels, and a handful of
 * tasks across every status column — useful for exercising the List/Board
 * views immediately after a fresh `npm run start:dev`.
 *
 * Usage: npm run seed
 */
import mongoose from 'mongoose';
import { MONGO_DB_URI } from '../constants';
import { UserSchema, UserEntity } from '../entities/user.entity';
import { WorkspaceSchema, WorkspaceEntity } from '../entities/workspace.entity';
import { ProjectSchema, ProjectEntity } from '../entities/project.entity';
import { TaskSchema, TaskEntity } from '../entities/task.entity';
import { LabelSchema, LabelEntity } from '../entities/label.entity';
import { TaskPriority } from '../enums/task-priority.enum';
import { TaskStatus } from '../enums/task-status.enum';

async function seed() {
  const uri = MONGO_DB_URI;
  await mongoose.connect(uri);
  console.log(`Connected to ${uri}`);

  const UserModel = mongoose.model(UserEntity.name, UserSchema);
  const WorkspaceModel = mongoose.model(WorkspaceEntity.name, WorkspaceSchema);
  const ProjectModel = mongoose.model(ProjectEntity.name, ProjectSchema);
  const TaskModel = mongoose.model(TaskEntity.name, TaskSchema);
  const LabelModel = mongoose.model(LabelEntity.name, LabelSchema);

  // Clear existing to avoid duplicate key errors on repeated runs
  await UserModel.deleteMany({});
  await WorkspaceModel.deleteMany({});
  await ProjectModel.deleteMany({});
  await TaskModel.deleteMany({});
  await LabelModel.deleteMany({});

  const user1 = await UserModel.create({
    name: 'Demo User',
    email: 'demo@taskflow.dev',
    isGuest: false,
  });
  const user2 = await UserModel.create({
    name: 'Jane Doe',
    email: 'jane@taskflow.dev',
    isGuest: false,
  });
  const user3 = await UserModel.create({
    name: 'John Smith',
    email: 'john@taskflow.dev',
    isGuest: false,
  });

  const workspace = await WorkspaceModel.create({
    name: 'Dexter',
    ownerId: user1._id,
    memberIds: [user1._id, user2._id, user3._id],
  });

  await UserModel.updateOne({ _id: user1._id }, { $set: { defaultWorkspaceId: workspace._id } });
  await UserModel.updateOne({ _id: user2._id }, { $set: { defaultWorkspaceId: workspace._id } });
  await UserModel.updateOne({ _id: user3._id }, { $set: { defaultWorkspaceId: workspace._id } });

  const project = await ProjectModel.create({
    workspaceId: workspace._id,
    name: 'Website Redesign',
    priority: TaskPriority.HIGH,
    leadId: user1._id,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  const labelDefs = [
    { name: 'Research', color: '#8B5CF6' },
    { name: 'Design', color: '#F59E0B' },
    { name: 'Development', color: '#3B82F6' },
    { name: 'Testing', color: '#10B981' },
    { name: 'Deployment', color: '#EF4444' },
    { name: 'Marketing', color: '#EC4899' },
  ];
  const labels = await LabelModel.insertMany(
    labelDefs.map((l) => ({ ...l, workspaceId: workspace._id, isDeleted: false })),
  );

  const taskDefs: { title: string; status: TaskStatus; priority: TaskPriority; memberIds: any[] }[] = [
    {
      title: 'Audit current site information architecture',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      memberIds: [user1._id, user2._id],
    },
    {
      title: 'Design landing page hero section',
      status: TaskStatus.DOING,
      priority: TaskPriority.HIGH,
      memberIds: [user2._id],
    },
    {
      title: 'Set up Next.js project scaffold',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.URGENT,
      memberIds: [user1._id],
    },
    {
      title: 'Waiting on brand guideline sign-off',
      status: TaskStatus.ON_HOLD,
      priority: TaskPriority.LOW,
      memberIds: [user3._id],
    },
    {
      title: 'Write API integration tests',
      status: TaskStatus.TODO,
      priority: TaskPriority.NO_PRIORITY,
      memberIds: [],
    },
    {
      title: 'Deploy to staging environment',
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.HIGH,
      memberIds: [user1._id, user3._id],
    }
  ];

  const tasks: any[] = [];
  for (const def of taskDefs) {
    const task = await TaskModel.create({
      workspaceId: workspace._id,
      projectId: project._id,
      title: def.title,
      status: def.status,
      priority: def.priority,
      memberIds: def.memberIds,
      labelIds: [labels[Math.floor(Math.random() * labels.length)]._id],
      reporterId: user1._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    tasks.push(task);
  }

  const parentTask = tasks[1];
  await TaskModel.create({
    workspaceId: workspace._id,
    projectId: project._id,
    parentTaskId: parentTask._id,
    title: 'Create wireframes',
    status: TaskStatus.COMPLETED,
    priority: TaskPriority.MEDIUM,
    memberIds: [user2._id],
    reporterId: user1._id,
  });
  await TaskModel.create({
    workspaceId: workspace._id,
    projectId: project._id,
    parentTaskId: parentTask._id,
    title: 'Design high fidelity mockups',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    memberIds: [user2._id, user3._id],
    reporterId: user2._id,
  });

  console.log('✅ Seed complete');
  console.log(`   Workspace: ${workspace._id}`);
  console.log(`   Project:   ${project._id}`);
  console.log(`   Demo user: ${user1._id} (${user1.email})`);
  console.log(`   Jane user: ${user2._id} (${user2.email})`);
  console.log(`   John user: ${user3._id} (${user3.email})`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
