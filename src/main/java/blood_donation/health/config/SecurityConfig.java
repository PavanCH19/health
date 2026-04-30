package blood_donation.health.config;

import blood_donation.health.Utils.JwtFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtFilter jwtFilter) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**").permitAll()
                        .anyRequest().authenticated()
                )
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable());

        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider(UserDetailsService userAuthService) {

        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userAuthService);
        provider.setPasswordEncoder(passwordEncoder());

        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}


// ==========================================================
// [PHASE 1: APPLICATION STARTUP]
// ==========================================================

// Spring Boot starts
//   ↓
// Scans annotations (@Configuration, @Service, @Component)
//   ↓
// Creates Beans:
//     - SecurityFilterChain
//     - JwtFilter
//     - UserAuthService
//     - AuthenticationProvider (DaoAuthenticationProvider)
//     - AuthenticationManager
//     - PasswordEncoder
//   ↓
// Builds Authentication System:
//     AuthenticationManager
//         ↓
//     DaoAuthenticationProvider
//         ↓
//     UserDetailsService (UserAuthService)
//   ↓
// Builds Security Filter Chain:
//     SecurityContextPersistenceFilter
//     ↓
//     JwtFilter (your custom filter)
//     ↓
//     UsernamePasswordAuthenticationFilter
//     ↓
//     AuthorizationFilter
//     ↓
//     ExceptionTranslationFilter
//   ↓
// Application READY to handle requests


// ==========================================================
// [PHASE 2: LOGIN FLOW (AUTHENTICATION)]
// ==========================================================

// Client sends request:
//   POST /auth/login
//   Body: email + password
//   ↓
// Request reaches Controller (AuthController)
//   ↓
// authManager.authenticate(
//     UsernamePasswordAuthenticationToken(email, password)
// )
//   ↓
// AuthenticationManager receives request
//   ↓
// Delegates to AuthenticationProvider
//   ↓
// DaoAuthenticationProvider executes
//   ↓
// Calls UserAuthService.loadUserByUsername(email)
//   ↓
// UserAuthService:
//     - Calls UserRepository
//     - Fetches user from DB
//     - Converts User → UserDetails
//   ↓
// Returns UserDetails to Provider
//   ↓
// PasswordEncoder compares:
//     rawPassword vs hashedPassword
//   ↓
// IF password matches:
//     - Authentication object created
//     - Contains:
//         Principal (user)
//         Authorities (ROLE_USER / ROLE_ADMIN)
//   ↓
// Authentication SUCCESS
//   ↓
// Controller generates JWT token:
//     jwtUtil.generateToken(email)
//   ↓
// JWT contains:
//     - subject (email)
//     - issuedAt
//     - expiration
//     - signature
//   ↓
// Token returned to client
//   ↓
// Client stores token (localStorage / memory)


// ==========================================================
// [PHASE 3: REQUEST FLOW (JWT AUTHENTICATION)]
// ==========================================================

// Client sends request:
//   GET /admin/dashboard
//   Header:
//     Authorization: Bearer <JWT>
//   ↓
// Request enters SecurityFilterChain
//   ↓
// JwtFilter executes FIRST
//   ↓
// JwtFilter:
//   1. Read Authorization header
//   2. Check if header starts with "Bearer "
//   3. Extract token
//   4. Call jwtUtil.extractUsername(token)
//   5. Parse JWT (verify signature + expiration)
//   ↓
// If token valid:
//   ↓
// Load user again from DB:
//   userAuthService.loadUserByUsername(email)
//   ↓
// Create Authentication object:
//   UsernamePasswordAuthenticationToken
//   ↓
// Set into SecurityContext:
//   SecurityContextHolder.getContext().setAuthentication(auth)
//   ↓
// Continue filter chain


// ==========================================================
// [PHASE 4: AUTHORIZATION CHECK]
// ==========================================================

// After JwtFilter:
//   ↓
// AuthorizationFilter runs
//   ↓
// Reads:
//   SecurityContext → Authentication → Authorities
//   ↓
// Matches with config rules:
//
//   /admin/** → hasRole("ADMIN")
//   /user/** → hasAnyRole("USER", "ADMIN")
//
//   ↓
// Decision:
//
//   IF role matches:
//       → Request allowed
//       → Controller executed
//
//   ELSE:
//       → 403 Forbidden
//
//   IF no authentication:
//       → 401 Unauthorized


// ==========================================================
// [PHASE 5: CONTROLLER EXECUTION]
// ==========================================================

// If authorized:
//   ↓
// Controller method runs
//   ↓
// Business logic executes
//   ↓
// Response returned to client


// ==========================================================
// [PHASE 6: EXCEPTION HANDLING]
// ==========================================================

// If error occurs:
//
// No token / invalid token:
//   → AuthenticationEntryPoint → 401
//
// No permission:
//   → AccessDeniedHandler → 403
//
// Token expired / invalid:
//   → Exception handled in filter or entry point


// ==========================================================
// [PHASE 7: SECURITY CONTEXT LIFECYCLE]
// ==========================================================

// Per request:
//
// SecurityContextHolder created
//   ↓
// JwtFilter sets Authentication
//   ↓
// Used during request
//   ↓
// Cleared after response


// ==========================================================
// [FULL SYSTEM SUMMARY]
// ==========================================================

// STARTUP:
//   Build security system

// LOGIN:
//   Authenticate user → generate JWT

// REQUEST:
//   JWT → Filter → Set Authentication → Authorization → Controller

// SECURITY:
//   Stateless (no session)
//   Every request must carry token