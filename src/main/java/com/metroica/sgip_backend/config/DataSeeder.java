package com.metroica.sgip_backend.config;

import com.metroica.sgip_backend.movimientos.InventarioMovimiento;
import com.metroica.sgip_backend.movimientos.MovimientoRepository;
import com.metroica.sgip_backend.productos.Categoria;
import com.metroica.sgip_backend.productos.CategoriaRepository;
import com.metroica.sgip_backend.productos.Producto;
import com.metroica.sgip_backend.productos.ProductoRepository;
import com.metroica.sgip_backend.productos.Proveedor;
import com.metroica.sgip_backend.productos.ProveedorRepository;
import com.metroica.sgip_backend.seguridad.Usuario;
import com.metroica.sgip_backend.seguridad.UsuarioRepository;
import com.metroica.sgip_backend.shared.enums.EstadoProducto;
import com.metroica.sgip_backend.shared.enums.RolUsuario;
import com.metroica.sgip_backend.shared.enums.TipoMovimiento;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@Profile({"dev", "demo"})
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final String DEMO_REF = "DEMO_IA_V4";

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final CategoriaRepository categoriaRepository;
    private final ProveedorRepository proveedorRepository;
    private final ProductoRepository productoRepository;
    private final MovimientoRepository movimientoRepository;
    private final Environment environment;

    @Override
    public void run(String... args) {
        List<Usuario> corruptos = usuarioRepository.findAll().stream()
                .filter(u -> "PENDING_HASH".equals(u.getPasswordHash()) || "hash".equals(u.getPasswordHash()))
                .toList();

        if (!corruptos.isEmpty()) {
            System.out.println("=== REPARANDO CONTRASEÑAS DE DESARROLLO (PENDING_HASH -> BCrypt) ===");
            for (Usuario u : corruptos) {
                String defaultPass = switch (u.getRol()) {
                    case ADMINISTRADOR -> "admin123";
                    case GERENTE -> "gerente123";
                    default -> "operario123";
                };
                u.setPasswordHash(passwordEncoder.encode(defaultPass));
                usuarioRepository.save(u);
            }
            System.out.println("Usuarios de desarrollo reparados: " + corruptos.size());
        }

        if (usuarioRepository.count() == 0) {
            Usuario admin = new Usuario();
            admin.setNombre("Admin");
            admin.setApellido("Sistema");
            admin.setEmail("admin@metroica.com");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRol(RolUsuario.ADMINISTRADOR);
            admin.setActivo(true);
            usuarioRepository.save(admin);

            Usuario operario = new Usuario();
            operario.setNombre("Operario");
            operario.setApellido("Tienda");
            operario.setEmail("operario@metroica.com");
            operario.setPasswordHash(passwordEncoder.encode("operario123"));
            operario.setRol(RolUsuario.OPERARIO);
            operario.setActivo(true);
            usuarioRepository.save(operario);

            Usuario gerente = new Usuario();
            gerente.setNombre("Gerente");
            gerente.setApellido("General");
            gerente.setEmail("gerente@metroica.com");
            gerente.setPasswordHash(passwordEncoder.encode("gerente123"));
            gerente.setRol(RolUsuario.GERENTE);
            gerente.setActivo(true);
            usuarioRepository.save(gerente);

            System.out.println("=== USUARIOS DE DESARROLLO CREADOS ===");
        }

        if (environment.acceptsProfiles(Profiles.of("demo"))) {
            cargarDemoIa();
        }
    }

    private void cargarDemoIa() {
        Usuario admin = usuarioRepository.findByEmail("admin@metroica.com")
                .orElseGet(() -> usuarioRepository.findAll().stream().findFirst().orElse(null));
        if (admin == null) {
            return;
        }

        Map<String, Categoria> categorias = crearCategoriasDemo();
        Proveedor proveedor = crearProveedorDemo();
        List<ProductoDemo> demos = List.of(
                new ProductoDemo("IA-ARROZ-001", "Arroz Extra Costeño 5kg", "Abarrotes", 4, 4, 18, 34),
                new ProductoDemo("IA-ACEITE-001", "Aceite Vegetal Metro 1L", "Abarrotes", 5, 3, 22, 28),
                new ProductoDemo("IA-AZUCAR-001", "Azucar Rubia 1kg", "Abarrotes", 3, 2, 16, 26),
                new ProductoDemo("IA-LECHE-001", "Leche Evaporada Six Pack", "Lácteos", 5, 5, 24, 30),
                new ProductoDemo("IA-YOGURT-001", "Yogurt Familiar Fresa 1L", "Lácteos", 2, 5, 14, 18),
                new ProductoDemo("IA-GASEOSA-001", "Gaseosa Cola 3L", "Bebidas", 7, 4, 30, 42),
                new ProductoDemo("IA-AGUA-001", "Agua Mineral 2.5L", "Bebidas", 6, 3, 26, 36),
                new ProductoDemo("IA-DETERGENTE-001", "Detergente Bolsa 4kg", "Limpieza", 2, 1, 12, 16),
                new ProductoDemo("IA-LAVAVAJILLA-001", "Lavavajilla Liquido 750ml", "Limpieza", 2, 2, 10, 15),
                new ProductoDemo("IA-PAPEL-001", "Papel Higienico 24 rollos", "Cuidado Personal", 3, 4, 20, 24),
                new ProductoDemo("IA-SNACK-001", "Papas Fritas Familiar", "Snacks", 6, 6, 18, 25),
                new ProductoDemo("IA-CHOCOLATE-001", "Chocolate Bitter Barra", "Snacks", 3, 7, 12, 18)
        );

        for (ProductoDemo demo : demos) {
            Producto producto = productoRepository.findBySku(demo.sku())
                    .map(p -> actualizarProductoDemo(p, demo, categorias.get(demo.categoria()), proveedor))
                    .orElseGet(() -> crearProductoDemo(demo, categorias.get(demo.categoria()), proveedor));
            boolean tieneMovimientosDemo = movimientoRepository.findAll().stream()
                    .anyMatch(m -> DEMO_REF.equals(m.getReferencia())
                            && m.getProducto() != null
                            && producto.getId().equals(m.getProducto().getId()));
            if (!tieneMovimientosDemo) {
                crearMovimientosHistoricos(producto, admin, demo);
            }
        }

        System.out.println("=== DATA DEMO IA V4 CREADA ===");
    }

    private Map<String, Categoria> crearCategoriasDemo() {
        Map<String, Categoria> result = new HashMap<>();
        for (String nombre : List.of("Abarrotes", "Lácteos", "Bebidas", "Limpieza", "Cuidado Personal", "Snacks")) {
            Optional<Categoria> existente = categoriaRepository.findAll().stream()
                    .filter(c -> normalizar(nombre).equals(normalizar(c.getNombre())))
                    .findFirst();
            Categoria categoria = existente.orElseGet(() -> {
                Categoria c = new Categoria();
                c.setNombre(nombre);
                c.setDescripcion("Categoria demo para inteligencia predictiva");
                c.setActiva(true);
                return categoriaRepository.save(c);
            });
            if (!nombre.equals(categoria.getNombre())) {
                categoria.setNombre(nombre);
                categoria.setActiva(true);
                categoria = categoriaRepository.save(categoria);
            }
            result.put(nombre, categoria);
        }
        return result;
    }

    private Proveedor crearProveedorDemo() {
        return proveedorRepository.findAll().stream()
                .filter(p -> "Proveedor Demo IA".equalsIgnoreCase(p.getNombre()))
                .findFirst()
                .orElseGet(() -> {
                    Proveedor proveedor = new Proveedor();
                    proveedor.setNombre("Proveedor Demo IA");
                    proveedor.setContacto("Equipo SGIP");
                    proveedor.setTelefono("999999999");
                    proveedor.setEmail("demoia@metroica.pe");
                    proveedor.setDireccion("Ica - Peru");
                    proveedor.setLeadTimeDias(3);
                    proveedor.setActivo(true);
                    return proveedorRepository.save(proveedor);
                });
    }

    private Producto crearProductoDemo(ProductoDemo demo, Categoria categoria, Proveedor proveedor) {
        Producto producto = new Producto();
        producto.setSku(demo.sku());
        producto.setCodigoBarras("780" + Math.abs(demo.sku().hashCode()));
        producto.setNombre(demo.nombre());
        producto.setDescripcion("Producto demo para graficas y prediccion IA");
        producto.setMarca("Metro Demo");
        producto.setUnidadMedida("UNIDAD");
        producto.setCategoria(categoria);
        producto.setProveedor(proveedor);
        producto.setPrecioCosto(BigDecimal.valueOf(5 + demo.base()));
        producto.setPrecioVenta(BigDecimal.valueOf(8 + demo.base() * 1.8));
        producto.setStockActual(demo.stockActual());
        producto.setStockMinimo(Math.max(3, demo.puntoPedido() / 2));
        producto.setStockMaximo(500);
        producto.setPuntoPedido(demo.puntoPedido());
        producto.setEstado(EstadoProducto.ACTIVO);
        return productoRepository.save(producto);
    }

    private Producto actualizarProductoDemo(Producto producto, ProductoDemo demo, Categoria categoria, Proveedor proveedor) {
        producto.setNombre(demo.nombre());
        producto.setDescripcion("Producto demo para graficas y prediccion IA");
        producto.setMarca("Metro Demo");
        producto.setUnidadMedida("UNIDAD");
        producto.setCategoria(categoria);
        producto.setProveedor(proveedor);
        producto.setPrecioCosto(BigDecimal.valueOf(5 + demo.base()));
        producto.setPrecioVenta(BigDecimal.valueOf(8 + demo.base() * 1.8));
        producto.setStockActual(demo.stockActual());
        producto.setStockMinimo(Math.max(3, demo.puntoPedido() / 2));
        producto.setStockMaximo(500);
        producto.setPuntoPedido(demo.puntoPedido());
        producto.setEstado(EstadoProducto.ACTIVO);
        return productoRepository.save(producto);
    }

    private void crearMovimientosHistoricos(Producto producto, Usuario usuario, ProductoDemo demo) {
        List<InventarioMovimiento> movimientos = new ArrayList<>();
        int semanas = 20;
        int[] cantidades = new int[semanas];
        int totalSalidas = 0;
        for (int i = 0; i < semanas; i++) {
            int estacional = (i % 6 == 0) ? demo.pico() : 0;
            int tendencia = Math.max(0, (i - 8) / 3);
            int cantidad = Math.max(1, demo.base() + tendencia + estacional + (i % 3));
            cantidades[i] = cantidad;
            totalSalidas += cantidad;
        }

        int stock = producto.getStockActual() + totalSalidas;
        LocalDate inicio = LocalDate.now().minusWeeks(semanas);
        for (int i = 0; i < semanas; i++) {
            int cantidad = cantidades[i];
            InventarioMovimiento movimiento = new InventarioMovimiento();
            movimiento.setProducto(producto);
            movimiento.setUsuario(usuario);
            movimiento.setTipo(TipoMovimiento.SALIDA);
            movimiento.setCantidad(cantidad);
            movimiento.setStockAntes(stock);
            movimiento.setStockDespues(stock - cantidad);
            movimiento.setMotivo("Salida historica demo IA semana " + (i + 1));
            movimiento.setReferencia(DEMO_REF);
            movimiento.setFecha(inicio.plusWeeks(i).atTime(10 + (i % 8), 15));
            movimientos.add(movimiento);
            stock -= cantidad;
        }
        movimientoRepository.saveAll(movimientos);
    }

    private record ProductoDemo(String sku, String nombre, String categoria, int base, int pico,
                                int stockActual, int puntoPedido) {
    }

    private String normalizar(String value) {
        return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase();
    }
}
