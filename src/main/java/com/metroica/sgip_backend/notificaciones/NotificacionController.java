package com.metroica.sgip_backend.notificaciones;

import com.metroica.sgip_backend.seguridad.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionService notificacionService;

    @GetMapping
    public ResponseEntity<List<NotificacionResponseDTO>> listar() {
        UUID usuarioId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(notificacionService.listarPorUsuario(usuarioId));
    }

    @GetMapping("/no-leidas")
    public ResponseEntity<Map<String, Long>> contarNoLeidas() {
        UUID usuarioId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(Map.of("count", notificacionService.contarNoLeidas(usuarioId)));
    }

    @PatchMapping("/{id}/leer")
    public ResponseEntity<NotificacionResponseDTO> marcarLeida(@PathVariable UUID id) {
        UUID usuarioId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(notificacionService.marcarLeida(id, usuarioId));
    }
}