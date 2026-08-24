package com.quickcart.controller;

import com.quickcart.dto.UserResponse;
import com.quickcart.model.User;
import com.quickcart.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/account")
public class AccountController {

    private final UserRepository userRepository;

    public AccountController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public UserResponse me(Authentication auth) {
        return UserResponse.from(currentUser(auth));
    }

    @PostMapping("/subscribe")
    public UserResponse subscribe(Authentication auth) {
        User user = currentUser(auth);
        user.setPremium(true);
        userRepository.save(user);
        return UserResponse.from(user);
    }

    @PostMapping("/unsubscribe")
    public UserResponse unsubscribe(Authentication auth) {
        User user = currentUser(auth);
        user.setPremium(false);
        userRepository.save(user);
        return UserResponse.from(user);
    }

    private User currentUser(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown user"));
    }
}
