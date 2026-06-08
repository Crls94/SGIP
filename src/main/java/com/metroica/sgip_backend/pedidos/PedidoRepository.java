package com.metroica.sgip_backend.pedidos;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, UUID> {

    @Query("SELECT p FROM Pedido p WHERE p.estado NOT IN ('DESPACHADO', 'CANCELADO') ORDER BY p.prioridad ASC, p.fechaIngreso ASC")
    List<Pedido> findColaPedidosActivos();

    @Query("SELECT COUNT(p) FROM Pedido p WHERE p.estado NOT IN ('DESPACHADO', 'CANCELADO')")
    long countPedidosActivos();

    @Query("SELECT p.estado, COUNT(p) FROM Pedido p GROUP BY p.estado ORDER BY p.estado")
    List<Object[]> countPedidosPorEstado();

    @Query("SELECT p.canal, COUNT(p) FROM Pedido p GROUP BY p.canal ORDER BY p.canal")
    List<Object[]> countPedidosPorCanal();

    @Query(value = """
        SELECT COALESCE(SUM(p.total), 0)
        FROM pedidos p
        WHERE CAST(p.fecha_ingreso AS DATE) = CURRENT_DATE
          AND p.estado <> 'CANCELADO'
        """, nativeQuery = true)
    BigDecimal sumVentasHoy();

    @Query(value = """
        SELECT CAST(p.fecha_ingreso AS DATE) AS fecha,
               COALESCE(SUM(p.total), 0) AS total,
               COUNT(*) AS cantidad
        FROM pedidos p
        WHERE p.fecha_ingreso >= CURRENT_DATE - INTERVAL '6 days'
          AND p.estado <> 'CANCELADO'
        GROUP BY CAST(p.fecha_ingreso AS DATE)
        ORDER BY fecha ASC
        """, nativeQuery = true)
    List<Object[]> findVentasUltimos7Dias();

    List<Pedido> findByFechaIngresoBetweenOrderByFechaIngresoDesc(LocalDateTime fechaDesde, LocalDateTime fechaHasta);

    List<Pedido> findByFechaIngresoGreaterThanEqualOrderByFechaIngresoDesc(LocalDateTime fechaDesde);

    List<Pedido> findByFechaIngresoLessThanEqualOrderByFechaIngresoDesc(LocalDateTime fechaHasta);

    List<Pedido> findAllByOrderByFechaIngresoDesc();
}
