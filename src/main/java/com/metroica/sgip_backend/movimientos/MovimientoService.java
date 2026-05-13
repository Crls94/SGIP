package com.metroica.sgip_backend.movimientos;

import com.metroica.sgip_backend.alertas.AlertaStock;
import com.metroica.sgip_backend.alertas.AlertaStockRepository;
import com.metroica.sgip_backend.notificaciones.NotificacionService;
import com.metroica.sgip_backend.productos.Producto;
import com.metroica.sgip_backend.productos.ProductoRepository;
import com.metroica.sgip_backend.seguridad.SecurityUtils;
import com.metroica.sgip_backend.seguridad.Usuario;
import com.metroica.sgip_backend.seguridad.UsuarioRepository;
import com.metroica.sgip_backend.shared.enums.EstadoAlerta;
import com.metroica.sgip_backend.shared.enums.RolUsuario;
import com.metroica.sgip_backend.shared.enums.TipoMovimiento;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MovimientoService {

    private final MovimientoRepository movimientoRepository;
    private final ProductoRepository productoRepository;
    private final AlertaStockRepository alertaStockRepository;
    private final NotificacionService notificacionService;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public String registrarMovimientoReal(MovimientoRequestDTO request) {
        UUID userId = SecurityUtils.getCurrentUserId();

        Producto producto = productoRepository.findByIdWithLock(request.getProductoId())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado en la base de datos"));

        int stockAntes = producto.getStockActual();
        int stockDespues = stockAntes;
        TipoMovimiento tipo = TipoMovimiento.valueOf(request.getTipo().toUpperCase());
        int cantidadMovimiento = request.getCantidad();

        if (tipo == TipoMovimiento.SALIDA || tipo == TipoMovimiento.MERMA) {
            if (stockAntes < request.getCantidad()) {
                throw new RuntimeException("Stock insuficiente. Solo hay " + stockAntes + " unidades disponibles.");
            }
            stockDespues = stockAntes - request.getCantidad();
        } else if (tipo == TipoMovimiento.ENTRADA || tipo == TipoMovimiento.DEVOLUCION) {
            stockDespues = stockAntes + request.getCantidad();
        } else if (tipo == TipoMovimiento.AJUSTE) {
            stockDespues = request.getCantidad();
            cantidadMovimiento = Math.abs(stockDespues - stockAntes);
        } else {
            throw new RuntimeException("Tipo de movimiento no soportado");
        }

        producto.setStockActual(stockDespues);
        productoRepository.save(producto);

        verificarAlertaStock(producto, stockDespues);

        InventarioMovimiento movimiento = new InventarioMovimiento();
        movimiento.setProducto(producto);
        movimiento.setTipo(tipo);
        movimiento.setCantidad(cantidadMovimiento);
        movimiento.setStockAntes(stockAntes);
        movimiento.setStockDespues(stockDespues);
        movimiento.setMotivo(request.getMotivo());
        movimiento.setFecha(LocalDateTime.now());

        Usuario usuario = new Usuario();
        usuario.setId(userId);
        movimiento.setUsuario(usuario);

        movimientoRepository.save(movimiento);

        return "Stock de '" + producto.getNombre() + "' paso de " + stockAntes + " a " + stockDespues;
    }

    public void verificarAlertaStock(Producto producto, int stockDespues) {
        if (stockDespues <= producto.getPuntoPedido()) {
            boolean existeAlertaActiva = alertaStockRepository
                    .findByProductoAndEstado(producto, EstadoAlerta.ACTIVA)
                    .stream().findAny().isPresent();

            if (!existeAlertaActiva) {
                AlertaStock alerta = new AlertaStock();
                alerta.setProducto(producto);
                alerta.setStockAlGenerar(stockDespues);
                alerta.setPuntoPedidoReferencia(producto.getPuntoPedido());
                alerta.setEstado(EstadoAlerta.ACTIVA);
                alertaStockRepository.save(alerta);

                notificarStockCritico(producto, stockDespues);
            }
        }
    }

    private void notificarStockCritico(Producto producto, int stockActual) {
        String titulo = "Stock critico: " + producto.getNombre();
        String mensaje = String.format(
                "El producto '%s' (SKU: %s) ha alcanzado stock critico con %d unidades (punto de pedido: %d).",
                producto.getNombre(), producto.getSku(), stockActual, producto.getPuntoPedido());

        List<Usuario> admins = usuarioRepository.findByRolAndActivoTrue(RolUsuario.ADMINISTRADOR);
        for (Usuario admin : admins) {
            notificacionService.crearNotificacion(admin.getId(), titulo, mensaje, "ALERTA_STOCK", admin.getEmail());
        }
    }
}
