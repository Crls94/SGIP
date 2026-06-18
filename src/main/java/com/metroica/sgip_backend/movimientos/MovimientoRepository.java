package com.metroica.sgip_backend.movimientos;

import com.metroica.sgip_backend.shared.enums.TipoMovimiento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MovimientoRepository extends JpaRepository<InventarioMovimiento, UUID>, JpaSpecificationExecutor<InventarioMovimiento> {

    List<InventarioMovimiento> findByTipoOrderByFechaAsc(TipoMovimiento tipo);

    @EntityGraph(attributePaths = {"producto"})
    Page<InventarioMovimiento> findAll(Specification<InventarioMovimiento> spec, Pageable pageable);

    @Query("""
            SELECT COALESCE(SUM(m.cantidad), 0)
            FROM InventarioMovimiento m
            WHERE m.producto.id = :productoId
              AND m.tipo = :tipo
              AND m.fecha >= :desde
              AND m.fecha < :hasta
            """)
    Long sumCantidadByProductoAndTipoBetween(@Param("productoId") UUID productoId,
                                             @Param("tipo") TipoMovimiento tipo,
                                             @Param("desde") LocalDateTime desde,
                                             @Param("hasta") LocalDateTime hasta);
}
