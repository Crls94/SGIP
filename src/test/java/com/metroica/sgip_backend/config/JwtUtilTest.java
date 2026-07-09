package com.metroica.sgip_backend.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private final JwtUtil jwtUtil = new JwtUtil(
            "dev-only-jwt-secret-change-me-32chars",
            86400000L
    );

    @Test
    void debeGenerarTokenConClaimsCorrectos() {
        // Cambios 17/07: Prueba de seguridad asociada al RF-01 Autenticacion.
        // Verifica que el JWT transporte email, id de usuario y rol para autorizacion.

        // Preparacion: se define el identificador del usuario y sus datos de sesion.
        var userId = java.util.UUID.randomUUID();

        // Ejecucion: se genera un token con los claims necesarios para SGIP.
        String token = jwtUtil.generateToken(userId, "test@metroica.com", "OPERARIO");

        // Validacion: el token existe, conserva sus claims y es considerado valido.
        assertNotNull(token);
        assertEquals("test@metroica.com", jwtUtil.extractEmail(token));
        assertEquals(userId.toString(), jwtUtil.extractUserId(token));
        assertEquals("OPERARIO", jwtUtil.extractRol(token));
        assertTrue(jwtUtil.isTokenValid(token));
    }

    @Test
    void tokenExpiradoDebeSerInvalido() {
        // Cambios 17/07: Prueba de seguridad asociada al RNF Seguridad.
        // Asegura que un token vencido no sea aceptado por el sistema.

        // Preparacion: se crea una utilidad JWT con tiempo de expiracion negativo para simular vencimiento.
        JwtUtil jwtExpirado = new JwtUtil(
                "dev-only-jwt-secret-change-me-32chars",
                -1000L
        );

        // Ejecucion: se genera un token que nace expirado.
        String token = jwtExpirado.generateToken(
                java.util.UUID.randomUUID(), "test@metroica.com", "OPERARIO");

        // Validacion: la utilidad normal debe rechazar el token vencido.
        assertFalse(jwtUtil.isTokenValid(token));
    }

    @Test
    void tokenInvalidoDebeRetornarFalse() {
        // Cambios 17/07: Prueba de seguridad asociada al RNF Seguridad.
        // Comprueba el rechazo de tokens falsos, vacios o nulos.

        // Validacion: cada variante invalida debe responder false sin romper la aplicacion.
        assertFalse(jwtUtil.isTokenValid("token.falso.invalido"));
        assertFalse(jwtUtil.isTokenValid(""));
        assertFalse(jwtUtil.isTokenValid(null));
    }

    @Test
    void debeGenerarTokensConDiferentesRoles() {
        // Cambios 17/07: Prueba asociada al RF-01 Autenticacion por roles.
        // Valida la diferenciacion entre perfiles como administrador y gerente.

        // Preparacion: se reutiliza el mismo usuario para validar tokens con roles distintos.
        var userId = java.util.UUID.randomUUID();

        // Ejecucion y validacion: el token de administrador debe conservar ese rol.
        String tokenAdmin = jwtUtil.generateToken(userId, "admin@metroica.com", "ADMINISTRADOR");
        assertEquals("ADMINISTRADOR", jwtUtil.extractRol(tokenAdmin));

        // Ejecucion y validacion: el token de gerente debe conservar el rol gerencial.
        String tokenGerente = jwtUtil.generateToken(userId, "gerente@metroica.com", "GERENTE");
        assertEquals("GERENTE", jwtUtil.extractRol(tokenGerente));
    }
}
