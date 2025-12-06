/**
 * Script um mögliche Tabellennamen für Mitarbeiter zu testen
 * Findet den korrekten Entity Set Namen
 */

const DATAVERSE_URL = "https://scepdevstud6.crm17.dynamics.com";

// Hole TOKEN aus Command Line Argument
const TOKEN = process.argv[2];

async function testTableName(tableName) {
  const url = `${DATAVERSE_URL}/api/data/v9.2/${tableName}?$top=1`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        "Accept": "application/json",
      },
    });

    if (response.ok) {
      console.log(`✅ ${tableName} - EXISTIERT`);
      return true;
    } else {
      console.log(`❌ ${tableName} - ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${tableName} - Error: ${error.message}`);
    return false;
  }
}

async function findCorrectTableName() {
  if (!TOKEN) {
    console.error("❌ Bitte TOKEN als Argument übergeben:");
    console.error("   node scripts/check-lookup-metadata.js 'YOUR_TOKEN_HERE'");
    return;
  }

  console.log("🔍 Teste mögliche Tabellennamen...\n");

  const possibleNames = [
    "cr6df_sgsw_mitarbeitendes", // Plural -s
    "cr6df_sgsw_mitarbeitende",  // Original
    "cr6df_mitarbeitende",       // Ohne sgsw_
    "cr6df_mitarbeitendes",      // Ohne sgsw_ + plural
    "systemusers",               // Standard
  ];

  for (const name of possibleNames) {
    await testTableName(name);
  }
}

findCorrectTableName();
