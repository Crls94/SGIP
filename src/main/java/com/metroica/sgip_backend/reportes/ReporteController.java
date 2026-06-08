package com.metroica.sgip_backend.reportes;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteService reporteService;

    @GetMapping
    public List<ReporteDTO> listarReportes() {
        return reporteService.listarReportes();
    }

    @GetMapping("/{id}/descargar")
    public ResponseEntity<byte[]> descargarReporte(@PathVariable UUID id) {
        try {
            byte[] contenido = reporteService.descargarReporte(id);
            String contentType = reporteService.getContentType(id);
            String filename = reporteService.getFilename(id);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(contenido);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/inventario")
    public ResponseEntity<byte[]> reporteInventario(@RequestParam(defaultValue = "xlsx") String formato) {
        byte[] contenido = reporteService.generarReporteInventario(formato);
        String contentType = "pdf".equalsIgnoreCase(formato) ?
                MediaType.APPLICATION_PDF_VALUE :
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        String filename = "inventario." + ("pdf".equalsIgnoreCase(formato) ? "pdf" : "xlsx");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType(contentType))
                .body(contenido);
    }

    @GetMapping("/pedidos")
    public ResponseEntity<byte[]> reportePedidos(
            @RequestParam(defaultValue = "xlsx") String formato,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaHasta) {
        byte[] contenido = reporteService.generarReportePedidos(formato, fechaDesde, fechaHasta);
        String contentType = "pdf".equalsIgnoreCase(formato) ?
                MediaType.APPLICATION_PDF_VALUE :
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        String filename = "pedidos." + ("pdf".equalsIgnoreCase(formato) ? "pdf" : "xlsx");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType(contentType))
                .body(contenido);
    }
}