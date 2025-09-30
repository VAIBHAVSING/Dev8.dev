# 🎯 Technical Decisions & ADRs

## Overview

This document tracks key architectural and technical decisions for Dev8.dev, following the Architecture Decision Record (ADR) pattern.

**Format:**
- **Status**: Proposed | Accepted | Deprecated | Superseded
- **Context**: Why we need to make this decision
- **Decision**: What we decided
- **Consequences**: Trade-offs and implications
- **Alternatives**: What we considered but rejected

---

## ADR-001: Monorepo with Turborepo

**Status:** ✅ Accepted  
**Date:** August 2024  
**Deciders:** Tech Lead

### Context
Need to organize Next.js frontend, Go backend, documentation, and shared packages. Options are:
1. Monorepo (single repository)
2. Polyrepo (multiple repositories)
3. Monolith (single codebase)

### Decision
Use **Turborepo monorepo** structure with:
- `apps/web` - Next.js frontend
- `apps/agent` - Go backend  
- `apps/docs` - Documentation site
- `packages/ui` - Shared React components
- `packages/typescript-config` - Shared TypeScript configs
- `packages/eslint-config` - Shared ESLint configs

### Consequences

**Positive:**
- ✅ Code sharing across apps
- ✅ Unified dependency management
- ✅ Single CI/CD pipeline
- ✅ Atomic commits across frontend/backend
- ✅ Better developer experience

**Negative:**
- ❌ Larger repository size
- ❌ Steeper learning curve for new developers
- ❌ Need for good tooling (Turborepo)

**Neutral:**
- Single source of truth for all code
- Requires discipline in module boundaries

### Alternatives Considered

**Polyrepo:**
- Rejected: Too much overhead in coordinating changes
- Rejected: Harder to share code between apps
- Rejected: Multiple CI/CD pipelines to maintain

**Monolith:**
- Rejected: Couples frontend and backend too tightly
- Rejected: Harder to scale team
- Rejected: Language barriers (TypeScript + Go)

---

## ADR-002: Next.js 15 with App Router

**Status:** ✅ Accepted  
**Date:** August 2024  
**Deciders:** Tech Lead, Frontend Team

### Context
Need modern React framework for server-side rendering, routing, and API routes. Considering:
1. Next.js (App Router)
2. Next.js (Pages Router)
3. Remix
4. Create React App + Express

### Decision
Use **Next.js 15 with App Router** for:
- Modern React patterns (Server Components, Streaming)
- Built-in API routes
- Excellent TypeScript support
- Large ecosystem
- Vercel deployment integration

### Consequences

**Positive:**
- ✅ Server Components for better performance
- ✅ Streaming for faster page loads
- ✅ Built-in API routes (no separate backend needed for some endpoints)
- ✅ File-based routing
- ✅ Excellent documentation
- ✅ Easy deployment to Vercel

**Negative:**
- ❌ App Router still relatively new (potential bugs)
- ❌ Learning curve for team
- ❌ Some patterns different from Pages Router

**Neutral:**
- Requires Next.js-specific knowledge
- Tied to Vercel ecosystem (but not required)

### Alternatives Considered

**Remix:**
- Rejected: Smaller ecosystem
- Rejected: Less mature than Next.js
- Benefit: Better nested routing (but App Router catches up)

**Pages Router:**
- Rejected: Older pattern, App Router is future
- Benefit: More stable, but less performant

**CRA + Express:**
- Rejected: Too much custom configuration
- Rejected: No SSR out of the box
- Rejected: More boilerplate

---

## ADR-003: Go for Backend Agent

**Status:** ✅ Accepted  
**Date:** August 2024  
**Deciders:** Tech Lead, Backend Team

### Context
Need backend service for cloud resource management. Must integrate with Azure SDK. Options:
1. Go
2. Node.js/TypeScript
3. Python
4. Rust

### Decision
Use **Go 1.24** for backend agent because:
- Excellent Azure SDK support
- High performance for container orchestration
- Simple deployment (single binary)
- Strong typing
- Great for system-level programming

### Consequences

**Positive:**
- ✅ Fast compilation and execution
- ✅ Single binary deployment
- ✅ Excellent concurrency (goroutines)
- ✅ Strong Azure SDK
- ✅ Low memory footprint
- ✅ Static typing catches bugs early

