# ZK-SNARK Flow Diagrams

Below are sequence diagrams illustrating the flow of Zero-Knowledge Proofs in our voting system.

## 1. Voter Registration and Authentication Flow

```mermaid
sequenceDiagram
    participant Voter
    participant Client
    participant Server
    participant DB as Database
    participant ZKP as ZKP Service

    Voter->>Client: Enter Identifier (e.g. ID number)
    
    note over Client: Registration
    Client->>Client: Hash identifier using SHA-256
    Client->>Server: Send hashed identifier
    Server->>Server: Double hash for extra security
    Server->>DB: Store double-hashed identifier
    Server->>Client: Registration success
    Client->>Voter: Confirmation
    
    note over Client: Authentication
    Voter->>Client: Enter Identifier
    Client->>Client: Hash identifier
    Client->>Client: Generate nullifier secret
    Client->>ZKP: Generate auth proof using<br/>snarkjs & circom circuit
    ZKP-->>Client: Return proof + public signals
    Client->>Server: Send proof + hashed identifier
    Server->>ZKP: Verify proof using verification key
    Server->>DB: Validate hashed identifier
    Server->>Server: Generate JWT with nullifier hash
    Server->>Client: Return JWT token
    Client->>Client: Store token & nullifier
    Client->>Voter: Authentication success
```

## 2. Voting Process Flow

```mermaid
sequenceDiagram
    participant Voter
    participant Client
    participant Server
    participant DB as Database
    participant ZKP as ZKP Service
    participant BC as Blockchain Service

    Voter->>Client: Select candidate
    
    note over Client: Generate Vote Proof
    Client->>Client: Get nullifier from storage
    Client->>ZKP: Generate vote proof using<br/>snarkjs & circom circuit
    ZKP-->>Client: Return proof + public signals
    
    Client->>Server: Send vote + proof
    
    Server->>ZKP: Verify vote proof
    Server->>DB: Check nullifier usage
    
    alt Nullifier hasn't voted
        Server->>BC: Submit vote transaction
        BC-->>Server: Return transaction hash
        Server->>DB: Store vote + nullifier + tx hash
        Server->>DB: Mark nullifier as "used"
        Server->>Client: Vote accepted + tx hash
        Client->>Client: Mark user as voted
        Client->>Voter: Vote confirmation
    else Nullifier already used
        Server->>Client: Double voting rejected
        Client->>Voter: Error: Already voted
    end
```

## 3. Admin Actions Flow

```mermaid
sequenceDiagram
    participant Admin
    participant Client
    participant Server
    participant DB as Database
    participant ZKP as ZKP Service
    participant BC as Blockchain Service

    Admin->>Client: Log in with credentials
    Client->>Server: Send username/password
    Server->>DB: Verify admin credentials
    Server->>Client: Return admin JWT
    
    Admin->>Client: Initiate admin action
    
    note over Client: Generate Admin Proof
    Client->>Client: Get admin key from storage
    Client->>Client: Generate action nonce
    Client->>ZKP: Generate admin proof using<br/>snarkjs & circom circuit
    ZKP-->>Client: Return proof + public signals
    
    Client->>Server: Send action + proof
    
    Server->>ZKP: Verify admin proof
    
    alt Valid admin proof
        Server->>BC: Submit admin action
        BC-->>Server: Return transaction hash
        Server->>DB: Execute action + store tx hash
        Server->>DB: Log action with proof
        Server->>Client: Action confirmed
        Client->>Admin: Success notification
    else Invalid admin proof
        Server->>DB: Log unauthorized attempt
        Server->>Client: Reject action
        Client->>Admin: Error: Unauthorized
    end
```

## 4. Complete System Architecture

```mermaid
flowchart TB
    subgraph "Client Side"
        A[Voter/Admin Browser]
        B[ZK Proof Generation]
        C[Local Storage]
        D[Web3 Integration]
    end
    
    subgraph "Server Side"
        E[API Endpoints]
        F[ZKP Service]
        G[JWT Auth]
        H[Access Control]
        I[Blockchain Service]
    end
    
    subgraph "Storage Layer"
        J[(User DB)]
        K[(Vote DB)]
        L[(System Logs)]
        M[Blockchain]
    end
    
    A --> B
    A --> C
    A --> D
    B --> E
    C --> E
    D --> I
    E --> F
    E --> G
    E --> H
    F --> I
    G --> H
    H --> J
    H --> K
    H --> L
    I --> M
    
    classDef clientNodes fill:#f9f,stroke:#333,stroke-width:2px;
    classDef serverNodes fill:#bbf,stroke:#333,stroke-width:2px;
    classDef storageNodes fill:#bfb,stroke:#333,stroke-width:2px;
    
    class A,B,C,D clientNodes;
    class E,F,G,H,I serverNodes;
    class J,K,L,M storageNodes;
```

These diagrams illustrate the complete flow of Zero-Knowledge Proofs in our voting system, showing how privacy is maintained throughout the process while ensuring security and preventing fraud. 