package com.metroica.sgip_backend.config;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, String>> root() {
        return ResponseEntity.ok(Map.of(
                "app", "SGIP Backend",
                "version", "1.0.0",
                "auth", "/api/v1/auth/login",
                "docs", "/api/v1/productos"
        ));
    }
}
