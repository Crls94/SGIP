package com.metroica.sgip_backend.seguridad;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/seguridad")
@RequiredArgsConstructor
public class SeguridadVerificacionController {

    private final UsuarioRepository usuarioRepository;

    @GetMapping("/verificacion")
    public ResponseEntity<Map<String, Object>> verificar() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UsuarioPrincipal principal = auth != null && auth.getPrincipal() instanceof UsuarioPrincipal usuario
                ? usuario
                : null;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("timestamp", LocalDateTime.now());
        result.put("autenticado", principal != null && auth.isAuthenticated());
        result.put("jwtProcesado", principal != null);
        result.put("usuarioId", principal != null ? principal.getId() : null);
        result.put("email", principal != null ? principal.getEmail() : null);
        result.put("rol", principal != null ? principal.getRol() : null);
        result.put("permisoAdmin", SecurityUtils.hasRole("ADMINISTRADOR"));
        result.put("permisoOperario", SecurityUtils.hasRole("OPERARIO"));
        result.put("permisoGerente", SecurityUtils.hasRole("GERENTE"));
        result.put("baseDatosAccesible", usuarioRepository.count() >= 0);
        result.put("usuariosRegistrados", usuarioRepository.count());
        return ResponseEntity.ok(result);
    }
}
