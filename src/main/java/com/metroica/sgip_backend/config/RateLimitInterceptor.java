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

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                             Object handler) throws Exception {
        String path = request.getRequestURI();
        String method = request.getMethod();
        String key = resolveKey(request);

        if (!isRateLimited(path, method)) {
            return true;
        }

        Bucket bucket = buckets.computeIfAbsent(key, k -> createBucket(path));
        if (bucket.tryConsume(1)) {
            return true;
        }

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"Demasiadas solicitudes. Intente de nuevo en unos segundos.\"}");
        return false;
    }

    private String resolveKey(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return "jwt:" + authHeader.substring(7).substring(0, Math.min(20, authHeader.length() - 7));
        }
        return "ip:" + request.getRemoteAddr();
    }

    private boolean isRateLimited(String path, String method) {
        if (path.contains("/api/v1/pedidos") && "POST".equals(method)) return true;
        if (path.contains("/api/v1/movimientos") && "POST".equals(method)) return true;
        return false;
    }

    private Bucket createBucket(String path) {
        if (path.contains("/api/v1/pedidos")) {
            return Bucket.builder()
                    .addLimit(limit -> limit.capacity(3).refillIntervally(1, Duration.ofSeconds(2)).initialTokens(3))
                    .build();
        }
        if (path.contains("/api/v1/movimientos")) {
            return Bucket.builder()
                    .addLimit(limit -> limit.capacity(5).refillIntervally(5, Duration.ofSeconds(1)).initialTokens(5))
                    .build();
        }
        return Bucket.builder()
                .addLimit(limit -> limit.capacity(20).refillIntervally(20, Duration.ofSeconds(1)).initialTokens(20))
                .build();
    }
}
