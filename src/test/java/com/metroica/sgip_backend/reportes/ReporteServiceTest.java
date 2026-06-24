package com.metroica.sgip_backend.reportes;

import com.metroica.sgip_backend.productos.Producto;
import com.metroica.sgip_backend.productos.ProductoRepository;
import com.metroica.sgip_backend.seguridad.UsuarioPrincipal;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReporteServiceTest {

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private ReporteRepository reporteRepository;

    @Mock
    private EntityManager entityManager;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void generarReporteInventarioRechazaFormatoNoSoportado() {
        // Cambios 17/07: Prueba de regresion asociada al RF-09 Reportes Exportables.
        // Asegura que solo se acepten los formatos definidos para el proyecto: xlsx y pdf.

        // Preparacion: se instancia el servicio porque esta validacion no requiere repositorios reales.
        ReporteService service = new ReporteService(null, null, null);

        // Ejecucion y validacion: el formato csv debe ser rechazado por no pertenecer al alcance.
        assertThrows(IllegalArgumentException.class,
                () -> service.generarReporteInventario("csv"));
    }

    @Test
    void generarReportePedidosRechazaRangoDeFechasInvertido() {
        // Cambios 17/07: Prueba negativa asociada al RF-09 Reportes Exportables.
        // Valida que los filtros de fechas no permitan rangos inconsistentes.

        // Preparacion: se instancia el servicio para probar la regla de fechas del reporte.
        ReporteService service = new ReporteService(null, null, null);

        // Ejecucion y validacion: una fecha inicial posterior a la final debe producir error.
        assertThrows(IllegalArgumentException.class,
                () -> service.generarReportePedidos(
                        "xlsx",
                        java.time.LocalDateTime.parse("2026-06-10T00:00:00"),
                        java.time.LocalDateTime.parse("2026-06-01T00:00:00")));
    }

    @Test
    void generarReporteInventarioExcelDevuelveContenido() {
        // Cambios 17/07: Prueba funcional asociada al RF-09 Reportes Exportables.
        // Comprueba que SGIP genere un archivo Excel de inventario con contenido descargable.

        // Preparacion: se instancia el servicio con repositorios simulados y ruta temporal de reportes.
        ReporteService service = new ReporteService(productoRepository, null, reporteRepository);
        ReflectionTestUtils.setField(service, "entityManager", entityManager);
        ReflectionTestUtils.setField(service, "reportesDir", "/tmp/opencode/reportes-test");

        // Preparacion: se simula un usuario administrador autenticado para registrar el reporte generado.
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new UsuarioPrincipal(UUID.randomUUID(), "admin@metroica.com", "ADMINISTRADOR", "Admin"),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMINISTRADOR"))));

        // Datos de prueba: se agrega un producto al inventario que aparecera en el Excel.
        Producto producto = new Producto();
        producto.setSku("SKU-001");
        producto.setNombre("Arroz Extra");
        producto.setStockActual(12);
        producto.setPrecioVenta(BigDecimal.valueOf(5.50));
        producto.setPuntoPedido(3);
        when(productoRepository.findAll()).thenReturn(List.of(producto));

        // Ejecucion: se solicita el reporte de inventario en formato Excel.
        byte[] contenido = service.generarReporteInventario("xlsx");

        // Validacion: el archivo generado debe contener bytes, es decir, no estar vacio.
        assertTrue(contenido.length > 0);
    }
}
