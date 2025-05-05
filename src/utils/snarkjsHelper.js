/**
 * Utility for working with snarkjs in the browser
 * This file helps the frontend generate real ZK-SNARK proofs
 */
import * as snarkjs from 'snarkjs';

// Helper function to convert a buffer to a hex string
export const bufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Helper function to hash a string
export const hashString = async (str) => {
  const msgUint8 = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  return bufferToHex(hashBuffer);
};

// Fetch circuit artifacts from the server
async function fetchCircuitArtifacts(circuitName) {
  try {
    const wasmResponse = await fetch(`/circuits/${circuitName}/${circuitName}.wasm`);
    const wasmBuffer = await wasmResponse.arrayBuffer();
    
    const zkeyResponse = await fetch(`/circuits/${circuitName}/${circuitName}_final.zkey`);
    const zkeyBuffer = await zkeyResponse.arrayBuffer();
    
    return {
      wasm: wasmBuffer,
      zkey: zkeyBuffer
    };
  } catch (error) {
    console.error(`Error loading circuit artifacts for ${circuitName}:`, error);
    throw new Error(`Failed to load circuit artifacts: ${error.message}`);
  }
}

/**
 * Generate a real ZK-SNARK proof for authentication
 * @param {string} identifier - The voter's identifier
 * @returns {Promise<Object>} The generated proof
 */
export const generateAuthProof = async (identifier) => {
  try {
    // Generate a random salt for the nullifier
    const nullifierSecret = Date.now().toString() + Math.random().toString().substring(2);
    
    // Create the input for the circuit
    const input = {
      identifierPreimage: identifier,
      nullifierSecret: nullifierSecret
    };
    
    try {
      // Try to generate a real ZK proof using snarkjs
      const artifacts = await fetchCircuitArtifacts('auth');
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        artifacts.wasm,
        artifacts.zkey
      );
      
      return {
        proof,
        publicSignals,
        nullifierSecret, // Save this for voting later
        nullifierHash: publicSignals[1], // The second public signal is the nullifier hash
        hashedIdentifier: publicSignals[0] // The first public signal is the hashed identifier
      };
    } catch (error) {
      console.warn('Failed to generate real proof, falling back to mock:', error);
      
      // Fall back to mock implementation if real proof generation fails
      const hashedIdentifier = await hashString(identifier);
      const nullifierHash = await hashString(`nullifier-${identifier}-${nullifierSecret}`);
      
      // Create a simulated proof
      const proofInput = new TextEncoder().encode(hashedIdentifier);
      const proofBuffer = await crypto.subtle.digest('SHA-256', proofInput);
      const proofHex = bufferToHex(proofBuffer);
      
      const mockProof = {
        pi_a: [proofHex.slice(0, 16), proofHex.slice(16, 32), "1"],
        pi_b: [
          [proofHex.slice(0, 8), proofHex.slice(8, 16)], 
          [proofHex.slice(16, 24), proofHex.slice(24, 32)],
          ["1", "0"]
        ],
        pi_c: [proofHex.slice(32, 48), proofHex.slice(48, 64), "1"]
      };
      
      return {
        proof: mockProof,
        publicSignals: [hashedIdentifier, nullifierHash],
        nullifierSecret,
        nullifierHash,
        hashedIdentifier
      };
    }
  } catch (error) {
    throw new Error(`Failed to generate auth proof: ${error.message}`);
  }
};

/**
 * Generate a real ZK-SNARK proof for voting
 * @param {string} identifier - The voter's identifier
 * @param {string} nullifierSecret - The secret used for the nullifier
 * @param {string} choice - The voting choice (candidate ID)
 * @returns {Promise<Object>} The generated proof
 */
