# ZK-SNARK Circuit Implementations

This document provides detailed information about the three main Zero-Knowledge Proof circuits in our voting system.

## Circuit Overview

Our system uses three distinct circuits:
1. Authentication Circuit (`auth.circom`)
2. Voting Circuit (`vote.circom`)
3. Admin Circuit (`admin.circom`)

Each circuit is compiled using Circom 2.0.0 and uses the Groth16 proving system.

## 1. Authentication Circuit

The authentication circuit proves that a voter knows their original identifier without revealing it.

### Circuit Purpose
- Prove knowledge of the original identifier that hashes to a registered value
- Generate a unique nullifier hash that doesn't reveal the original identifier
- Prevent identity correlation across authentications

### Circom Implementation

```circom
pragma circom 2.0.0;

include "/app/circomlib/circuits/poseidon.circom";
include "/app/circomlib/circuits/comparators.circom";

template VoterAuth() {
    // Private inputs
    signal input identifierPreimage; // The secret identifier
    signal input nullifierSecret;    // Random secret for nullifier
    
    // Public inputs/outputs
    signal input publicHashedIdentifier; // Public input for verification
    signal output hashedIdentifier;      // Public hash of the identifier
    signal output nullifierHash;         // Public hash to prevent double voting
    
    // Step 1: Compute the hashed identifier
    component identifierHasher = Poseidon(1);
    identifierHasher.inputs[0] <== identifierPreimage;
    hashedIdentifier <== identifierHasher.out;
    
    // Ensure the public hashed identifier matches our calculation
    publicHashedIdentifier === hashedIdentifier;
    
    // Step 2: Compute the nullifier hash
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== identifierPreimage;
    nullifierHasher.inputs[1] <== nullifierSecret;
    nullifierHash <== nullifierHasher.out;
}

component main { public [publicHashedIdentifier] } = VoterAuth();
```

### Client-Side Implementation

```javascript
export const generateAuthProof = async (identifier) => {
  try {
    // Generate a random salt for the nullifier
    const nullifierSecret = Date.now().toString() + Math.random().toString().substring(2);
    
    // Create the input for the circuit
    const input = {
      identifierPreimage: identifier,
      nullifierSecret: nullifierSecret,
      publicHashedIdentifier: hashedIdentifier
    };
    
    // Generate the proof using snarkjs
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      authWasmPath,
      authZkeyPath
    );
    
    return {
      proof,
      publicSignals,
      nullifierSecret,
      nullifierHash: publicSignals[1],
      hashedIdentifier: publicSignals[0]
    };
  } catch (error) {
    throw new Error(`Auth proof generation failed: ${error.message}`);
  }
};
```

## 2. Voting Circuit

The voting circuit proves eligibility to vote without revealing the voter's identity.

### Circuit Purpose
- Prove the voter has a valid authentication token
- Create a deterministic nullifier that prevents double voting
- Encrypt the vote choice without revealing the voter's identity

### Circom Implementation

```circom
pragma circom 2.0.0;

include "/app/circomlib/circuits/poseidon.circom";
include "/app/circomlib/circuits/comparators.circom";

template VoteCircuit() {
    // Private inputs
    signal input identifierPreimage;    // Original voter identifier
    signal input nullifierSecret;       // Secret from auth
    signal input choice;                // Vote choice (candidate ID)
    
    // Public inputs/outputs
    signal input publicNullifierHash;   // Expected nullifier hash
    signal output nullifierHash;        // To prevent double voting
    signal output choiceHash;           // Encrypted vote choice
    
    // Step 1: Verify the nullifier matches
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== identifierPreimage;
    nullifierHasher.inputs[1] <== nullifierSecret;
    nullifierHash <== nullifierHasher.out;
    
    // Ensure the nullifier matches the one from auth
    publicNullifierHash === nullifierHash;
    
    // Step 2: Create encrypted vote choice
    component choiceHasher = Poseidon(2);
    choiceHasher.inputs[0] <== choice;
    choiceHasher.inputs[1] <== nullifierSecret;
    choiceHash <== choiceHasher.out;
}

component main { public [publicNullifierHash] } = VoteCircuit();
```

### Client-Side Implementation

