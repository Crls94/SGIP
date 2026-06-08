package com.metroica.sgip_backend.pedidos;

import com.metroica.sgip_backend.movimientos.InventarioMovimiento;
import com.metroica.sgip_backend.movimientos.MovimientoRepository;
import com.metroica.sgip_backend.movimientos.MovimientoService;
import com.metroica.sgip_backend.productos.Producto;
import com.metroica.sgip_backend.productos.ProductoRepository;
import com.metroica.sgip_backend.seguridad.SecurityUtils;
import com.metroica.sgip_backend.seguridad.Usuario;
import com.metroica.sgip_backend.shared.enums.CanalPedido;
import com.metroica.sgip_backend.shared.enums.EstadoPedido;
import com.metroica.sgip_backend.shared.enums.TipoMovimiento;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
/**
 * Servicio de negocio para la gestión de pedidos locales y delivery.
 * Controla creación de pedidos, descuento/restauración de stock y transiciones de estado.
 */
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final PedidoDetalleRepository detalleRepository;
    private final ProductoRepository productoRepository;
    private final MovimientoRepository movimientoRepository;
    private final MovimientoService movimientoService;

    @Transactional
    public PedidoResponseDTO crearPedido(PedidoCreateDTO dto) {
        UUID userId = SecurityUtils.getCurrentUserId();

        Pedido pedido = new Pedido();
        Usuario usuario = new Usuario();
        usuario.setId(userId);
        pedido.setUsuario(usuario);
        pedido.setCanal(dto.getCanal());
        pedido.setClienteNombre(dto.getClienteNombre());
        pedido.setClienteTelefono(dto.getClienteTelefono());
        pedido.setClienteDireccion(dto.getClienteDireccion());
        pedido.setObservaciones(dto.getObservaciones());
        pedido.setPrioridad(dto.getCanal() == CanalPedido.DELIVERY ? (short) 3 : (short) 5);

        pedidoRepository.save(pedido);

        List<PedidoDetalle> detalles = new ArrayList<>();

        for (PedidoItemDTO itemDTO : dto.getItems()) {
            Producto producto = productoRepository.findByIdWithLock(itemDTO.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + itemDTO.getProductoId()));

            if (producto.getStockActual() < itemDTO.getCantidad()) {
                throw new RuntimeException("Stock insuficiente para '" + producto.getNombre() + "'. Disponible: " + producto.getStockActual());
            }

            producto.setStockActual(producto.getStockActual() - itemDTO.getCantidad());
            productoRepository.save(producto);
            movimientoService.verificarAlertaStock(producto, producto.getStockActual());

            PedidoDetalle detalle = new PedidoDetalle();
            detalle.setPedido(pedido);
            detalle.setProducto(producto);
            detalle.setCantidad(itemDTO.getCantidad());
            detalle.setPrecioUnitario(producto.getPrecioVenta());
            detalles.add(detalle);

            registrarMovimiento(producto, userId, TipoMovimiento.SALIDA, itemDTO.getCantidad(),
                    stockAntes(producto, itemDTO.getCantidad()), producto.getStockActual(),
                    "Salida por pedido " + pedido.getId());
        }

        detalleRepository.saveAll(detalles);

        return toResponseDTO(pedidoRepository.findById(pedido.getId()).orElseThrow());
    }

    @Transactional(readOnly = true)
    public List<PedidoResponseDTO> verColaPedidos() {
        return pedidoRepository.findColaPedidosActivos()
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PedidoResponseDTO obtenerPedido(UUID id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado: " + id));
        return toResponseDTO(pedido);
    }

    @Transactional
    public PedidoResponseDTO actualizarEstado(UUID id, String estado) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado: " + id));
        EstadoPedido nuevoEstado = EstadoPedido.valueOf(estado);
        if (pedido.getEstado() == nuevoEstado) {
            return toResponseDTO(pedido);
        }
        validarTransicion(pedido.getEstado(), nuevoEstado);

        if (nuevoEstado == EstadoPedido.CANCELADO) {
            restaurarStockPedido(pedido);
        }

        if (nuevoEstado == EstadoPedido.DESPACHADO) {
            pedido.setFechaDespacho(LocalDateTime.now());
        }

        pedido.setEstado(nuevoEstado);
        pedidoRepository.save(pedido);
        return toResponseDTO(pedido);
    }

    private void restaurarStockPedido(Pedido pedido) {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<PedidoDetalle> detalles = detalleRepository.findByPedidoIdWithProducto(pedido.getId());

        for (PedidoDetalle detalle : detalles) {
            Producto producto = productoRepository.findByIdWithLock(detalle.getProducto().getId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + detalle.getProducto().getId()));
            int stockAntes = producto.getStockActual();
            int stockDespues = stockAntes + detalle.getCantidad();
            producto.setStockActual(stockDespues);
            productoRepository.save(producto);

            registrarMovimiento(producto, userId, TipoMovimiento.ENTRADA, detalle.getCantidad(), stockAntes, stockDespues,
                    "Reposicion por cancelacion de pedido " + pedido.getId());
        }
    }

    private void validarTransicion(EstadoPedido actual, EstadoPedido nuevo) {
        boolean valida = switch (actual) {
            case PENDIENTE -> nuevo == EstadoPedido.EN_PROCESO || nuevo == EstadoPedido.CANCELADO;
            case EN_PROCESO -> nuevo == EstadoPedido.LISTO || nuevo == EstadoPedido.CANCELADO;
            case LISTO -> nuevo == EstadoPedido.DESPACHADO || nuevo == EstadoPedido.CANCELADO;
            case DESPACHADO, CANCELADO -> false;
        };
        if (!valida) {
            throw new RuntimeException("Transicion de estado invalida: " + actual + " -> " + nuevo);
        }
    }

    private void registrarMovimiento(Producto producto, UUID userId, TipoMovimiento tipo, int cantidad,
                                     int stockAntes, int stockDespues, String motivo) {
        InventarioMovimiento movimiento = new InventarioMovimiento();
        movimiento.setProducto(producto);
        movimiento.setTipo(tipo);
        movimiento.setCantidad(cantidad);
        movimiento.setStockAntes(stockAntes);
        movimiento.setStockDespues(stockDespues);
        movimiento.setMotivo(motivo);
        movimiento.setFecha(LocalDateTime.now());

        Usuario usuario = new Usuario();
        usuario.setId(userId);
        movimiento.setUsuario(usuario);

        movimientoRepository.save(movimiento);
    }

    private int stockAntes(Producto producto, int cantidadSalida) {
        return producto.getStockActual() + cantidadSalida;
    }

    private PedidoResponseDTO toResponseDTO(Pedido pedido) {
        PedidoResponseDTO dto = new PedidoResponseDTO();
        dto.setId(pedido.getId());
        dto.setNumero(pedido.getNumero());
        dto.setCanal(pedido.getCanal());
        dto.setEstado(pedido.getEstado());
        dto.setPrioridad(pedido.getPrioridad().intValue());
        dto.setTotal(pedido.getTotal());
        dto.setFechaIngreso(pedido.getFechaIngreso());
        dto.setClienteNombre(pedido.getClienteNombre());
        dto.setClienteTelefono(pedido.getClienteTelefono());
        dto.setClienteDireccion(pedido.getClienteDireccion());
        dto.setObservaciones(pedido.getObservaciones());
        dto.setItems(detalleRepository.findByPedidoIdWithProducto(pedido.getId()).stream()
                .map(detalle -> new PedidoResponseDTO.ItemDTO(
                        detalle.getProducto().getId(),
                        detalle.getProducto().getNombre(),
                        detalle.getCantidad(),
                        detalle.getPrecioUnitario(),
                        detalle.getSubtotal()))
                .toList());
        return dto;
    }
}
