package com.metroica.sgip_backend.pedidos;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PedidoDetalleRepository extends JpaRepository<PedidoDetalle, UUID> {

    @Query("SELECT d FROM PedidoDetalle d JOIN FETCH d.producto WHERE d.pedido.id = :pedidoId")
    List<PedidoDetalle> findByPedidoIdWithProducto(UUID pedidoId);
}