**Negative:**
- ❌ Different language from frontend
- ❌ Smaller talent pool than Node.js
- ❌ Verbose error handling
- ❌ No shared types with TypeScript (need manual sync)

**Neutral:**
- Learning curve for JavaScript developers
- Different testing patterns than Node.js

### Alternatives Considered

**Node.js/TypeScript:**
- Rejected: Poorer performance for system tasks
- Rejected: Single-threaded limitations
- Benefit: Same language as frontend
- Benefit: Larger talent pool

**Python:**
- Rejected: Slower performance
- Rejected: GIL limitations for concurrency
- Benefit: Great for scripts and automation

**Rust:**
- Rejected: Too steep learning curve
- Rejected: Longer development time
- Benefit: Ultimate performance and safety

---

## ADR-004: Azure Container Instances (not Kubernetes)

**Status:** ✅ Accepted  
**Date:** March 2025  
**Deciders:** Tech Lead, DevOps

### Context
Need container platform for running VS Code environments. Must support:
- Dynamic container creation
- Persistent storage
- Resource isolation
- Cost efficiency

Options:
1. Azure Container Instances (ACI)
2. Azure Kubernetes Service (AKS)
3. Docker Compose
4. AWS ECS

### Decision
Use **Azure Container Instances** for MVP because:
- Serverless (no cluster management)
- Fast provisioning (< 60 seconds)
- Pay-per-use pricing
- Simple architecture
- Perfect for prototype validation

**Migration plan:** Can move to AKS in Phase 3 if needed.

### Consequences

**Positive:**
- ✅ Zero cluster management overhead
- ✅ Fast environment creation
- ✅ No idle costs
- ✅ Simple debugging
- ✅ Perfect for MVP validation
- ✅ Easy rollback/deletion
- ✅ Native Azure integration

**Negative:**
- ❌ Less control than Kubernetes
- ❌ Fewer advanced features (auto-scaling, complex networking)
- ❌ May need migration later for huge scale
- ❌ Limited to Azure (vendor lock-in for now)

**Neutral:**
- Good enough for 1000s of users
- Can migrate to AKS later if needed

### Alternatives Considered

**Azure Kubernetes Service (AKS):**
- Rejected for MVP: Too complex
- Rejected for MVP: Slower provisioning
- Rejected for MVP: Cluster management overhead
- Future consideration: When scaling needs require it

**Docker Compose:**
- Rejected: Not production-ready
- Rejected: No cloud integration
- Use: Local development only

**AWS ECS:**
- Rejected: Want to stay in Azure ecosystem
- Rejected: Less integrated than ACI
- Future: If multi-cloud needed

---

## ADR-005: Direct Azure SDK (not CloudSDK abstraction)

**Status:** ✅ Accepted  
**Date:** March 2025  
**Deciders:** Tech Lead, Backend Team

### Context
Need to integrate with Azure services (ACI, Files, Registry). Options:
1. Direct Azure SDK for Go
2. Custom CloudSDK abstraction (multi-cloud)
3. Terraform/Pulumi
4. Azure CLI wrapper

### Decision
Use **direct Azure SDK for Go** because:
- Better documentation and examples
- Full feature access
- Easier troubleshooting
- Faster MVP development
- Microsoft-maintained

**Multi-cloud:** Can add later if customer demand exists.

### Consequences

**Positive:**
- ✅ Best documentation available
- ✅ Full Azure feature access
- ✅ Active Microsoft support
- ✅ Type-safe SDK
- ✅ No abstraction layer bugs
- ✅ Faster development
- ✅ Better error messages

**Negative:**
- ❌ Azure vendor lock-in
- ❌ Multi-cloud requires separate implementation
- ❌ More work if switching clouds

**Neutral:**
- Most customers prefer single cloud anyway
- Can add other clouds later as separate modules

### Alternatives Considered

**CloudSDK Abstraction (like Vercel AI SDK):**
- Rejected for MVP: Extra complexity
- Rejected for MVP: Need to test multiple providers
- Rejected for MVP: Custom bugs in abstraction layer
- Future: If multi-cloud becomes critical

**Terraform/Pulumi:**
- Rejected: Not for runtime operations
- Rejected: Slower than SDK
- Use: For infrastructure provisioning only

**Azure CLI Wrapper:**
- Rejected: Parsing CLI output is brittle
- Rejected: Poor error handling
- Rejected: No type safety

---

## ADR-006: PostgreSQL with Prisma

