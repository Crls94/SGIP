package com.metroica.sgip_backend.productos;

import org.springframework.stereotype.Service;

@Service
public class ProductoMapper {

    public ProductoResponseDTO toResponseDTO(Producto producto) {
        ProductoResponseDTO dto = new ProductoResponseDTO();
        dto.setId(producto.getId());
        dto.setSku(producto.getSku());
        dto.setNombre(producto.getNombre());
        dto.setCategoriaNombre(producto.getCategoria() != null ? producto.getCategoria().getNombre() : null);
        dto.setProveedorNombre(producto.getProveedor() != null ? producto.getProveedor().getNombre() : null);
        dto.setPrecioVenta(producto.getPrecioVenta());
        dto.setStockActual(producto.getStockActual());
        dto.setPuntoPedido(producto.getPuntoPedido());
        dto.setEstado(producto.getEstado() != null ? producto.getEstado().name() : null);
        return dto;
    }

    public Producto toEntity(ProductoCreateDTO dto) {
        Producto producto = new Producto();
        producto.setSku(dto.getSku());
        producto.setNombre(dto.getNombre());
        producto.setPrecioCosto(dto.getPrecioCosto());
        producto.setPrecioVenta(dto.getPrecioVenta());
        producto.setStockActual(dto.getStockActual());
        producto.setPuntoPedido(dto.getPuntoPedido());
        producto.setEstado(com.metroica.sgip_backend.shared.enums.EstadoProducto.ACTIVO);
        return producto;
    }
}
