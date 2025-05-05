# ZKP-SNARK Implementation Workflow

## 1. System Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[User Interface]
        PG[Proof Generator]
        WC[Web3 Client]
        LS[Local Storage]
    end

    subgraph "Backend Layer"
        API[API Gateway]
        ZKS[ZKP Service]
        Auth[Auth Service]
        VS[Vote Service]
        AS[Admin Service]
    end

    subgraph "Storage Layer"
        DB[(MongoDB)]
        BC[Blockchain]
        FS[File System]
    end

    subgraph "ZKP Components"
        CC[Circom Circuits]
        VK[Verification Keys]
        PK[Proving Keys]
    end

    UI --> PG
    PG --> WC
    PG --> LS
    WC --> API
    API --> ZKS
    API --> Auth
    API --> VS
    API --> AS
    ZKS --> CC
    ZKS --> VK
    ZKS --> PK
    Auth --> DB
    VS --> DB
    VS --> BC
    AS --> DB
    AS --> BC
    CC -.-> FS
    VK -.-> FS
    PK -.-> FS

    classDef frontend fill:#f9f,stroke:#333,stroke-width:2px;
    classDef backend fill:#bbf,stroke:#333,stroke-width:2px;
    classDef storage fill:#bfb,stroke:#333,stroke-width:2px;
    classDef zkp fill:#ffb,stroke:#333,stroke-width:2px;

    class UI,PG,WC,LS frontend;
    class API,ZKS,Auth,VS,AS backend;
    class DB,BC,FS storage;
    class CC,VK,PK zkp;
```

## 2. Circuit Compilation Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant CC as Circom Compiler
    participant SJ as SnarkJS
    participant FS as File System

    Dev->>CC: Write circuit (.circom)
    CC->>FS: Generate R1CS
    CC->>FS: Generate WASM
    CC->>FS: Generate Symbols

    Dev->>SJ: Initialize Powers of Tau
    SJ->>FS: Generate pot12_0000.ptau
    Dev->>SJ: Contribute to Ceremony
    SJ->>FS: Generate pot12_0001.ptau
    Dev->>SJ: Prepare Phase 2
    SJ->>FS: Generate pot12_final.ptau

    Dev->>SJ: Setup Circuit
    SJ->>FS: Generate circuit_0000.zkey
    Dev->>SJ: Contribute to zKey
    SJ->>FS: Generate circuit_final.zkey
    Dev->>SJ: Export Verification Key
    SJ->>FS: Save verification_key.json

    Note over Dev,FS: Circuit is now ready for proof generation
```

## 3. Voter Registration and Authentication

```mermaid
sequenceDiagram
    participant V as Voter
    participant C as Client
    participant AS as Auth Service
    participant ZS as ZKP Service
    participant DB as Database

    V->>C: Enter Identifier
    
    Note over C: Registration Process
    C->>C: Hash Identifier (SHA-256)
    C->>AS: Send Hashed ID
    AS->>AS: Double Hash (SHA-256)
    AS->>DB: Store Double-Hashed ID
    AS->>C: Return Success
    
    Note over C: Authentication Process
    C->>C: Generate Nullifier Secret
    C->>C: Load Auth Circuit (WASM)
    C->>C: Create Circuit Inputs
    C->>C: Generate ZK Proof
    C->>AS: Send Proof + Public Signals
    AS->>ZS: Verify Proof
    ZS->>ZS: Load Verification Key
    ZS->>ZS: Verify ZK Proof
    AS->>AS: Generate JWT with Nullifier
    AS->>C: Return JWT Token
    C->>C: Store Token & Nullifier
```

## 4. Voting Process

```mermaid
sequenceDiagram
    participant V as Voter
    participant C as Client
    participant VS as Vote Service
    participant ZS as ZKP Service
    participant DB as Database
    participant BC as Blockchain

    V->>C: Select Candidate
    C->>C: Get Nullifier from Storage
    C->>C: Load Vote Circuit (WASM)
    
    Note over C: Proof Generation
    C->>C: Create Circuit Inputs
    C->>C: Generate Vote ZK Proof
    
    C->>VS: Send Vote + Proof
    VS->>ZS: Verify Vote Proof
    ZS->>ZS: Load Vote Verification Key
    ZS->>ZS: Verify ZK Proof
    
    VS->>DB: Check Nullifier Usage
    
    alt Nullifier Not Used
        VS->>BC: Submit Vote Transaction
        BC-->>VS: Return Transaction Hash
        VS->>DB: Store Vote Record
        VS->>DB: Mark Nullifier as Used
        VS->>C: Confirm Vote + Tx Hash
        C->>C: Mark User as Voted
        C->>V: Show Success
    else Nullifier Already Used
        VS->>C: Reject Double Vote
        C->>V: Show Error
    end
```

