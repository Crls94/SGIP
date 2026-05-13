package com.metroica.sgip_backend.pedidos;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, UUID> {

    @Query("SELECT p FROM Pedido p WHERE p.estado NOT IN ('DESPACHADO', 'CANCELADO') ORDER BY p.prioridad ASC, p.fechaIngreso ASC")
    List<Pedido> findColaPedidosActivos();

    @Query("SELECT COUNT(p) FROM Pedido p WHERE p.estado NOT IN ('DESPACHADO', 'CANCELADO')")
    long countPedidosActivos();

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
}