**Status:** ✅ Accepted  
**Date:** August 2024  
**Deciders:** Tech Lead, Backend Team

### Context
Need database for user data, environments, auth. Options:
1. PostgreSQL
2. MySQL
3. MongoDB
4. SQLite

### Decision
Use **PostgreSQL 15+** with **Prisma ORM** because:
- Proven scalability
- Strong typing with Prisma
- Excellent for relational data
- Great ecosystem
- Easy local development

### Consequences

**Positive:**
- ✅ Battle-tested reliability
- ✅ ACID compliance
- ✅ Rich query capabilities
- ✅ JSON support for flexibility
- ✅ Great tooling (Prisma Studio)
- ✅ Type-safe database access

**Negative:**
- ❌ Requires database hosting
- ❌ Not as simple as SQLite
- ❌ Schema migrations needed

**Neutral:**
- Good enough for millions of records
- Can add read replicas later

### Alternatives Considered

**MySQL:**
- Rejected: No significant benefits over PostgreSQL
- PostgreSQL has better JSON support

**MongoDB:**
- Rejected: Relational data fits SQL better
- Rejected: Harder to ensure data consistency

**SQLite:**
- Rejected: Not production-grade for multi-user
- Use: For local testing only

---

## ADR-007: NextAuth.js for Authentication

**Status:** ✅ Accepted  
**Date:** August 2024  
**Deciders:** Tech Lead, Full-stack Team

### Context
Need authentication with OAuth (Google, GitHub) and credentials. Options:
1. NextAuth.js
2. Auth0
3. Clerk
4. Custom implementation

### Decision
Use **NextAuth.js v5** because:
- Built for Next.js
- Supports multiple providers
- Session management included
- Database adapters for Prisma
- Open source and free

### Consequences

**Positive:**
- ✅ Easy OAuth integration
- ✅ Session management built-in
- ✅ Database integration via Prisma
- ✅ Secure by default
- ✅ Free and open source
- ✅ Large community

**Negative:**
- ❌ Some configuration complexity
- ❌ Tied to Next.js architecture
- ❌ Less feature-rich than Auth0/Clerk

**Neutral:**
- Good enough for MVP
- Can migrate to paid service later if needed

### Alternatives Considered

**Auth0:**
- Rejected: Expensive for scale
- Benefit: More features, better UX

**Clerk:**
- Rejected: Expensive
- Benefit: Beautiful pre-built components

**Custom:**
- Rejected: Security risks
- Rejected: Too much maintenance

---

## ADR-008: Polling (not WebSocket) for Status Updates

**Status:** ✅ Accepted (MVP)  
**Date:** March 2025  
**Deciders:** Tech Lead, Frontend Team

### Context
Need real-time environment status updates. Options:
1. Polling (HTTP requests every N seconds)
2. WebSocket
3. Server-Sent Events (SSE)
4. Long polling

### Decision
Use **polling with SWR** (5-second interval) for MVP because:
- Simpler to implement
- Easier to debug
- Works everywhere (no WebSocket firewall issues)
- Good enough for MVP use case

**Future:** Can add WebSocket in Phase 2 if needed.

### Consequences

**Positive:**
- ✅ Simple implementation
- ✅ Works through all firewalls/proxies
- ✅ Easier to debug
- ✅ No connection management complexity
- ✅ SWR handles caching and revalidation

**Negative:**
- ❌ Slight delay (up to 5 seconds)
- ❌ More HTTP requests
- ❌ Not truly "real-time"

**Neutral:**
- Good enough for status updates
- Can optimize polling frequency
- Stop polling when not active

### Alternatives Considered

**WebSocket:**
- Deferred to Phase 2: More complex
- Deferred to Phase 2: Connection management needed
- Future: If real-time becomes critical

**Server-Sent Events:**
- Rejected: Similar complexity to WebSocket
- Rejected: Less browser support

**Long Polling:**
- Rejected: More complex than simple polling
- Rejected: Connection management issues

---

## ADR-009: code-server for VS Code

**Status:** ✅ Accepted  
**Date:** March 2025  
**Deciders:** Tech Lead

### Context
Need browser-based IDE. Options:
1. code-server (VS Code in browser)
2. Eclipse Theia
3. Custom web IDE
4. Cloud9

### Decision
Use **code-server** because:
- Official VS Code port to browser
- Actively maintained by Coder
- Full VS Code experience
- Extension marketplace support
- Proven at scale

