package com.metroica.sgip_backend.reportes;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReporteRepository extends JpaRepository<Reporte, UUID> {

    @Query("SELECT r FROM Reporte r JOIN FETCH r.usuario ORDER BY r.createdAt DESC")
    List<Reporte> findAllByOrderByCreatedAtDesc();
}