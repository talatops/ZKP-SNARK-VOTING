# ZK-SNARK Circuit Implementations

This document provides detailed information about the three main Zero-Knowledge Proof circuits in our voting system.

## 1. Authentication Circuit

The authentication circuit proves that a voter knows their original identifier without revealing it.

### Circuit Purpose
- Prove knowledge of the original identifier that hashes to a registered value
- Generate a unique nullifier hash that doesn't reveal the original identifier
- Prevent identity correlation across authentications

### Circom Implementation Example

```circom
pragma circom 2.0.0;

include "circomlib/poseidon.circom";
include "circomlib/bitify.circom";

template AuthCircuit() {
    // Private inputs (not revealed)
    signal input identifier; // The voter's original ID
    signal input salt;       // Random salt for nullifier

    // Public inputs (revealed in the proof)
    signal output hashedIdentifier; // The hash of the ID that's registered
    signal output nullifierHash;    // Unique identifier for this voter

    // Hash the identifier to match against registered hashes
    component identifierHasher = Poseidon(1);
    identifierHasher.inputs[0] <== identifier;
    hashedIdentifier <== identifierHasher.out;

    // Create nullifier hash (unique per auth but linkable to user)
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== identifier;
    nullifierHasher.inputs[1] <== salt;
    nullifierHash <== nullifierHasher.out;
}

component main {public [hashedIdentifier]} = AuthCircuit();
```

### Current Client-Side Implementation
```javascript
export const generateAuthProof = async (identifier) => {
  // Create a secure hash of the identifier
  const identifierHash = await hashString(identifier);
  
  // Create a salt for the nullifier
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = bufferToHex(salt);
  
  // Create nullifier hash using both identifier and salt
  const nullifierInput = identifier + saltHex;
  const nullifierHash = await hashString(nullifierInput);
  
  // Generate proof components
  const proof = {
    pi_a: Array.from(crypto.getRandomValues(new Uint8Array(3))).map(x => x.toString(16)).join(''),
    pi_b: [
      Array.from(crypto.getRandomValues(new Uint8Array(2))).map(x => x.toString(16)).join(''),
      Array.from(crypto.getRandomValues(new Uint8Array(2))).map(x => x.toString(16)).join('')
    ],
    pi_c: Array.from(crypto.getRandomValues(new Uint8Array(2))).map(x => x.toString(16)).join(''),
    protocol: "groth16",
    curve: "bn128"
  };
  
  return {
    proof,
    publicSignals: {
      hashedIdentifier: identifierHash,
      nullifierHash: nullifierHash
    }
  };
};
```

## 2. Voting Circuit

The voting circuit proves eligibility to vote without revealing the voter's identity.

### Circuit Purpose
- Prove the voter has a valid authentication token
- Create a deterministic nullifier that prevents double voting
- Encrypt the vote choice without revealing the voter's identity

### Circom Implementation Example

```circom
pragma circom 2.0.0;

include "circomlib/poseidon.circom";
include "circomlib/bitify.circom";

template VoteCircuit() {
    // Private inputs (not revealed)
    signal input nullifier;        // From auth token
    signal input voteChoice;       // Candidate ID (kept private)
    signal input voterSecret;      // Secret from auth

    // Public inputs (revealed in the proof)
    signal output nullifierHash;   // To prevent double voting
    signal output voteCommitment;  // Encrypted vote

    // Create deterministic nullifier hash for this voter
    component nullifierHasher = Poseidon(1);
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHash <== nullifierHasher.out;

    // Create vote commitment (hides the actual vote)
    component voteHasher = Poseidon(2);
    voteHasher.inputs[0] <== voteChoice;
    voteHasher.inputs[1] <== voterSecret;
    voteCommitment <== voteHasher.out;
}

component main {public [nullifierHash, voteCommitment]} = VoteCircuit();
```

### Current Client-Side Implementation
```javascript
export const generateVoteProof = async (nullifierFromToken, candidateId) => {
  if (!nullifierFromToken) {
    throw new Error("Authentication required before voting");
  }
  
  // Create a deterministic nullifier hash to prevent double voting
  const nullifierHash = await hashString(nullifierFromToken);
  
  // Create hash of the vote choice
  const choiceHash = await hashString(candidateId.toString());
  
  // Generate proof components
  const proof = {
    pi_a: Array.from(crypto.getRandomValues(new Uint8Array(3))).map(x => x.toString(16)).join(''),
    pi_b: [
      Array.from(crypto.getRandomValues(new Uint8Array(2))).map(x => x.toString(16)).join(''),
      Array.from(crypto.getRandomValues(new Uint8Array(2))).map(x => x.toString(16)).join('')
    ],
    pi_c: Array.from(crypto.getRandomValues(new Uint8Array(2))).map(x => x.toString(16)).join(''),
    protocol: "groth16",
    curve: "bn128"
  };
  
  return {
    proof,
    publicSignals: {
      nullifierHash: nullifierHash,
      voteCommitment: choiceHash
    },
    voteData: {
      candidateId: candidateId
    }
  };
};
```

