package com.metroica.sgip_backend.movimientos;

import com.metroica.sgip_backend.alertas.AlertaStockRepository;
import com.metroica.sgip_backend.notificaciones.NotificacionService;
import com.metroica.sgip_backend.productos.Producto;
import com.metroica.sgip_backend.productos.ProductoRepository;
import com.metroica.sgip_backend.seguridad.UsuarioPrincipal;
import com.metroica.sgip_backend.seguridad.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MovimientoServiceTest {

    @Mock
    private MovimientoRepository movimientoRepository;

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private AlertaStockRepository alertaStockRepository;

    @Mock
    private NotificacionService notificacionService;

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private MovimientoService movimientoService;

    @BeforeEach
    void setUp() {
        UsuarioPrincipal principal = new UsuarioPrincipal(
                UUID.randomUUID(), "operario@metroica.pe", "OPERARIO", "Operario Test");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_OPERARIO"))));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void registrarMovimientoRealRechazaSalidaSiCantidadSuperaStockDisponible() {
        UUID productoId = UUID.randomUUID();
        Producto producto = new Producto();
        producto.setId(productoId);
        producto.setNombre("Arroz Extra");
        producto.setStockActual(5);

        MovimientoRequestDTO request = new MovimientoRequestDTO();
        request.setProductoId(productoId);
        request.setTipo("SALIDA");
        request.setCantidad(10);
        request.setMotivo("Venta local");

        when(productoRepository.findByIdWithLock(productoId)).thenReturn(Optional.of(producto));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> movimientoService.registrarMovimientoReal(request));

        assertTrue(ex.getMessage().contains("Stock insuficiente"));
        verify(productoRepository, never()).save(producto);
        verify(movimientoRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }
}
