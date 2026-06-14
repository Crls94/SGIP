package com.metroica.sgip_backend.alertas;

import com.metroica.sgip_backend.productos.Producto;
import com.metroica.sgip_backend.shared.enums.EstadoAlerta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface AlertaStockRepository extends JpaRepository<AlertaStock, UUID> {

    @Query("SELECT COUNT(a) FROM AlertaStock a WHERE a.estado = 'ACTIVA'")
    long countAlertasActivas();

    List<AlertaStock> findByEstado(EstadoAlerta estado);

    List<AlertaStock> findByProductoAndEstado(Producto producto, EstadoAlerta estado);

    boolean existsByProductoAndEstadoAndOrigenAndSemanaInicio(Producto producto, EstadoAlerta estado,
                                                              String origen, LocalDate semanaInicio);
}
