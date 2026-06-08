package com.metroica.sgip_backend.pedidos;

import com.metroica.sgip_backend.movimientos.MovimientoRepository;
import com.metroica.sgip_backend.movimientos.MovimientoService;
import com.metroica.sgip_backend.productos.Producto;
import com.metroica.sgip_backend.productos.ProductoRepository;
import com.metroica.sgip_backend.seguridad.UsuarioPrincipal;
import com.metroica.sgip_backend.shared.enums.CanalPedido;
import com.metroica.sgip_backend.shared.enums.EstadoPedido;
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
        UUID pedidoId = UUID.randomUUID();
        Pedido pedido = new Pedido();
        pedido.setId(pedidoId);
        pedido.setEstado(EstadoPedido.CANCELADO);
        pedido.setPrioridad((short) 5);

        when(pedidoRepository.findById(pedidoId)).thenReturn(Optional.of(pedido));
        when(detalleRepository.findByPedidoIdWithProducto(pedidoId)).thenReturn(List.of());

        var response = pedidoService.actualizarEstado(pedidoId, "CANCELADO");

        assertEquals(EstadoPedido.CANCELADO, response.getEstado());
        verify(productoRepository, never()).findByIdWithLock(org.mockito.ArgumentMatchers.any());
        verify(movimientoRepository, never()).save(org.mockito.ArgumentMatchers.any());
        verify(pedidoRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void crearPedidoRechazaItemConStockInsuficiente() {
        UUID productoId = UUID.randomUUID();
        Producto producto = new Producto();
        producto.setId(productoId);
        producto.setNombre("Leche Gloria");
        producto.setStockActual(2);

        PedidoItemDTO item = new PedidoItemDTO();
        item.setProductoId(productoId);
        item.setCantidad(5);

        PedidoCreateDTO dto = new PedidoCreateDTO();
        dto.setCanal(CanalPedido.LOCAL);
        dto.setItems(List.of(item));

        when(productoRepository.findByIdWithLock(productoId)).thenReturn(Optional.of(producto));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> pedidoService.crearPedido(dto));

        assertTrue(ex.getMessage().contains("Stock insuficiente"));
        verify(productoRepository, never()).save(producto);
        verify(detalleRepository, never()).saveAll(org.mockito.ArgumentMatchers.any());
        verify(movimientoRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }
}
