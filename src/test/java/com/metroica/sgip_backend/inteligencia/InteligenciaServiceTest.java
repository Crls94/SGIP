package com.metroica.sgip_backend.inteligencia;

import com.metroica.sgip_backend.alertas.AlertaStock;
import com.metroica.sgip_backend.alertas.AlertaStockMapper;
import com.metroica.sgip_backend.alertas.AlertaStockRepository;
import com.metroica.sgip_backend.movimientos.MovimientoRepository;
import com.metroica.sgip_backend.notificaciones.NotificacionService;
import com.metroica.sgip_backend.productos.Producto;
import com.metroica.sgip_backend.productos.ProductoRepository;
import com.metroica.sgip_backend.seguridad.UsuarioRepository;
import com.metroica.sgip_backend.shared.enums.EstadoAlerta;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InteligenciaServiceTest {

    @Mock
    private MovimientoRepository movimientoRepository;

    @Mock
    private MovimientoExportMapper mapper;

    @Mock
    private PrediccionRepository prediccionRepository;

    @Mock
    private AlertaStockRepository alertaStockRepository;

    @Spy
    private AlertaStockMapper alertaStockMapper;

    @Mock
    private NotificacionService notificacionService;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private ProductoRepository productoRepository;

    @InjectMocks
    private InteligenciaService inteligenciaService;

    @Test
    void guardarPrediccionCreaRegistroConSemanaFinYModeloPorDefecto() {
        UUID productoId = UUID.randomUUID();
        Producto producto = producto(productoId, "Arroz Extra", 20, 5);
        PrediccionRequestDTO request = prediccionRequest(productoId, LocalDate.of(2026, 7, 6), 12, null);

        when(productoRepository.findById(productoId)).thenReturn(Optional.of(producto));
        when(prediccionRepository.findByProductoIdAndSemanaInicio(productoId, request.getSemanaInicio()))
                .thenReturn(Optional.empty());
        when(prediccionRepository.save(any(PrediccionDemanda.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PrediccionResponseDTO response = inteligenciaService.guardarPrediccion(request);

        assertEquals(productoId, response.getProductoId());
        assertEquals(LocalDate.of(2026, 7, 12), response.getSemanaFin());
        assertEquals("v1.0-linreg", response.getModeloVersion());
        assertEquals("BAJO", response.getRiesgo());
        verify(prediccionRepository).save(argThat(prediccion ->
                prediccion.getProducto() == producto
                        && prediccion.getCantidadPredicha() == 12
                        && "v1.0-linreg".equals(prediccion.getModeloVersion())));
    }

    @Test
    void guardarPrediccionActualizaRegistroExistenteParaProductoYSemana() {
        UUID productoId = UUID.randomUUID();
        Producto producto = producto(productoId, "Leche Gloria", 10, 3);
        LocalDate semana = LocalDate.of(2026, 7, 13);
        PrediccionDemanda existente = new PrediccionDemanda();
        existente.setProducto(producto);
        existente.setSemanaInicio(semana);
        existente.setCantidadPredicha(4);
        existente.setModeloVersion("modelo-antiguo");
        PrediccionRequestDTO request = prediccionRequest(productoId, semana, 11, " v2-demo ");

        when(productoRepository.findById(productoId)).thenReturn(Optional.of(producto));
        when(prediccionRepository.findByProductoIdAndSemanaInicio(productoId, semana)).thenReturn(Optional.of(existente));
        when(prediccionRepository.save(any(PrediccionDemanda.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PrediccionResponseDTO response = inteligenciaService.guardarPrediccion(request);

        assertEquals(11, existente.getCantidadPredicha());
        assertEquals("v2-demo", existente.getModeloVersion());
        assertEquals("ALTO", response.getRiesgo());
    }

    @Test
    void guardarPrediccionRechazaProductoInexistente() {
        UUID productoId = UUID.randomUUID();
        PrediccionRequestDTO request = prediccionRequest(productoId, LocalDate.of(2026, 7, 6), 8, null);
        when(productoRepository.findById(productoId)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> inteligenciaService.guardarPrediccion(request));

        assertTrue(ex.getMessage().contains("Producto no encontrado"));
        verify(prediccionRepository, never()).save(any());
    }

    @Test
    void obtenerPrediccionesCalculaRiesgoAltoMedioYBajo() {
        when(prediccionRepository.findUltimasPredicciones()).thenReturn(List.of(
                prediccion(producto(UUID.randomUUID(), "Producto Alto", 5, 3), LocalDate.now().plusDays(7), 9),
                prediccion(producto(UUID.randomUUID(), "Producto Medio", 10, 4), LocalDate.now().plusDays(7), 8),
                prediccion(producto(UUID.randomUUID(), "Producto Bajo", 30, 5), LocalDate.now().plusDays(7), 7)
        ));

        List<PrediccionResponseDTO> predicciones = inteligenciaService.obtenerPredicciones();

        assertEquals("ALTO", predicciones.get(0).getRiesgo());
        assertEquals("MEDIO", predicciones.get(1).getRiesgo());
        assertEquals("BAJO", predicciones.get(2).getRiesgo());
    }

    @Test
    void obtenerPrediccionesMuestraPrecisionSiYaExisteCantidadRealGuardada() {
        PrediccionDemanda prediccion = prediccion(
                producto(UUID.randomUUID(), "Producto Validado", 20, 5),
                LocalDate.now(),
                10);
        prediccion.setSemanaFin(LocalDate.now().plusDays(6));
        prediccion.setCantidadReal(9);
        prediccion.setErrorPorcentaje(BigDecimal.valueOf(10));
        when(prediccionRepository.findUltimasPredicciones()).thenReturn(List.of(prediccion));

        List<PrediccionResponseDTO> predicciones = inteligenciaService.obtenerPredicciones();

        assertEquals(9, predicciones.get(0).getCantidadReal());
        assertEquals(BigDecimal.valueOf(10), predicciones.get(0).getErrorPorcentaje());
        assertEquals(BigDecimal.valueOf(90), predicciones.get(0).getPrecisionPorcentaje());
    }

    @Test
    void generarAlertasPredictivasCreaAlertaParaRiesgoAlto() {
        Producto producto = producto(UUID.randomUUID(), "Aceite Vegetal", 5, 3);
        PrediccionDemanda prediccion = prediccion(producto, LocalDate.of(2026, 8, 3), 12);

        when(prediccionRepository.findUltimasPredicciones()).thenReturn(List.of(prediccion));
        when(alertaStockRepository.existsByProductoAndEstadoAndOrigenAndSemanaInicio(
                producto, EstadoAlerta.ACTIVA, "IA_PREDICTIVA", prediccion.getSemanaInicio()))
                .thenReturn(false);
        when(alertaStockRepository.save(any(AlertaStock.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(usuarioRepository.findByRolAndActivoTrue(any())).thenReturn(List.of());

        var alertas = inteligenciaService.generarAlertasPredictivas();

        assertEquals(1, alertas.size());
        assertEquals("IA_PREDICTIVA", alertas.get(0).getOrigen());
        assertEquals(7, alertas.get(0).getFaltanteEstimado());
        verify(alertaStockRepository).save(argThat(alerta ->
                alerta.getProducto() == producto
                        && alerta.getCantidadPredicha() == 12
                        && alerta.getEstado() == EstadoAlerta.ACTIVA
                        && alerta.getMensaje().contains("Faltante estimado: 7")));
    }

    @Test
    void generarAlertasPredictivasNoDuplicaAlertaActiva() {
        Producto producto = producto(UUID.randomUUID(), "Azucar Rubia", 5, 3);
        PrediccionDemanda prediccion = prediccion(producto, LocalDate.of(2026, 8, 10), 9);

        when(prediccionRepository.findUltimasPredicciones()).thenReturn(List.of(prediccion));
        when(alertaStockRepository.existsByProductoAndEstadoAndOrigenAndSemanaInicio(
                producto, EstadoAlerta.ACTIVA, "IA_PREDICTIVA", prediccion.getSemanaInicio()))
                .thenReturn(true);

        var alertas = inteligenciaService.generarAlertasPredictivas();

        assertTrue(alertas.isEmpty());
        verify(alertaStockRepository, never()).save(any());
    }

    @Test
    void generarAlertasPredictivasIgnoraRiesgoBajo() {
        Producto producto = producto(UUID.randomUUID(), "Fideos", 30, 5);
        PrediccionDemanda prediccion = prediccion(producto, LocalDate.of(2026, 8, 17), 6);
        when(prediccionRepository.findUltimasPredicciones()).thenReturn(List.of(prediccion));

        var alertas = inteligenciaService.generarAlertasPredictivas();

        assertTrue(alertas.isEmpty());
        verify(alertaStockRepository, never()).save(any());
    }

    private Producto producto(UUID id, String nombre, int stockActual, int puntoPedido) {
        Producto producto = new Producto();
        producto.setId(id);
        producto.setSku("SKU-" + nombre.replace(" ", "-").toUpperCase());
        producto.setNombre(nombre);
        producto.setStockActual(stockActual);
        producto.setPuntoPedido(puntoPedido);
        return producto;
    }

    private PrediccionDemanda prediccion(Producto producto, LocalDate semanaInicio, int cantidadPredicha) {
        PrediccionDemanda prediccion = new PrediccionDemanda();
        prediccion.setProducto(producto);
        prediccion.setSemanaInicio(semanaInicio);
        prediccion.setSemanaFin(semanaInicio.plusDays(6));
        prediccion.setCantidadPredicha(cantidadPredicha);
        prediccion.setConfianza(BigDecimal.valueOf(0.85));
        prediccion.setModeloVersion("v1-test");
        return prediccion;
    }

    private PrediccionRequestDTO prediccionRequest(UUID productoId, LocalDate semanaInicio,
                                                   int cantidadPredicha, String modeloVersion) {
        PrediccionRequestDTO request = new PrediccionRequestDTO();
        request.setProductoId(productoId);
        request.setSemanaInicio(semanaInicio);
        request.setCantidadPredicha(cantidadPredicha);
        request.setConfianza(BigDecimal.valueOf(0.80));
        request.setModeloVersion(modeloVersion);
        return request;
    }
}
