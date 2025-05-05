#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CIRCUIT_DIRS = ['admin', 'auth', 'vote'];
const PTAU_FILE = 'pot15_final.ptau';

// Download the Powers of Tau file if it doesn't exist
if (!fs.existsSync(PTAU_FILE)) {
  console.log('Downloading Powers of Tau file...');
  // Using a different source for the Powers of Tau file
  execSync(`curl -L -o ${PTAU_FILE} https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_15.ptau`);
}

// Fix import paths in circuit files before compiling
CIRCUIT_DIRS.forEach(circuitName => {
  const circuitPath = path.join(__dirname, circuitName, `${circuitName}.circom`);
  if (fs.existsSync(circuitPath)) {
    console.log(`Fixing imports in ${circuitName}.circom`);
    
    let content = fs.readFileSync(circuitPath, 'utf8');
    
    // Replace node_modules imports with direct path to circomlib
    content = content.replace(/include "\.\.\/\.\.\/node_modules\/circomlib\/circuits\//g, 
                              'include "/app/circomlib/circuits/');
    
    fs.writeFileSync(circuitPath, content);
    console.log(`Fixed imports in ${circuitName}.circom`);
  }
});

// Process each circuit
CIRCUIT_DIRS.forEach(circuitName => {
  const circuitDir = path.join(__dirname, circuitName);
  const circuitPath = path.join(circuitDir, `${circuitName}.circom`);
  
  if (!fs.existsSync(circuitPath)) {
    console.error(`Circuit file not found: ${circuitPath}`);
    return;
  }
  
  console.log(`Compiling circuit: ${circuitName}`);
  
  try {
    // Step 1: Compile the circuit to generate R1CS and WASM files
    console.log('Generating R1CS and WASM...');
    execSync(`circom ${circuitPath} --r1cs --wasm --sym --output ${circuitDir}`, { stdio: 'inherit' });
    
    // Step 2: Generate the zKey file
    const zKeyPath = path.join(circuitDir, `${circuitName}_0000.zkey`);
    console.log('Generating initial zKey...');
    execSync(`snarkjs zkey new ${path.join(circuitDir, `${circuitName}.r1cs`)} ${PTAU_FILE} ${zKeyPath}`, { stdio: 'inherit' });
    
    // Step 3: Contribute to the zKey ceremony (in a real system, this would involve multiple contributors)
    const contributedZKeyPath = path.join(circuitDir, `${circuitName}_0001.zkey`);
    console.log('Contributing to zKey ceremony...');
    execSync(`snarkjs zkey contribute ${zKeyPath} ${contributedZKeyPath} -n="First contribution" -e="random entropy"`, { stdio: 'inherit' });
    
    // Step 4: Finalize the zKey
    const finalZKeyPath = path.join(circuitDir, `${circuitName}_final.zkey`);
    console.log('Finalizing zKey...');
    execSync(`snarkjs zkey beacon ${contributedZKeyPath} ${finalZKeyPath} 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Final Beacon phase2"`, { stdio: 'inherit' });
    
    // Step 5: Export the verification key
    const verificationKeyPath = path.join(circuitDir, 'verification_key.json');
    console.log('Exporting verification key...');
    execSync(`snarkjs zkey export verificationkey ${finalZKeyPath} ${verificationKeyPath}`, { stdio: 'inherit' });
    
    // Optional: Generate Solidity verifier (if you're using Ethereum)
    const solidityVerifierPath = path.join(circuitDir, `${circuitName}_verifier.sol`);
    console.log('Generating Solidity verifier...');
    execSync(`snarkjs zkey export solidityverifier ${finalZKeyPath} ${solidityVerifierPath}`, { stdio: 'inherit' });
    
    console.log(`Circuit ${circuitName} compiled successfully!`);
  } catch (error) {
    console.error(`Error compiling circuit ${circuitName}:`, error.message);
  }
});

console.log('All circuits compiled!'); 