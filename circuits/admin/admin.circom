pragma circom 2.0.0;

include "/app/circomlib/circuits/poseidon.circom";
include "/app/circomlib/circuits/comparators.circom";

/*
 * Circuit for admin actions (candidate management)
 * - Takes admin credentials as private input
 * - Outputs admin action hash and admin proof
 * - Prevents non-admin users from managing candidates
 */
template AdminAction() {
    // Private inputs
    signal input adminKey;        // The admin secret key, only known to admins
    signal input actionData;      // Data about the action (add/modify/remove candidate)
    signal input actionNonce;     // Random nonce to prevent replay attacks
    
    // Public inputs/outputs
    signal output adminProof;     // Public proof of admin authority
    signal input publicActionHash; // This will be the public input that matches actionHash
    signal output actionHash;     // Public hash of the action data
    
    // Step 1: Compute the admin proof
    component adminProver = Poseidon(1);
    adminProver.inputs[0] <== adminKey;
    adminProof <== adminProver.out;
    
    // Step 2: Compute the action hash
    // The action hash combines the action data with a nonce
    component actionHasher = Poseidon(3);
    actionHasher.inputs[0] <== adminKey;
    actionHasher.inputs[1] <== actionData;
    actionHasher.inputs[2] <== actionNonce;
    actionHash <== actionHasher.out;
    
    // Ensure the public action hash matches our calculated hash
    publicActionHash === actionHash;
}

component main { public [publicActionHash] } = AdminAction(); 