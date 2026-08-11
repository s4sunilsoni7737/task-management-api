const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb+srv://s4sunilsoni7737_db_user:m6xxmeSF53o74rNX@cluster0.8cnsg9f.mongodb.net/?appName=Cluster0');
  
  const LabelSchema = new mongoose.Schema({ workspaceId: mongoose.Schema.Types.ObjectId, isDeleted: Boolean }, { collection: 'labels' });
  const LabelModel = mongoose.model('Label', LabelSchema);
  
  const WorkspaceSchema = new mongoose.Schema({ memberIds: [mongoose.Schema.Types.ObjectId], isDeleted: Boolean }, { collection: 'workspaces' });
  const WorkspaceModel = mongoose.model('Workspace', WorkspaceSchema);
  
  const resolvedWorkspaceId = "6a7b1a7257c7c3b21c5f3c94";
  const userId = "6a7b1a7257c7c3b21c5f3c8c";

  console.log('Labels count:', await LabelModel.find({ workspaceId: resolvedWorkspaceId, isDeleted: false }).countDocuments());
  console.log('Workspaces count:', await WorkspaceModel.find({ memberIds: userId, isDeleted: false }).countDocuments());
  
  await mongoose.disconnect();
}
run();
