import fetch from "node-fetch";

async function testHistoryEndpoint() {
  const url = "https://lostbaskingshark-crm.cloudfy.live/api/whatsapp/tools/get-patient-history";
  const auth = "Bearer clini-smart-auth-2026";
  
  const payload = {
    clinicId: "29661809-6f2c-4857-87c6-f994f88f2548",
    patientPhone: "5581999999999"
  };

  console.log("Testando endpoint:", url);
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": auth
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log("Resposta:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Erro no teste:", err.message);
  }
}

testHistoryEndpoint();
