
const fs = require('fs');
try {
  const data = JSON.parse(fs.readFileSync('c:/CliniSmart CRM/scratch/workflow_bRQoyjQbfwsE9yRZ.json', 'utf16le'));
  const node = data.data.nodes.find(n => n.name === "Agente Gerente Sofia");
  console.log(JSON.stringify(node, null, 2));
} catch (e) {
  console.log("UTF-16 failed, trying standard...");
  try {
     const data = JSON.parse(fs.readFileSync('c:/CliniSmart CRM/scratch/workflow_bRQoyjQbfwsE9yRZ.json', 'utf8'));
     const node = data.data.nodes.find(n => n.name === "Agente Gerente Sofia");
     console.log(JSON.stringify(node, null, 2));
  } catch (err) {
     console.log("Error:", err.message);
  }
}
