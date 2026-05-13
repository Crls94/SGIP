package com.metroica.sgip_backend.seguridad;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<List<UsuarioResponseDTO>> listarUsuarios() {
        return ResponseEntity.ok(usuarioService.listarUsuarios().stream()
                .map(this::toDTO)
                .toList());
    }

    @PatchMapping("/{id}/rol")
    public ResponseEntity<UsuarioResponseDTO> cambiarRol(@PathVariable UUID id, @Valid @RequestBody CambiarRolDTO dto) {
        return ResponseEntity.ok(toDTO(usuarioService.cambiarRol(id, dto.getRol())));
    }

    @PatchMapping("/{id}/desactivar")
    public ResponseEntity<Void> desactivarUsuario(@PathVariable UUID id) {
        usuarioService.desactivarUsuario(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/activar")
    public ResponseEntity<UsuarioResponseDTO> activarUsuario(@PathVariable UUID id) {
        return ResponseEntity.ok(toDTO(usuarioService.activarUsuario(id)));
    }

    private UsuarioResponseDTO toDTO(Usuario u) {
        UsuarioResponseDTO dto = new UsuarioResponseDTO();
        dto.setId(u.getId());
        dto.setNombre(u.getNombre());
        dto.setApellido(u.getApellido());
        dto.setEmail(u.getEmail());
        dto.setRol(u.getRol().name());
        dto.setActivo(u.getActivo());
        dto.setUltimoLogin(u.getUltimoLogin());
        dto.setCreatedAt(u.getCreatedAt());
        return dto;
    }
}