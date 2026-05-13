package com.metroica.sgip_backend.seguridad;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class UsuarioPrincipalTest {

    @Test
    void debeCrearPrincipalConTodosLosCampos() {
        UUID id = UUID.randomUUID();
        UsuarioPrincipal principal = new UsuarioPrincipal(id, "test@test.com", "OPERARIO", "Test User");

        assertEquals(id, principal.getId());
        assertEquals("test@test.com", principal.getEmail());
        assertEquals("OPERARIO", principal.getRol());
        assertEquals("Test User", principal.getNombre());
    }
}
