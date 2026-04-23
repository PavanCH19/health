package blood_donation.health.Controller;

import blood_donation.health.DTO.LoginDto;
import blood_donation.health.DTO.RegisterDto;
import blood_donation.health.Utils.JwtUtil;
import blood_donation.health.service.UserAuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserAuthService userAuthService;

    @PostMapping("/login")
    public String login(@RequestBody LoginDto request) {

        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        return jwtUtil.generateToken(request.getEmail());
    }

    @PostMapping("/register")
    public String register(@RequestBody RegisterDto request) {
        return userAuthService.register(request);
    }
}