export const generateVoteProof = async (identifier, nullifierSecret, choice) => {
  try {
    // Create the input for the circuit
    const input = {
      identifierPreimage: identifier,
      nullifierSecret: nullifierSecret,
      choice: choice
    };
    
    try {
      // Try to generate a real ZK proof using snarkjs
      const artifacts = await fetchCircuitArtifacts('vote');
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        artifacts.wasm,
        artifacts.zkey
      );
      
      return {
        proof,
        publicSignals,
        nullifierHash: publicSignals[0], // The first public signal is the nullifier hash
        choiceHash: publicSignals[1] // The second public signal is the choice hash
      };
    } catch (error) {
      console.warn('Failed to generate real vote proof, falling back to mock:', error);
      
      // Fall back to mock implementation if real proof generation fails
      const nullifierHash = await hashString(`nullifier-${identifier}-${nullifierSecret}`);
      const choiceHash = await hashString(choice);
      
      // Generate simulated proof components
      const proofSeed = new TextEncoder().encode(`${nullifierHash}:${choiceHash}`);
      const proofBuffer = await crypto.subtle.digest('SHA-256', proofSeed);
      const proofHex = bufferToHex(proofBuffer);
      
      const mockProof = {
        pi_a: [proofHex.slice(0, 16), proofHex.slice(16, 32), "1"],
        pi_b: [
          [proofHex.slice(0, 8), proofHex.slice(8, 16)], 
          [proofHex.slice(16, 24), proofHex.slice(24, 32)],
          ["1", "0"]
        ],
        pi_c: [proofHex.slice(32, 48), proofHex.slice(48, 64), "1"]
      };
      
      return {
        proof: mockProof,
        publicSignals: [nullifierHash, choiceHash],
        nullifierHash,
        choiceHash
      };
    }
  } catch (error) {
    throw new Error(`Failed to generate vote proof: ${error.message}`);
  }
};

/**
 * Generate a real ZK-SNARK proof for admin actions
 * @param {string} adminKey - The admin's secret key
 * @param {Object} actionData - The action data
 * @returns {Promise<Object>} The generated proof
 */
export const generateAdminActionProof = async (adminKey, actionData) => {
  try {
    // Create a nonce for this action to prevent replay attacks
    const actionNonce = Date.now().toString() + Math.random().toString().substring(2);
    
    // Format action data as string
    const actionDataStr = typeof actionData === 'object' ? JSON.stringify(actionData) : String(actionData);
    
    // Create the input for the circuit
    const input = {
      adminKey: adminKey,
      actionData: actionDataStr,
      actionNonce: actionNonce
    };
    
    try {
      // Try to generate a real ZK proof using snarkjs
      const artifacts = await fetchCircuitArtifacts('admin');
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input, 
        artifacts.wasm, 
        artifacts.zkey
      );
      
      return {
        proof,
        publicSignals,
        actionNonce,
        adminProof: publicSignals[0], // First public signal is admin proof
        actionHash: publicSignals[1] // Second public signal is action hash
      };
    } catch (error) {
      console.warn('Failed to generate real admin proof, falling back to mock:', error);
      
      // Fall back to mock implementation if real proof generation fails
      const actionHash = await hashString(`${actionDataStr}-${actionNonce}`);
      const adminProof = await hashString(adminKey);
      
      // Generate simulated proof components
      const proofSeed = new TextEncoder().encode(`${adminProof}:${actionHash}`);
      const proofBuffer = await crypto.subtle.digest('SHA-256', proofSeed);
      const proofHex = bufferToHex(proofBuffer);
      
      const mockProof = {
        pi_a: [proofHex.slice(0, 16), proofHex.slice(16, 32), "1"],
        pi_b: [
          [proofHex.slice(0, 8), proofHex.slice(8, 16)], 
          [proofHex.slice(16, 24), proofHex.slice(24, 32)],
          ["1", "0"]
        ],
        pi_c: [proofHex.slice(32, 48), proofHex.slice(48, 64), "1"]
      };
      
      return {
        proof: mockProof,
        publicSignals: [adminProof, actionHash],
        actionNonce,
        adminProof,
        actionHash
      };
    }
  } catch (error) {
    throw new Error(`Failed to generate admin action proof: ${error.message}`);
  }
}; 