package com.metroica.sgip_backend.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private final JwtUtil jwtUtil = new JwtUtil(
            "c2dpcC1iYWNrZW5kLWp3dC1zZWNyZXQta2V5LTIwMjUtbWV0cm9pY2Etc2VndXJv",
            86400000L
    );

    @Test
    void debeGenerarTokenConClaimsCorrectos() {
        var userId = java.util.UUID.randomUUID();
        String token = jwtUtil.generateToken(userId, "test@metroica.com", "OPERARIO");

        assertNotNull(token);
        assertEquals("test@metroica.com", jwtUtil.extractEmail(token));
        assertEquals(userId.toString(), jwtUtil.extractUserId(token));
        assertEquals("OPERARIO", jwtUtil.extractRol(token));
        assertTrue(jwtUtil.isTokenValid(token));
    }

    @Test
    void tokenExpiradoDebeSerInvalido() {
        JwtUtil jwtExpirado = new JwtUtil(
                "c2dpcC1iYWNrZW5kLWp3dC1zZWNyZXQta2V5LTIwMjUtbWV0cm9pY2Etc2VndXJv",
                -1000L
        );
        String token = jwtExpirado.generateToken(
                java.util.UUID.randomUUID(), "test@metroica.com", "OPERARIO");
        assertFalse(jwtUtil.isTokenValid(token));
    }

    @Test
    void tokenInvalidoDebeRetornarFalse() {
        assertFalse(jwtUtil.isTokenValid("token.falso.invalido"));
        assertFalse(jwtUtil.isTokenValid(""));
        assertFalse(jwtUtil.isTokenValid(null));
    }

    @Test
    void debeGenerarTokensConDiferentesRoles() {
        var userId = java.util.UUID.randomUUID();
        String tokenAdmin = jwtUtil.generateToken(userId, "admin@metroica.com", "ADMINISTRADOR");
        assertEquals("ADMINISTRADOR", jwtUtil.extractRol(tokenAdmin));

        String tokenGerente = jwtUtil.generateToken(userId, "gerente@metroica.com", "GERENTE");
        assertEquals("GERENTE", jwtUtil.extractRol(tokenGerente));
    }
}