## 3. Admin Action Circuit

The admin action circuit proves administration privileges without revealing admin credentials.

### Circuit Purpose
- Prove the user has admin privileges
- Create a secure nonce for each action
- Bind the action type and parameters to the proof

### Circom Implementation Example

```circom
pragma circom 2.0.0;

include "circomlib/poseidon.circom";
include "circomlib/bitify.circom";

template AdminActionCircuit() {
    // Private inputs (not revealed)
    signal input adminKey;         // Admin's private key
    signal input actionType;       // Type of admin action
    signal input actionParams;     // Parameters hash
    signal input nonce;            // Unique nonce for this action

    // Public inputs (revealed in the proof)
    signal output adminKeyHash;    // Hash of admin key for verification
    signal output actionHash;      // Hash binding the action to this proof
    signal output nonceHash;       // Prevents replay attacks

    // Verify admin identity
    component keyHasher = Poseidon(1);
    keyHasher.inputs[0] <== adminKey;
    adminKeyHash <== keyHasher.out;

    // Bind action details to proof
    component actionHasher = Poseidon(2);
    actionHasher.inputs[0] <== actionType;
    actionHasher.inputs[1] <== actionParams;
    actionHash <== actionHasher.out;

    // Create nonce hash to prevent replay
    component nonceHasher = Poseidon(2);
    nonceHasher.inputs[0] <== adminKey;
    nonceHasher.inputs[1] <== nonce;
    nonceHash <== nonceHasher.out;
}

component main {public [adminKeyHash, actionHash, nonceHash]} = AdminActionCircuit();
```

### Current Client-Side Implementation
```javascript
export const generateAdminActionProof = async (adminKey, actionType, actionData) => {
  if (!adminKey) {
    throw new Error("Admin authentication required");
  }
  
  // Create nonce for this specific action
  const nonce = Date.now().toString() + Math.random().toString().substring(2);
  const nonceHash = await hashString(nonce);
  
  // Hash the action data
  const actionDataStr = typeof actionData === 'object' ? JSON.stringify(actionData) : String(actionData);
  const actionHash = await hashString(actionType + actionDataStr);
  
  // Generate proof components
  const proof = {
    pi_a: Array.from(crypto.getRandomValues(new Uint8Array(3))).map(x => x.toString(16)).join(''),
    pi_b: [
      Array.from(crypto.getRandomValues(new Uint8Array(2))).map(x => x.toString(16)).join(''),
      Array.from(crypto.getRandomValues(new Uint8Array(2))).map(x => x.toString(16)).join('')
    ],
    pi_c: Array.from(crypto.getRandomValues(new Uint8Array(2))).map(x => x.toString(16)).join(''),
    protocol: "groth16",
    curve: "bn128"
  };
  
  return {
    proof,
    publicSignals: {
      adminKeyHash: await hashString(adminKey),
      actionHash: actionHash,
      nonceHash: nonceHash
    },
    actionData: {
      type: actionType,
      data: actionData,
      nonce: nonce
    }
  };
};
```

## Server-Side Verification

On the server side, each proof is verified using a corresponding verification key. The verification process ensures:

1. The proof is valid and was generated using the correct circuit
2. The public signals match the expected values
3. The nullifier (for voting) hasn't been used before
4. The admin key hash (for admin actions) matches a registered admin

### Example Verification Pseudo-Code

```javascript
function verifyProof(proofData, publicSignals, verificationKey) {
  // Use snarkjs or a similar library to verify the proof
  const isValid = snarkjs.groth16.verify(
    verificationKey,
    publicSignals,
    proofData.proof
  );
  
  return isValid;
}

// For voting: also check if the nullifier has been used before
async function verifyVote(proofData) {
  const isValidProof = verifyProof(
    proofData,
    proofData.publicSignals,
    voteVerificationKey
  );
  
  if (!isValidProof) {
    return { success: false, message: "Invalid proof" };
  }
  
  // Check if nullifier has voted before
  const hasVoted = await checkNullifierUsed(proofData.publicSignals.nullifierHash);
  
  if (hasVoted) {
    return { success: false, message: "Already voted" };
  }
  
  // Mark nullifier as used and record the vote
  await recordVote(
    proofData.publicSignals.nullifierHash,
    proofData.voteData.candidateId
  );
  
  return { success: true, message: "Vote recorded successfully" };
}
```

## Future Enhancements

1. **Full Circuit Implementation**: Replace simulated proofs with real ZK-SNARK proof generation using circuits compiled with Circom and proof generation with SnarkJS.

2. **On-chain Verification**: Move verification to Ethereum smart contracts for trustless verification.

3. **Multi-party Computation**: Add secure MPC for vote tallying to further enhance privacy.

4. **Custom Circuits**: Develop specialized circuits for different voting schemes like ranked-choice or quadratic voting.

5. **Front-end Integration**: Add WebAssembly-based proof generation for better performance. 