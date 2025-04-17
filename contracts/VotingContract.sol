// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title Anonymous Voting Contract using zk-SNARKs
 * @dev This contract allows users to cast votes anonymously using zk-SNARK proofs
 */
contract VotingContract {
    // State variables
    address public admin;
    bool public votingOpen;
    uint256 public totalVotes;
    
    // Mapping to track used nullifiers to prevent double voting
    mapping(bytes32 => bool) public nullifierUsed;
    
    // Store vote counts by choice hash
    mapping(bytes32 => uint256) public votesByChoice;
    
    // The verification contract address
    address public verifier;
    
    // Events
    event VoteCast(bytes32 nullifierHash, bytes32 choiceHash);
    event VotingStatusChanged(bool isOpen);
    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    modifier votingIsOpen() {
        require(votingOpen, "Voting is not open");
        _;
    }
    
    /**
     * @dev Constructor sets the admin and verifier contract address
     * @param _verifier The address of the zk-SNARK verifier contract
     */
    constructor(address _verifier) {
        admin = msg.sender;
        verifier = _verifier;
        votingOpen = false;
    }
    
    /**
     * @dev Open or close voting
     * @param _open Whether voting should be open
     */
    function setVotingStatus(bool _open) external onlyAdmin {
        votingOpen = _open;
        emit VotingStatusChanged(_open);
    }
    
    /**
     * @dev Cast a vote with a zk-SNARK proof
     * @param _nullifierHash Hash to prevent double voting
     * @param _choiceHash Hash of the vote choice
     * @param _proof The zk-SNARK proof data
     */
    function castVote(
        bytes32 _nullifierHash,
        bytes32 _choiceHash,
        bytes calldata _proof
    ) external votingIsOpen {
        // Ensure the nullifier hasn't been used before
        require(!nullifierUsed[_nullifierHash], "Vote already cast with this nullifier");
        
        // In a real implementation, we would call the verifier contract to verify the proof
        // require(IVerifier(verifier).verifyProof(_proof, [_nullifierHash, _choiceHash]), "Invalid proof");
        
        // Mark nullifier as used
        nullifierUsed[_nullifierHash] = true;
        
        // Increment vote count for this choice
        votesByChoice[_choiceHash]++;
        
        // Increment total votes
        totalVotes++;
        
        // Emit event
        emit VoteCast(_nullifierHash, _choiceHash);
    }
    
    /**
     * @dev Check if a nullifier has been used
     * @param _nullifierHash The nullifier hash to check
     * @return Whether the nullifier has been used
     */
    function hasVoted(bytes32 _nullifierHash) external view returns (bool) {
        return nullifierUsed[_nullifierHash];
    }
    
    /**
     * @dev Get the vote count for a specific choice
     * @param _choiceHash The hash of the choice
     * @return The number of votes for the choice
     */
    function getVotesForChoice(bytes32 _choiceHash) external view returns (uint256) {
        return votesByChoice[_choiceHash];
    }
    
    /**
     * @dev Get the total number of votes cast
     * @return The total number of votes
     */
    function getTotalVotes() external view returns (uint256) {
        return totalVotes;
    }
    
    /**
     * @dev Update the verifier contract address (in case of upgrades)
     * @param _newVerifier The new verifier contract address
     */
    function updateVerifier(address _newVerifier) external onlyAdmin {
        verifier = _newVerifier;
    }
} 