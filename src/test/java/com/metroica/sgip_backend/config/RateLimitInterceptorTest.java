package com.metroica.sgip_backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RateLimitInterceptorTest {

    private final RateLimitInterceptor interceptor = new RateLimitInterceptor();

    @Test
    void loginDebeBloquearDespuesDelLimitePorIp() throws Exception {
        for (int i = 0; i < 10; i++) {
            assertTrue(preHandle("POST", "/api/v1/auth/login", null));
        }

        MockHttpServletResponse response = responseAfterPreHandle("POST", "/api/v1/auth/login", null);

        assertEquals(429, response.getStatus());
        assertFalse(response.getContentAsString().isBlank());
    }

    @Test
    void pedidosYMovimientosNoCompartenBucket() throws Exception {
        String token = "token-operario";
        for (int i = 0; i < 30; i++) {
            assertTrue(preHandle("POST", "/api/v1/pedidos", token));
        }

        assertEquals(429, responseAfterPreHandle("POST", "/api/v1/pedidos", token).getStatus());
        assertTrue(preHandle("POST", "/api/v1/movimientos", token));
    }

    @Test
    void apiGeneralDebePermitirCienSolicitudesPorRutaYUsuario() throws Exception {
        String token = "token-gerente";
        for (int i = 0; i < 100; i++) {
            assertTrue(preHandle("GET", "/api/v1/dashboard", token));
        }

        assertEquals(429, responseAfterPreHandle("GET", "/api/v1/dashboard", token).getStatus());
    }

    @Test
    void rutasFueraDeApiNoDebenLimitarse() throws Exception {
        for (int i = 0; i < 120; i++) {
            assertTrue(preHandle("GET", "/", null));
        }
    }

    private boolean preHandle(String method, String path, String token) throws Exception {
        MockHttpServletResponse response = responseAfterPreHandle(method, path, token);
        return response.getStatus() != 429;
    }

    private MockHttpServletResponse responseAfterPreHandle(String method, String path, String token) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setRemoteAddr("192.168.1.10");
        if (token != null) {
            request.addHeader("Authorization", "Bearer " + token);
        }
        MockHttpServletResponse response = new MockHttpServletResponse();
        interceptor.preHandle(request, response, new Object());
        return response;
    }
}
