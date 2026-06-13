package com.metroica.sgip_backend.inteligencia;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class MovimientoExportDTO {
    private UUID productoId;
    private String sku;
    private Integer cantidad;
    private LocalDateTime fecha;
    private String productoNombre;
    private String categoriaNombre;
    private Integer stockActual;
    private Integer puntoPedido;
}
