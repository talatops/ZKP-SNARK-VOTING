# ZKP-SNARK Voting System Demo Guide

## Demo Overview

This guide provides a step-by-step approach to demonstrating the Zero-Knowledge Proof SNARK voting system. The presentation covers the circuit architecture, compilation process, and practical application in a secure, privacy-preserving voting system.

## Prerequisites

Ensure these components are running before starting the demo:
- Docker containers (`docker-compose ps` should show all containers running)
- Compiled ZK circuits (verify with `test-zkp-actual.js`)

## 1. Introduction to ZKP-SNARK Voting System

**Begin with a high-level overview:**

"This system uses Zero-Knowledge Proofs to ensure three crucial properties in voting systems:
- **Privacy**: Voters' choices cannot be linked to their identity
- **Verifiability**: The system can prove votes are correctly counted
- **Integrity**: No one can vote twice or tamper with votes"

## 2. System Architecture

**Explain the major components:**

"The system consists of three specialized ZK circuits:
1. **Admin Circuit**: Manages administrative actions securely
2. **Auth Circuit**: Handles voter authentication without compromising privacy
3. **Vote Circuit**: Enables anonymous voting while preventing double-voting"

## 3. Exploring the Circuit Definitions

### Show the Admin Circuit

```bash
# Display admin circuit code
docker-compose exec backend bash -c "cat /app/circuits/admin/admin.circom"
```

**Key points to highlight:**
- Private input `adminKey`: Secret known only to admins
- Public input `publicActionHash`: Verification parameter
- Output `actionHash`: Hash of the admin action
- Poseidon hash functions for cryptographic operations
- The constraint `publicActionHash === actionHash` ensures correctness

### Show the Auth Circuit

```bash
# Display auth circuit code
docker-compose exec backend bash -c "cat /app/circuits/auth/auth.circom"
```

**Key points to highlight:**
- Private input `identifierPreimage`: Secret voter identifier
- Public input `publicHashedIdentifier`: For verification
- Outputs `hashedIdentifier` and `nullifierHash`
- Nullifier hash prevents double voting

### Show the Vote Circuit

```bash
# Display vote circuit code
docker-compose exec backend bash -c "cat /app/circuits/vote/vote.circom"
```

**Key points to highlight:**
- Private inputs: `identifierPreimage`, `nullifierSecret`, `choice`
- Public inputs: `publicNullifierHash`, `publicChoiceHash`
- The nullifier links to authentication while preserving anonymity
- Choice hash records the vote without revealing the actual choice

## 4. Circuit Compilation Process

**Explain the transformation from circuit code to ZK artifacts:**

```bash
# Run this to show the compilation script
docker-compose exec backend bash -c "cat /app/circuits/compile-circuits.js"
```

**Walk through the key steps:**
1. Circuit code (`.circom`) is written with constraints
2. Circom compiler converts it to R1CS (mathematical representation)
3. WASM files are generated for witness calculation
4. zKey files are created for proof generation and verification

**Show the compiled artifacts:**

```bash
# Verify circuit artifacts exist
docker-compose exec backend bash -c "node /app/test-zkp-actual.js"
```

## 5. Demonstrating Proof Generation and Verification

**Explain the flow with actual code examples:**

```bash
# Show the test script with actual values
docker-compose exec backend bash -c "cat /app/test-zkp.js"
```

**Key points to demonstrate:**

1. **Input preparation**:
   - Private inputs (kept secret): admin keys, voter identifiers, choices
   - Public inputs (verified by the system): hashes and verification parameters

2. **Proof generation**:
   - WASM files generate a "witness" (solution to the circuit constraints)
   - zKey files are used with the witness to create a compact proof

3. **Verification**:
   - Verification keys check if proofs are valid without seeing private inputs

## 6. Real-world Flow Demonstration

**Walk through these end-to-end scenarios:**

### Admin Flow

1. Admin has a secret key (e.g., `123456789`)
2. Admin wants to add a candidate (action data: `987654321`)
3. System uses admin circuit to verify authority without seeing the key
4. If verified, the candidate is added to the system

### Voter Registration Flow

1. Voter registers with identity details
2. System assigns a secret identifier preimage (e.g., `12345678`)
3. Voter stores this identifier securely
4. Auth circuit registers voter with hashed identifier

### Voting Flow

1. Voter authenticates using their secret identifier
2. Nullifier hash prevents double voting
3. Voter selects a candidate (e.g., candidate ID `42`)
4. Vote circuit creates a proof linking the vote to a valid registration
5. System records anonymous vote with no link to the voter's identity

## 7. Security Analysis

**Highlight these security properties:**

1. **Zero-Knowledge**: System never learns private inputs
   - Admin keys remain secret while proving authority
   - Voter identifiers are never exposed
   - Votes cannot be linked to voters

2. **Cryptographic Guarantees**:
   - Soundness: Invalid proofs are mathematically impossible
   - Completeness: Valid inputs always generate valid proofs
   - Witness indistinguishability: Multiple valid inputs create indistinguishable proofs

## 8. Technical Performance

**If time permits, mention these practical aspects:**

```bash
# Show file sizes to illustrate practical performance
docker-compose exec backend bash -c "ls -lh /app/circuits/admin/admin_js/admin.wasm /app/circuits/admin/admin_final.zkey /app/circuits/admin/verification_key.json"
```

- WASM file sizes (~2MB): Shows computational requirements
- zKey size: Illustrates proving complexity
- Verification key size: Small for efficient verification
- Proof generation time: Practical for user-facing applications
- Verification time: Fast enough for real-time verification

## 9. Live Demo (Optional)

If you've implemented frontend components:

```bash
# Access the frontend
echo "Open http://localhost:3001 in your browser"
```

Demonstrate:
1. Admin login and candidate management
2. Voter registration
3. Casting votes anonymously
4. Viewing election results while preserving privacy

## 10. Conclusion

**Summarize the key innovations:**

1. Privacy and verifiability achieved simultaneously
2. No trusted parties required for correctness
3. Mathematical guarantees instead of policy-based security
4. Scalable approach for real-world voting systems

## Troubleshooting During Demo

If issues occur:

```bash
# Check if containers are running
docker-compose ps

# View backend logs
docker-compose logs backend

# Restart backend if needed
docker-compose restart backend

# Verify circuit files
docker-compose exec backend bash -c "ls -la /app/circuits/*/verification_key.json"
```

## Q&A Preparation

Be prepared to answer these common questions:
- "How does this compare to blockchain voting?"
- "What prevents a malicious admin from creating fake votes?"
- "How do we know the circuits themselves are correct?"
- "What's the performance impact on large-scale elections?"
- "How would this integrate with existing identity systems?" 