package com.metroica.sgip_backend.inteligencia;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inteligencia")
@RequiredArgsConstructor
public class InteligenciaController {

    private final InteligenciaService inteligenciaService;

    @GetMapping("/datos-entrenamiento")
    public ResponseEntity<List<MovimientoExportDTO>> obtenerDatos(
            @RequestParam(required = false) UUID productoId,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta) {
        return ResponseEntity.ok(inteligenciaService.extraerDatosEntrenamiento(productoId, categoria, fechaDesde, fechaHasta));
    }

    @GetMapping("/predicciones")
    public ResponseEntity<List<PrediccionResponseDTO>> obtenerPredicciones() {
        return ResponseEntity.ok(inteligenciaService.obtenerPredicciones());
    }
}
