package com.metroica.sgip_backend.movimientos;

import com.metroica.sgip_backend.alertas.AlertaStockRepository;
import com.metroica.sgip_backend.notificaciones.NotificacionService;
import com.metroica.sgip_backend.productos.Producto;
import com.metroica.sgip_backend.productos.ProductoRepository;
import com.metroica.sgip_backend.seguridad.Usuario;
import com.metroica.sgip_backend.seguridad.UsuarioPrincipal;
import com.metroica.sgip_backend.seguridad.UsuarioRepository;
import com.metroica.sgip_backend.shared.enums.EstadoAlerta;
import com.metroica.sgip_backend.shared.enums.RolUsuario;
import com.metroica.sgip_backend.shared.enums.TipoMovimiento;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
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
        // Cambios 17/07: Prueba negativa asociada al RF-03 Control de Stock.
        // Valida que SGIP proteja la integridad del inventario ante salidas sin stock suficiente.

        // Preparacion: se crea un producto con solo 5 unidades disponibles.
        UUID productoId = UUID.randomUUID();
        Producto producto = new Producto();
        producto.setId(productoId);
        producto.setNombre("Arroz Extra");
        producto.setStockActual(5);

        // Datos de prueba: se intenta registrar una salida de 10 unidades, superando el stock real.
        MovimientoRequestDTO request = new MovimientoRequestDTO();
        request.setProductoId(productoId);
        request.setTipo("SALIDA");
        request.setCantidad(10);
        request.setMotivo("Venta local");

        // Simulacion: el repositorio devuelve el producto como si existiera en la base de datos.
        when(productoRepository.findByIdWithLock(productoId)).thenReturn(Optional.of(producto));

        // Ejecucion y validacion: el servicio debe lanzar error por stock insuficiente.
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> movimientoService.registrarMovimientoReal(request));

        // Verificacion: no se debe guardar el producto ni registrar movimiento si la salida es invalida.
        assertTrue(ex.getMessage().contains("Stock insuficiente"));
        verify(productoRepository, never()).save(producto);
        verify(movimientoRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void registrarMovimientoRealEntradaActualizaStockYGuardaMovimiento() {
        // Cambios 17/07: Prueba funcional asociada al RF-03 Control de Stock.
        // Demuestra que una entrada de mercaderia actualiza el stock y registra trazabilidad del movimiento.

        // Preparacion: se define un producto existente con stock inicial de 5 unidades.
        UUID productoId = UUID.randomUUID();
        Producto producto = new Producto();
        producto.setId(productoId);
        producto.setNombre("Arroz Extra");
        producto.setStockActual(5);
        producto.setPuntoPedido(2);

        // Datos de prueba: se registra una entrada valida de 3 unidades por compra a proveedor.
        MovimientoRequestDTO request = new MovimientoRequestDTO();
        request.setProductoId(productoId);
        request.setTipo("ENTRADA");
        request.setCantidad(3);
        request.setMotivo("Compra a proveedor");

        // Simulacion: el producto se obtiene usando bloqueo, igual que en el flujo real del servicio.
        when(productoRepository.findByIdWithLock(productoId)).thenReturn(Optional.of(producto));

        // Ejecucion: se invoca el metodo real que procesa el movimiento de inventario.
        String resultado = movimientoService.registrarMovimientoReal(request);

        // Validacion: el stock debe pasar de 5 a 8 y el mensaje debe reflejar el cambio.
        assertTrue(resultado.contains("paso de 5 a 8"));
        assertEquals(8, producto.getStockActual());

        // Verificacion: se guarda el producto actualizado y un movimiento de tipo ENTRADA con trazabilidad.
        verify(productoRepository).save(producto);
        verify(movimientoRepository).save(argThat(movimiento ->
                movimiento.getTipo() == TipoMovimiento.ENTRADA
                        && movimiento.getCantidad() == 3
                        && movimiento.getStockAntes() == 5
                        && movimiento.getStockDespues() == 8));
    }

    @Test
    void verificarAlertaStockGeneraAlertaYNotificacionCuandoStockEsCritico() {
        // Cambios 17/07: Prueba de integracion asociada al RF-04 Alertas de Stock Critico.
        // Verifica la colaboracion entre alertas, usuarios administradores y notificaciones.

        // Preparacion: se configura un producto cuyo punto de pedido es 3 unidades.
        Producto producto = new Producto();
        producto.setId(UUID.randomUUID());
        producto.setSku("SKU-CRITICO");
        producto.setNombre("Aceite Vegetal");
        producto.setPuntoPedido(3);

        // Preparacion: se crea un administrador que recibira la notificacion de stock critico.
        Usuario admin = new Usuario();
        admin.setId(UUID.randomUUID());
        admin.setEmail("admin@metroica.com");

        // Simulacion: no existe una alerta activa previa, por lo que el sistema debe generar una nueva.
        when(alertaStockRepository.existsByProductoAndEstadoAndOrigen(producto, EstadoAlerta.ACTIVA, "STOCK_REAL"))
                .thenReturn(false);
        when(usuarioRepository.findByRolAndActivoTrue(RolUsuario.ADMINISTRADOR)).thenReturn(List.of(admin));

        // Ejecucion: se verifica el stock final de 2 unidades, menor o igual al punto de pedido.
        movimientoService.verificarAlertaStock(producto, 2);

        // Validacion: se guarda una alerta activa con los datos del producto y el stock critico detectado.
        verify(alertaStockRepository).save(argThat(alerta ->
                alerta.getProducto() == producto
                        && alerta.getStockAlGenerar() == 2
                        && alerta.getPuntoPedidoReferencia() == 3
                        && alerta.getEstado() == EstadoAlerta.ACTIVA));

        // Validacion: se envia una notificacion al administrador responsable.
        verify(notificacionService).crearNotificacion(
                eq(admin.getId()),
                contains("Stock critico"),
                contains("Aceite Vegetal"),
                eq("ALERTA_STOCK"),
                eq("admin@metroica.com"));
    }
}
