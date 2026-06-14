package com.metroica.sgip_backend.alertas;

import com.metroica.sgip_backend.alertas.AlertaStock;
import com.metroica.sgip_backend.alertas.AlertaStockResponseDTO;
import org.springframework.stereotype.Service;

@Service
public class AlertaStockMapper {

    public AlertaStockResponseDTO toResponseDTO(AlertaStock alerta) {
        AlertaStockResponseDTO dto = new AlertaStockResponseDTO();
        dto.setId(alerta.getId());
        dto.setProductoNombre(alerta.getProducto() != null ? alerta.getProducto().getNombre() : null);
        dto.setStockAlGenerar(alerta.getStockAlGenerar());
        dto.setPuntoPedidoReferencia(alerta.getPuntoPedidoReferencia());
        dto.setOrigen(alerta.getOrigen());
        dto.setCantidadPredicha(alerta.getCantidadPredicha());
        dto.setFaltanteEstimado(alerta.getFaltanteEstimado());
        dto.setSemanaInicio(alerta.getSemanaInicio());
        dto.setSemanaFin(alerta.getSemanaFin());
        dto.setMensaje(alerta.getMensaje());
        dto.setEstado(alerta.getEstado() != null ? alerta.getEstado().name() : null);
        dto.setFechaGenerada(alerta.getFechaGenerada());
        return dto;
    }
}
