package blood_donation.health.service;

import blood_donation.health.DTO.RegisterDto;
import blood_donation.health.Entity.Enum.Role;
import blood_donation.health.Entity.Users;
import blood_donation.health.Utils.JwtUtil;
import blood_donation.health.Utils.UserAlreadyExistsException;
import blood_donation.health.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Service
@AllArgsConstructor
public class UserAuthService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // Spring Security login
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        if (!user.isActive()) {
            throw new UsernameNotFoundException("Account is deactivated" );
        }

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                user.getRoles().stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name()))
                        .toList()
        );
    }

    public Map<String, String> login(String email) {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found"));

        String role = user.getRoles()
                .stream()
                .findFirst()
                .map(Enum::name)
                .orElse("USER");

        String token = jwtUtil.generateToken(email, role);

        Map<String, String> response = new HashMap<>();
        response.put("token", token);

        return response;
    }


    // Register user
    public String register(RegisterDto request) {

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new UserAlreadyExistsException(
                    "User already exists with email: " + request.getEmail()
            );
        }

        Set<Role> roles = new HashSet<>();
        roles.add(request.getRole());

        Users user = new Users();
        user.setEmail(request.getEmail());
        user.setPassword( passwordEncoder.encode(request.getPassword()));
        user.setRoles(roles);
        user.setVerified(false);
        user.setActive(true);

        try {
            userRepository.save(user);
        } catch (DataIntegrityViolationException ex) {
            throw new UserAlreadyExistsException(
                    "User already exists with email: " + request.getEmail()
            );
        }

        return "Registered Successfully";
    }
}