## 5. Admin Actions

```mermaid
sequenceDiagram
    participant A as Admin
    participant C as Client
    participant AS as Admin Service
    participant ZS as ZKP Service
    participant DB as Database
    participant BC as Blockchain

    A->>C: Initiate Admin Action
    C->>C: Get Admin Key
    C->>C: Load Admin Circuit (WASM)
    
    Note over C: Admin Proof Generation
    C->>C: Generate Action Nonce
    C->>C: Create Circuit Inputs
    C->>C: Generate Admin ZK Proof
    
    C->>AS: Send Action + Proof
    AS->>ZS: Verify Admin Proof
    ZS->>ZS: Load Admin Verification Key
    ZS->>ZS: Verify ZK Proof
    
    alt Valid Proof
        AS->>BC: Submit Admin Transaction
        BC-->>AS: Return Transaction Hash
        AS->>DB: Execute Action
        AS->>DB: Log Action + Proof
        AS->>C: Confirm Action
        C->>A: Show Success
    else Invalid Proof
        AS->>DB: Log Failed Attempt
        AS->>C: Reject Action
        C->>A: Show Error
    end
```

## 6. Development vs Production Flow

```mermaid
graph TB
    subgraph "Development Environment"
        DC[Development Config]
        MP[Mock Proofs]
        LT[Local Testing]
    end

    subgraph "Production Environment"
        PC[Production Config]
        RP[Real Proofs]
        SC[Secure Ceremony]
    end

    subgraph "Shared Components"
        CC[Circom Circuits]
        SJ[SnarkJS]
        WA[WASM Modules]
    end

    DC --> MP
    MP --> LT
    PC --> RP
    RP --> SC
    CC --> MP
    CC --> RP
    SJ --> MP
    SJ --> RP
    WA --> MP
    WA --> RP

    classDef dev fill:#f9f,stroke:#333,stroke-width:2px;
    classDef prod fill:#bbf,stroke:#333,stroke-width:2px;
    classDef shared fill:#bfb,stroke:#333,stroke-width:2px;

    class DC,MP,LT dev;
    class PC,RP,SC prod;
    class CC,SJ,WA shared;
```

## 7. Data Flow and Privacy

```mermaid
graph LR
    subgraph "Private Data"
        ID[Voter ID]
        KEY[Admin Key]
        VOTE[Vote Choice]
    end

    subgraph "Public Data"
        HASH[Hashed ID]
        NULL[Nullifier Hash]
        PROOF[ZK Proof]
        PUB[Public Signals]
    end

    subgraph "Verification"
        VK[Verification Key]
        VERIFY[Proof Verifier]
        VALID[Validation Result]
    end

    ID --> HASH
    ID --> NULL
    KEY --> PROOF
    VOTE --> PROOF
    HASH --> PUB
    NULL --> PUB
    PROOF --> VERIFY
    PUB --> VERIFY
    VK --> VERIFY
    VERIFY --> VALID

    classDef private fill:#f77,stroke:#333,stroke-width:2px;
    classDef public fill:#7f7,stroke:#333,stroke-width:2px;
    classDef verify fill:#77f,stroke:#333,stroke-width:2px;

    class ID,KEY,VOTE private;
    class HASH,NULL,PROOF,PUB public;
    class VK,VERIFY,VALID verify;
```

These diagrams provide a comprehensive view of our ZKP-SNARK implementation, showing:
1. Overall system architecture
2. Circuit compilation process
3. Voter registration and authentication flow
4. Voting process with proof generation and verification
5. Admin actions with secure proof verification
6. Development vs Production environments
7. Data flow and privacy preservation

Each component is color-coded for better understanding:
- Frontend components: Pink
- Backend components: Light blue
- Storage components: Light green
- ZKP components: Light yellow
- Private data: Red
- Public data: Green
- Verification components: Blue 