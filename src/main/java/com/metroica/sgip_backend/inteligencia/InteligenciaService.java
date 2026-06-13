package com.metroica.sgip_backend.inteligencia;

import com.metroica.sgip_backend.movimientos.MovimientoRepository;
import com.metroica.sgip_backend.shared.enums.TipoMovimiento;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
/**
 * Servicio de inteligencia de demanda.
 * Expone datos históricos de salida para entrenamiento y consulta predicciones almacenadas.
 */
public class InteligenciaService {

    private final MovimientoRepository movimientoRepository;
    private final MovimientoExportMapper mapper;
    private final PrediccionRepository prediccionRepository;

    @Transactional(readOnly = true)
    public List<MovimientoExportDTO> extraerDatosEntrenamiento() {
        return extraerDatosEntrenamiento(null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<MovimientoExportDTO> extraerDatosEntrenamiento(UUID productoId, String categoria,
                                                               LocalDate fechaDesde, LocalDate fechaHasta) {
        return movimientoRepository.findByTipoOrderByFechaAsc(TipoMovimiento.SALIDA)
                .stream()
                .filter(m -> matchesFilters(m, productoId, categoria, fechaDesde, fechaHasta))
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PrediccionResponseDTO> obtenerPredicciones() {
        return prediccionRepository.findUltimasPredicciones()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PrediccionDemanda obtenerUltimaPrediccion() {
        return prediccionRepository.findFirstByOrderByGeneradoEnDesc().orElse(null);
    }

    private PrediccionResponseDTO toDTO(PrediccionDemanda p) {
        PrediccionResponseDTO dto = new PrediccionResponseDTO();
        dto.setId(p.getId());
        dto.setProductoId(p.getProducto() != null ? p.getProducto().getId() : null);
        dto.setProductoNombre(p.getProducto() != null ? p.getProducto().getNombre() : null);
        dto.setSku(p.getProducto() != null ? p.getProducto().getSku() : null);
        dto.setCategoriaNombre(p.getProducto() != null && p.getProducto().getCategoria() != null
                ? p.getProducto().getCategoria().getNombre()
                : null);
        dto.setStockActual(p.getProducto() != null ? p.getProducto().getStockActual() : null);
        dto.setPuntoPedido(p.getProducto() != null ? p.getProducto().getPuntoPedido() : null);
        dto.setSemanaInicio(p.getSemanaInicio());
        dto.setSemanaFin(p.getSemanaFin());
        dto.setCantidadPredicha(p.getCantidadPredicha());
        dto.setCantidadReal(p.getCantidadReal());
        dto.setErrorPorcentaje(p.getErrorPorcentaje());
        dto.setConfianza(p.getConfianza());
        dto.setModeloVersion(p.getModeloVersion());
        dto.setGeneradoEn(p.getGeneradoEn());
        if (dto.getStockActual() != null && dto.getCantidadPredicha() != null) {
            int diferencia = dto.getStockActual() - dto.getCantidadPredicha();
            dto.setDiferenciaStockPrediccion(diferencia);
            dto.setRiesgo(calcularRiesgo(dto.getStockActual(), dto.getPuntoPedido(), dto.getCantidadPredicha()));
        }
        return dto;
    }

    private boolean matchesFilters(com.metroica.sgip_backend.movimientos.InventarioMovimiento movimiento,
                                   UUID productoId, String categoria, LocalDate fechaDesde, LocalDate fechaHasta) {
        if (productoId != null && !productoId.equals(movimiento.getProducto().getId())) {
            return false;
        }
        if (categoria != null && !categoria.isBlank()) {
            String nombreCategoria = movimiento.getProducto().getCategoria() != null
                    ? movimiento.getProducto().getCategoria().getNombre()
                    : "";
            if (!categoria.equalsIgnoreCase(nombreCategoria)) {
                return false;
            }
        }
        LocalDateTime fecha = movimiento.getFecha();
        if (fechaDesde != null && fecha.toLocalDate().isBefore(fechaDesde)) {
            return false;
        }
        return fechaHasta == null || !fecha.toLocalDate().isAfter(fechaHasta);
    }

    private String calcularRiesgo(Integer stockActual, Integer puntoPedido, Integer demandaPredicha) {
        if (demandaPredicha > stockActual) {
            return "ALTO";
        }
        if (stockActual - demandaPredicha <= Math.max(1, puntoPedido == null ? 0 : puntoPedido / 2)) {
            return "MEDIO";
        }
        return "BAJO";
    }
}
