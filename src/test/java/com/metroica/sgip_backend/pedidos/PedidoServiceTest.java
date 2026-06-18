package com.metroica.sgip_backend.pedidos;

import com.metroica.sgip_backend.movimientos.MovimientoRepository;
import com.metroica.sgip_backend.movimientos.MovimientoService;
import com.metroica.sgip_backend.productos.Producto;
import com.metroica.sgip_backend.productos.ProductoRepository;
import com.metroica.sgip_backend.seguridad.UsuarioPrincipal;
import com.metroica.sgip_backend.shared.enums.CanalPedido;
import com.metroica.sgip_backend.shared.enums.EstadoPedido;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PedidoServiceTest {

    @Mock
    private PedidoRepository pedidoRepository;

    @Mock
    private PedidoDetalleRepository detalleRepository;

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private MovimientoRepository movimientoRepository;

    @Mock
    private MovimientoService movimientoService;

    @InjectMocks
    private PedidoService pedidoService;

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
    void actualizarEstadoNoRestauraStockSiPedidoYaEstaCancelado() {
        // Cambios 17/07: Prueba de regresion asociada al RF-05 Gestion de Pedidos.
        // Asegura que volver a cancelar un pedido no duplique la reposicion de stock.

        // Preparacion: se crea un pedido que ya se encuentra cancelado.
        UUID pedidoId = UUID.randomUUID();
        Pedido pedido = new Pedido();
        pedido.setId(pedidoId);
        pedido.setEstado(EstadoPedido.CANCELADO);
        pedido.setPrioridad((short) 5);

        // Simulacion: el repositorio devuelve el pedido cancelado y sin detalles a restaurar.
        when(pedidoRepository.findById(pedidoId)).thenReturn(Optional.of(pedido));
        when(detalleRepository.findByPedidoIdWithProducto(pedidoId)).thenReturn(List.of());

        // Ejecucion: se solicita nuevamente el cambio al mismo estado CANCELADO.
        var response = pedidoService.actualizarEstado(pedidoId, "CANCELADO");

        // Validacion: el estado se mantiene y no se generan cambios adicionales en stock ni movimientos.
        assertEquals(EstadoPedido.CANCELADO, response.getEstado());
        verify(productoRepository, never()).findByIdWithLock(org.mockito.ArgumentMatchers.any());
        verify(movimientoRepository, never()).save(org.mockito.ArgumentMatchers.any());
        verify(pedidoRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void crearPedidoRechazaItemConStockInsuficiente() {
        // Cambios 17/07: Prueba negativa asociada al RF-05 y al RNF de integridad de datos.
        // Valida que un pedido no pueda dejar el inventario en valores inconsistentes.

        // Preparacion: se crea un producto con solo 2 unidades disponibles.
        UUID productoId = UUID.randomUUID();
        Producto producto = new Producto();
        producto.setId(productoId);
        producto.setNombre("Leche Gloria");
        producto.setStockActual(2);

        // Datos de prueba: el pedido solicita 5 unidades, cantidad mayor al stock disponible.
        PedidoItemDTO item = new PedidoItemDTO();
        item.setProductoId(productoId);
        item.setCantidad(5);

        // Preparacion: se arma un pedido local con el item invalido.
        PedidoCreateDTO dto = new PedidoCreateDTO();
        dto.setCanal(CanalPedido.LOCAL);
        dto.setItems(List.of(item));

        // Simulacion: el producto existe y se obtiene con bloqueo para validar stock.
        when(productoRepository.findByIdWithLock(productoId)).thenReturn(Optional.of(producto));

        // Ejecucion y validacion: crear el pedido debe fallar por stock insuficiente.
        RuntimeException ex = assertThrows(RuntimeException.class, () -> pedidoService.crearPedido(dto));

        // Verificacion: no se guarda stock, detalles ni movimientos si el pedido no cumple la regla.
        assertTrue(ex.getMessage().contains("Stock insuficiente"));
        verify(productoRepository, never()).save(producto);
        verify(detalleRepository, never()).saveAll(org.mockito.ArgumentMatchers.any());
        verify(movimientoRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void crearPedidoDeliveryAsignaPrioridadAltaYDescuentaStock() {
        // Cambios 17/07: Prueba de integracion para RF-05 Gestion de Pedidos y RF-06 Cola Priorizada.
        // Valida que un pedido delivery se registre con prioridad operativa y descuente stock atomico.

        // Preparacion: se define un producto con stock suficiente para atender el pedido.
        UUID productoId = UUID.randomUUID();
        UUID pedidoId = UUID.randomUUID();
        Producto producto = new Producto();
        producto.setId(productoId);
        producto.setNombre("Leche Gloria");
        producto.setStockActual(10);
        producto.setPrecioVenta(BigDecimal.valueOf(4.50));

        // Datos de prueba: el pedido solicita 3 unidades del producto.
        PedidoItemDTO item = new PedidoItemDTO();
        item.setProductoId(productoId);
        item.setCantidad(3);

        // Preparacion: el canal DELIVERY debe recibir prioridad operativa mas alta que LOCAL.
        PedidoCreateDTO dto = new PedidoCreateDTO();
        dto.setCanal(CanalPedido.DELIVERY);
        dto.setClienteNombre("Cliente Delivery");
        dto.setItems(List.of(item));

        // Simulacion: al guardar el pedido se asigna un ID como lo haria la base de datos.
        Pedido[] pedidoGuardado = new Pedido[1];
        doAnswer(invocation -> {
            Pedido pedido = invocation.getArgument(0);
            pedido.setId(pedidoId);
            pedido.setNumero(1001);
            pedidoGuardado[0] = pedido;
            return pedido;
        }).when(pedidoRepository).save(any(Pedido.class));

        // Simulacion: el servicio encuentra el producto y luego recupera el pedido guardado para armar la respuesta.
        when(productoRepository.findByIdWithLock(productoId)).thenReturn(Optional.of(producto));
        when(pedidoRepository.findById(pedidoId)).thenAnswer(invocation -> Optional.of(pedidoGuardado[0]));
        when(detalleRepository.findByPedidoIdWithProducto(pedidoId)).thenReturn(List.of());

        // Ejecucion: se crea el pedido completo usando la regla real del servicio.
        PedidoResponseDTO response = pedidoService.crearPedido(dto);

        // Validacion: el pedido queda como DELIVERY, con prioridad 3 y stock descontado de 10 a 7.
        assertEquals(CanalPedido.DELIVERY, response.getCanal());
        assertEquals(3, response.getPrioridad());
        assertEquals(7, producto.getStockActual());

        // Verificacion: se guardan los datos principales del flujo pedido-detalle-movimiento.
        verify(productoRepository).save(producto);
        verify(detalleRepository).saveAll(any());
        verify(movimientoRepository).save(argThat(movimiento ->
                movimiento.getTipo() == TipoMovimiento.SALIDA
                        && movimiento.getCantidad() == 3
                        && movimiento.getStockAntes() == 10
                        && movimiento.getStockDespues() == 7));
    }

    @Test
    void verColaPedidosRespetaOrdenPriorizadoDelRepositorio() {
        // Cambios 17/07: Prueba de aceptacion asociada al RF-06 Cola de Pedidos Priorizada.
        // Comprueba que la cola entregada al usuario conserve el orden operativo esperado.

        // Preparacion: se crea un pedido delivery con prioridad 3, que debe aparecer primero.
        Pedido delivery = new Pedido();
        delivery.setId(UUID.randomUUID());
        delivery.setNumero(2001);
        delivery.setCanal(CanalPedido.DELIVERY);
        delivery.setEstado(EstadoPedido.PENDIENTE);
        delivery.setPrioridad((short) 3);

        // Preparacion: se crea un pedido local con prioridad 5, que debe aparecer despues.
        Pedido local = new Pedido();
        local.setId(UUID.randomUUID());
        local.setNumero(2002);
        local.setCanal(CanalPedido.LOCAL);
        local.setEstado(EstadoPedido.PENDIENTE);
        local.setPrioridad((short) 5);

        // Simulacion: el repositorio devuelve la cola ya ordenada por las reglas de negocio.
        when(pedidoRepository.findColaPedidosActivos()).thenReturn(List.of(delivery, local));
        when(detalleRepository.findByPedidoIdWithProducto(delivery.getId())).thenReturn(List.of());
        when(detalleRepository.findByPedidoIdWithProducto(local.getId())).thenReturn(List.of());

        // Ejecucion: se consulta la cola que vera el usuario en el modulo de pedidos.
        List<PedidoResponseDTO> cola = pedidoService.verColaPedidos();

        // Validacion: delivery aparece antes que local y su prioridad numerica es menor.
        assertEquals(CanalPedido.DELIVERY, cola.get(0).getCanal());
        assertEquals(CanalPedido.LOCAL, cola.get(1).getCanal());
        assertTrue(cola.get(0).getPrioridad() < cola.get(1).getPrioridad());
    }
}
