async function run() {
  try {
    const loginRes = await fetch('https://task-management-api-gold.vercel.app/api/v1/auth/guest', { method: 'POST' });
    const loginData = await loginRes.json();
    const token = loginData.data.accessToken;
    console.log('Workspace ID:', loginData.data.workspace._id);

    const labelsRes = await fetch('https://task-management-api-gold.vercel.app/api/v1/labels', { headers: { Authorization: `Bearer ${token}` } });
    const labelsData = await labelsRes.json();
    console.log('Labels count:', labelsData.data.length);

    const workspacesRes = await fetch('https://task-management-api-gold.vercel.app/api/v1/workspaces', { headers: { Authorization: `Bearer ${token}` } });
    const workspacesData = await workspacesRes.json();
    console.log('Workspaces count:', workspacesData.data.length);
  } catch (err) {
    console.error(err.message);
  }
}
run();
