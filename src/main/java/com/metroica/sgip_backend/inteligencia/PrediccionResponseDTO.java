package com.metroica.sgip_backend.inteligencia;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class PrediccionResponseDTO {
    private UUID id;
    private UUID productoId;
    private String productoNombre;
    private LocalDate semanaInicio;
    private LocalDate semanaFin;
    private Integer cantidadPredicha;
    private Integer cantidadReal;
    private BigDecimal errorPorcentaje;
    private BigDecimal confianza;
    private String modeloVersion;
    private LocalDateTime generadoEn;
}
