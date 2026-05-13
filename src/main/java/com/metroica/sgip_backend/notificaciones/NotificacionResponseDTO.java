package com.metroica.sgip_backend.notificaciones;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class NotificacionResponseDTO {

    private UUID id;
    private String titulo;
    private String mensaje;
    private Boolean leida;
    private String tipo;
    private LocalDateTime createdAt;

    public NotificacionResponseDTO() {}

    public NotificacionResponseDTO(UUID id, String titulo, String mensaje,
                                    Boolean leida, String tipo, LocalDateTime createdAt) {
        this.id = id;
        this.titulo = titulo;
        this.mensaje = mensaje;
        this.leida = leida;
        this.tipo = tipo;
        this.createdAt = createdAt;
    }
}