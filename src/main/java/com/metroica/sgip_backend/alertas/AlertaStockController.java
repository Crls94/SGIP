package com.metroica.sgip_backend.alertas;

import com.metroica.sgip_backend.shared.enums.EstadoAlerta;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/alertas")
@RequiredArgsConstructor
public class AlertaStockController {

    private final AlertaStockService alertaStockService;

    @GetMapping("/activas")
    public ResponseEntity<List<AlertaStockResponseDTO>> listarAlertasActivas() {
        return ResponseEntity.ok(alertaStockService.listarActivas());
    }

    @PatchMapping("/{id}/resolver")
    public ResponseEntity<AlertaStockResponseDTO> resolverAlerta(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "RESUELTA") EstadoAlerta estado) {
        return ResponseEntity.ok(alertaStockService.resolverAlerta(id, estado));
    }
}
