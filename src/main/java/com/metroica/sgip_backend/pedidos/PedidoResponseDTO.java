package com.metroica.sgip_backend.pedidos;

import com.metroica.sgip_backend.shared.enums.CanalPedido;
import com.metroica.sgip_backend.shared.enums.EstadoPedido;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class PedidoResponseDTO {
    private UUID id;
    private Integer numero;
    private CanalPedido canal;
    private EstadoPedido estado;
    private Integer prioridad;
    private BigDecimal total;
    private LocalDateTime fechaIngreso;
    private String clienteNombre;
    private String clienteTelefono;
    private String clienteDireccion;
    private String observaciones;
    private List<ItemDTO> items;

    @Data
    public static class ItemDTO {
        private final UUID productoId;
        private final String productoNombre;
        private final Integer cantidad;
        private final BigDecimal precioUnitario;
        private final BigDecimal subtotal;
    }
}
