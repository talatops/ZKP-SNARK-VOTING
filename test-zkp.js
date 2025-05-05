const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');
const util = require('util');

// Make console.log display objects better
const inspect = (obj) => console.log(util.inspect(obj, false, null, true));

async function main() {
  console.log('========== ZKP-SNARK VOTING SYSTEM DEMO ==========');

  try {
    // 1. Test Admin Circuit
    console.log('\n----- ADMIN CIRCUIT DEMO -----');
    const adminKey = '123456789'; // Secret admin key
    const actionData = '987654321'; // Example action data (like adding a candidate)
    const actionNonce = '555444333'; // Random nonce to prevent replay attacks
    
    // Calculate the expected action hash (for demo purposes)
    console.log('Creating admin proof with:');
    console.log(`  Admin Key: ${adminKey}`);
    console.log(`  Action Data: ${actionData}`);
    console.log(`  Action Nonce: ${actionNonce}`);
    
    // Generate a proof
    const adminInput = {
      adminKey: adminKey,
      actionData: actionData,
      actionNonce: actionNonce,
      publicActionHash: "2501868777802348545714702685483213336601442223569967527355209151149165780641"
    };
    
    console.log('\nGenerating admin proof...');
    const adminProof = await generateProof('admin', adminInput);
    console.log('Admin proof generated successfully!');
    console.log('Proof details:');
    inspect(adminProof);

    console.log('\nVerifying admin proof...');
    const adminVerified = await verifyProof('admin', adminProof.publicSignals, adminProof.proof);
    console.log(`Admin proof verification result: ${adminVerified ? 'VALID ✅' : 'INVALID ❌'}`);

    // 2. Test Auth Circuit
    console.log('\n\n----- AUTH CIRCUIT DEMO -----');
    const identifierPreimage = '12345678'; // Voter's secret identifier 
    const nullifierSecret = '87654321'; // Secret for nullifier
    
    console.log('Creating voter authentication with:');
    console.log(`  Identifier Preimage: ${identifierPreimage}`);
    console.log(`  Nullifier Secret: ${nullifierSecret}`);
    
    // Generate a proof
    const authInput = {
      identifierPreimage: identifierPreimage,
      nullifierSecret: nullifierSecret, 
      publicHashedIdentifier: "20764447115888171692176140757302178914819795456286933423708474141450740213323"
    };
    
    console.log('\nGenerating auth proof...');
    const authProof = await generateProof('auth', authInput);
    console.log('Auth proof generated successfully!');
    console.log('Proof details:');
    inspect(authProof);

    console.log('\nVerifying auth proof...');
    const authVerified = await verifyProof('auth', authProof.publicSignals, authProof.proof);
    console.log(`Auth proof verification result: ${authVerified ? 'VALID ✅' : 'INVALID ❌'}`);

    // 3. Test Vote Circuit
    console.log('\n\n----- VOTE CIRCUIT DEMO -----');
    const choice = '42'; // Candidate ID 
    
    console.log('Creating anonymous vote with:');
    console.log(`  Identifier Preimage: ${identifierPreimage} (same as auth)`);
    console.log(`  Nullifier Secret: ${nullifierSecret} (same as auth)`);
    console.log(`  Voting Choice: ${choice}`);
    
    // Generate a proof
    const voteInput = {
      identifierPreimage: identifierPreimage,
      nullifierSecret: nullifierSecret,
      choice: choice,
      publicNullifierHash: "1590204380219083102505858929030540146729466407003400647706138007315190430383", 
      publicChoiceHash: "8365577799539384663899794442022354891237484320765090705979616311134436098119"
    };
    
    console.log('\nGenerating vote proof...');
    const voteProof = await generateProof('vote', voteInput);
    console.log('Vote proof generated successfully!');
    console.log('Proof details:');
    inspect(voteProof);

    console.log('\nVerifying vote proof...');
    const voteVerified = await verifyProof('vote', voteProof.publicSignals, voteProof.proof);
    console.log(`Vote proof verification result: ${voteVerified ? 'VALID ✅' : 'INVALID ❌'}`);

    console.log('\n========== DEMO COMPLETED SUCCESSFULLY ==========');
    
  } catch (error) {
    console.error('Error during demo:', error);
  }
}

async function generateProof(circuitName, input) {
  const wasmPath = path.join(__dirname, `circuits/${circuitName}/${circuitName}_js/${circuitName}.wasm`);
  const zkeyPath = path.join(__dirname, `circuits/${circuitName}/${circuitName}_final.zkey`);
  
  return await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
}

async function verifyProof(circuitName, publicSignals, proof) {
  const vkeyPath = path.join(__dirname, `circuits/${circuitName}/verification_key.json`);
  const vkey = JSON.parse(fs.readFileSync(vkeyPath));
  
  return await snarkjs.groth16.verify(vkey, publicSignals, proof);
}

// Run the demo
main().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error(err);
  process.exit(1);
}); 