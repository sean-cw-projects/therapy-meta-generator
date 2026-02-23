// Simple test script for the API
const http = require('http');

const data = JSON.stringify({
  pageType: 'specialty',
  specialty: 'Anxiety Therapy',
  focusKeyword: 'anxiety therapist',
  content: 'Our experienced therapists specialize in treating anxiety disorders using evidence-based approaches including CBT and mindfulness techniques. We provide a safe, supportive environment for healing.'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Testing API endpoint...\n');

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('\nResponse:');
    try {
      const parsed = JSON.parse(responseData);
      console.log(JSON.stringify(parsed, null, 2));

      if (parsed.metaDescription) {
        console.log('\n✅ SUCCESS! API is working!');
        console.log('\nGenerated Meta Description:');
        console.log(parsed.metaDescription);
        console.log('\nSEO Score:', parsed.seoScore + '/100');
      }
    } catch (e) {
      console.log(responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(data);
req.end();
