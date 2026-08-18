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
import { ActivityLogSchema, ActivityLogEntity } from '../entities/activity-log.entity';
import { CommentSchema, CommentEntity } from '../entities/comment.entity';
import { TaskPriority } from '../enums/task-priority.enum';
import { TaskStatus } from '../enums/task-status.enum';
import { ActivityType } from '../enums/activity-type.enum';

async function seed() {
  const uri = MONGO_DB_URI;
  await mongoose.connect(uri);
  console.log(`Connected to ${uri}`);

  const UserModel = mongoose.model(UserEntity.name, UserSchema, require('../entities/user.entity').UserCollectionName);
  const WorkspaceModel = mongoose.model(WorkspaceEntity.name, WorkspaceSchema, require('../entities/workspace.entity').WorkspaceCollectionName);
  const ProjectModel = mongoose.model(ProjectEntity.name, ProjectSchema, require('../entities/project.entity').ProjectCollectionName);
  const TaskModel = mongoose.model(TaskEntity.name, TaskSchema, require('../entities/task.entity').TaskCollectionName);
  const LabelModel = mongoose.model(LabelEntity.name, LabelSchema, require('../entities/label.entity').LabelCollectionName);
  const ActivityLogModel = mongoose.model('ActivityLogEntity', ActivityLogSchema, require('../entities/activity-log.entity').ActivityLogCollectionName);
  const CommentModel = mongoose.model('CommentEntity', CommentSchema, require('../entities/comment.entity').CommentCollectionName);

  // Clear ALL existing data so there are no old duplicates/orphans
  console.log('Clearing database...');
  await UserModel.deleteMany({});
  await WorkspaceModel.deleteMany({});
  await ProjectModel.deleteMany({});
  await TaskModel.deleteMany({});
  await LabelModel.deleteMany({});
  await ActivityLogModel.deleteMany({});
  await CommentModel.deleteMany({});

  console.log('Creating users...');
  // The 'name' matches exactly what usersService.getOrCreateDemoUser looks for!
  const demoOwner = await UserModel.create({
    name: 'Demo Owner',
    email: 'owner@taskflow.dev',
    isGuest: true,
  });
  const demoMember = await UserModel.create({
    name: 'Demo Member',
    email: 'member@taskflow.dev',
    isGuest: true,
  });
  const guestUser = await UserModel.create({
    name: 'Demo Guest',
    email: 'guest@taskflow.dev',
    isGuest: true,
  });

  console.log('Creating workspace...');
  const workspace = await WorkspaceModel.create({
    name: 'Demo Workspace',
    ownerId: demoOwner._id,
    memberIds: [demoOwner._id, demoMember._id, guestUser._id],
  });

  // CRITICAL: Update the users so they know which workspace they belong to!
  await UserModel.updateOne({ _id: demoOwner._id }, { $set: { workspaceId: workspace._id } });
  await UserModel.updateOne({ _id: demoMember._id }, { $set: { workspaceId: workspace._id } });
  await UserModel.updateOne({ _id: guestUser._id }, { $set: { workspaceId: workspace._id } });

  console.log('Creating project...');
  const project = await ProjectModel.create({
    workspaceId: workspace._id,
    name: 'Website Redesign',
    priority: TaskPriority.HIGH,
    leadId: demoOwner._id,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  console.log('Creating labels...');
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

  console.log('Creating tasks...');
  const taskDefs: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    memberIds: any[];
    labelIds: any[];
    dueDate?: Date | null;
  }[] = [
    {
      title: 'Audit current site information architecture',
      description: 'Review the existing site map and identify areas for improvement.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      memberIds: [demoOwner._id, demoMember._id],
      labelIds: [labels[0]._id],
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Future
    },
    {
      title: 'Design landing page hero section',
      description: 'Create Figma mockups for the new hero section.',
      status: TaskStatus.DOING,
      priority: TaskPriority.HIGH,
      memberIds: [demoMember._id],
      labelIds: [labels[1]._id],
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Overdue
    },
    {
      title: 'Set up Next.js project scaffold',
      description: 'Initialize repo with Turbopack and ESLint.',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.URGENT,
      memberIds: [demoOwner._id],
      labelIds: [labels[2]._id],
    },
    {
      title: 'Waiting on brand guideline sign-off',
      description: 'Client needs to approve the new logo and colors before we can proceed.',
      status: TaskStatus.ON_HOLD,
      priority: TaskPriority.LOW,
      memberIds: [guestUser._id],
      labelIds: [labels[1]._id, labels[5]._id],
    },
    {
      title: 'Write API integration tests',
      description: 'Cover all authentication and user endpoints.',
      status: TaskStatus.TODO,
      priority: TaskPriority.NO_PRIORITY,
      memberIds: [],
      labelIds: [labels[3]._id],
    },
    {
      title: 'Deploy staging environment',
      description: 'Push initial scaffold to Vercel and set up DNS.',
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.HIGH,
      memberIds: [demoOwner._id],
      labelIds: [labels[4]._id],
      dueDate: new Date(), // Today
    },
    {
      title: 'Fix responsive layout bugs on mobile',
      description: 'The navbar hamburger menu is overflowing on iPhone SE.',
      status: TaskStatus.DOING,
      priority: TaskPriority.HIGH,
      memberIds: [demoMember._id],
      labelIds: [labels[2]._id, labels[3]._id],
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Draft Q3 marketing campaign',
      description: 'Outline the budget, channels, and key messaging for the upcoming quarter.',
      status: TaskStatus.DOING,
      priority: TaskPriority.MEDIUM,
      memberIds: [guestUser._id, demoOwner._id],
      labelIds: [labels[5]._id],
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Analyze competitor pricing models',
      description: 'Gather pricing data from top 3 competitors and put in a spreadsheet.',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      memberIds: [],
      labelIds: [labels[0]._id],
    },
  ];

  const tasks: any[] = [];
  let index = 1;
  for (const def of taskDefs) {
    const task = await TaskModel.create({
      ...def,
      workspaceId: workspace._id,
      projectId: project._id,
      reporterId: demoOwner._id,
      teamId: `DEX-${index++}`,
    });
    tasks.push(task);

    // Initial CREATED log
    await ActivityLogModel.create({
      taskId: task._id,
      actorId: demoOwner._id,
      type: ActivityType.CREATED,
      message: 'created the task',
    });

    // Simulate a status change log for tasks that are not TODO
    if (task.status !== TaskStatus.TODO) {
      await ActivityLogModel.create({
        taskId: task._id,
        actorId: def.memberIds.length > 0 ? def.memberIds[0] : demoOwner._id,
        type: ActivityType.STATUS_CHANGE,
        fromValue: TaskStatus.TODO,
        toValue: task.status,
        message: `changed status from ${TaskStatus.TODO} to ${task.status}`,
      });
    }
  }

  console.log('Creating subtasks and comments...');
  
  // Subtasks for 'Audit current site information architecture'
  const parentTask = tasks[0];
  const subtask1 = await TaskModel.create({
    workspaceId: workspace._id,
    projectId: project._id,
    parentTaskId: parentTask._id, // LINK TO PARENT
    title: 'Review existing Google Analytics',
    status: TaskStatus.COMPLETED,
    priority: TaskPriority.MEDIUM,
    memberIds: [demoOwner._id],
    reporterId: demoOwner._id,
    teamId: `DEX-${index++}`,
  });
  
  const subtask2 = await TaskModel.create({
    workspaceId: workspace._id,
    projectId: project._id,
    parentTaskId: parentTask._id,
    title: 'Interview key stakeholders',
    status: TaskStatus.DOING,
    priority: TaskPriority.HIGH,
    memberIds: [demoMember._id],
    reporterId: demoOwner._id,
    teamId: `DEX-${index++}`,
  });

  // Log subtask creations
  for (const sub of [subtask1, subtask2]) {
    await ActivityLogModel.create({
      taskId: parentTask._id,
      actorId: demoOwner._id,
      type: ActivityType.SUBTASK_ADDED,
      toValue: sub._id.toString(),
      message: `added subtask "${sub.title}"`,
    });
    
    await ActivityLogModel.create({
      taskId: sub._id,
      actorId: demoOwner._id,
      type: ActivityType.CREATED,
      message: 'created the subtask',
    });
  }

  // Add rich comments between Demo Owner and Demo Member on 'Design landing page hero section'
  const designTask = tasks[1];
  await CommentModel.create({
    taskId: designTask._id,
    authorId: demoOwner._id,
    body: 'Can we try a dark mode variant for the hero section? I think it might look sleeker with our new typography.',
  });
  await ActivityLogModel.create({
    taskId: designTask._id,
    actorId: demoOwner._id,
    type: ActivityType.COMMENT,
    message: 'added a comment',
  });

  await CommentModel.create({
    taskId: designTask._id,
    authorId: demoMember._id,
    body: 'Absolutely! I will put together a few options today and we can review them tomorrow morning. Should I include the new 3D assets?',
  });
  await ActivityLogModel.create({
    taskId: designTask._id,
    actorId: demoMember._id,
    type: ActivityType.COMMENT,
    message: 'added a comment',
  });

  // Add comment with attachment simulation on 'Set up Next.js project scaffold'
  const setupTask = tasks[2];
  await CommentModel.create({
    taskId: setupTask._id,
    authorId: demoOwner._id,
    body: 'All set! Scaffold is ready. See the attached setup guide for local dev instructions.',
    attachments: [
      { name: 'setup-guide.md', url: 'https://example.com/setup-guide.md' }
    ]
  });
  await ActivityLogModel.create({
    taskId: setupTask._id,
    actorId: demoOwner._id,
    type: ActivityType.COMMENT,
    message: 'added a comment',
  });

  // Ensure ALL tasks have at least one comment
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    // Skip if we already added explicit comments for these indexes
    if (i === 1 || i === 2) continue; 
    
    await CommentModel.create({
      taskId: t._id,
      authorId: demoMember._id,
      body: `Just checking in on this task. Let me know if you need any help with ${t.title}.`,
    });
    await ActivityLogModel.create({
      taskId: t._id,
      actorId: demoMember._id,
      type: ActivityType.COMMENT,
      message: 'added a comment',
    });
  }

  // Ensure some more subtasks
  for (let i = 3; i < 6; i++) {
    const parentT = tasks[i];
    const s1 = await TaskModel.create({
      workspaceId: workspace._id,
      projectId: project._id,
      parentTaskId: parentT._id,
      title: `Subtask 1 for ${parentT.title}`,
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      memberIds: [],
      reporterId: demoOwner._id,
      teamId: `DEX-${index++}`,
    });
    await ActivityLogModel.create({
      taskId: parentT._id,
      actorId: demoOwner._id,
      type: ActivityType.SUBTASK_ADDED,
      toValue: s1._id.toString(),
      message: `added subtask "${s1.title}"`,
    });
  }


  console.log('Seed completed successfully!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
