# 🔐 Spring Boot JWT Authentication & Authorization Flow

This project implements a **fully stateless authentication system** using **Spring Boot, Spring Security, and JWT**.

The following diagrams represent the **complete internal flow**, including filters, providers, and security context handling.

---

# 🚀 PHASE 1: APPLICATION STARTUP

```id="startup-detailed-flow"
        Spring Boot Starts
                ↓
   Scans Annotations
 (@Configuration, @Service, @Component)
                ↓
          Creates Beans
                ↓
   ┌──────────────────────────────┐
   │ SecurityFilterChain          │
   │ JwtFilter (Custom Filter)    │
   │ UserAuthService              │
   │ AuthenticationProvider       │
   │   (DaoAuthenticationProvider)│
   │ AuthenticationManager        │
   │ PasswordEncoder              │
   └──────────────────────────────┘
                ↓
     Builds Authentication System
                ↓
     AuthenticationManager
                ↓
     DaoAuthenticationProvider
                ↓
     UserDetailsService
        (UserAuthService)
                ↓
     Builds Security Filter Chain
                ↓
 SecurityContextPersistenceFilter
                ↓
        JwtFilter (Custom)
                ↓
 UsernamePasswordAuthenticationFilter
                ↓
        AuthorizationFilter
                ↓
   ExceptionTranslationFilter
                ↓
   ✅ Application READY
```

---

# 🔑 PHASE 2: LOGIN FLOW (AUTHENTICATION)

```id="login-detailed-flow"
 Client Request
 POST /auth/login
 (email + password)
        ↓
   AuthController
        ↓
 authManager.authenticate(
   UsernamePasswordAuthenticationToken
 )
        ↓
 AuthenticationManager
        ↓
 Delegates to AuthenticationProvider
        ↓
 DaoAuthenticationProvider
        ↓
 Calls UserAuthService.loadUserByUsername()
        ↓
        UserAuthService
        ↓
   Calls UserRepository
        ↓
   Fetches User from DB
        ↓
 Converts User → UserDetails
        ↓
 Returns UserDetails
        ↓
 PasswordEncoder.matches()
 (raw vs hashed password)
        ↓
 ┌──────────────────────────────┐
 │ If Password Matches          │
 └──────────────────────────────┘
        ↓
 Authentication Object Created
   - Principal (User)
   - Authorities (Roles)
        ↓
 Authentication SUCCESS
        ↓
 Controller Generates JWT
 jwtUtil.generateToken(email)
        ↓
         JWT Contains
   - Subject (email)
   - IssuedAt
   - Expiration
   - Signature
        ↓
 Token Sent to Client
        ↓
 Client Stores Token
 (localStorage / memory)
```

---

# 🔁 PHASE 3: REQUEST FLOW (JWT AUTHENTICATION)

```id="request-detailed-flow"
 Client Request
 GET /admin/dashboard
 Authorization: Bearer <JWT>
        ↓
   SecurityFilterChain
        ↓
 JwtFilter (Executes FIRST)
        ↓
 1. Read Authorization Header
 2. Check "Bearer " Prefix
 3. Extract JWT Token
 4. jwtUtil.extractUsername(token)
 5. Validate Token
    - Signature
    - Expiration
        ↓
 ┌──────────────────────────────┐
 │ If Token is Valid            │
 └──────────────────────────────┘
        ↓
 Load User From Database
 userAuthService.loadUserByUsername()
        ↓
 Create Authentication Object
 UsernamePasswordAuthenticationToken
        ↓
 Set Authentication
 SecurityContextHolder.getContext()
        .setAuthentication(auth)
        ↓
 Continue Filter Chain
```

---

# 🛡 PHASE 4: AUTHORIZATION CHECK

```id="authorization-detailed-flow"
 After JwtFilter
        ↓
 AuthorizationFilter Executes
        ↓
 Reads SecurityContext
        ↓
 Authentication → Authorities
        ↓
 Match With Config Rules

   /admin/** → hasRole("ADMIN")
   /user/**  → hasAnyRole("USER","ADMIN")

        ↓
        Decision
        ↓
 ┌───────────────┬────────────────┐
 │ Role Matches  │ Role Fails     │
 ├───────────────┼────────────────┤
 │ ✅ Allow       │ ❌ 403 Forbidden│
 │ Controller    │                │
 │ Executes      │                │
 └───────────────┴────────────────┘

 If No Authentication → ❌ 401 Unauthorized
```

---

# 🎯 PHASE 5: CONTROLLER EXECUTION

```id="controller-detailed-flow"
 Authorized Request
        ↓
 Controller Method Runs
        ↓
 Business Logic Executes
        ↓
 Response Returned to Client
```

---

# ⚠️ PHASE 6: EXCEPTION HANDLING

```id="exception-detailed-flow"
        Error Occurs
              ↓
 ┌────────────────────────────────────┐
 │ No Token / Invalid Token           │
 │ → AuthenticationEntryPoint → 401   │
 ├────────────────────────────────────┤
 │ No Permission                     │
 │ → AccessDeniedHandler → 403        │
 ├────────────────────────────────────┤
 │ Token Expired / Invalid           │
 │ → Handled in Filter / EntryPoint   │
 └────────────────────────────────────┘
```

---

# 🔄 PHASE 7: SECURITY CONTEXT LIFECYCLE

```id="context-detailed-flow"
        Per Request
            ↓
 SecurityContextHolder Created
            ↓
 JwtFilter Sets Authentication
            ↓
 Used Throughout Request
            ↓
 Cleared After Response
```

---

# 🧠 FULL SYSTEM SUMMARY

```id="full-summary-flow"
        STARTUP
 Build Security System
        ↓
         LOGIN
 Authenticate User
 Generate JWT
        ↓
        REQUEST
 Attach JWT Token
        ↓
        FILTER
 Validate Token
 Set Authentication
        ↓
   AUTHORIZATION
 Check Roles
        ↓
 ┌───────────────┬───────────────┐
 │ Allowed       │ Denied        │
 ↓               ↓
 Controller      401 / 403
 Execution
        ↓
      RESPONSE
```

---

# ⚡ SECURITY CHARACTERISTICS

* Stateless Authentication (No Sessions)
* Every request must include JWT
* Role-based Authorization
* Secure Password Encoding
* Filter-based Security Pipeline

---

# 🏁 FINAL NOTE

This architecture ensures:

* Scalability (stateless design)
* Strong security via JWT
* Clear separation of:

    * Authentication
    * Authorization
    * Request processing

---

**Production-ready Spring Security + JWT flow 🚀**
