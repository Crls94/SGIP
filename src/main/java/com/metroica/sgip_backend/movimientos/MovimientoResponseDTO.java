package com.metroica.sgip_backend.movimientos;

import com.metroica.sgip_backend.shared.enums.TipoMovimiento;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MovimientoResponseDTO {
    private UUID id;
    private UUID productoId;
    private String productoNombre;
    private String productoSku;
    private TipoMovimiento tipo;
    private Integer cantidad;
    private Integer stockAntes;
    private Integer stockDespues;
    private String motivo;
    private String referencia;
    private LocalDateTime fecha;

    public static MovimientoResponseDTO fromEntity(InventarioMovimiento movimiento) {
        return MovimientoResponseDTO.builder()
                .id(movimiento.getId())
                .productoId(movimiento.getProducto().getId())
                .productoNombre(movimiento.getProducto().getNombre())
                .productoSku(movimiento.getProducto().getSku())
                .tipo(movimiento.getTipo())
                .cantidad(movimiento.getCantidad())
                .stockAntes(movimiento.getStockAntes())
                .stockDespues(movimiento.getStockDespues())
                .motivo(movimiento.getMotivo())
                .referencia(movimiento.getReferencia())
                .fecha(movimiento.getFecha())
                .build();
    }
}
