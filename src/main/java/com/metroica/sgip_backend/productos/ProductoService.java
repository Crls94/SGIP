package com.metroica.sgip_backend.productos;

import com.metroica.sgip_backend.movimientos.InventarioMovimiento;
import com.metroica.sgip_backend.movimientos.MovimientoRepository;
import com.metroica.sgip_backend.movimientos.MovimientoService;
import com.metroica.sgip_backend.seguridad.SecurityUtils;
import com.metroica.sgip_backend.seguridad.Usuario;
import com.metroica.sgip_backend.shared.enums.TipoMovimiento;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
/**
 * Servicio de negocio para gestionar productos del inventario.
 * Centraliza reglas de creación, actualización, eliminación y registro de ajustes de stock.
 */
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final ProductoMapper productoMapper;
    private final CategoriaRepository categoriaRepository;
    private final ProveedorRepository proveedorRepository;
    private final MovimientoRepository movimientoRepository;
    private final MovimientoService movimientoService;

    @Transactional(readOnly = true)
    public Page<ProductoResponseDTO> listarInventario(Pageable pageable) {
        return productoRepository.findAll(pageable)
                .map(productoMapper::toResponseDTO);
    }

    @Transactional
    public ProductoResponseDTO crearProducto(ProductoCreateDTO dto) {
        Categoria categoria = categoriaRepository.findById(dto.getCategoriaId())
                .orElseThrow(() -> new RuntimeException("Categoria no encontrada con ID: " + dto.getCategoriaId()));
        Proveedor proveedor = proveedorRepository.findById(dto.getProveedorId())
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado con ID: " + dto.getProveedorId()));

        if (productoRepository.findBySku(dto.getSku()).isPresent()) {
            throw new RuntimeException("Ya existe un producto con el SKU: " + dto.getSku());
        }

        Producto producto = productoMapper.toEntity(dto);
        producto.setCategoria(categoria);
        producto.setProveedor(proveedor);

        productoRepository.save(producto);
        return productoMapper.toResponseDTO(producto);
    }

    @Transactional
    public ProductoResponseDTO actualizarProducto(UUID id, ProductoCreateDTO dto) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + id));
        int stockAntes = producto.getStockActual();

        producto.setSku(dto.getSku());
        producto.setNombre(dto.getNombre());
        producto.setPrecioCosto(dto.getPrecioCosto());
        producto.setPrecioVenta(dto.getPrecioVenta());
        producto.setStockActual(dto.getStockActual());
        producto.setPuntoPedido(dto.getPuntoPedido());

        if (dto.getCategoriaId() != null) {
            Categoria categoria = categoriaRepository.findById(dto.getCategoriaId())
                    .orElseThrow(() -> new RuntimeException("Categoria no encontrada con ID: " + dto.getCategoriaId()));
            producto.setCategoria(categoria);
        }
        if (dto.getProveedorId() != null) {
            Proveedor proveedor = proveedorRepository.findById(dto.getProveedorId())
                    .orElseThrow(() -> new RuntimeException("Proveedor no encontrado con ID: " + dto.getProveedorId()));
            producto.setProveedor(proveedor);
        }

        productoRepository.save(producto);
        if (stockAntes != producto.getStockActual()) {
            registrarAjusteStock(producto, stockAntes, producto.getStockActual());
            movimientoService.verificarAlertaStock(producto, producto.getStockActual());
        }
        return productoMapper.toResponseDTO(producto);
    }

    @Transactional
    public void eliminarProducto(UUID id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + id));
        productoRepository.delete(producto);
    }

    private void registrarAjusteStock(Producto producto, int stockAntes, int stockDespues) {
        InventarioMovimiento movimiento = new InventarioMovimiento();
        movimiento.setProducto(producto);
        movimiento.setTipo(TipoMovimiento.AJUSTE);
        movimiento.setCantidad(Math.abs(stockDespues - stockAntes));
        movimiento.setStockAntes(stockAntes);
        movimiento.setStockDespues(stockDespues);
        movimiento.setMotivo("Ajuste por actualizacion de producto");
        movimiento.setFecha(LocalDateTime.now());

        Usuario usuario = new Usuario();
        usuario.setId(SecurityUtils.getCurrentUserId());
        movimiento.setUsuario(usuario);

        movimientoRepository.save(movimiento);
    }
}
