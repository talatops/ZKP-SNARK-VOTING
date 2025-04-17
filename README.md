# Anonymous Authentication with zk-SNARKs

This project implements a secure anonymous authentication system using zero-knowledge proofs (zk-SNARKs) for a voting application. The system ensures that voters can authenticate without revealing their identities while maintaining the integrity of the voting process.

## Features

- Anonymous voter authentication using zk-SNARKs
- Secure and private voting interface
- Administrator dashboard for system monitoring and logging
- Blockchain integration for immutable vote recording
- RESTful API with Swagger documentation
- Protection against double voting

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 16+ and npm (if running without Docker)
- MongoDB (if running without Docker)

### Running with Docker (Recommended)

1. Clone the repository
2. Create a `.env` file in the `backend` directory using the provided `.env.example` as a template
3. Build and start the containers:

```bash
docker-compose up --build
```

4. Access the frontend at http://localhost:3000
5. Access the API documentation at http://localhost:5000/api-docs

### Running Without Docker

#### Backend Setup
1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following content:
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/zk-auth-voting
JWT_SECRET=dev-secret-key-change-this-in-production
ADMIN_JWT_SECRET=admin-dev-secret-key-change-this-in-production
ENCRYPTION_KEY=voting-system-encryption-key-32-bytes-dev
ETHEREUM_NETWORK=sepolia
INFURA_KEY=dummy_infura_key_for_dev
ETHEREUM_PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000001
CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
LOG_LEVEL=debug
```

4. Start the backend:
```bash
npm start
```

#### Frontend Setup
1. Navigate to the root directory and install dependencies:
```bash
npm install
```

2. Start the frontend:
```bash
npm start
```

3. Access the frontend at http://localhost:3000

## User Guide

### Voter Authentication Process

1. **Registration**: First time voters need to be registered in the system.
   - Enter your identifier (e.g., "123456789") in the login page
   - The identifier is hashed locally before being sent to the server
   - A zero-knowledge proof is generated to verify you know the identifier

2. **Voting**: After authentication, you'll be directed to the voting dashboard.
   - Select your preferred candidate
   - Your vote is recorded anonymously
   - The system creates a nullifier hash tied to your identifier to prevent double voting
   - No one can determine how you voted, even system administrators

### Admin Access

Administrator access provides monitoring capabilities without compromising voter privacy.

- **Credentials**:
  - Username: `admin` 
  - Password: `adminpassword`

- **Capabilities**:
  - View system logs and voting statistics
  - Monitor system health
  - Track registration and voting activity
  - Cannot see individual voter choices or identities

## Troubleshooting

- **Connection Issues**: If you can't connect to http://localhost:3000, try:
  - Ensure all Docker containers are running with `docker ps`
  - Try using http://127.0.0.1:3000 instead
  - Check if port 3000 is already in use by another application

- **Authentication Failure**: 
  - For voters: Ensure you're using the same identifier you registered with
  - For admin: Verify the admin account was initialized (check MongoDB logs)

- **Database Connection Errors**:
  - Verify MongoDB is running with `docker logs project_mongo_1`
  - Check the backend logs for connection errors

## Project Structure

### Frontend

- `src/`: React frontend source code
  - `components/`: Reusable UI components
  - `pages/`: Main application pages
  - `utils/`: Utility functions and API services

### Backend

- `backend/src/`: Node.js backend source code
  - `controllers/`: API route handlers
  - `models/`: MongoDB data models
  - `routes/`: API route definitions
  - `services/`: Business logic including zk-SNARKs and blockchain services
  - `middleware/`: Express middleware
  - `config/`: Configuration files
  - `utils/`: Utility functions

### Smart Contracts

- `contracts/`: Ethereum smart contracts for vote verification and recording
  - `VotingContract.sol`: Main contract for anonymous voting

### zk-SNARKs Circuits

- `circuits/`: Circom circuits for zero-knowledge proofs
  - `auth/`: Circuit for anonymous authentication
  - `vote/`: Circuit for anonymous voting

## How zk-SNARKs Work in This Project

1. **Authentication**:
   - User provides an identifier (e.g., voter ID)
   - System generates a hash of the identifier
   - zk-SNARKs proof is generated to prove the user knows the preimage of the hash
   - The proof is verified without revealing the original identifier

2. **Voting**:
   - After authentication, the user receives a nullifier hash
   - When casting a vote, a new zk-SNARKs proof is generated
   - The proof verifies that the user is authorized to vote without revealing identity
   - The nullifier prevents double voting
   - The vote is recorded on the blockchain without linking to the voter's identity

## Technologies Used

- **Frontend**: React, TailwindCSS
- **Backend**: Node.js, Express, MongoDB
- **Blockchain**: Ethereum, Ethers.js
- **zk-SNARKs**: Circom, SnarkJS
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker, Docker Compose

## Security Considerations

- No personal identifiable information is stored
- Voting choices cannot be linked to voter identities
- Proofs are verified in a secure environment
- All communications use HTTPS
- Authentication tokens are short-lived
- Smart contracts are used for immutable record-keeping

## Security Utilities Implementation

This project includes several security utilities:

1. **JWT Authentication**: Secure token-based authentication
2. **Encryption**: AES-256-GCM encryption for sensitive data
3. **Input Validation**: Comprehensive validation to prevent injection attacks
4. **Rate Limiting**: Protection against brute force attacks
5. **Secure ID Generation**: Cryptographically secure identifier generation
6. **Response Formatting**: Consistent API responses with proper error handling
7. **Asynchronous Error Handling**: Robust error management

## UI/UX Implementation

The UI/UX has been designed based on the requirements specified in the project documentation, with a focus on:

- Clean, aesthetic, and easy-to-navigate design
- Strong privacy and security visual cues
- Clear feedback on user actions
- Informative content about the privacy protections in place

### User Interfaces

1. **Voter Login**: Allows voters to authenticate anonymously using a hashed identifier
2. **Voting Dashboard**: Provides a secure interface for casting votes
3. **Admin Login**: Secure login for system administrators
4. **Admin Dashboard**: Displays system status and logs for monitoring 