### Consequences

**Positive:**
- ✅ Familiar VS Code experience
- ✅ Full extension support
- ✅ Active development and community
- ✅ Well-documented
- ✅ Battle-tested (Coder, GitHub Codespaces)

**Negative:**
- ❌ Some VS Code features may not work
- ❌ Dependency on Coder's maintenance
- ❌ Larger container image size

**Neutral:**
- Good enough for 99% of use cases
- Can customize if needed

### Alternatives Considered

**Eclipse Theia:**
- Rejected: Less familiar to users
- Rejected: Smaller extension ecosystem

**Custom IDE:**
- Rejected: Years of development needed
- Rejected: Won't match VS Code quality

**Cloud9:**
- Rejected: Outdated, no longer maintained

---

## ADR-010: Tailwind CSS for Styling

**Status:** ✅ Accepted  
**Date:** August 2024  
**Deciders:** Tech Lead, Frontend Team

### Context
Need CSS framework for responsive, modern UI. Options:
1. Tailwind CSS
2. CSS Modules
3. Styled Components
4. MUI/Chakra

### Decision
Use **Tailwind CSS v3** because:
- Utility-first approach
- Excellent Next.js integration
- Small bundle size
- Rapid development
- Design system consistency

### Consequences

**Positive:**
- ✅ Fast development
- ✅ No custom CSS to write
- ✅ Consistent design system
- ✅ Tree-shaking for small bundles
- ✅ Responsive design utilities

**Negative:**
- ❌ Verbose classNames
- ❌ Learning curve for new users
- ❌ Not component-based

**Neutral:**
- Widely used and well-documented
- Can use with headless UI libraries

### Alternatives Considered

**CSS Modules:**
- Rejected: More boilerplate
- Benefit: Scoped styles

**Styled Components:**
- Rejected: Runtime overhead
- Rejected: Not RSC-compatible

**MUI/Chakra:**
- Rejected: Opinionated components
- Rejected: Harder to customize

---

## 📊 Decision Matrix

Summary of key decisions and their status:

| Decision | Status | Phase | Priority | Reversibility |
|----------|--------|-------|----------|---------------|
| Monorepo (Turborepo) | ✅ Accepted | Foundation | High | Low |
| Next.js 15 App Router | ✅ Accepted | Foundation | High | Medium |
| Go Backend | ✅ Accepted | Foundation | High | Low |
| Azure ACI | ✅ Accepted | MVP | High | High |
| Direct Azure SDK | ✅ Accepted | MVP | Medium | Medium |
| PostgreSQL + Prisma | ✅ Accepted | Foundation | High | Low |
| NextAuth.js | ✅ Accepted | Foundation | Medium | Medium |
| Polling (not WebSocket) | ✅ Accepted | MVP | Low | High |
| code-server | ✅ Accepted | MVP | High | Medium |
| Tailwind CSS | ✅ Accepted | Foundation | Low | Medium |

**Reversibility:**
- **Low:** Hard to change, fundamental to architecture
- **Medium:** Possible but requires significant work
- **High:** Easy to change or replace

---

## 🔄 Future Decisions Needed

### Phase 2 Decisions
- [ ] **ADR-011**: SSH Access Implementation (direct vs bastion)
- [ ] **ADR-012**: Terminal Implementation (WebSocket vs SSE)
- [ ] **ADR-013**: Real-time Updates (upgrade to WebSocket?)
- [ ] **ADR-014**: Monitoring Solution (Azure Monitor vs DataDog vs Prometheus)

### Phase 3 Decisions
- [ ] **ADR-015**: Kubernetes Migration (if needed)
- [ ] **ADR-016**: Multi-cloud Strategy
- [ ] **ADR-017**: CDN Strategy
- [ ] **ADR-018**: API Gateway (Kong vs Envoy vs custom)

---

## 📝 Decision Process

### How to Add New ADR

1. **Identify Decision Needed**
   - Architecture-level decision
   - Impacts multiple components
   - Non-obvious trade-offs

2. **Research Options**
   - List at least 3 alternatives
   - Research pros/cons
   - Get team input

3. **Document Decision**
   - Use ADR template above
   - Explain context and consequences
   - Get tech lead approval

4. **Update This Document**
   - Add new ADR with number
   - Update decision matrix
   - Link to relevant issues/PRs

---

**Last Updated:** March 29, 2025  
**Next Review:** After MVP launch
