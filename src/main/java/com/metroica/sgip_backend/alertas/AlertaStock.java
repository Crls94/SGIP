package com.metroica.sgip_backend.alertas;

import com.metroica.sgip_backend.shared.enums.EstadoAlerta;
import com.metroica.sgip_backend.productos.Producto;
import com.metroica.sgip_backend.seguridad.Usuario;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "alertas_stock")
@Data
public class AlertaStock {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(name = "stock_al_generar", nullable = false)
    private Integer stockAlGenerar;

    @Column(name = "punto_pedido_ref", nullable = false)
    private Integer puntoPedidoReferencia;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private EstadoAlerta estado = EstadoAlerta.ACTIVA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resuelta_por")
    private Usuario resueltaPor;

    @Column(name = "fecha_generada", insertable = false, updatable = false)
    private LocalDateTime fechaGenerada;

    @Column(name = "fecha_resuelta")
    private LocalDateTime fechaResuelta;
}
