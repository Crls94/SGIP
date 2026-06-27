package com.metroica.sgip_backend.config;

import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private static final RateLimit LOGIN_LIMIT = new RateLimit(10, Duration.ofMinutes(1));
    private static final RateLimit PEDIDOS_LIMIT = new RateLimit(30, Duration.ofMinutes(1));
    private static final RateLimit MOVIMIENTOS_LIMIT = new RateLimit(60, Duration.ofMinutes(1));
    private static final RateLimit REPORTES_LIMIT = new RateLimit(20, Duration.ofMinutes(1));
    private static final RateLimit IA_ALERTAS_LIMIT = new RateLimit(10, Duration.ofMinutes(1));
    private static final RateLimit IA_DATOS_LIMIT = new RateLimit(30, Duration.ofMinutes(1));
    private static final RateLimit API_GENERAL_LIMIT = new RateLimit(100, Duration.ofMinutes(1));

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                             Object handler) throws Exception {
        String path = request.getRequestURI();
        String method = request.getMethod();
        RateLimit limit = resolveLimit(path, method);

        if (limit == null) {
            return true;
        }

        String key = resolveKey(request, method, path);
        Bucket bucket = buckets.computeIfAbsent(key, k -> createBucket(limit));
        if (bucket.tryConsume(1)) {
            return true;
        }

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"Demasiadas solicitudes. Intente de nuevo en unos segundos.\"}");
        return false;
    }

    private String resolveKey(HttpServletRequest request, String method, String path) {
        String authHeader = request.getHeader("Authorization");
        String identity;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            identity = "jwt:" + Integer.toHexString(authHeader.substring(7).hashCode());
        } else {
            identity = "ip:" + request.getRemoteAddr();
        }
        return identity + ":" + method + ":" + normalizePath(path);
    }

    private RateLimit resolveLimit(String path, String method) {
        if ("POST".equals(method) && "/api/v1/auth/login".equals(path)) {
            return LOGIN_LIMIT;
        }
        if ("POST".equals(method) && path.startsWith("/api/v1/pedidos")) {
            return PEDIDOS_LIMIT;
        }
        if ("POST".equals(method) && path.startsWith("/api/v1/movimientos")) {
            return MOVIMIENTOS_LIMIT;
        }
        if ("GET".equals(method) && path.startsWith("/api/v1/reportes")) {
            return REPORTES_LIMIT;
        }
        if ("POST".equals(method) && "/api/v1/inteligencia/alertas-predictivas/generar".equals(path)) {
            return IA_ALERTAS_LIMIT;
        }
        if ("GET".equals(method) && "/api/v1/inteligencia/datos-entrenamiento".equals(path)) {
            return IA_DATOS_LIMIT;
        }
        if (path.startsWith("/api/v1/")) {
            return API_GENERAL_LIMIT;
        }
        return null;
    }

    private Bucket createBucket(RateLimit rateLimit) {
        return Bucket.builder()
                .addLimit(limit -> limit.capacity(rateLimit.capacity())
                        .refillIntervally(rateLimit.capacity(), rateLimit.period())
                        .initialTokens(rateLimit.capacity()))
                .build();
    }

    private String normalizePath(String path) {
        return path
                .replaceAll("/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}", "/{id}")
                .replaceAll("/\\d+", "/{id}");
    }

    private record RateLimit(long capacity, Duration period) {
    }
}
