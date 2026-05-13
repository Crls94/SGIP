package com.metroica.sgip_backend.dashboard;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class VentaDiariaDTO {
    private LocalDate fecha;
    private BigDecimal total;
    private Integer cantidad;
}
