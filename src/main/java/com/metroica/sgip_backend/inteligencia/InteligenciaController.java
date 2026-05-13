package com.metroica.sgip_backend.inteligencia;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inteligencia")
@RequiredArgsConstructor
public class InteligenciaController {

    private final InteligenciaService inteligenciaService;

    @GetMapping("/datos-entrenamiento")
    public ResponseEntity<List<MovimientoExportDTO>> obtenerDatos() {
        return ResponseEntity.ok(inteligenciaService.extraerDatosEntrenamiento());
    }

    @GetMapping("/predicciones")
    public ResponseEntity<List<PrediccionResponseDTO>> obtenerPredicciones() {
        return ResponseEntity.ok(inteligenciaService.obtenerPredicciones());
    }
}