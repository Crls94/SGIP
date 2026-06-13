package com.metroica.sgip_backend.inteligencia;

import com.metroica.sgip_backend.movimientos.InventarioMovimiento;
import org.springframework.stereotype.Component;

@Component
public class MovimientoExportMapper {

    public MovimientoExportDTO toDTO(InventarioMovimiento movimiento) {
        MovimientoExportDTO dto = new MovimientoExportDTO();
        dto.setProductoId(movimiento.getProducto().getId());
        dto.setSku(movimiento.getProducto().getSku());
        dto.setProductoNombre(movimiento.getProducto().getNombre());
        dto.setCategoriaNombre(movimiento.getProducto().getCategoria() != null
                ? movimiento.getProducto().getCategoria().getNombre()
                : null);
        dto.setStockActual(movimiento.getProducto().getStockActual());
        dto.setPuntoPedido(movimiento.getProducto().getPuntoPedido());
        dto.setCantidad(movimiento.getCantidad());
        dto.setFecha(movimiento.getFecha());
        return dto;
    }
}
