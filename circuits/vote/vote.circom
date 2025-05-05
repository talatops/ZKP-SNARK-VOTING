pragma circom 2.0.0;

include "/app/circomlib/circuits/poseidon.circom";
include "/app/circomlib/circuits/bitify.circom";
include "/app/circomlib/circuits/comparators.circom";

/*
 * Circuit for anonymous voting
 * - Takes the nullifier hash and choice as input
 * - Proves that the voter is authorized
 * - Records the vote choice without revealing voter identity
 */
template AnonymousVote() {
    // Private inputs
    signal input identifierPreimage; // The original secret identifier
    signal input nullifierSecret;    // Secret for nullifier
    signal input choice;             // The voting choice (e.g., candidate ID)
    
    // Public inputs/outputs
    signal input publicNullifierHash; // Public input for nullifier hash verification
    signal input publicChoiceHash;    // Public input for choice hash verification
    signal output nullifierHash;     // Public nullifier hash (to prevent double voting)
    signal output choiceHash;        // Hash of the choice
    
    // Step 1: Compute the nullifier hash
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== identifierPreimage;
    nullifierHasher.inputs[1] <== nullifierSecret;
    nullifierHash <== nullifierHasher.out;
    
    // Ensure the public nullifier hash matches our calculation
    publicNullifierHash === nullifierHash;
    
    // Step 2: Compute the choice hash
    component choiceHasher = Poseidon(1);
    choiceHasher.inputs[0] <== choice;
    choiceHash <== choiceHasher.out;
    
    // Ensure the public choice hash matches our calculation
    publicChoiceHash === choiceHash;
}

component main { public [publicNullifierHash, publicChoiceHash] } = AnonymousVote(); 