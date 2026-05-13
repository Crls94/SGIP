package com.metroica.sgip_backend.productos;

import com.metroica.sgip_backend.shared.enums.EstadoProducto;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "productos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Producto {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(unique = true, length = 50)
    @NotBlank(message = "El SKU es obligatorio para el control interno")
    private String sku;

    @Column(name = "codigo_barras", unique = true, length = 50)
    private String codigoBarras;

    @Column(nullable = false, length = 250)
    @NotBlank(message = "El nombre del producto no puede estar vacio")
    private String nombre;

    private String descripcion;
    private String marca;

    @Column(name = "unidad_medida", nullable = false, length = 30)
    private String unidadMedida = "UNIDAD";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id", nullable = false)
    private Proveedor proveedor;

    @Column(name = "precio_costo", precision = 10, scale = 2, nullable = false)
    @PositiveOrZero(message = "El precio de costo no puede ser negativo")
    private BigDecimal precioCosto;

    @Column(name = "precio_venta", precision = 10, scale = 2, nullable = false)
    @PositiveOrZero(message = "El precio de venta no puede ser negativo")
    private BigDecimal precioVenta;

    @Column(name = "stock_actual", nullable = false)
    private Integer stockActual = 0;

    @Column(name = "stock_minimo", nullable = false)
    private Integer stockMinimo = 10;

    @Column(name = "stock_maximo", nullable = false)
    private Integer stockMaximo = 500;

    @Column(name = "punto_pedido", nullable = false)
    private Integer puntoPedido = 30;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private EstadoProducto estado = EstadoProducto.ACTIVO;

    @Column(name = "imagen_url")
    private String imagenUrl;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
