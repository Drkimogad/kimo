// Communicates purpose at a glance
const FETCHRESPONSEAPI_URL = '/api/agent';

// Function name = what it does + what it returns
async function fetchAIResponseFromAgent(prompt) {
  const response = await fetch(FETCHRESPONSEAPI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  return (await response.json()).response;
}
