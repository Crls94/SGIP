package com.metroica.sgip_backend.productos;

import com.metroica.sgip_backend.movimientos.MovimientoRepository;
import com.metroica.sgip_backend.movimientos.MovimientoService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductoServiceTest {

    @Mock
    private ProductoRepository productoRepository;

    @Spy
    private ProductoMapper productoMapper;

    @Mock
    private CategoriaRepository categoriaRepository;

    @Mock
    private ProveedorRepository proveedorRepository;

    @Mock
    private MovimientoRepository movimientoRepository;

    @Mock
    private MovimientoService movimientoService;

    @InjectMocks
    private ProductoService productoService;

    @Test
    void crearProductoRechazaSkuDuplicado() {
        // Cambios 17/07: Prueba unitaria asociada al RF-02 Gestion de Productos.
        // Verifica que el SKU se mantenga como identificador unico dentro del inventario.

        // Preparacion: se arma un producto nuevo con categoria y proveedor validos.
        ProductoCreateDTO dto = productoDto();
        Categoria categoria = new Categoria();
        categoria.setId(1);
        Proveedor proveedor = new Proveedor();
        proveedor.setId(1);

        // Simulacion: categoria/proveedor existen, pero el SKU ya esta registrado.
        when(categoriaRepository.findById(1)).thenReturn(Optional.of(categoria));
        when(proveedorRepository.findById(1)).thenReturn(Optional.of(proveedor));
        when(productoRepository.findBySku("SKU-001")).thenReturn(Optional.of(new Producto()));

        // Ejecucion y validacion: el servicio debe rechazar el producto por duplicidad de SKU.
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> productoService.crearProducto(dto));

        // Verificacion: no se guarda ningun producto cuando falla la regla de unicidad.
        assertEquals("Ya existe un producto con el SKU: SKU-001", ex.getMessage());
        verify(productoRepository, never()).save(any());
    }

    @Test
    void crearProductoGuardaProductoConCategoriaYProveedor() {
        // Cambios 17/07: Prueba funcional asociada al RF-02 Gestion de Productos.
        // Demuestra que un producto valido queda relacionado con su categoria y proveedor.

        // Preparacion: se arma el DTO con los datos minimos requeridos para crear producto.
        ProductoCreateDTO dto = productoDto();
        Categoria categoria = new Categoria();
        categoria.setId(1);
        categoria.setNombre("Abarrotes");
        Proveedor proveedor = new Proveedor();
        proveedor.setId(1);
        proveedor.setNombre("Distribuidora ABC");

        // Simulacion: categoria y proveedor existen, y no hay otro producto con el mismo SKU.
        when(categoriaRepository.findById(1)).thenReturn(Optional.of(categoria));
        when(proveedorRepository.findById(1)).thenReturn(Optional.of(proveedor));
        when(productoRepository.findBySku("SKU-001")).thenReturn(Optional.empty());

        // Ejecucion: se crea el producto usando el servicio real.
        ProductoResponseDTO response = productoService.crearProducto(dto);

        // Validacion: la respuesta conserva SKU, nombre, categoria y proveedor esperados.
        assertEquals("SKU-001", response.getSku());
        assertEquals("Arroz Extra", response.getNombre());
        assertEquals("Abarrotes", response.getCategoriaNombre());
        assertEquals("Distribuidora ABC", response.getProveedorNombre());

        // Verificacion: el repositorio recibe la entidad para persistirla.
        verify(productoRepository).save(any(Producto.class));
    }

    private ProductoCreateDTO productoDto() {
        ProductoCreateDTO dto = new ProductoCreateDTO();
        dto.setSku("SKU-001");
        dto.setNombre("Arroz Extra");
        dto.setCategoriaId(1);
        dto.setProveedorId(1);
        dto.setPrecioCosto(BigDecimal.valueOf(3.50));
        dto.setPrecioVenta(BigDecimal.valueOf(5.00));
        dto.setStockActual(20);
        dto.setPuntoPedido(5);
        return dto;
    }
}
