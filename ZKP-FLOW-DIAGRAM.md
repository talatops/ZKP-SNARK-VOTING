# ZK-SNARK Flow Diagrams

Below are sequence diagrams illustrating the flow of Zero-Knowledge Proofs in our voting system.

## 1. Voter Registration and Authentication Flow

```mermaid
sequenceDiagram
    participant Voter
    participant Client
    participant Server
    participant DB as Database

    Voter->>Client: Enter Identifier (e.g. ID number)
    
    note over Client: Registration
    Client->>Client: Hash identifier
    Client->>Server: Send hashed identifier
    Server->>DB: Store hashed identifier
    Server->>Client: Registration success
    Client->>Voter: Confirmation
    
    note over Client: Authentication
    Voter->>Client: Enter Identifier
    Client->>Client: Hash identifier
    Client->>Client: Generate ZK proof<br/>(Proves knowledge of original ID<br/>without revealing it)
    Client->>Client: Create nullifier hash
    Client->>Server: Send ZK proof + nullifier hash
    Server->>Server: Verify ZK proof
    Server->>Server: Generate JWT token<br/>with nullifier hash
    Server->>Client: Return JWT token
    Client->>Client: Store token
    Client->>Voter: Authentication success
```

## 2. Voting Process Flow

```mermaid
sequenceDiagram
    participant Voter
    participant Client
    participant Server
    participant DB as Database

    Voter->>Client: Select candidate
    
    note over Client: Generate Vote Proof
    Client->>Client: Get nullifier hash from JWT
    Client->>Client: Generate ZK proof<br/>(Proves eligibility to vote<br/>without revealing identity)
    
    Client->>Server: Send vote + ZK proof
    
    Server->>Server: Verify ZK proof
    Server->>DB: Check if nullifier has voted
    
    alt Nullifier hasn't voted
        Server->>DB: Store vote + nullifier hash
        Server->>DB: Mark nullifier as "used"
        Server->>Client: Vote accepted
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

    Admin->>Client: Log in with credentials
    Client->>Server: Send username/password
    Server->>DB: Verify admin credentials
    Server->>Client: Return admin JWT token
    
    Admin->>Client: Initiate admin action<br/>(e.g., add candidate)
    
    note over Client: Generate Admin Proof
    Client->>Client: Get admin token
    Client->>Client: Generate action nonce
    Client->>Client: Generate ZK proof<br/>(Proves admin privileges<br/>without revealing secret keys)
    
    Client->>Server: Send action + ZK proof
    
    Server->>Server: Verify admin ZK proof
    
    alt Valid admin proof
        Server->>DB: Execute admin action
        Server->>DB: Log action with proof hash
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
        C[Hash Generation]
    end
    
    subgraph "Server Side"
        D[API Endpoints]
        E[ZK Proof Verification]
        F[JWT Authentication]
        G[Access Control]
    end
    
    subgraph "Data Storage"
        H[(User DB)]
        I[(Vote DB)]
        J[(System Log DB)]
    end
    
    A --> B
    A --> C
    B --> D
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    G --> I
    G --> J
    
    classDef clientNodes fill:#f9f,stroke:#333,stroke-width:2px;
    classDef serverNodes fill:#bbf,stroke:#333,stroke-width:2px;
    classDef dbNodes fill:#bfb,stroke:#333,stroke-width:2px;
    
    class A,B,C clientNodes;
    class D,E,F,G serverNodes;
    class H,I,J dbNodes;
```

These diagrams illustrate the flow of Zero-Knowledge Proofs in our voting system, showing how privacy is maintained throughout the process while ensuring security and preventing fraud. 