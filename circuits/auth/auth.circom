pragma circom 2.0.0;

include "/app/circomlib/circuits/poseidon.circom";
include "/app/circomlib/circuits/comparators.circom";

/*
 * Circuit for voter authentication
 * - Takes a secret preimage (identifier) as private input
 * - Outputs the hashed identifier and a nullifier hash
 * - The nullifier hash prevents double voting
 */
template VoterAuth() {
    // Private inputs
    signal input identifierPreimage; // The secret identifier, only known to the voter
    signal input nullifierSecret;    // Random secret for nullifier, chosen by voter
    
    // Public inputs/outputs
    signal input publicHashedIdentifier; // Public input for verification
    signal output hashedIdentifier;  // Public hash of the identifier
    signal output nullifierHash;     // Public hash to prevent double voting
    
    // Step 1: Compute the hashed identifier
    component identifierHasher = Poseidon(1);
    identifierHasher.inputs[0] <== identifierPreimage;
    hashedIdentifier <== identifierHasher.out;
    
    // Ensure the public hashed identifier matches our calculation
    publicHashedIdentifier === hashedIdentifier;
    
    // Step 2: Compute the nullifier hash
    // The nullifier combines the identifier with a secret to prevent linking
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== identifierPreimage;
    nullifierHasher.inputs[1] <== nullifierSecret;
    nullifierHash <== nullifierHasher.out;
}

component main { public [publicHashedIdentifier] } = VoterAuth(); 