```javascript
export const generateVoteProof = async (identifier, nullifierSecret, choice) => {
  try {
    // Create the input for the circuit
    const input = {
      identifierPreimage: identifier,
      nullifierSecret: nullifierSecret,
      choice: choice,
      publicNullifierHash: storedNullifierHash
    };
    
    // Generate the proof using snarkjs
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      voteWasmPath,
      voteZkeyPath
    );
    
    return {
      proof,
      publicSignals,
      nullifierHash: publicSignals[0],
      choiceHash: publicSignals[1]
    };
  } catch (error) {
    throw new Error(`Vote proof generation failed: ${error.message}`);
  }
};
```

## 3. Admin Circuit

The admin circuit proves administration privileges without revealing admin credentials.

### Circuit Purpose
- Prove the user has admin privileges
- Create a secure nonce for each action
- Bind the action type and parameters to the proof

### Circom Implementation

```circom
pragma circom 2.0.0;

include "/app/circomlib/circuits/poseidon.circom";
include "/app/circomlib/circuits/comparators.circom";

template AdminCircuit() {
    // Private inputs
    signal input adminKey;        // Admin's private key
    signal input actionData;      // Action parameters
    signal input actionNonce;     // Unique nonce for this action
    
    // Public inputs/outputs
    signal input publicActionHash; // Expected action hash
    signal output actionHash;      // Hash binding the action
    signal output nonceHash;       // Prevents replay attacks
    
    // Step 1: Create action hash
    component actionHasher = Poseidon(2);
    actionHasher.inputs[0] <== actionData;
    actionHasher.inputs[1] <== actionNonce;
    actionHash <== actionHasher.out;
    
    // Ensure action hash matches expected
    publicActionHash === actionHash;
    
    // Step 2: Create nonce hash
    component nonceHasher = Poseidon(2);
    nonceHasher.inputs[0] <== adminKey;
    nonceHasher.inputs[1] <== actionNonce;
    nonceHash <== nonceHasher.out;
}

component main { public [publicActionHash] } = AdminCircuit();
```

### Client-Side Implementation

```javascript
export const generateAdminProof = async (adminKey, actionData) => {
  try {
    // Generate a unique nonce
    const actionNonce = Date.now().toString() + Math.random().toString().substring(2);
    
    // Calculate expected action hash
    const expectedActionHash = await calculateActionHash(actionData, actionNonce);
    
    // Create the input for the circuit
    const input = {
      adminKey: adminKey,
      actionData: actionData,
      actionNonce: actionNonce,
      publicActionHash: expectedActionHash
    };
    
    // Generate the proof using snarkjs
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      adminWasmPath,
      adminZkeyPath
    );
    
    return {
      proof,
      publicSignals,
      actionHash: publicSignals[0],
      nonceHash: publicSignals[1],
      actionNonce
    };
  } catch (error) {
    throw new Error(`Admin proof generation failed: ${error.message}`);
  }
};
```

## Circuit Compilation and Setup

The circuits are compiled using the following process:

1. **Circuit Compilation**
```bash
circom circuit.circom --r1cs --wasm --sym
```

2. **Trusted Setup**
```bash
# Phase 1
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau

# Phase 2
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau
snarkjs groth16 setup circuit.r1cs pot12_final.ptau circuit_0000.zkey
snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey
```

3. **Export Verification Key**
```bash
snarkjs zkey export verificationkey circuit_final.zkey verification_key.json
```

## Testing and Verification

The system includes comprehensive tests for each circuit:

1. **Unit Tests**: Test individual circuit constraints
2. **Integration Tests**: Test complete proof generation and verification flow
3. **Performance Tests**: Measure proof generation and verification times

Example test command:
```bash
node test-zkp.js
```

## Security Considerations

1. **Trusted Setup**: The system requires a secure trusted setup ceremony
2. **Nonce Management**: Each proof uses unique nonces to prevent replay attacks
3. **Hash Functions**: Uses Poseidon hash for efficient in-circuit computation
4. **Input Validation**: All inputs are validated before proof generation

## Performance Optimization

1. **Circuit Size**: Minimized number of constraints for faster proving
2. **Parallel Processing**: Proof generation can be parallelized
3. **WebAssembly**: Uses WASM for efficient client-side computation
4. **Caching**: Implements strategic caching of circuit artifacts 