package com.metroica.sgip_backend.productos;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, UUID> {

    Optional<Producto> findByCodigoBarras(String codigoBarras);
    Optional<Producto> findBySku(String sku);

    @Query("SELECT p FROM Producto p WHERE p.stockActual <= p.puntoPedido AND p.estado = 'ACTIVO'")
    List<Producto> findProductosConStockCritico();

    @Query("SELECT COUNT(p) FROM Producto p WHERE p.estado = 'ACTIVO'")
    long countProductosActivos();

    @Query("SELECT COUNT(p) FROM Producto p WHERE p.stockActual > p.puntoPedido AND p.estado = 'ACTIVO'")
    long countProductosConStockOk();

    @Query("SELECT COUNT(p) FROM Producto p WHERE p.stockActual > 0 AND p.stockActual <= p.puntoPedido AND p.estado = 'ACTIVO'")
    long countProductosConStockBajo();

    @Query("SELECT COUNT(p) FROM Producto p WHERE p.stockActual <= 0 AND p.estado = 'ACTIVO'")
    long countProductosSinStock();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Producto p WHERE p.id = :id")
    Optional<Producto> findByIdWithLock(@Param("id") UUID id);
}
