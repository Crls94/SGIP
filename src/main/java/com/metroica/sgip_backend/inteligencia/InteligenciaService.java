package com.metroica.sgip_backend.inteligencia;

import com.metroica.sgip_backend.alertas.AlertaStock;
import com.metroica.sgip_backend.alertas.AlertaStockMapper;
import com.metroica.sgip_backend.alertas.AlertaStockRepository;
import com.metroica.sgip_backend.alertas.AlertaStockResponseDTO;
import com.metroica.sgip_backend.movimientos.MovimientoRepository;
import com.metroica.sgip_backend.notificaciones.NotificacionService;
import com.metroica.sgip_backend.productos.Producto;
import com.metroica.sgip_backend.productos.ProductoRepository;
import com.metroica.sgip_backend.seguridad.Usuario;
import com.metroica.sgip_backend.seguridad.UsuarioRepository;
import com.metroica.sgip_backend.shared.enums.EstadoAlerta;
import com.metroica.sgip_backend.shared.enums.RolUsuario;
import com.metroica.sgip_backend.shared.enums.TipoMovimiento;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
    private final AlertaStockRepository alertaStockRepository;
    private final AlertaStockMapper alertaStockMapper;
    private final NotificacionService notificacionService;
    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;

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

    @Transactional
    public PrediccionResponseDTO guardarPrediccion(PrediccionRequestDTO dto) {
        Producto producto = productoRepository.findById(dto.getProductoId())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + dto.getProductoId()));

        PrediccionDemanda prediccion = prediccionRepository
                .findByProductoIdAndSemanaInicio(dto.getProductoId(), dto.getSemanaInicio())
                .orElseGet(PrediccionDemanda::new);

        prediccion.setProducto(producto);
        prediccion.setSemanaInicio(dto.getSemanaInicio());
        prediccion.setSemanaFin(dto.getSemanaInicio().plusDays(6));
        prediccion.setCantidadPredicha(dto.getCantidadPredicha());
        prediccion.setConfianza(dto.getConfianza());
        prediccion.setModeloVersion(dto.getModeloVersion() == null || dto.getModeloVersion().isBlank()
                ? "v1.0-linreg"
                : dto.getModeloVersion().trim());

        return toDTO(prediccionRepository.save(prediccion));
    }

    @Transactional(readOnly = true)
    public PrediccionDemanda obtenerUltimaPrediccion() {
        return prediccionRepository.findFirstByOrderByGeneradoEnDesc().orElse(null);
    }

    @Transactional
    public List<AlertaStockResponseDTO> generarAlertasPredictivas() {
        return prediccionRepository.findUltimasPredicciones()
                .stream()
                .filter(this::requiereAlertaPredictiva)
                .filter(this::noTieneAlertaPredictivaActiva)
                .map(this::crearAlertaPredictiva)
                .map(alertaStockMapper::toResponseDTO)
                .collect(Collectors.toList());
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
        completarPrecisionReal(dto, p);
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

    private void completarPrecisionReal(PrediccionResponseDTO dto, PrediccionDemanda p) {
        if (p.getProducto() == null || p.getSemanaInicio() == null || p.getSemanaFin() == null
                || LocalDate.now().isBefore(p.getSemanaFin())) {
            return;
        }

        Integer cantidadReal = p.getCantidadReal();
        if (cantidadReal == null) {
            Long totalReal = movimientoRepository.sumCantidadByProductoAndTipoBetween(
                    p.getProducto().getId(),
                    TipoMovimiento.SALIDA,
                    p.getSemanaInicio().atStartOfDay(),
                    p.getSemanaFin().plusDays(1).atStartOfDay());
            cantidadReal = totalReal == null ? 0 : totalReal.intValue();
        }

        BigDecimal error = p.getErrorPorcentaje();
        if (error == null) {
            error = calcularErrorPorcentaje(p.getCantidadPredicha(), cantidadReal);
        }

        dto.setCantidadReal(cantidadReal);
        dto.setErrorPorcentaje(error);
        dto.setPrecisionPorcentaje(BigDecimal.valueOf(100).subtract(error).max(BigDecimal.ZERO));
    }

    private BigDecimal calcularErrorPorcentaje(Integer predicho, Integer real) {
        int demandaPredicha = predicho == null ? 0 : predicho;
        int demandaReal = real == null ? 0 : real;
        if (demandaPredicha == 0) {
            return demandaReal == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(100);
        }
        return BigDecimal.valueOf(Math.abs(demandaReal - demandaPredicha) * 100.0 / demandaPredicha)
                .setScale(2, RoundingMode.HALF_UP);
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

    private boolean requiereAlertaPredictiva(PrediccionDemanda prediccion) {
        Producto producto = prediccion.getProducto();
        if (producto == null || producto.getStockActual() == null || prediccion.getCantidadPredicha() == null) {
            return false;
        }
        String riesgo = calcularRiesgo(producto.getStockActual(), producto.getPuntoPedido(), prediccion.getCantidadPredicha());
        return "ALTO".equals(riesgo) || "MEDIO".equals(riesgo);
    }

    private boolean noTieneAlertaPredictivaActiva(PrediccionDemanda prediccion) {
        return !alertaStockRepository.existsByProductoAndEstadoAndOrigenAndSemanaInicio(
                prediccion.getProducto(), EstadoAlerta.ACTIVA, "IA_PREDICTIVA", prediccion.getSemanaInicio());
    }

    private AlertaStock crearAlertaPredictiva(PrediccionDemanda prediccion) {
        Producto producto = prediccion.getProducto();
        int stockActual = producto.getStockActual() == null ? 0 : producto.getStockActual();
        int demanda = prediccion.getCantidadPredicha() == null ? 0 : prediccion.getCantidadPredicha();
        int faltante = Math.max(0, demanda - stockActual);

        AlertaStock alerta = new AlertaStock();
        alerta.setProducto(producto);
        alerta.setStockAlGenerar(stockActual);
        alerta.setPuntoPedidoReferencia(producto.getPuntoPedido());
        alerta.setOrigen("IA_PREDICTIVA");
        alerta.setPrediccion(prediccion);
        alerta.setCantidadPredicha(demanda);
        alerta.setFaltanteEstimado(faltante);
        alerta.setSemanaInicio(prediccion.getSemanaInicio());
        alerta.setSemanaFin(prediccion.getSemanaFin());
        alerta.setEstado(EstadoAlerta.ACTIVA);
        alerta.setMensaje(crearMensajePredictivo(producto, demanda, faltante, stockActual));

        AlertaStock guardada = alertaStockRepository.save(alerta);
        try {
            notificarRiesgoPredictivo(producto, guardada.getMensaje());
        } catch (Exception ignored) {
            // La alerta operativa no debe fallar si no se pudo emitir la notificacion auxiliar.
        }
        return guardada;
    }

    private String crearMensajePredictivo(Producto producto, int demanda, int faltante, int stockActual) {
        if (faltante > 0) {
            return String.format("La IA estima una demanda de %d unidades para %s. Stock actual: %d. Faltante estimado: %d.",
                    demanda, producto.getNombre(), stockActual, faltante);
        }
        return String.format("La IA estima una demanda de %d unidades para %s y el stock quedaria cerca del punto de pedido.",
                demanda, producto.getNombre());
    }

    private void notificarRiesgoPredictivo(Producto producto, String mensaje) {
        String titulo = "Riesgo predictivo de stock: " + producto.getNombre();
        List<Usuario> admins = usuarioRepository.findByRolAndActivoTrue(RolUsuario.ADMINISTRADOR);
        for (Usuario admin : admins) {
            notificacionService.crearNotificacion(admin.getId(), titulo, mensaje, "ALERTA_IA", admin.getEmail());
        }
    }
}
