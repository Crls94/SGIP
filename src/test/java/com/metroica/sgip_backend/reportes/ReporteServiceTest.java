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
        ReporteService service = new ReporteService(null, null, null);

        assertThrows(IllegalArgumentException.class,
                () -> service.generarReporteInventario("csv"));
    }

    @Test
    void generarReportePedidosRechazaRangoDeFechasInvertido() {
        ReporteService service = new ReporteService(null, null, null);

        assertThrows(IllegalArgumentException.class,
                () -> service.generarReportePedidos(
                        "xlsx",
                        java.time.LocalDateTime.parse("2026-06-10T00:00:00"),
                        java.time.LocalDateTime.parse("2026-06-01T00:00:00")));
    }

    @Test
    void generarReporteInventarioExcelDevuelveContenido() {
        ReporteService service = new ReporteService(productoRepository, null, reporteRepository);
        ReflectionTestUtils.setField(service, "entityManager", entityManager);
        ReflectionTestUtils.setField(service, "reportesDir", "/tmp/opencode/reportes-test");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new UsuarioPrincipal(UUID.randomUUID(), "admin@metroica.pe", "ADMINISTRADOR", "Admin"),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMINISTRADOR"))));

        Producto producto = new Producto();
        producto.setSku("SKU-001");
        producto.setNombre("Arroz Extra");
        producto.setStockActual(12);
        producto.setPrecioVenta(BigDecimal.valueOf(5.50));
        producto.setPuntoPedido(3);
        when(productoRepository.findAll()).thenReturn(List.of(producto));

        byte[] contenido = service.generarReporteInventario("xlsx");

        assertTrue(contenido.length > 0);
    }
}
