const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/api/v1/auth/guest',
  method: 'POST',
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const token = parsed.data.accessToken;
      console.log('Got token:', token ? 'yes' : 'no');
      
      // Fetch labels
      http.get('http://localhost:8000/api/v1/labels', { headers: { Authorization: `Bearer ${token}` } }, (res2) => {
        let lData = '';
        res2.on('data', chunk => lData += chunk);
        res2.on('end', () => console.log('Labels:', lData));
      });
      
    } catch (e) {
      console.error(e);
    }
  });
});
req.on('error', e => console.error(`Error: ${e.message}`));
req.end();
