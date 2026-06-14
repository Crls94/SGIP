package com.metroica.sgip_backend.alertas;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class AlertaStockResponseDTO {
    private UUID id;
    private String productoNombre;
    private Integer stockAlGenerar;
    private Integer puntoPedidoReferencia;
    private String origen;
    private Integer cantidadPredicha;
    private Integer faltanteEstimado;
    private LocalDate semanaInicio;
    private LocalDate semanaFin;
    private String mensaje;
    private String estado;
    private LocalDateTime fechaGenerada;
}
