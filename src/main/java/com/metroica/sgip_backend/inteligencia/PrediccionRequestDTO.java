package com.metroica.sgip_backend.inteligencia;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class PrediccionRequestDTO {

    @NotNull(message = "El producto es obligatorio")
    private UUID productoId;

    @NotNull(message = "La semana de inicio es obligatoria")
    private LocalDate semanaInicio;

    @NotNull(message = "La cantidad predicha es obligatoria")
    @Min(value = 0, message = "La cantidad predicha no puede ser negativa")
    private Integer cantidadPredicha;

    @DecimalMin(value = "0.0", message = "La confianza no puede ser negativa")
    @DecimalMax(value = "1.0", message = "La confianza no puede superar 1.0")
    private BigDecimal confianza;

    private String modeloVersion;
}
